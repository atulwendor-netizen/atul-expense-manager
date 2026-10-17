import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Expense } from '../types/index';
import { formatCurrency } from '../utils/calculations';
import { TrendingUp, Layers } from 'lucide-react';

interface ExpenseTrendChartProps {
  expenses: Expense[];
}

export const ExpenseTrendChart: React.FC<ExpenseTrendChartProps> = ({ expenses }) => {
  const [viewMode, setViewMode] = useState<'daily' | 'cumulative'>('daily');

  const chartData = useMemo(() => {
    // Group valid expenses by date
    const dateMap = new Map<string, number>();

    expenses
      .filter((e) => e.status === 'valid' && e.date && typeof e.amount === 'number')
      .forEach((e) => {
        const d = e.date;
        dateMap.set(d, (dateMap.get(d) || 0) + (e.amount || 0));
      });

    // Sort by date ascending
    const sortedDates = Array.from(dateMap.keys()).sort();

    let runningTotal = 0;
    return sortedDates.map((date) => {
      const daily = dateMap.get(date) || 0;
      runningTotal += daily;

      // Format short label e.g. "Aug 20"
      const parts = date.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const shortDate = parts.length === 3
        ? `${monthNames[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)}`
        : date;

      return {
        date,
        shortDate,
        amount: daily,
        cumulative: runningTotal,
      };
    });
  }, [expenses]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Spending Trend Over Time
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daily and cumulative expenditure progression
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('daily')}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              viewMode === 'daily'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Daily Spend
          </button>
          <button
            onClick={() => setViewMode('cumulative')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              viewMode === 'cumulative'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Layers className="h-3 w-3" />
            Cumulative
          </button>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis
              dataKey="shortDate"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              dy={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {data.date}
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        Daily: {formatCurrency(data.amount)}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Cumulative: {formatCurrency(data.cumulative)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey={viewMode === 'daily' ? 'amount' : 'cumulative'}
              stroke="#3b82f6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#spendGradient)"
              isAnimationActive={true}
              animationDuration={700}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
