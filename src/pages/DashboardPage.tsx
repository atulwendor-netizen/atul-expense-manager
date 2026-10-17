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
  Clock,
  Receipt,
  Calendar,
  TrendingDown,
  AlertTriangle,
  FileCheck,
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
                {metrics.incompleteTransactions} Incomplete Record Found in Current Scope
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Row 80 (Grabbit location gurgaon) is missing an amount and is safely excluded from financial totals until reviewed.
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
            badge={{ text: 'Verified', variant: 'info' }}
            onClick={() => onNavigateTab('expenses')}
          />
        </div>

        {/* 2. Total Reimbursement */}
        <div className={`scroll-reveal stagger-2 ${cardsReveal.isRevealed ? 'is-revealed' : ''}`}>
          <SummaryCard
            title="Reimbursement"
            value={formatCurrency(metrics.totalReimbursement)}
            subtitle={reimbursements.length > 0 ? `${reimbursements.length} payment${reimbursements.length > 1 ? 's' : ''} logged` : 'No payments yet'}
            icon={CheckCircle}
            accentColor="emerald"
            badge={{
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
            subtitle="Expense - Reimbursement"
            icon={Clock}
            accentColor="amber"
            badge={{
              text: metrics.pendingReimbursement === 0 ? 'Cleared' : 'Awaiting',
              variant: metrics.pendingReimbursement === 0 ? 'success' : 'warning',
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
