import React, { useMemo } from 'react';
import { Trip, Expense, DashboardMetrics } from '../types/index';
import { formatCurrency, formatDateRange } from '../utils/calculations';
import { MapPin, Calendar, Clock, Compass, ChevronRight, Layers } from 'lucide-react';

interface CurrentTripSummaryProps {
  currentTrip: Trip | null;
  allTrips: Trip[];
  expenses: Expense[];
  metrics: DashboardMetrics;
  activeTripId: string;
  onSelectTrip: (tripId: string) => void;
  onManageTrips?: () => void;
}

export const CurrentTripSummary: React.FC<CurrentTripSummaryProps> = ({
  currentTrip,
  allTrips,
  expenses,
  metrics,
  activeTripId,
  onSelectTrip,
  onManageTrips,
}) => {
  const isAllTrips = activeTripId === 'all';

  // Compute date range, locations, and duration dynamically from the scoped dataset
  const { dateRangeText, locationsText, durationText, cardTitle, cardSubtitle } = useMemo(() => {
    if (isAllTrips) {
      // Find earliest and latest dates across all valid expenses
      const dates = expenses
        .map((e) => e.date)
        .filter(Boolean)
        .sort();
      const earliest = dates.length > 0 ? dates[0] : '2026-08-20';
      const latest = dates.length > 0 ? dates[dates.length - 1] : '2026-10-13';

      // Collect unique locations
      const locSet = new Set<string>();
      allTrips.forEach((t) => t.locations?.forEach((l) => locSet.add(l)));
      const locs = Array.from(locSet).join(', ') || 'Mumbai, Pune, Gurgaon, Delhi NCR';

      return {
        dateRangeText: formatDateRange(earliest, latest),
        locationsText: locs,
        durationText: `${metrics.activeSpendingDays} Active Spending Days`,
        cardTitle: 'All Trips & Work Expenses',
        cardSubtitle: 'Overall summary across all itineraries, intercity stays, and local operations',
      };
    } else {
      // Specific trip selected
      const trip = currentTrip || allTrips.find((t) => t.id === activeTripId);
      const locs = trip?.locations?.join(', ') || 'Various Locations';
      const dateText = formatDateRange(trip?.startDate, trip?.endDate);
      const dur = `${metrics.tripDurationDays} Days Duration`;

      return {
        dateRangeText: dateText,
        locationsText: locs,
        durationText: dur,
        cardTitle: trip?.name || 'Selected Trip',
        cardSubtitle: trip?.description || 'Itemized travel expenses and reimbursements for this itinerary',
      };
    }
  }, [isAllTrips, currentTrip, allTrips, activeTripId, expenses, metrics]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-6 text-white shadow-md relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 shrink-0">
              {isAllTrips ? <Layers className="h-5 w-5" /> : <Compass className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300 border border-blue-400/20">
                  {isAllTrips ? 'Overall Scope' : 'Active Trip'}
                </span>
                <span className="text-xs text-slate-400">{durationText}</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
                {cardTitle}
              </h2>
              <p className="text-xs text-slate-400 max-w-xl truncate mt-0.5">
                {cardSubtitle}
              </p>
            </div>
          </div>

          {/* Trip Selector Dropdown */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <select
              value={activeTripId}
              onChange={(e) => onSelectTrip(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Trips & Stays</option>
              {allTrips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {onManageTrips && (
              <button
                onClick={onManageTrips}
                className="flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors shrink-0"
              >
                Trips
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Location & Dates Pill Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 backdrop-blur-sm border border-white/10">
            <Calendar className="h-3.5 w-3.5 text-blue-400" />
            <span>{dateRangeText}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 backdrop-blur-sm border border-white/10">
            <Clock className="h-3.5 w-3.5 text-emerald-400" />
            <span>{durationText}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 backdrop-blur-sm border border-white/10">
            <MapPin className="h-3.5 w-3.5 text-rose-400" />
            <span>{locationsText}</span>
          </div>
        </div>

        {/* Dynamic Trip Quick Metrics Bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/10 pt-4">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              {isAllTrips ? 'Total Spending' : 'Trip Spending'}
            </span>
            <p className="mt-0.5 text-lg font-bold text-white">
              {formatCurrency(metrics.totalExpense)}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Daily Average
            </span>
            <p className="mt-0.5 text-lg font-bold text-white">
              {formatCurrency(metrics.dailyAverage)}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Transactions
            </span>
            <p className="mt-0.5 text-lg font-bold text-white">
              {metrics.totalTransactions} valid items
              {metrics.incompleteTransactions > 0 ? ` (+${metrics.incompleteTransactions} draft)` : ''}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Pending Reimbursement
            </span>
            <p className="mt-0.5 text-lg font-bold text-amber-400">
              {formatCurrency(metrics.pendingReimbursement)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
