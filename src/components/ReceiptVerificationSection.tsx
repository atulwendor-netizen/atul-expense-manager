import React, { useState, useMemo } from 'react';
import { Expense, Trip, ReceiptVerificationStatus } from '../types/index';
import { formatCurrency, formatDate } from '../utils/calculations';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileQuestion,
  FileText,
  Search,
  FilterX,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileCheck2,
} from 'lucide-react';

export interface ReceiptFilterState {
  search: string;
  status: 'all' | ReceiptVerificationStatus;
  startDate: string;
  endDate: string;
  tripId: string;
  category: string;
  paymentMethod: string;
}

interface ReceiptVerificationSectionProps {
  expenses: Expense[];
  trips: Trip[];
  onOpenVerifyModal: (expense: Expense, filteredList: Expense[]) => void;
  isManager?: boolean;
}

export const ReceiptVerificationSection: React.FC<ReceiptVerificationSectionProps> = ({
  expenses,
  trips,
  onOpenVerifyModal,
  isManager: _isManager = false,
}) => {
  const [filters, setFilters] = useState<ReceiptFilterState>({
    search: '',
    status: 'all',
    startDate: '',
    endDate: '',
    tripId: 'all',
    category: 'all',
    paymentMethod: 'all',
  });

  const [sortField, setSortField] = useState<'date' | 'amount' | 'status' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  const tripMap = useMemo(() => new Map(trips.map((t) => [t.id, t.name])), [trips]);

  // Unique filter option extractions
  const categories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.category) set.add(e.category);
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

  // Multi-filtering logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // 1. Search Query
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchDesc = e.description?.toLowerCase().includes(q);
        const matchId = e.id?.toLowerCase().includes(q);
        const matchCat = e.category?.toLowerCase().includes(q);
        const matchLoc = e.location?.toLowerCase().includes(q);
        const matchNotes = e.notes?.toLowerCase().includes(q);
        const matchPay = e.paymentMethod?.toLowerCase().includes(q);
        const matchAmt = e.amount !== null && e.amount !== undefined ? String(e.amount).includes(q) : false;
        const matchTrip = e.tripId ? (tripMap.get(e.tripId)?.toLowerCase().includes(q) ?? false) : false;
        if (!matchDesc && !matchId && !matchCat && !matchLoc && !matchNotes && !matchPay && !matchAmt && !matchTrip) {
          return false;
        }
      }

      // 2. Verification Status
      const status: ReceiptVerificationStatus =
        e.verificationStatus || (e.receipt ? 'receipt_attached' : 'receipt_missing');

      if (filters.status !== 'all' && status !== filters.status) {
        return false;
      }

      // 3. Trip
      if (filters.tripId !== 'all' && e.tripId !== filters.tripId) {
        return false;
      }

      // 4. Category
      if (filters.category !== 'all' && e.category !== filters.category) {
        return false;
      }

      // 5. Payment Method
      if (filters.paymentMethod !== 'all' && e.paymentMethod !== filters.paymentMethod) {
        return false;
      }

      // 6. Date Range
      const expDate = e.date ? e.date.split('T')[0] : '';
      if (filters.startDate && (!expDate || expDate < filters.startDate)) {
        return false;
      }
      if (filters.endDate && (!expDate || expDate > filters.endDate)) {
        return false;
      }

      return true;
    });
  }, [expenses, filters, tripMap]);

  // Metric calculation for verification
  const verificationMetrics = useMemo(() => {
    let verifiedCount = 0;
    let pendingCount = 0;
    let attachedCount = 0;
    let missingCount = 0;
    let fileUnavailableCount = 0;

    expenses.forEach((e) => {
      const status = e.verificationStatus || (e.receipt ? 'receipt_attached' : 'receipt_missing');
      if (status === 'verified') verifiedCount++;
      else if (status === 'verification_pending') pendingCount++;
      else if (status === 'receipt_attached') attachedCount++;
      else if (status === 'file_unavailable') fileUnavailableCount++;
      else missingCount++;
    });

    const total = expenses.length;
    const verifiedPercent = total > 0 ? Math.round((verifiedCount / total) * 100) : 0;

    return {
      total,
      verifiedCount,
      verifiedPercent,
      pendingCount,
      attachedCount,
      missingCount,
      fileUnavailableCount,
    };
  }, [expenses]);

  // Sorting
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = (a.date || '').localeCompare(b.date || '');
      } else if (sortField === 'amount') {
        const amtA = typeof a.amount === 'number' && !isNaN(a.amount) ? a.amount : -1;
        const amtB = typeof b.amount === 'number' && !isNaN(b.amount) ? b.amount : -1;
        comparison = amtA - amtB;
      } else if (sortField === 'description') {
        comparison = (a.description || '').localeCompare(b.description || '');
      } else if (sortField === 'status') {
        const statA = a.verificationStatus || (a.receipt ? 'receipt_attached' : 'receipt_missing');
        const statB = b.verificationStatus || (b.receipt ? 'receipt_attached' : 'receipt_missing');
        comparison = statA.localeCompare(statB);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredExpenses, sortField, sortOrder]);

  // Pagination
  const totalItems = sortedExpenses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedExpenses = sortedExpenses.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const renderSortIndicator = (field: typeof sortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
    ) : (
      <ArrowDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
    );
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      startDate: '',
      endDate: '',
      tripId: 'all',
      category: 'all',
      paymentMethod: 'all',
    });
    setCurrentPage(1);
  };

  const renderStatusBadge = (status: ReceiptVerificationStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </span>
        );
      case 'verification_pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="h-3 w-3" />
            Verification Pending
          </span>
        );
      case 'receipt_attached':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <FileText className="h-3 w-3" />
            Receipt Attached
          </span>
        );
      case 'file_unavailable':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertTriangle className="h-3 w-3" />
            File Unavailable
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <FileQuestion className="h-3 w-3" />
            Receipt Missing
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Verification Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Verified */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verified Receipts</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {verificationMetrics.verifiedCount}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ({verificationMetrics.verifiedPercent}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Audited & confirmed valid</p>
        </div>

        {/* Verification Pending */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Review</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {verificationMetrics.pendingCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Flagged for auditor review</p>
        </div>

        {/* Receipt Attached (Unreviewed) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Receipt Attached</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {verificationMetrics.attachedCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Document present, awaiting verification</p>
        </div>

        {/* Missing Receipt */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Receipt Missing</span>
            <div className="rounded-xl bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <FileQuestion className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {verificationMetrics.missingCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">No proof document uploaded</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, search: e.target.value }));
                setCurrentPage(1);
              }}
              placeholder="Search expenses, amounts, notes, references..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
            />
          </div>

          {/* Verification Status Filter */}
          <div className="w-full md:w-56">
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value as any }));
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Verification Statuses</option>
              <option value="verified">Verified</option>
              <option value="verification_pending">Verification Pending</option>
              <option value="receipt_attached">Receipt Attached (Unreviewed)</option>
              <option value="receipt_missing">Receipt Missing</option>
              <option value="file_unavailable">File Unavailable</option>
            </select>
          </div>

          {/* Trip Filter */}
          <div className="w-full md:w-48">
            <select
              value={filters.tripId}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, tripId: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white focus:outline-none"
            >
              <option value="all">All Trips</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Category:</span>
            <select
              value={filters.category}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, category: e.target.value }));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Payment:</span>
            <select
              value={filters.paymentMethod}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, paymentMethod: e.target.value }));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Payment Methods</option>
              {paymentMethods.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">From:</span>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, startDate: e.target.value }));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">To:</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, endDate: e.target.value }));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {(filters.search ||
            filters.status !== 'all' ||
            filters.tripId !== 'all' ||
            filters.category !== 'all' ||
            filters.paymentMethod !== 'all' ||
            filters.startDate ||
            filters.endDate) && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 ml-auto"
            >
              <FilterX className="h-3 w-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Filtered Count Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing <strong>{filteredExpenses.length}</strong> of <strong>{expenses.length}</strong> expenses
        </span>
        <span className="text-[11px] italic">
          Click any row or "Verify" to open side-by-side verification
        </span>
      </div>

      {/* Verification Table - Desktop View */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th
                  onClick={() => handleSort('date')}
                  className="py-3.5 pl-4 pr-3 cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    {renderSortIndicator('date')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('description')}
                  className="py-3.5 px-3 cursor-pointer select-none group min-w-[200px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Expense Description / ID</span>
                    {renderSortIndicator('description')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('amount')}
                  className="py-3.5 px-3 text-right cursor-pointer select-none group"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Amount</span>
                    {renderSortIndicator('amount')}
                  </div>
                </th>

                <th className="py-3.5 px-3 hidden md:table-cell">Payment Method</th>
                <th className="py-3.5 px-3 hidden lg:table-cell">Trip / Location</th>
                <th className="py-3.5 px-3 text-center">Receipt Attachment</th>

                <th
                  onClick={() => handleSort('status')}
                  className="py-3.5 px-3 text-center cursor-pointer select-none group"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Verification Status</span>
                    {renderSortIndicator('status')}
                  </div>
                </th>

                <th className="py-3.5 pr-4 pl-3 text-right">Audit Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FileQuestion className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        No expenses match the current filter criteria
                      </p>
                      <button
                        onClick={handleClearFilters}
                        className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Reset all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((expense) => {
                  const status: ReceiptVerificationStatus =
                    expense.verificationStatus || (expense.receipt ? 'receipt_attached' : 'receipt_missing');
                  const hasReceipt = Boolean(expense.receipt);
                  const metadata = expense.receiptMetadata;
                  const isPdf =
                    metadata?.fileType?.includes('pdf') ||
                    (expense.receiptName || '').toLowerCase().endsWith('.pdf');

                  return (
                    <tr
                      key={expense.id}
                      onClick={() => onOpenVerifyModal(expense, sortedExpenses)}
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      {/* Date */}
                      <td className="py-3.5 pl-4 pr-3 whitespace-nowrap font-medium text-slate-600 dark:text-slate-400">
                        {formatDate(expense.date)}
                      </td>

                      {/* Description & ID */}
                      <td className="py-3.5 px-3">
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                            {expense.description || 'Untitled Expense'}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>ID: {expense.id}</span>
                            {expense.rawOriginal?.rowNumber && (
                              <span>• Row #{expense.rawOriginal.rowNumber}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        {expense.amount !== null && !isNaN(expense.amount as number) ? (
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(expense.amount)}
                          </span>
                        ) : (
                          <span className="font-semibold text-amber-500 italic">Incomplete</span>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-3 whitespace-nowrap hidden md:table-cell text-slate-600 dark:text-slate-400">
                        {expense.paymentMethod || '—'}
                      </td>

                      {/* Trip / Location */}
                      <td className="py-3.5 px-3 hidden lg:table-cell text-slate-600 dark:text-slate-400">
                        <div className="truncate max-w-[150px]">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {expense.tripId ? tripMap.get(expense.tripId) || 'Trip' : 'No Trip'}
                          </span>
                          {expense.location && (
                            <p className="text-[10px] text-slate-400 truncate">{expense.location}</p>
                          )}
                        </div>
                      </td>

                      {/* Receipt Attachment Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {hasReceipt ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[11px] font-semibold">
                            <FileText className="h-3 w-3" />
                            <span>{isPdf ? 'PDF Receipt' : 'Photo / Receipt'}</span>
                            {metadata?.fileSize ? (
                              <span className="text-[9px] opacity-75">
                                ({(metadata.fileSize / 1024).toFixed(0)}K)
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 italic">
                            No Receipt
                          </span>
                        )}
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {renderStatusBadge(status)}
                      </td>

                      {/* Action */}
                      <td
                        className="py-3.5 pr-4 pl-3 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onOpenVerifyModal(expense, sortedExpenses)}
                          className="inline-flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 transition-colors"
                        >
                          <FileCheck2 className="h-3.5 w-3.5" />
                          <span>Verify</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Showing <strong>{startIndex + 1}</strong> to{' '}
              <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> of{' '}
              <strong>{totalItems}</strong> entries
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Page {validCurrentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
