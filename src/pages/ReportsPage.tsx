import React, { useState, useMemo } from 'react';
import { Expense, Reimbursement, Trip } from '../types/index';
import { SummaryCard } from '../components/SummaryCard';
import { formatCurrency, formatDate } from '../utils/calculations';
import { exportExpensesToCSV, exportExpensesToExcel, exportReimbursementClaimToExcel } from '../utils/export';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Receipt,
  CheckCircle2,
  Clock,
  RotateCcw,
  Building,
  User,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface ReportsPageProps {
  expenses: Expense[];
  reimbursements: Reimbursement[];
  trips: Trip[];
  activeTripId: string;
  onSelectTrip: (tripId: string) => void;
  onNotify: (type: 'success' | 'warning' | 'info' | 'error', text: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  expenses,
  reimbursements,
  trips,
  activeTripId,
  onSelectTrip,
  onNotify,
}) => {
  const [selectedTrip, setSelectedTrip] = useState(activeTripId);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Sync with global activeTripId
  React.useEffect(() => {
    setSelectedTrip(activeTripId);
  }, [activeTripId]);

  const tripMap = useMemo(() => new Map(trips.map((t) => [t.id, t.name])), [trips]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.category) set.add(e.category.trim());
    });
    return Array.from(set).sort();
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedTrip !== 'all' && e.tripId !== selectedTrip) return false;
      if (selectedCategory !== 'all' && e.category?.trim() !== selectedCategory) return false;
      if (startDate && e.date && e.date < startDate) return false;
      if (endDate && e.date && e.date > endDate) return false;
      return true;
    });
  }, [expenses, selectedTrip, selectedCategory, startDate, endDate]);

  const validExpenses = useMemo(() => {
    return filteredExpenses.filter((e) => e.status === 'valid' && typeof e.amount === 'number');
  }, [filteredExpenses]);

  const incompleteExpenses = useMemo(() => {
    return filteredExpenses.filter((e) => e.status === 'incomplete');
  }, [filteredExpenses]);

  // Filtered reimbursements
  const scopedReimbursements = useMemo(() => {
    return reimbursements.filter((r) => {
      if (selectedTrip !== 'all' && r.tripId !== selectedTrip) return false;
      if (startDate && r.date && r.date < startDate) return false;
      if (endDate && r.date && r.date > endDate) return false;
      return true;
    });
  }, [reimbursements, selectedTrip, startDate, endDate]);

  // Financial calculations
  const totalSpend = useMemo(() => {
    return validExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [validExpenses]);

  const totalReimbursed = useMemo(() => {
    return scopedReimbursements.reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [scopedReimbursements]);

  const pendingDue = Math.max(0, totalSpend - totalReimbursed);
  const settlementPct = totalSpend > 0 ? Math.min(100, Math.round((totalReimbursed / totalSpend) * 100)) : 0;

  // Category breakdown for report
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    validExpenses.forEach((e) => {
      const cat = e.category?.trim() || 'Miscellaneous';
      const cur = map.get(cat) || { amount: 0, count: 0 };
      map.set(cat, {
        amount: cur.amount + (e.amount || 0),
        count: cur.count + 1,
      });
    });

    return Array.from(map.entries())
      .map(([category, val]) => ({
        category,
        amount: val.amount,
        count: val.count,
        percentage: totalSpend > 0 ? ((val.amount / totalSpend) * 100).toFixed(1) : '0.0',
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [validExpenses, totalSpend]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportClaimExcel = () => {
    exportReimbursementClaimToExcel(
      filteredExpenses,
      scopedReimbursements,
      trips,
      `atul_reimbursement_claim_${selectedTrip !== 'all' ? selectedTrip : 'all'}.xlsx`
    );
    onNotify('success', 'Generated comprehensive Excel claim workbook (.xlsx)');
  };

  const handleExportExpensesExcel = () => {
    exportExpensesToExcel(
      filteredExpenses,
      trips,
      `atul_expenses_export_${new Date().toISOString().split('T')[0]}.xlsx`
    );
    onNotify('success', 'Downloaded expense records as Excel (.xlsx)');
  };

  const handleExportCSV = () => {
    exportExpensesToCSV(
      filteredExpenses,
      trips,
      `atul_expenses_export_${new Date().toISOString().split('T')[0]}.csv`
    );
    onNotify('success', 'Downloaded expense records as CSV');
  };

  const handleResetFilters = () => {
    setSelectedTrip('all');
    onSelectTrip('all');
    setStartDate('');
    setEndDate('');
    setSelectedCategory('all');
  };

  const selectedTripObj = trips.find((t) => t.id === selectedTrip);

  return (
    <div className="space-y-6">
      {/* Page Header (No-print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reports & Claim Sheets
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Formal audit statements, print/PDF-ready reimbursement claim sheets, and data exports
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleExportClaimExcel}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-700 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Claim Sheet (.xlsx)</span>
          </button>

          <button
            onClick={handleExportExpensesExcel}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (No-print) */}
      <div className="no-print rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Scope:</span>
          <select
            value={selectedTrip}
            onChange={(e) => {
              setSelectedTrip(e.target.value);
              onSelectTrip(e.target.value);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Trips & Tours</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
          />
          <span className="text-xs text-slate-400">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
          />
        </div>

        <button
          onClick={handleResetFilters}
          className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Summary KPI Cards (No-print) */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Claimed Spend"
          value={formatCurrency(totalSpend)}
          subtitle={`${validExpenses.length} valid transactions`}
          icon={Receipt}
          accentColor="brand"
        />

        <SummaryCard
          title="Reimbursements Received"
          value={formatCurrency(totalReimbursed)}
          subtitle={`${scopedReimbursements.length} payments recorded`}
          icon={CheckCircle2}
          accentColor="emerald"
          badge={{ text: 'Settled', variant: 'success' }}
        />

        <SummaryCard
          title="Pending Due Balance"
          value={formatCurrency(pendingDue)}
          subtitle="Total Spend − Reimbursed"
          icon={Clock}
          accentColor="amber"
          badge={{ text: pendingDue === 0 ? 'Settled' : 'Payable', variant: pendingDue === 0 ? 'success' : 'warning' }}
        />

        <SummaryCard
          title="Incomplete Records"
          value={String(incompleteExpenses.length)}
          subtitle={incompleteExpenses.length > 0 ? 'Requires attention' : 'All clear'}
          icon={AlertTriangle}
          accentColor={incompleteExpenses.length > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* FORMAL PRINTABLE STATEMENT CONTAINER */}
      <div
        id="printable-report"
        className="rounded-3xl border border-slate-200/90 bg-white p-8 md:p-12 shadow-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      >
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 dark:border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="inline-block rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white mb-2">
                Official Statement
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                ATUL EXPENSE MANAGER
              </h2>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                Travel & Reimbursement Settlement Claim Sheet
              </p>
            </div>

            <div className="sm:text-right text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <div>
                <strong>Claim ID:</strong> CLM-{Date.now().toString().slice(-6)}
              </div>
              <div>
                <strong>Date Generated:</strong> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div>
                <strong>Status:</strong>{' '}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {pendingDue === 0 ? 'Fully Reimbursed' : 'Pending Settlement'}
                </span>
              </div>
            </div>
          </div>

          {/* Traveler & Tour Meta Info */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="h-3 w-3" /> Claimant Name
              </span>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">Atul</div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Building className="h-3 w-3" /> Tour Scope
              </span>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                {selectedTripObj ? selectedTripObj.name : 'All Tours (Consolidated)'}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Duration / Period
              </span>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                {selectedTripObj
                  ? `${formatDate(selectedTripObj.startDate)} – ${formatDate(selectedTripObj.endDate)}`
                  : 'Aug 20 – Oct 13, 2026'}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Settlement Rate
              </span>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {settlementPct}% cleared
              </div>
            </div>
          </div>
        </div>

        {/* Executive Financial Summary Grid */}
        <div className="my-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Financial Balance Reconciliation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-[11px] font-semibold text-slate-500">Gross Expenditure Claimed</span>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalSpend)}
              </div>
              <span className="text-[10px] text-slate-400">Sum of {validExpenses.length} valid expenses</span>
            </div>

            <div className="rounded-xl border border-emerald-200 p-4 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                Less: Reimbursements Received
              </span>
              <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                {formatCurrency(totalReimbursed)}
              </div>
              <span className="text-[10px] text-emerald-600/80">From {scopedReimbursements.length} payment credit(s)</span>
            </div>

            <div className="rounded-xl border border-amber-200 p-4 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                Net Balance Payable to Employee
              </span>
              <div className="text-xl font-black text-amber-700 dark:text-amber-400 mt-1">
                {formatCurrency(pendingDue)}
              </div>
              <span className="text-[10px] text-amber-600/80">
                {pendingDue === 0 ? 'All dues cleared' : 'Outstanding company reimbursement'}
              </span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="my-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Expenditure by Category
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300">
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-center">Transactions</th>
                  <th className="py-2.5 px-4 text-right">Subtotal (₹)</th>
                  <th className="py-2.5 px-4 text-right">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {categoryBreakdown.map((row) => (
                  <tr key={row.category}>
                    <td className="py-2 px-4 font-semibold text-slate-800 dark:text-slate-200">{row.category}</td>
                    <td className="py-2 px-4 text-center text-slate-600 dark:text-slate-400">{row.count}</td>
                    <td className="py-2 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="py-2 px-4 text-right text-slate-600 dark:text-slate-400">{row.percentage}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60 font-bold">
                  <td className="py-2.5 px-4">Grand Total</td>
                  <td className="py-2.5 px-4 text-center">{validExpenses.length}</td>
                  <td className="py-2.5 px-4 text-right text-blue-600 dark:text-blue-400">
                    {formatCurrency(totalSpend)}
                  </td>
                  <td className="py-2.5 px-4 text-right">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Itemized Expenses Table */}
        <div className="my-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
            <span>Itemized Expense Ledger ({filteredExpenses.length} Records)</span>
            <span className="text-[11px] font-normal lowercase">all amounts in inr (₹)</span>
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                  <th className="py-2 px-3 w-10 text-center">#</th>
                  <th className="py-2 px-3 whitespace-nowrap">Date</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Location</th>
                  <th className="py-2 px-3">Payment</th>
                  <th className="py-2 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredExpenses.map((e, idx) => (
                  <tr
                    key={e.id}
                    className={e.status === 'incomplete' ? 'bg-amber-50/50 dark:bg-amber-950/20' : undefined}
                  >
                    <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                      {formatDate(e.date)}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                      {e.description}
                      {e.status === 'incomplete' && (
                        <span className="ml-2 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          Incomplete record
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{e.category}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{e.location || '—'}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{e.paymentMethod || '—'}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {e.amount !== null && typeof e.amount === 'number' ? formatCurrency(e.amount) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60 font-bold">
                  <td colSpan={6} className="py-2.5 px-3 text-right uppercase">
                    Total Valid Expenditure:
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white whitespace-nowrap font-black">
                    {formatCurrency(totalSpend)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Reimbursements Received Log */}
        <div className="my-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Company Reimbursements Received
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                  <th className="py-2 px-3 w-10 text-center">#</th>
                  <th className="py-2 px-3">Payment Date</th>
                  <th className="py-2 px-3">Reference / UTR</th>
                  <th className="py-2 px-3">Trip Allocation</th>
                  <th className="py-2 px-3">Notes</th>
                  <th className="py-2 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {scopedReimbursements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-xs text-slate-400">
                      No reimbursement credits recorded for this scope.
                    </td>
                  </tr>
                ) : (
                  scopedReimbursements.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(r.date)}
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                        {r.reference}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                        {(r.tripId && tripMap.get(r.tripId)) || 'General / Unallocated'}
                      </td>
                      <td className="py-2 px-3 text-slate-500">{r.notes || '—'}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatCurrency(r.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60 font-bold">
                  <td colSpan={5} className="py-2.5 px-3 text-right uppercase">
                    Total Reimbursement Credits Received:
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap font-black">
                    {formatCurrency(totalReimbursed)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Declarations & Approval Signature Block */}
        <div className="mt-10 pt-6 border-t-2 border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 mb-4 text-slate-600 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>
              <strong>Certification:</strong> I certify that all expenses listed above represent legitimate and necessary work expenses incurred in the performance of official duties.
            </span>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-12 pt-4">
            <div>
              <div className="border-b border-slate-300 dark:border-slate-700 h-12" />
              <div className="mt-2 text-xs font-bold text-slate-900 dark:text-white">Claimant Signature</div>
              <div className="text-[11px] text-slate-500">Atul • Date: _________________</div>
            </div>

            <div>
              <div className="border-b border-slate-300 dark:border-slate-700 h-12" />
              <div className="mt-2 text-xs font-bold text-slate-900 dark:text-white">Authorized Signatory / Finance Approval</div>
              <div className="text-[11px] text-slate-500">Manager / Finance Team • Date: _________________</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
