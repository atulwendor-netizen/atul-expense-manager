import React from 'react';
import { Expense, Reimbursement, Trip, DashboardMetrics } from '../types/index';
import { SummaryCard } from '../components/SummaryCard';
import { ExpenseTrendChart } from '../components/ExpenseTrendChart';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { RecentExpenses } from '../components/RecentExpenses';
import { TopExpenses } from '../components/TopExpenses';
import { ReimbursementSummaryCard } from '../components/ReimbursementSummaryCard';
import { CurrentTripSummary } from '../components/CurrentTripSummary';
import { formatCurrency } from '../utils/calculations';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
  Wallet,
  CheckCircle,
  CheckCircle2,
  Clock,
  Receipt,
  Calendar,
  TrendingDown,
  AlertTriangle,
  FileCheck,
  FileText,
  FileQuestion,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface DashboardPageProps {
  expenses: Expense[];
  reimbursements: Reimbursement[];
  trips: Trip[];
  metrics: DashboardMetrics;
  currentTrip: Trip | null;
  activeTripId: string;
  onSelectTrip: (tripId: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenAddExpense: () => void;
  onOpenAddReimbursement: () => void;
  onEditExpense: (expense: Expense) => void;
  onViewExpenseDetails?: (expense: Expense) => void;
  isManager?: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  expenses,
  reimbursements,
  trips,
  metrics,
  currentTrip,
  activeTripId,
  onSelectTrip,
  onNavigateTab,
  onOpenAddExpense,
  onOpenAddReimbursement,
  onEditExpense,
  onViewExpenseDetails,
  isManager = false,
}) => {
  const isAllTrips = activeTripId === 'all';
  const scopeLabel = isAllTrips ? 'All Trips' : currentTrip?.name || 'Selected Trip';

  // Real-time Receipt Storage & Verification metrics for the active scope
  const receiptMetrics = React.useMemo(() => {
    let verifiedCount = 0;
    let pendingCount = 0;
    let attachedCount = 0;
    let missingCount = 0;

    expenses.forEach((e) => {
      const status = e.verificationStatus || (e.receipt ? 'receipt_attached' : 'receipt_missing');
      if (status === 'verified') verifiedCount++;
      else if (status === 'verification_pending') pendingCount++;
      else if (status === 'receipt_attached') attachedCount++;
      else missingCount++;
    });

    const total = expenses.length;
    const verifiedPercent = total > 0 ? Math.round((verifiedCount / total) * 100) : 0;
    const totalAttached = verifiedCount + pendingCount + attachedCount;
    const attachedPercent = total > 0 ? Math.round((totalAttached / total) * 100) : 0;

    return {
      total,
      verifiedCount,
      pendingCount,
      attachedCount: totalAttached,
      unreviewedCount: attachedCount,
      missingCount,
      verifiedPercent,
      attachedPercent,
    };
  }, [expenses]);

  // Smooth scroll-reveal observers for dashboard sections
  const cardsReveal = useScrollReveal({ threshold: 0.05 });
  const chartsReveal = useScrollReveal({ threshold: 0.1 });
  const secondaryReveal = useScrollReveal({ threshold: 0.1 });

  return (
    <div className="space-y-6 animate-dashboard-fade">
      {/* Scope Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Financial Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
              Scope: {scopeLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAllTrips
              ? 'Showing overall financials across all travel itineraries and local operations'
              : `Showing focused financials dedicated to ${currentTrip?.name || 'selected trip'}`}
          </p>
        </div>

        {/* Quick Scope Selector Buttons */}
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 self-start sm:self-auto">
          <button
            onClick={() => onSelectTrip('all')}
            className={`rounded-lg px-3 py-1.5 text-xs transition-all ${
              isAllTrips
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400 font-bold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium'
            }`}
          >
            All Trips
          </button>
          {trips.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTrip(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs transition-all ${
                activeTripId === t.id
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400 font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Incomplete Records Alert if any exist in the current scope */}
      {metrics.incompleteTransactions > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-amber-900 shadow-sm dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/80 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">
                {metrics.incompleteTransactions} Incomplete Record{metrics.incompleteTransactions > 1 ? 's' : ''} Found in Current Scope
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {(() => {
                  const incomplete = expenses.filter((e) => e.status === 'incomplete' || e.amount === null);
                  if (incomplete.length === 0) return 'Incomplete records are safely excluded from financial totals until reviewed.';
                  const names = incomplete.slice(0, 2).map((e) => e.description || 'Incomplete item').join(', ');
                  const extra = incomplete.length > 2 ? ` and ${incomplete.length - 2} more` : '';
                  const verb = incomplete.length > 1 ? ' are ' : ' is ';
                  return `${names}${extra}${verb}missing an amount and safely excluded from financial totals until reviewed.`;
                })()}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('expenses')}
            className="self-start sm:self-auto rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm"
          >
            Review Incomplete Records
          </button>
        </div>
      )}

      {/* Current Trip Summary Hero Banner */}
      <CurrentTripSummary
        currentTrip={currentTrip}
        allTrips={trips}
        expenses={expenses}
        metrics={metrics}
        activeTripId={activeTripId}
        onSelectTrip={onSelectTrip}
        onManageTrips={() => onNavigateTab('trips')}
      />

      {/* Receipt Storage & Entry-Wise Verification Banner */}
      <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-cyan-50/40 p-4 sm:p-5 shadow-xs dark:border-emerald-900/60 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Receipt Storage & Entry-Wise Verification
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {receiptMetrics.verifiedCount} of {receiptMetrics.total} Verified ({receiptMetrics.verifiedPercent}%)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Persistent storage active for receipts (PNG, JPG, PDF) • Entry-level verification with side-by-side audit and metadata tracking.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('receipt-verification')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Audit & Verify Receipts</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Live Mini Progress & Stat Breakdown */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Verified</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {receiptMetrics.verifiedCount}{' '}
                <span className="text-[10px] text-emerald-600 font-semibold">({receiptMetrics.verifiedPercent}%)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Attached</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {receiptMetrics.attachedCount}{' '}
                <span className="text-[10px] text-blue-600 font-semibold">({receiptMetrics.attachedPercent}%)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Pending Review</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {receiptMetrics.pendingCount}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <FileQuestion className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Missing Receipt</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {receiptMetrics.missingCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Google Drive & Payment Proofs Quick Audit Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 p-4 shadow-xs dark:border-blue-900/60 dark:from-blue-950/40 dark:to-indigo-950/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Google Drive Payment Proofs & Finance Audit
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Folder: "Expense Manager Payment Proofs" • Verify receipts, match UPI transfers, and review audit discrepancies.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('payment-proofs')}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors shrink-0"
        >
          <span>Open Payment Proofs</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 6 Core Dashboard KPI Summary Cards with Staggered Entrance */}
      <div 
        ref={cardsReveal.ref}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        {/* 1. Total Expense */}
        <div className={`scroll-reveal stagger-1 ${cardsReveal.isRevealed ? 'is-revealed' : ''}`}>
          <SummaryCard
            title="Total Expense"
            value={formatCurrency(metrics.totalExpense)}
            subtitle={isAllTrips ? 'Overall spending' : `${currentTrip?.name} spend`}
            icon={Wallet}
            accentColor="brand"
            badge={{
              text: `${receiptMetrics.verifiedCount}/${expenses.length} Verified`,
              variant: receiptMetrics.verifiedCount === expenses.length && expenses.length > 0 ? 'success' : 'info',
            }}
            onClick={() => onNavigateTab('receipt-verification')}
          />
        </div>

        {/* 2. Total Reimbursement */}
        <div className={`scroll-reveal stagger-2 ${cardsReveal.isRevealed ? 'is-revealed' : ''}`}>
          <SummaryCard
            title="Reimbursement"
            value={formatCurrency(metrics.totalReimbursement)}
            subtitle={metrics.totalOverReimbursement && metrics.totalOverReimbursement > 0 ? `Includes ${formatCurrency(metrics.totalOverReimbursement)} excess advance` : (reimbursements.length > 0 ? `${reimbursements.length} payment${reimbursements.length > 1 ? 's' : ''} logged` : 'No payments yet')}
            icon={CheckCircle}
            accentColor="emerald"
            badge={metrics.totalOverReimbursement && metrics.totalOverReimbursement > 0 ? { text: `${formatCurrency(metrics.totalOverReimbursement)} Excess`, variant: 'warning' } : {
              text: reimbursements.length > 0 ? `${reimbursements.length} Logged` : 'None',
              variant: reimbursements.length > 0 ? 'success' : 'neutral',
            }}
            onClick={() => onNavigateTab('reimbursements')}
          />
        </div>

        {/* 3. Pending Reimbursement */}
        <div className={`scroll-reveal stagger-3 ${cardsReveal.isRevealed ? 'is-revealed' : ''}`}>
          <SummaryCard
            title="Pending Amount"
            value={formatCurrency(metrics.pendingReimbursement)}
            subtitle={metrics.totalOverReimbursement && metrics.totalOverReimbursement > 0 ? `Reconciled dues (Net: ${formatCurrency(metrics.netBalance || 0)})` : "Sum of pending trip claims"}
            icon={Clock}
            accentColor="amber"
            badge={{
              text: metrics.hasDiscrepancy ? 'Discrepancy Flagged' : (metrics.pendingReimbursement === 0 ? 'Cleared' : 'Awaiting'),
              variant: metrics.pendingReimbursement === 0 && !metrics.hasDiscrepancy ? 'success' : 'warning',
            }}
            onClick={() => onNavigateTab('reimbursements')}
          />
        </div>

        {/* 4. Total Transactions */}
        <div className={`scroll-reveal stagger-4 ${cardsReveal.isRevealed ? 'is-revealed' : ''}`}>
          <SummaryCard
            title="Transactions"
            value={metrics.totalTransactions}
            subtitle="Itemized valid entries"
            icon={Receipt}
            accentColor="violet"
            badge={{
              text: metrics.incompleteTransactions > 0 ? `+${metrics.incompleteTransactions} draft` : 'All valid',
              variant: metrics.incompleteTransactions > 0 ? 'warning' : 'neutral',
            }}
            onClick={() => onNavigateTab('expenses')}
          />
        </div>

        {/* 5. Trip Duration */}
        <div className={`scroll-reveal stagger-5 ${cardsReveal.isRevealed ? 'is-revealed' : ''}`}>
          <SummaryCard
            title="Trip Duration"
            value={`${metrics.tripDurationDays} Days`}
            subtitle={`${metrics.activeSpendingDays} active spending days`}
            icon={Calendar}
            accentColor="indigo"
            badge={{ text: scopeLabel, variant: 'neutral' }}
            onClick={() => onNavigateTab('trips')}
          />
        </div>

        {/* 6. Canonical Daily Average */}
        <div className={`scroll-reveal stagger-6 ${cardsReveal.isRevealed ? 'is-revealed' : ''}`}>
          <SummaryCard
            title="Daily Average"
            value={formatCurrency(metrics.dailyAverage)}
            subtitle={`Total / ${metrics.activeSpendingDays} active day${metrics.activeSpendingDays > 1 ? 's' : ''}`}
            icon={TrendingDown}
            accentColor="rose"
            badge={{ text: `≈ ${formatCurrency(metrics.dailyAverage)}/day`, variant: 'neutral' }}
          />
        </div>
      </div>

      {/* Visual Analytics Row: Trend Chart & Category Breakdown */}
      <div 
        ref={chartsReveal.ref}
        className={`grid grid-cols-1 gap-6 lg:grid-cols-3 scroll-reveal ${chartsReveal.isRevealed ? 'is-revealed' : ''}`}
      >
        <div className="lg:col-span-2">
          <ExpenseTrendChart expenses={expenses} />
        </div>
        <div>
          <CategoryBreakdown expenses={expenses} />
        </div>
      </div>

      {/* Secondary Dashboard Row: Reimbursement Summary, Top Expenses, Recent Expenses */}
      <div 
        ref={secondaryReveal.ref}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <div className={`scroll-reveal stagger-1 ${secondaryReveal.isRevealed ? 'is-revealed' : ''}`}>
          <ReimbursementSummaryCard
            totalExpense={metrics.totalExpense}
            totalReimbursement={metrics.totalReimbursement}
            pendingReimbursement={metrics.pendingReimbursement}
            reimbursements={reimbursements}
            onNavigateToReimbursements={() => onNavigateTab('reimbursements')}
            onAddReimbursement={isManager ? undefined : onOpenAddReimbursement}
          />
        </div>

        <div className={`scroll-reveal stagger-2 ${secondaryReveal.isRevealed ? 'is-revealed' : ''}`}>
          <TopExpenses
            expenses={expenses}
            onSelectExpense={(exp) => {
              if (isManager && onViewExpenseDetails) {
                onViewExpenseDetails(exp);
              } else {
                onEditExpense(exp);
              }
            }}
          />
        </div>

        <div className={`scroll-reveal stagger-3 ${secondaryReveal.isRevealed ? 'is-revealed' : ''}`}>
          <RecentExpenses
            expenses={expenses}
            onViewAll={() => onNavigateTab('expenses')}
            onEditExpense={(exp) => {
              if (isManager && onViewExpenseDetails) {
                onViewExpenseDetails(exp);
              } else {
                onEditExpense(exp);
              }
            }}
            onAddExpense={isManager ? undefined : onOpenAddExpense}
          />
        </div>
      </div>
    </div>
  );
};
