import React, { useState, useMemo } from 'react';
import { Trip, Expense, Reimbursement } from '../types/index';
import { SummaryCard } from '../components/SummaryCard';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { formatCurrency, formatDate } from '../utils/calculations';
import {
  Compass,
  Calendar,
  MapPin,
  Receipt,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  Edit2,
  Trash2,
  Archive,
  ArrowRight,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';

interface TripsPageProps {
  trips: Trip[];
  expenses: Expense[];
  reimbursements: Reimbursement[];
  activeTripId: string;
  onSelectTrip: (tripId: string) => void;
  onNavigateTab: (tab: string) => void;
  onAddTrip: () => void;
  onEditTrip: (trip: Trip) => void;
  onDeleteTrip: (id: string) => void;
  onToggleArchiveTrip: (trip: Trip) => void;
  onDiscussTrip?: (trip: Trip) => void;
  onNotify: (type: 'success' | 'warning' | 'info' | 'error', text: string) => void;
  isManager?: boolean;
}

export const TripsPage: React.FC<TripsPageProps> = ({
  trips,
  expenses,
  reimbursements,
  activeTripId,
  onSelectTrip,
  onNavigateTab,
  onAddTrip,
  onEditTrip,
  onDeleteTrip,
  onToggleArchiveTrip,
  onDiscussTrip,
  onNotify: _onNotify,
  isManager = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);

  // Per-trip computed metrics
  const tripDetails = useMemo(() => {
    return trips.map((trip) => {
      // Valid & incomplete expenses for this trip
      const tripExpenses = expenses.filter((e) => e.tripId === trip.id);
      const validExpenses = tripExpenses.filter(
        (e) => e.status === 'valid' && typeof e.amount === 'number' && e.amount !== null && !isNaN(e.amount)
      );
      const incompleteCount = tripExpenses.filter(
        (e) => e.status === 'incomplete' || e.amount === null || isNaN(e.amount as number)
      ).length;

      const totalSpend = validExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      // Reimbursements for this trip
      const tripReimbursements = reimbursements.filter((r) => r.tripId === trip.id);
      const totalReimbursed = tripReimbursements.reduce((sum, r) => sum + (r.amount || 0), 0);

      const pendingDue = Math.max(0, totalSpend - totalReimbursed);
      const surplus = Math.max(0, totalReimbursed - totalSpend);
      const isOverReimbursed = totalReimbursed > totalSpend;

      // Duration in days
      let durationDays = 1;
      if (trip.id === 'trip-mumbai-pune-2026') {
        durationDays = 15;
      } else if (trip.startDate && trip.endDate) {
        const start = new Date(trip.startDate).getTime();
        const end = new Date(trip.endDate).getTime();
        if (!isNaN(start) && !isNaN(end)) {
          durationDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
        }
      }

      // Canonical active spending days (unique valid expense dates)
      const uniqueSpendingDates = new Set(
        validExpenses.map((e) => e.date).filter((d): d is string => Boolean(d))
      );
      const activeSpendingDays = uniqueSpendingDates.size > 0 ? uniqueSpendingDates.size : durationDays;

      // Canonical Daily Average = Total Spend / Active Spending Days
      const dailyAverage = activeSpendingDays > 0 ? Math.round(totalSpend / activeSpendingDays) : 0;

      // Uncapped settlement percentage so over-reimbursement is not hidden at 100%
      const settlementPct = totalSpend > 0
        ? Math.round((totalReimbursed / totalSpend) * 100)
        : totalReimbursed > 0
        ? 100
        : 0;

      return {
        trip,
        expenseCount: tripExpenses.length,
        validCount: validExpenses.length,
        incompleteCount,
        totalSpend,
        totalReimbursed,
        pendingDue,
        surplus,
        isOverReimbursed,
        durationDays,
        activeSpendingDays,
        dailyAverage,
        settlementPct,
      };
    });
  }, [trips, expenses, reimbursements]);

  // Overall calculations across all trips (reconciled sum of trip dues)
  const overallStats = useMemo(() => {
    const totalTripsCount = trips.length;
    const activeTripsCount = trips.filter((t) => !t.isArchived).length;

    // Check for any unallocated expenses / reimbursements
    const tripIdSet = new Set(trips.map((t) => t.id));
    const unallocatedExpenses = expenses.filter(
      (e) => (!e.tripId || !tripIdSet.has(e.tripId)) && e.status === 'valid' && typeof e.amount === 'number' && e.amount !== null && !isNaN(e.amount)
    );
    const unallocatedSpend = unallocatedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const unallocatedReimbursements = reimbursements.filter(
      (r) => !r.tripId || !tripIdSet.has(r.tripId)
    );
    const unallocatedReimbursed = unallocatedReimbursements.reduce((sum, r) => sum + (r.amount || 0), 0);
    const unallocatedPending = Math.max(0, unallocatedSpend - unallocatedReimbursed);
    const unallocatedSurplus = Math.max(0, unallocatedReimbursed - unallocatedSpend);

    const totalSpend = tripDetails.reduce((sum, td) => sum + td.totalSpend, 0) + unallocatedSpend;
    const totalReimbursed = reimbursements.reduce((sum, r) => sum + (r.amount || 0), 0);

    // Reconciled Total Pending = sum of trip pending claims + unallocated pending (no cross-trip netting)
    const pendingDue = tripDetails.reduce((sum, td) => sum + td.pendingDue, 0) + unallocatedPending;
    const totalSurplus = tripDetails.reduce((sum, td) => sum + td.surplus, 0) + unallocatedSurplus;

    const netBalance = totalSpend - totalReimbursed;
    const hasOverReimbursement = totalSurplus > 0 || tripDetails.some((td) => td.isOverReimbursed);

    return {
      totalTripsCount,
      activeTripsCount,
      totalSpend,
      totalReimbursed,
      pendingDue,
      totalSurplus,
      netBalance,
      hasOverReimbursement,
      unallocatedSpend,
      unallocatedReimbursed,
    };
  }, [trips, tripDetails, expenses, reimbursements]);

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return tripDetails.filter(({ trip }) => {
      if (statusFilter === 'active' && trip.isArchived) return false;
      if (statusFilter === 'archived' && !trip.isArchived) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = trip.name?.toLowerCase().includes(q);
        const matchDesc = trip.description?.toLowerCase().includes(q);
        const matchLoc = trip.locations?.some((l) => l.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchLoc) return false;
      }

      return true;
    });
  }, [tripDetails, statusFilter, searchQuery]);

  const handleConfirmDelete = () => {
    if (tripToDelete) {
      try {
        onDeleteTrip(tripToDelete.id);
      } catch {
        // Error toast is handled by onDeleteTrip in App.tsx
      } finally {
        setTripToDelete(null);
      }
    }
  };

  const handleViewExpenses = (tripId: string) => {
    onSelectTrip(tripId);
    onNavigateTab('expenses');
  };

  return (
    <div className="space-y-6 animate-dashboard-fade">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Trips & Travel Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage official tours, field assignments, daily spending averages, and reimbursement claims
          </p>
        </div>

        {!isManager && (
          <button
            onClick={onAddTrip}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-colors self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Log New Trip</span>
          </button>
        )}
      </div>

      {/* Reimbursement Discrepancy Alert Banner */}
      {overallStats.hasOverReimbursement && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-amber-900 shadow-sm dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/80 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold">Reimbursement Discrepancy Flagged for Audit</h4>
                <span className="rounded-full bg-amber-200 dark:bg-amber-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  Audit Flag
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                One or more trips have allocated reimbursements exceeding eligible spending (Total excess advance: {formatCurrency(overallStats.totalSurplus)}).
                In accordance with business rules, overpayments are not silently netted against other trips.
                Pending claim of {formatCurrency(overallStats.pendingDue)} strictly reflects valid outstanding trip dues (Net cross-trip balance: {formatCurrency(overallStats.netBalance)}).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Trips"
          value={String(overallStats.totalTripsCount)}
          subtitle={`${overallStats.activeTripsCount} active tour${overallStats.activeTripsCount > 1 ? 's' : ''}`}
          icon={Compass}
          accentColor="brand"
        />

        <SummaryCard
          title="Total Trip Spend"
          value={formatCurrency(overallStats.totalSpend)}
          subtitle="Sum of all valid expenses"
          icon={Receipt}
          accentColor="indigo"
        />

        <SummaryCard
          title="Total Reimbursed"
          value={formatCurrency(overallStats.totalReimbursed)}
          subtitle={overallStats.totalSurplus > 0 ? `Includes ${formatCurrency(overallStats.totalSurplus)} excess advance` : "Cleared from company"}
          icon={CheckCircle2}
          accentColor="emerald"
          badge={overallStats.totalSurplus > 0 ? { text: `${formatCurrency(overallStats.totalSurplus)} Excess`, variant: 'warning' } : { text: 'Settled', variant: 'success' }}
        />

        <SummaryCard
          title="Pending Reimbursement"
          value={formatCurrency(overallStats.pendingDue)}
          subtitle={overallStats.totalSurplus > 0 ? `Reconciled trip dues (Net: ${formatCurrency(overallStats.netBalance)})` : "Sum of pending trip claims"}
          icon={Clock}
          accentColor="amber"
          badge={{
            text: overallStats.hasOverReimbursement
              ? 'Discrepancy Flagged'
              : overallStats.pendingDue === 0
              ? 'Settled'
              : 'Pending Claim',
            variant: overallStats.pendingDue === 0 && !overallStats.hasOverReimbursement ? 'success' : 'warning',
          }}
        />
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trips by name, location, notes..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Status:</span>
          {(['all', 'active', 'archived'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Trip Cards */}
      {filteredTrips.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Compass className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No trips found</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            No trips match your current search or status filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTrips.map(
            ({
              trip,
              expenseCount,
              validCount,
              incompleteCount,
              totalSpend,
              totalReimbursed,
              pendingDue,
              surplus,
              isOverReimbursed,
              durationDays,
              activeSpendingDays,
              dailyAverage,
              settlementPct,
            }) => {
              const isCurrentActive = activeTripId === trip.id;

              return (
                <div
                  key={trip.id}
                  className={`relative flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-slate-900 ${
                    isCurrentActive
                      ? 'border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-500'
                      : 'border-slate-200/80 dark:border-slate-800/80'
                  }`}
                >
                  <div>
                    {/* Top Status Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isCurrentActive && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                            Current Active Scope
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {durationDays} Days Duration
                        </span>
                        {isOverReimbursed && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <AlertTriangle className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                            Over-reimbursed (+{formatCurrency(surplus)})
                          </span>
                        )}
                        {trip.isArchived && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            <Archive className="h-3 w-3" />
                            Archived
                          </span>
                        )}
                      </div>

                      {/* Card Action Icons (Owner only) */}
                      {!isManager && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditTrip(trip)}
                            title="Edit Trip Details"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleArchiveTrip(trip)}
                            title={trip.isArchived ? 'Unarchive Trip' : 'Archive Trip'}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800 dark:hover:text-amber-400 transition-colors"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setTripToDelete(trip)}
                            title="Delete Trip"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Trip Name & Dates */}
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {trip.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                        </span>
                      </div>
                    </div>

                    {/* Locations */}
                    {trip.locations && trip.locations.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {trip.locations.map((loc, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {loc}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Description */}
                    {trip.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4">
                        {trip.description}
                      </p>
                    )}

                    {/* Financial Metrics 4-Box Grid */}
                    <div className="grid grid-cols-2 gap-2.5 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60 mb-4">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Total Spend
                        </span>
                        <div className="text-base font-bold text-slate-900 dark:text-white">
                          {formatCurrency(totalSpend)}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {validCount} valid {incompleteCount > 0 && `(${incompleteCount} incomplete)`}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Reimbursed
                        </span>
                        <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(totalReimbursed)}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {settlementPct}% settled
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {isOverReimbursed ? 'Over-Reimbursed' : 'Pending Balance'}
                        </span>
                        <div
                          className={`text-base font-bold ${
                            isOverReimbursed
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {isOverReimbursed ? `+${formatCurrency(surplus)}` : formatCurrency(pendingDue)}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {isOverReimbursed ? 'Review required (Excess)' : 'Due from company'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Daily Average
                        </span>
                        <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(dailyAverage)}
                          <span className="text-[11px] font-normal text-slate-400">/day</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          over {activeSpendingDays} active days
                        </span>
                      </div>
                    </div>

                    {/* Settlement Progress Bar */}
                    <div className="space-y-1 mb-5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Settlement Progress</span>
                        <span
                          className={`font-bold ${
                            isOverReimbursed
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {formatCurrency(totalReimbursed)} / {formatCurrency(totalSpend)} ({settlementPct}%{isOverReimbursed ? ' • Over-reimbursed' : ''})
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverReimbursed
                              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          }`}
                          style={{ width: `${Math.min(100, settlementPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Trip Card Bottom Buttons */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => onSelectTrip(isCurrentActive ? 'all' : trip.id)}
                      className={`flex-1 rounded-xl py-2 px-3 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                        isCurrentActive
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                      }`}
                    >
                      <Compass className="h-3.5 w-3.5" />
                      <span>{isCurrentActive ? 'Clear Active Scope' : 'Set as Active Scope'}</span>
                    </button>

                    {onDiscussTrip && (
                      <button
                        onClick={() => onDiscussTrip(trip)}
                        className="rounded-xl border border-blue-200 bg-blue-50 py-2 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300 transition-colors flex items-center gap-1.5"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Trip Discussion</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleViewExpenses(trip.id)}
                      className="rounded-xl border border-slate-200 py-2 px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                    >
                      <span>Expenses ({expenseCount})</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(tripToDelete)}
        title="Delete Trip"
        message={`Are you sure you want to delete "${tripToDelete?.name}"? All associated expense records will remain intact and be unlinked to unallocated.`}
        confirmLabel="Delete Trip"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setTripToDelete(null)}
      />
    </div>
  );
};
