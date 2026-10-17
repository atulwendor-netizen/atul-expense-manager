import React, { useState, useMemo } from 'react';
import { Reimbursement, Trip, Expense } from '../types/index';
import { SummaryCard } from '../components/SummaryCard';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { formatCurrency, formatDate } from '../utils/calculations';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Compass,
  Edit2,
  Trash2,
  TrendingUp,
  Receipt,
  MessageSquare,
  FileCheck,
} from 'lucide-react';

interface ReimbursementsPageProps {
  reimbursements: Reimbursement[];
  expenses: Expense[];
  trips: Trip[];
  activeTripId?: string;
  onSelectTrip?: (tripId: string) => void;
  onAddReimbursement: () => void;
  onEditReimbursement: (reimbursement: Reimbursement) => void;
  onDeleteReimbursement: (id: string) => void;
  onDiscussReimbursement?: (reimbursement: Reimbursement) => void;
  onNotify: (type: 'success' | 'warning' | 'info' | 'error', text: string) => void;
  onNavigateTab?: (tab: string) => void;
  isManager?: boolean;
}

export const ReimbursementsPage: React.FC<ReimbursementsPageProps> = ({
  reimbursements,
  expenses,
  trips,
  activeTripId = 'all',
  onSelectTrip,
  onAddReimbursement,
  onEditReimbursement,
  onDeleteReimbursement,
  onDiscussReimbursement,
  onNotify,
  onNavigateTab,
  isManager = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTripFilter, setSelectedTripFilter] = useState(activeTripId);
  const [reimbursementToDelete, setReimbursementToDelete] = useState<Reimbursement | null>(null);

  // Sync with activeTripId if it changes externally
  React.useEffect(() => {
    setSelectedTripFilter(activeTripId);
  }, [activeTripId]);

  const tripMap = useMemo(() => new Map(trips.map((t) => [t.id, t.name])), [trips]);

  // Scope-aware financial calculations based on selectedTripFilter
  const scopedExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedTripFilter !== 'all' && e.tripId !== selectedTripFilter) return false;
      return e.status === 'valid' && typeof e.amount === 'number';
    });
  }, [expenses, selectedTripFilter]);

  const totalExpense = useMemo(() => {
    return scopedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [scopedExpenses]);

  const scopedReimbursements = useMemo(() => {
    return reimbursements.filter((r) => {
      if (selectedTripFilter !== 'all' && r.tripId !== selectedTripFilter) return false;
      return true;
    });
  }, [reimbursements, selectedTripFilter]);

  const totalReimbursement = useMemo(() => {
    return scopedReimbursements.reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [scopedReimbursements]);

  // Pending Reimbursement MUST always be calculated dynamically:
  // Pending = Total Expense - Total Reimbursement
  const pendingReimbursement = Math.max(0, totalExpense - totalReimbursement);

  const settlementPercentage = totalExpense > 0
    ? Math.min(100, Math.round((totalReimbursement / totalExpense) * 100))
    : 0;

  // Filtered reimbursements for table display
  const filteredReimbursements = useMemo(() => {
    return scopedReimbursements.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRef = r.reference?.toLowerCase().includes(q);
        const matchNotes = r.notes?.toLowerCase().includes(q);
        const matchAmt = String(r.amount).includes(q);
        const matchTrip = r.tripId ? tripMap.get(r.tripId)?.toLowerCase().includes(q) : false;
        if (!matchRef && !matchNotes && !matchAmt && !matchTrip) return false;
      }
      return true;
    });
  }, [scopedReimbursements, searchQuery, tripMap]);

  // Per-Trip Breakdown calculations
  const tripBreakdowns = useMemo(() => {
    return trips.map((trip) => {
      const tripValidExpenses = expenses.filter(
        (e) => e.tripId === trip.id && e.status === 'valid' && typeof e.amount === 'number'
      );
      const tripTotalExpense = tripValidExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const tripReimbursements = reimbursements.filter((r) => r.tripId === trip.id);
      const tripTotalReimbursed = tripReimbursements.reduce((sum, r) => sum + (r.amount || 0), 0);
      const tripPending = Math.max(0, tripTotalExpense - tripTotalReimbursed);
      const tripPct = tripTotalExpense > 0
        ? Math.min(100, Math.round((tripTotalReimbursed / tripTotalExpense) * 100))
        : 0;

      return {
        trip,
        expenseCount: tripValidExpenses.length,
        totalExpense: tripTotalExpense,
        totalReimbursed: tripTotalReimbursed,
        pending: tripPending,
        percentage: tripPct,
      };
    });
  }, [trips, expenses, reimbursements]);

  const handleConfirmDelete = () => {
    if (reimbursementToDelete) {
      onDeleteReimbursement(reimbursementToDelete.id);
      onNotify('success', `Removed reimbursement payment of ₹${reimbursementToDelete.amount.toLocaleString('en-IN')}`);
      setReimbursementToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-dashboard-fade">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reimbursement Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log multiple reimbursement credits, track company advances, and balance pending dues
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('payment-proofs')}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 transition-colors"
            >
              <FileCheck className="h-4 w-4 text-blue-600" />
              <span>Payment Proofs</span>
            </button>
          )}

          {!isManager && (
            <button
              onClick={onAddReimbursement}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Record Reimbursement</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Reimbursement"
          value={formatCurrency(totalReimbursement)}
          subtitle={`${reimbursements.length} payment${reimbursements.length > 1 ? 's' : ''} received`}
          icon={CheckCircle2}
          accentColor="emerald"
          badge={{ text: 'Received', variant: 'success' }}
        />

        <SummaryCard
          title="Pending Reimbursement"
          value={formatCurrency(pendingReimbursement)}
          subtitle="Total Expense − Reimbursement"
          icon={Clock}
          accentColor="amber"
          badge={{
            text: pendingReimbursement === 0 ? 'Settled' : 'Due from Company',
            variant: pendingReimbursement === 0 ? 'success' : 'warning',
          }}
        />

        <SummaryCard
          title="Total Claimed Spend"
          value={formatCurrency(totalExpense)}
          subtitle="Sum of all valid expenses"
          icon={Receipt}
          accentColor="brand"
        />

        <SummaryCard
          title="Settlement Rate"
          value={`${settlementPercentage}%`}
          subtitle={`${formatCurrency(totalReimbursement)} of ${formatCurrency(totalExpense)} cleared`}
          icon={TrendingUp}
          accentColor="violet"
          badge={{
            text: settlementPercentage === 100 ? 'Fully Paid' : 'Partially Cleared',
            variant: settlementPercentage === 100 ? 'success' : 'neutral',
          }}
        />
      </div>

      {/* Visual Settlement Progress Bar Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Overall Settlement Progress
            </h3>
          </div>
          <span className="font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalReimbursement)} / {formatCurrency(totalExpense)} ({settlementPercentage}%)
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 transition-all duration-700"
            style={{ width: `${settlementPercentage}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>₹0</span>
          <span>Pending Due: <strong className="text-amber-600 dark:text-amber-400">{formatCurrency(pendingReimbursement)}</strong></span>
          <span>Target: {formatCurrency(totalExpense)}</span>
        </div>
      </div>

      {/* Filter and Search Bar for Reimbursements */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference, notes, trip..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedTripFilter}
            onChange={(e) => {
              setSelectedTripFilter(e.target.value);
              onSelectTrip?.(e.target.value);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Trips & Allocations</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reimbursement Log Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Logged Payments ({filteredReimbursements.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Total Received: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(totalReimbursement)}</strong>
          </span>
        </div>

        {filteredReimbursements.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No reimbursement records match your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reference / UTR</th>
                  <th className="py-3 px-4">Allocated Trip</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                  <th className="py-3 pr-4 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReimbursements.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/75 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(r.date)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {r.reference || 'Direct Deposit'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {r.tripId && tripMap.get(r.tripId) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                          <Compass className="h-3 w-3" />
                          {tripMap.get(r.tripId)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">General / Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {r.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                      +{formatCurrency(r.amount)}
                    </td>
                    <td className="py-3.5 pr-4 pl-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {onDiscussReimbursement && (
                          <button
                            onClick={() => onDiscussReimbursement(r)}
                            title="Discuss Payment"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800 dark:hover:text-amber-400 transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                          </button>
                        )}
                        {!isManager && (
                          <>
                            <button
                              onClick={() => onEditReimbursement(r)}
                              title="Edit Reimbursement"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-400 transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setReimbursementToDelete(r)}
                              title="Delete Reimbursement"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trip-Level Breakdown Cards */}
      <div>
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Compass className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          Reimbursement Breakdown by Trip
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tripBreakdowns.map((tb) => (
            <div
              key={tb.trip.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {tb.trip.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {tb.trip.locations.join(', ')} • {tb.expenseCount} transactions
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    tb.pending === 0
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {tb.pending === 0 ? 'Fully Reimbursed' : `Due ₹${tb.pending.toLocaleString('en-IN')}`}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 text-xs">
                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase">Expense</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {formatCurrency(tb.totalExpense)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase">Reimbursed</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatCurrency(tb.totalReimbursed)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase">Pending</span>
                  <p className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {formatCurrency(tb.pending)}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Progress</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {tb.percentage}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${tb.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(reimbursementToDelete)}
        title="Delete Reimbursement Entry?"
        message={`Are you sure you want to delete the reimbursement entry of ₹${reimbursementToDelete?.amount.toLocaleString('en-IN')} (Ref: ${reimbursementToDelete?.reference})? This will increase your pending balance automatically.`}
        confirmLabel="Yes, Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setReimbursementToDelete(null)}
      />
    </div>
  );
};
