import React, { useState, useMemo } from 'react';
import { Expense, Trip, ReceiptVerificationStatus } from '../types/index';
import { FilterBar, FilterState } from '../components/FilterBar';
import { ExpenseTable } from '../components/ExpenseTable';
import { ExpenseDetailsModal } from '../components/ExpenseDetailsModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { SummaryCard } from '../components/SummaryCard';
import { ReceiptVerificationSection } from '../components/ReceiptVerificationSection';
import { ReceiptVerificationModal } from '../components/ReceiptVerificationModal';
import { exportExpensesToCSV, exportExpensesToExcel } from '../utils/export';
import { formatCurrency } from '../utils/calculations';
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Download,
  Plus,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  FileCheck,
  Calculator,
  ShieldCheck,
} from 'lucide-react';

interface ExpensesPageProps {
  expenses: Expense[];
  trips: Trip[];
  initialSubView?: 'all' | 'verification';
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onBulkDeleteExpenses: (ids: string[]) => void;
  onDiscussExpense?: (expense: Expense) => void;
  onVerifyExpense?: (expenseId: string, status: ReceiptVerificationStatus, notes?: string) => void;
  onNotify: (type: 'success' | 'warning' | 'info' | 'error', text: string) => void;
  onNavigateTab?: (tab: string) => void;
  isManager?: boolean;
}

