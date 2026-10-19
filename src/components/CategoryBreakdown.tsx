import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Expense } from '../types/index';
import { formatCurrency } from '../utils/calculations';
import { PieChart as PieChartIcon } from 'lucide-react';

interface CategoryBreakdownProps {
  expenses: Expense[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Transit': '#3b82f6',         // Blue
  'Food & Beverage': '#10b981', // Emerald
  'Lodging': '#8b5cf6',         // Purple
  'Miscellaneous': '#f59e0b',   // Amber
  'Porter': '#ec4899',          // Pink
  'Uncategorized': '#94a3b8',   // Slate
};

const DEFAULT_COLOR = '#06b6d4'; // Cyan

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ expenses }) => {
  const { data, totalSpend } = useMemo(() => {
    const categoryTotals = new Map<string, { amount: number; count: number }>();
    let total = 0;

    expenses
      .filter((e) => e.status === 'valid' && typeof e.amount === 'number' && e.amount > 0)
      .forEach((e) => {
        const cat = e.category || 'Uncategorized';
        const current = categoryTotals.get(cat) || { amount: 0, count: 0 };
        categoryTotals.set(cat, {
          amount: current.amount + (e.amount || 0),
          count: current.count + 1,
        });
        total += e.amount || 0;
      });

    const items = Array.from(categoryTotals.entries())
      .map(([name, val]) => ({
        name,
        amount: val.amount,
        count: val.count,
        percentage: total > 0 ? (val.amount / total) * 100 : 0,
        color: CATEGORY_COLORS[name] || DEFAULT_COLOR,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { data: items, totalSpend: total };
  }, [expenses]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChartIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Category Breakdown
          </h3>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {data.length} Categories
        </span>
      </div>

      {data.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center text-center">
          <PieChartIcon className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-xs text-slate-400 dark:text-slate-500">
            No categorized expenses recorded yet.
          </p>
        </div>
      ) : (
        <>
          <div className="relative h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="amount"
                  isAnimationActive={true}
                  animationDuration={700}
                  animationEasing="ease-out"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-lg backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-semibold text-xs text-slate-900 dark:text-white">
                              {item.name}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                            {formatCurrency(item.amount)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.percentage.toFixed(1)}% ({item.count} items)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                Total
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatCurrency(totalSpend)}
              </span>
            </div>
          </div>

          {/* Category legend list */}
          <div className="mt-2 space-y-2.5 border-t border-slate-100 pt-3 dark:border-slate-800">
            {data.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    ({cat.count})
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(cat.amount)}
                  </span>
                  <span className="w-10 text-right text-[11px] text-slate-500 dark:text-slate-400">
                    {cat.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
