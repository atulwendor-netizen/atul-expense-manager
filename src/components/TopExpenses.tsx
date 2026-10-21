import React, { useMemo } from 'react';
import { Expense } from '../types/index';
import { formatCurrency, formatDate } from '../utils/calculations';
import { Trophy } from 'lucide-react';

interface TopExpensesProps {
  expenses: Expense[];
  onSelectExpense?: (expense: Expense) => void;
}

export const TopExpenses: React.FC<TopExpensesProps> = ({ expenses, onSelectExpense }) => {
  const { topList, maxAmount } = useMemo(() => {
    const valid = expenses.filter(
      (e) => e.status === 'valid' && typeof e.amount === 'number' && e.amount > 0
    );
    const sorted = [...valid].sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 5);
    const max = sorted.length > 0 ? sorted[0].amount || 1 : 1;
    return { topList: sorted, maxAmount: max };
  }, [expenses]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Top 5 Highest Expenses
          </h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Ranked by spend
        </span>
      </div>

      <div className="space-y-3">
        {topList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No expenses recorded yet.
          </div>
        ) : (
          topList.map((item, index) => {
          const ratio = Math.min(100, Math.round(((item.amount || 0) / maxAmount) * 100));

          return (
            <div
              key={item.id}
              role={onSelectExpense ? 'button' : undefined}
              tabIndex={onSelectExpense ? 0 : undefined}
              onClick={() => onSelectExpense?.(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectExpense?.(item);
                }
              }}
              className="group cursor-pointer rounded-xl p-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      index === 0
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : index === 1
                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        : index === 2
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                      {item.description}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatDate(item.date)} • {item.category}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 font-bold text-slate-900 dark:text-white">
                  {formatCurrency(item.amount)}
                </span>
              </div>

              {/* Relative bar */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500 group-hover:bg-blue-600"
                  style={{ width: `${ratio}%` }}
                />
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
};