const initialFilterState: FilterState = {
  search: '',
  startDate: '',
  endDate: '',
  category: 'all',
  paymentMethod: 'all',
  location: 'all',
  tripId: 'all',
  status: 'all',
};

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  expenses,
  trips,
  initialSubView = 'all',
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onBulkDeleteExpenses,
  onDiscussExpense,
  onVerifyExpense,
  onNotify,
  onNavigateTab,
  isManager = false,
}) => {
  const [activeSubView, setActiveSubView] = useState<'all' | 'verification'>(initialSubView);

  React.useEffect(() => {
    if (initialSubView) {
      setActiveSubView(initialSubView);
    }
  }, [initialSubView]);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Modals state
  const [selectedExpenseForDetails, setSelectedExpenseForDetails] = useState<Expense | null>(null);
  const [selectedExpenseForVerification, setSelectedExpenseForVerification] = useState<Expense | null>(null);
  const [verificationExpensesList, setVerificationExpensesList] = useState<Expense[]>([]);
  const [expenseIdToDelete, setExpenseIdToDelete] = useState<string | null>(null);
  const [bulkIdsToDelete, setBulkIdsToDelete] = useState<string[] | null>(null);

  // Pending verification count (unreviewed or pending review)
  const pendingVerificationCount = useMemo(() => {
    return expenses.filter((e) => {
      const s = e.verificationStatus || (e.receipt ? 'receipt_attached' : 'receipt_missing');
      return s === 'verification_pending' || s === 'receipt_attached';
    }).length;
  }, [expenses]);

  // Extract unique filter options from data
  const categories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set).sort();
  }, [expenses]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.location && e.location.trim()) set.add(e.location);
    });
    return Array.from(set).sort();
  }, [expenses]);

  const paymentMethods = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.paymentMethod && e.paymentMethod.trim()) set.add(e.paymentMethod);
    });
    return Array.from(set).sort();
  }, [expenses]);

  const tripMap = useMemo(() => new Map(trips.map((t) => [t.id, t.name])), [trips]);

  // Handle single filter change
  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilterState);
  };

  // MULTI-FILTERING LOGIC (AND logic)
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // 1. Search Query
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchDesc = e.description?.toLowerCase().includes(q);
        const matchCat = e.category?.toLowerCase().includes(q);
        const matchLoc = e.location?.toLowerCase().includes(q);
        const matchNotes = e.notes?.toLowerCase().includes(q);
        const matchPay = e.paymentMethod?.toLowerCase().includes(q);
        const matchAmt = e.amount !== null && e.amount !== undefined ? String(e.amount).includes(q) : false;
        const matchTrip = e.tripId ? (tripMap.get(e.tripId)?.toLowerCase().includes(q) ?? false) : false;
        if (!matchDesc && !matchCat && !matchLoc && !matchNotes && !matchPay && !matchAmt && !matchTrip) {
          return false;
        }
      }

      // 2. Category
      if (filters.category !== 'all' && e.category !== filters.category) {
        return false;
      }

      // 3. Location
      if (filters.location !== 'all' && e.location !== filters.location) {
        return false;
      }

      // 4. Payment Method
      if (filters.paymentMethod !== 'all' && e.paymentMethod !== filters.paymentMethod) {
        return false;
      }

      // 5. Trip
      if (filters.tripId !== 'all' && e.tripId !== filters.tripId) {
        return false;
      }

      // 6. Status
      if (filters.status !== 'all') {
        if (filters.status === 'valid' && (e.status !== 'valid' || e.amount === null || isNaN(e.amount as number))) {
          return false;
        }
        if (filters.status === 'incomplete' && e.status !== 'incomplete' && e.amount !== null && !isNaN(e.amount as number)) {
          return false;
        }
      }

      // 7. Date Range (Inclusive: startDate <= expDate <= endDate)
      const expDate = e.date ? e.date.split('T')[0] : '';
      if (filters.startDate) {
        if (!expDate || expDate < filters.startDate) return false;
      }
      if (filters.endDate) {
        if (!expDate || expDate > filters.endDate) return false;
      }

      return true;
    });
  }, [expenses, filters, tripMap]);

  // Page dynamic metrics from CURRENT filtered set
  const pageMetrics = useMemo(() => {
    const valid = filteredExpenses.filter((e) => e.status === 'valid' && typeof e.amount === 'number' && !isNaN(e.amount));
    const incomplete = filteredExpenses.filter((e) => e.status === 'incomplete' || e.amount === null || isNaN(e.amount as number));
    const totalAmount = valid.reduce((sum, e) => sum + (e.amount || 0), 0);
    const avgExpense = valid.length > 0 ? Math.round(totalAmount / valid.length) : 0;

    return {
      totalAmount,
      validCount: valid.length,
      incompleteCount: incomplete.length,
      avgExpense,
    };
  }, [filteredExpenses]);

  // Export handlers
  const handleExportCSV = () => {
    exportExpensesToCSV(filteredExpenses, trips);
    onNotify('success', `Exported ${filteredExpenses.length} expenses to CSV`);
    setIsExportMenuOpen(false);
  };

  const handleExportExcel = () => {
    exportExpensesToExcel(filteredExpenses, trips);
    onNotify('success', `Exported ${filteredExpenses.length} expenses to Excel (.xlsx)`);
    setIsExportMenuOpen(false);
  };

  // Confirm Single Delete
  const handleConfirmSingleDelete = () => {
    if (expenseIdToDelete) {
      try {
        onDeleteExpense(expenseIdToDelete);
        setExpenseIdToDelete(null);
      } catch {
        // Keep modal open if delete fails so user can retry or cancel
      }
    }
  };

  // Confirm Bulk Delete
  const handleConfirmBulkDelete = () => {
    if (bulkIdsToDelete && bulkIdsToDelete.length > 0) {
      try {
        onBulkDeleteExpenses(bulkIdsToDelete);
      } catch {
        // Error notification is already handled by onBulkDeleteExpenses in App.tsx
      } finally {
        setBulkIdsToDelete(null);
      }
    }
  };

  return (
    <div className="space-y-6 animate-dashboard-fade">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Expenses
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track, filter, and manage all personal and work-related expenses
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-3.5 w-3.5 ml-0.5 text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <div
                onClick={() => setIsExportMenuOpen(false)}
                className="absolute right-0 mt-1.5 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-20 animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  onClick={handleExportCSV}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 text-left"
                >
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <span>Export as CSV</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 text-left"
                >
                  <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                  <span>Export as Excel (.xlsx)</span>
                </button>
              </div>
            )}
          </div>

          {/* Payment Proofs Shortcut */}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('payment-proofs')}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 transition-colors"
            >
              <FileCheck className="h-4 w-4 text-blue-600" />
              <span>Payment Proofs</span>
            </button>
          )}

          {/* Calculator Shortcut */}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('calculator')}
              className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50/70 px-3.5 py-2 text-xs font-semibold text-violet-700 shadow-sm hover:bg-violet-100 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300 transition-colors"
            >
              <Calculator className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span>Calculator</span>
            </button>
          )}

          {/* Add Expense Primary Button (Owner only) */}
          {!isManager && (
            <button
              onClick={onAddExpense}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-view Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubView('all')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeSubView === 'all'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>All Expenses</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeSubView === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {expenses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('verification')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeSubView === 'verification'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Receipt Verification</span>
            {pendingVerificationCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeSubView === 'verification'
                    ? 'bg-amber-400 text-slate-900'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {pendingVerificationCount} pending
              </span>
            )}
          </button>
        </div>
      </div>

      {activeSubView === 'all' ? (
        <>
          {/* Dynamic Summary Cards for Filtered Set */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryCard
              title="Total Expenses"
              value={formatCurrency(pageMetrics.totalAmount)}
              subtitle="Sum of valid records"
              icon={Wallet}
              accentColor="brand"
            />
            <SummaryCard
              title="Valid Transactions"
              value={pageMetrics.validCount}
              subtitle="Fully logged records"
              icon={CheckCircle2}
              accentColor="emerald"
            />
            <SummaryCard
              title="Incomplete Records"
              value={pageMetrics.incompleteCount}
              subtitle={pageMetrics.incompleteCount > 0 ? 'Requires amount' : 'All records complete'}
              icon={AlertTriangle}
              accentColor="amber"
              badge={
                pageMetrics.incompleteCount > 0
                  ? { text: 'Attention', variant: 'warning' }
                  : { text: 'Clean', variant: 'success' }
              }
            />
            <SummaryCard
              title="Average Expense"
              value={formatCurrency(pageMetrics.avgExpense)}
              subtitle="Per item average"
              icon={TrendingDown}
              accentColor="violet"
            />
          </div>

          {/* Filter Toolbar */}
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            categories={categories}
            locations={locations}
            paymentMethods={paymentMethods}
            trips={trips}
            filteredCount={filteredExpenses.length}
            totalCount={expenses.length}
          />

          {/* Expense Table with desktop & mobile layouts */}
          <ExpenseTable
            filterKey={JSON.stringify(filters)}
            expenses={filteredExpenses}
            trips={trips}
            totalExpensesCount={expenses.length}
            onAddExpense={onAddExpense}
            onViewExpense={(expense) => setSelectedExpenseForDetails(expense)}
            onEditExpense={(expense) => onEditExpense(expense)}
            onDeleteExpense={(id) => {
              setSelectedExpenseForDetails(null);
              setExpenseIdToDelete(id);
            }}
            onBulkDelete={(ids) => setBulkIdsToDelete(ids)}
            onClearFilters={handleClearFilters}
            onDiscussExpense={onDiscussExpense}
            isManager={isManager}
          />
        </>
      ) : (
        /* Receipt Verification View */
        <ReceiptVerificationSection
          expenses={expenses}
          trips={trips}
          onOpenVerifyModal={(exp, list) => {
            setSelectedExpenseForVerification(exp);
            setVerificationExpensesList(list);
          }}
          isManager={isManager}
        />
      )}

      {/* Expense Details View Modal */}
      <ExpenseDetailsModal
        isOpen={Boolean(selectedExpenseForDetails)}
        onClose={() => setSelectedExpenseForDetails(null)}
        expense={selectedExpenseForDetails}
        trips={trips}
        onEdit={(expense) => onEditExpense(expense)}
        onDelete={(id) => {
          setSelectedExpenseForDetails(null);
          setExpenseIdToDelete(id);
        }}
        onDiscuss={onDiscussExpense}
        onOpenVerifyModal={(expense) => {
          setSelectedExpenseForVerification(expense);
          setVerificationExpensesList(expenses);
        }}
        isManager={isManager}
      />

      {/* Receipt Side-by-Side Verification Modal */}
      <ReceiptVerificationModal
        isOpen={Boolean(selectedExpenseForVerification)}
        onClose={() => setSelectedExpenseForVerification(null)}
        expense={selectedExpenseForVerification}
        expenses={verificationExpensesList.length > 0 ? verificationExpensesList : expenses}
        trips={trips}
        onVerify={(id, status, notes) => {
          if (onVerifyExpense) {
            onVerifyExpense(id, status, notes);
          }
        }}
        onSelectExpense={(exp) => setSelectedExpenseForVerification(exp)}
        onNotify={onNotify}
        isManager={isManager}
      />

      {/* Confirm Single Delete Modal */}
      <ConfirmationModal
        isOpen={Boolean(expenseIdToDelete)}
        title="Delete Expense Record?"
        message="Are you sure you want to delete this expense record? This action will permanently remove it and recalculate all financial dashboard totals."
        confirmLabel="Yes, Delete Expense"
        variant="danger"
        onConfirm={handleConfirmSingleDelete}
        onCancel={() => setExpenseIdToDelete(null)}
      />

      {/* Confirm Bulk Delete Modal */}
      <ConfirmationModal
        isOpen={Boolean(bulkIdsToDelete && bulkIdsToDelete.length > 0)}
        title={`Delete ${bulkIdsToDelete?.length || 0} Selected Expenses?`}
        message={`Are you sure you want to permanently delete these ${bulkIdsToDelete?.length || 0} selected expense records? This action cannot be undone.`}
        confirmLabel={`Delete ${bulkIdsToDelete?.length || 0} Expenses`}
        variant="danger"
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkIdsToDelete(null)}
      />
    </div>
  );
};
