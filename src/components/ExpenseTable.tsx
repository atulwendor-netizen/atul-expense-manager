import React, { useState, useMemo, useEffect } from 'react';
import { Expense, Trip } from '../types/index';
import { formatCurrency, formatDate } from '../utils/calculations';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Eye,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FilterX,
  MessageSquare,
} from 'lucide-react';

export type SortField = 'date' | 'description' | 'category' | 'amount';
export type SortOrder = 'asc' | 'desc';

interface ExpenseTableProps {
  expenses: Expense[];
  trips: Trip[];
  totalExpensesCount?: number;
  filterKey?: string;
  onAddExpense?: () => void;
  onViewExpense: (expense: Expense) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onClearFilters: () => void;
  onDiscussExpense?: (expense: Expense) => void;
  isManager?: boolean;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  trips,
  totalExpensesCount,
  filterKey,
  onAddExpense,
  onViewExpense,
  onEditExpense,
  onDeleteExpense,
  onBulkDelete,
  onClearFilters,
  onDiscussExpense,
  isManager = false,
}) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const tripMap = useMemo(() => new Map(trips.map((t) => [t.id, t.name])), [trips]);

  // 1. Sort expenses (deterministic & NaN-safe)
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        const dateA = a.date || '';
        const dateB = b.date || '';
        comparison = dateA.localeCompare(dateB);
      } else if (sortField === 'description') {
        comparison = (a.description || '').localeCompare(b.description || '');
      } else if (sortField === 'category') {
        comparison = (a.category || '').localeCompare(b.category || '');
      } else if (sortField === 'amount') {
        const amtA = typeof a.amount === 'number' && !isNaN(a.amount) ? a.amount : -1;
        const amtB = typeof b.amount === 'number' && !isNaN(b.amount) ? b.amount : -1;
        comparison = amtA - amtB;
      }
      if (comparison === 0) {
        comparison = (a.id || '').localeCompare(b.id || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [expenses, sortField, sortOrder]);

  // 2. Pagination calculation
  const totalItems = sortedExpenses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedExpenses = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return sortedExpenses.slice(startIndex, startIndex + pageSize);
  }, [sortedExpenses, validCurrentPage, pageSize]);

  const startRecord = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(validCurrentPage * pageSize, totalItems);

  // Reset to page 1 when filters change (filterKey changes)
  useEffect(() => {
    if (filterKey !== undefined) {
      setCurrentPage(1);
    }
  }, [filterKey]);

  // Keep currentPage valid when records are deleted (page clamping)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Clean up selectedIds when records are deleted
  useEffect(() => {
    setSelectedIds((prev) => {
      const existingIds = new Set(expenses.map((e) => e.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (existingIds.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [expenses]);

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (paginatedExpenses.every((e) => selectedIds.has(e.id))) {
      // Deselect all on current page
      const newSelected = new Set(selectedIds);
      paginatedExpenses.forEach((e) => newSelected.delete(e.id));
      setSelectedIds(newSelected);
    } else {
      // Select all on current page
      const newSelected = new Set(selectedIds);
      paginatedExpenses.forEach((e) => newSelected.add(e.id));
      setSelectedIds(newSelected);
    }
  };

  const handleToggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const isAllCurrentPageSelected =
    paginatedExpenses.length > 0 && paginatedExpenses.every((e) => selectedIds.has(e.id));

  // Render Sort Header Icon
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
    ) : (
      <ArrowDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
    );
  };

  // Empty state
  if (totalItems === 0) {
    const isGlobalEmpty = totalExpensesCount !== undefined ? totalExpensesCount === 0 : false;

    if (isGlobalEmpty) {
      return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No expenses recorded yet
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Get started by logging your first transaction or trip expense.
          </p>
          {onAddExpense && !isManager && (
            <button
              onClick={onAddExpense}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              + Record Expense
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 mb-3">
          <FilterX className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          No expenses match your filters
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Try loosening your filter criteria or search query to see more results.
        </p>
        <button
          onClick={onClearFilters}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          Reset All Filters
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk Action Banner */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-2.5 text-xs text-blue-900 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-800 animate-in fade-in duration-150">
          <span className="font-semibold">
            {selectedIds.size} expense{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg px-2.5 py-1 font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40"
            >
              Deselect All
            </button>
            {!isManager && (
              <button
                onClick={() => {
                  onBulkDelete(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 font-semibold text-white shadow-sm hover:bg-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Selected ({selectedIds.size})
              </button>
            )}
          </div>
        </div>
      )}

      {/* DESKTOP & TABLET TABLE VIEW */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {!isManager && (
                  <th className="py-3.5 pl-4 pr-2 w-10">
                    <input
                      type="checkbox"
                      checked={isAllCurrentPageSelected}
                      onChange={handleToggleSelectAll}
                      aria-label="Select all expenses on current page"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </th>
                )}

                <th
                  onClick={() => handleSort('date')}
                  className="py-3.5 px-3 cursor-pointer select-none group"
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
                    <span>Description</span>
                    {renderSortIndicator('description')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('category')}
                  className="py-3.5 px-3 cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Category</span>
                    {renderSortIndicator('category')}
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

                <th className="py-3.5 px-3 hidden lg:table-cell">Payment</th>
                <th className="py-3.5 px-3 hidden xl:table-cell">Location</th>
                <th className="py-3.5 px-3 hidden 2xl:table-cell">Trip</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedExpenses.map((expense) => {
                const isSelected = selectedIds.has(expense.id);
                const isIncomplete = expense.status === 'incomplete' || expense.amount === null;

                return (
                  <tr
                    key={expense.id}
                    onClick={() => onViewExpense(expense)}
                    className={`group transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/50 dark:bg-blue-950/20'
                        : isIncomplete
                        ? 'bg-amber-50/30 hover:bg-amber-50/60 dark:bg-amber-950/10 dark:hover:bg-amber-950/20'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Checkbox */}
                    {!isManager && (
                      <td
                        className="py-3 pl-4 pr-2"
                        onClick={(e) => handleToggleSelectRow(expense.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          aria-label={`Select expense: ${expense.description || expense.id}`}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                        />
                      </td>
                    )}

                    {/* Date */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium">
                      {formatDate(expense.date)}
                    </td>

                    {/* Description & Notes */}
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          <span>{expense.description || 'Untitled Expense'}</span>
                          {expense.receipt && (
                            <span title="Receipt attached">
                              <FileText className="h-3 w-3 text-blue-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        {expense.notes && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xs">
                            {expense.notes}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {expense.category || 'Uncategorized'}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {isIncomplete ? (
                        <span className="font-semibold text-amber-600 dark:text-amber-400 italic">
                          Missing
                        </span>
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(expense.amount)}
                        </span>
                      )}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-3 whitespace-nowrap hidden lg:table-cell text-slate-600 dark:text-slate-400">
                      {expense.paymentMethod || '—'}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3 whitespace-nowrap hidden xl:table-cell text-slate-600 dark:text-slate-400">
                      {expense.location || '—'}
                    </td>

                    {/* Trip */}
                    <td className="py-3 px-3 whitespace-nowrap hidden 2xl:table-cell text-slate-500 dark:text-slate-400">
                      {(expense.tripId && tripMap.get(expense.tripId)) || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isIncomplete ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <AlertCircle className="h-3 w-3" />
                          INCOMPLETE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          VALID
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 pr-4 pl-3 text-right whitespace-nowrap">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onViewExpense(expense)}
                          title="View Details"
                          aria-label={`View details for ${expense.description || 'expense'}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {onDiscussExpense && (
                          <button
                            onClick={() => onDiscussExpense(expense)}
                            title="Discuss Expense"
                            aria-label={`Discuss ${expense.description || 'expense'}`}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800 dark:hover:text-amber-400 transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                          </button>
                        )}
                        {!isManager && (
                          <>
                            <button
                              onClick={() => onEditExpense(expense)}
                              title="Edit Expense"
                              aria-label={`Edit ${expense.description || 'expense'}`}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-400 transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteExpense(expense.id)}
                              title="Delete Expense"
                              aria-label={`Delete ${expense.description || 'expense'}`}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-2.5">
        {paginatedExpenses.map((expense) => {
          const isSelected = selectedIds.has(expense.id);
          const isIncomplete = expense.status === 'incomplete' || expense.amount === null;

          return (
            <div
              key={expense.id}
              onClick={() => onViewExpense(expense)}
              className={`rounded-2xl border p-4 shadow-sm transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                  : isIncomplete
                  ? 'border-amber-200 bg-amber-50/20 dark:border-amber-800/60 dark:bg-amber-950/10'
                  : 'border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  {!isManager && (
                    <div
                      onClick={(e) => handleToggleSelectRow(expense.id, e)}
                      className="pt-0.5"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {expense.description || 'Untitled Expense'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatDate(expense.date)} • {expense.location || 'Local'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {isIncomplete ? (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Amount Missing
                    </span>
                  ) : (
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {formatCurrency(expense.amount)}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {expense.category}
                  </span>
                  {isIncomplete && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Incomplete
                    </span>
                  )}
                </div>

                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onDiscussExpense && (
                    <button
                      onClick={() => onDiscussExpense(expense)}
                      className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Discuss
                    </button>
                  )}
                  {!isManager ? (
                    <>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() => onEditExpense(expense)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400"
                      >
                        Edit
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() => onDeleteExpense(expense.id)}
                        className="text-xs font-semibold text-rose-600 dark:text-rose-400"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() => onViewExpense(expense)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400"
                      >
                        View
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGINATION TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 text-xs">
        <div className="flex items-center justify-between sm:justify-start gap-3 text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{startRecord}</strong>–
            <strong className="text-slate-900 dark:text-white">{endRecord}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{totalItems}</strong> expenses
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Per page:</span>
            <select
              value={pageSize}
              aria-label="Expenses per page"
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Page Nav Buttons */}
        <div className="flex items-center justify-center gap-1 self-center sm:self-auto">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validCurrentPage <= 1}
            aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-3 text-xs font-medium text-slate-700 dark:text-slate-300">
            Page {validCurrentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage >= totalPages}
            aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
