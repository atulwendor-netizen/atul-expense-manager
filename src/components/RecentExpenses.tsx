import React from 'react';
import { Expense } from '../types/index';
import { formatCurrency, formatDate } from '../utils/calculations';
import { Clock, ArrowUpRight, AlertCircle } from 'lucide-react';

interface RecentExpensesProps {
  expenses: Expense[];
  onViewAll?: () => void;
  onEditExpense?: (expense: Expense) => void;
  onAddExpense?: () => void;
}

export const RecentExpenses: React.FC<RecentExpensesProps> = ({
  expenses,
  onViewAll,
  onEditExpense,
  onAddExpense,
}) => {
  // Take the 6 most recent records (or sorted by date desc)
  const recentList = React.useMemo(() => {
    return [...expenses]
      .sort((a, b) => {
        // If dates exist, compare dates desc
        if (a.date && b.date) return b.date.localeCompare(a.date);
        if (a.date) return -1;
        if (b.date) return 1;
        return 0;
      })
      .slice(0, 6);
  }, [expenses]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Recent Expenses
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {onAddExpense && (
            <button
              onClick={onAddExpense}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              + Log
            </button>
          )}
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View all
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {recentList.map((expense) => {
          const isIncomplete = expense.status === 'incomplete' || expense.amount === null;

          return (
            <div
              key={expense.id}
              onClick={() => onEditExpense?.(expense)}
              className="flex items-center justify-between py-3 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-xl px-2 cursor-pointer group"
            >
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {expense.description || 'Untitled Expense'}
                  </span>
                  {isIncomplete ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                      <AlertCircle className="h-2.5 w-2.5" />
                      Incomplete
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {expense.category}
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{formatDate(expense.date)}</span>
                  <span>•</span>
                  <span>{expense.location || 'Not Specified'}</span>
                  {expense.paymentMethod && (
                    <>
                      <span>•</span>
                      <span>{expense.paymentMethod}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`text-sm font-semibold ${
                    isIncomplete
                      ? 'text-amber-600 dark:text-amber-400 italic'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
