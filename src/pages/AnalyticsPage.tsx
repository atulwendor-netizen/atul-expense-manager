import React, { useState, useMemo } from 'react';
import { Expense, Reimbursement, Trip } from '../types/index';
import { SummaryCard } from '../components/SummaryCard';
import { formatCurrency, formatDate, reconcileTripsSettlement } from '../utils/calculations';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Receipt,
  CreditCard,
  Calendar,
  Layers,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';

interface AnalyticsPageProps {
  expenses: Expense[];
  reimbursements: Reimbursement[];
  trips: Trip[];
  activeTripId: string;
  onSelectTrip: (tripId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Transit': '#3b82f6',
  'Food & Beverage': '#10b981',
  'Lodging': '#8b5cf6',
  'Miscellaneous': '#f59e0b',
  'Porter': '#ec4899',
  'Uncategorized': '#94a3b8',
};

const PAYMENT_COLORS: Record<string, string> = {
  'Digital / UPI': '#3b82f6',
  'Cash': '#10b981',
  'Card': '#8b5cf6',
  'Other': '#f59e0b',
};

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  expenses,
  reimbursements,
  trips,
  activeTripId,
  onSelectTrip,
}) => {
  const [selectedTrip, setSelectedTrip] = useState(activeTripId);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Sync with global activeTripId if it changes
  React.useEffect(() => {
    setSelectedTrip(activeTripId);
  }, [activeTripId]);

  // Extract available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.category) set.add(e.category.trim());
    });
    return Array.from(set).sort();
  }, [expenses]);

  // Filtered dataset according to active filters
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedTrip !== 'all' && e.tripId !== selectedTrip) return false;
      if (selectedCategory !== 'all' && e.category?.trim() !== selectedCategory) return false;
      const expDate = e.date ? e.date.split('T')[0] : '';
      if (startDate && (!expDate || expDate < startDate)) return false;
      if (endDate && (!expDate || expDate > endDate)) return false;
      return true;
    });
  }, [expenses, selectedTrip, selectedCategory, startDate, endDate]);

  const validExpenses = useMemo(() => {
    return filteredExpenses.filter(
      (e) => e.status === 'valid' && typeof e.amount === 'number' && !isNaN(e.amount) && e.amount > 0
    );
  }, [filteredExpenses]);

  // Reimbursements for active scope
  const scopedReimbursements = useMemo(() => {
    return reimbursements.filter((r) => {
      if (selectedTrip !== 'all' && r.tripId !== selectedTrip) return false;
      const rDate = r.date ? r.date.split('T')[0] : '';
      if (startDate && (!rDate || rDate < startDate)) return false;
      if (endDate && (!rDate || rDate > endDate)) return false;
      return true;
    });
  }, [reimbursements, selectedTrip, startDate, endDate]);

  // Key KPI metrics
  const totalSpend = useMemo(() => {
    return validExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [validExpenses]);

  const totalReimbursed = useMemo(() => {
    return scopedReimbursements.reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [scopedReimbursements]);

  const reconciliation = useMemo(() => {
    return reconcileTripsSettlement(trips, validExpenses, scopedReimbursements);
  }, [trips, validExpenses, scopedReimbursements]);

  const { pendingDue, totalSurplus, hasDiscrepancy } = useMemo(() => {
    if (selectedTrip !== 'all') {
      const summary = reconciliation.summaries.find((s) => s.tripId === selectedTrip);
      return {
        pendingDue: summary?.pendingDue || 0,
        totalSurplus: summary?.surplus || 0,
        hasDiscrepancy: summary?.isOverReimbursed || false,
      };
    }
    return {
      pendingDue: reconciliation.overall.pendingDue,
      totalSurplus: reconciliation.overall.totalSurplus,
      hasDiscrepancy: reconciliation.overall.hasDiscrepancy,
    };
  }, [selectedTrip, reconciliation]);

  const settlementRate = totalSpend > 0
    ? Math.round((totalReimbursed / totalSpend) * 100)
    : (totalReimbursed > 0 ? 100 : 0);

  // Active spending days calculation
  const uniqueDates = useMemo(() => {
    return new Set(validExpenses.map((e) => e.date).filter(Boolean));
  }, [validExpenses]);

  const dailyAverage = uniqueDates.size > 0 ? Math.round(totalSpend / uniqueDates.size) : 0;

  // 1. Category Breakdown Data
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    validExpenses.forEach((e) => {
      const cat = e.category?.trim() || 'Uncategorized';
      map.set(cat, (map.get(cat) || 0) + (e.amount || 0));
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalSpend > 0 ? Math.round((value / totalSpend) * 100) : 0,
        color: CATEGORY_COLORS[name] || '#06b6d4',
      }))
      .sort((a, b) => b.value - a.value);
  }, [validExpenses, totalSpend]);

  // 2. Daily Spending Trend Data
  const dailyTrendData = useMemo(() => {
    const dateMap = new Map<string, number>();
    validExpenses.forEach((e) => {
      if (e.date) {
        dateMap.set(e.date, (dateMap.get(e.date) || 0) + (e.amount || 0));
      }
    });

    const sortedDates = Array.from(dateMap.keys()).sort();
    let cumulative = 0;

    return sortedDates.map((date) => {
      const amount = dateMap.get(date) || 0;
      cumulative += amount;
      return {
        date,
        formattedDate: formatDate(date),
        amount,
        cumulative,
      };
    });
  }, [validExpenses]);

  // 3. Trip Comparison Data
  const tripComparisonData = useMemo(() => {
    return trips.map((trip) => {
      const tripExp = expenses
        .filter((e) => e.tripId === trip.id && e.status === 'valid' && typeof e.amount === 'number')
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      const tripReimb = reimbursements
        .filter((r) => r.tripId === trip.id)
        .reduce((sum, r) => sum + (r.amount || 0), 0);
      const tripPending = Math.max(0, tripExp - tripReimb);

      return {
        name: trip.name.split('(')[0].trim(),
        totalSpend: tripExp,
        reimbursed: tripReimb,
        pending: tripPending,
      };
    });
  }, [trips, expenses, reimbursements]);

  // 4. Payment Method Distribution Data
  const paymentMethodData = useMemo(() => {
    const map = new Map<string, number>();
    validExpenses.forEach((e) => {
      const pay = e.paymentMethod?.trim() || 'Other';
      map.set(pay, (map.get(pay) || 0) + (e.amount || 0));
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
        color: PAYMENT_COLORS[name] || '#3b82f6',
      }))
      .sort((a, b) => b.value - a.value);
  }, [validExpenses]);

  // 5. Monthly Summary Data
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, number>();
    validExpenses.forEach((e) => {
      if (e.date) {
        const monthKey = e.date.substring(0, 7); // 'YYYY-MM'
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + (e.amount || 0));
      }
    });

    const monthNames: Record<string, string> = {
      '2026-08': 'Aug 2026',
      '2026-09': 'Sep 2026',
      '2026-10': 'Oct 2026',
    };

    return Array.from(monthMap.keys())
      .sort()
      .map((key) => ({
        month: monthNames[key] || key,
        amount: monthMap.get(key) || 0,
      }));
  }, [validExpenses]);

  // 6. Top 10 Expenses
  const top10Expenses = useMemo(() => {
    return [...validExpenses]
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 10);
  }, [validExpenses]);

  const handleResetFilters = () => {
    setSelectedTrip('all');
    onSelectTrip('all');
    setStartDate('');
    setEndDate('');
    setSelectedCategory('all');
  };

  return (
    <div className="space-y-6 animate-dashboard-fade">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Analytics & Financial Insights
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deep-dive visual breakdown across categories, daily timelines, trip allocations, and payment modes
          </p>
        </div>

        <button
          onClick={handleResetFilters}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Tracked Expenditure"
          value={formatCurrency(totalSpend)}
          subtitle={`${validExpenses.length} valid transactions`}
          icon={Receipt}
          accentColor="brand"
        />

        <SummaryCard
          title="Settled Reimbursement"
          value={formatCurrency(totalReimbursed)}
          subtitle={totalSurplus > 0 ? `Includes ${formatCurrency(totalSurplus)} excess advance` : `${settlementRate}% coverage of total spend`}
          icon={TrendingUp}
          accentColor="emerald"
          badge={totalSurplus > 0 ? { text: `${formatCurrency(totalSurplus)} Excess`, variant: 'warning' } : { text: 'Received', variant: 'success' }}
        />

        <SummaryCard
          title="Pending Reimbursement"
          value={formatCurrency(pendingDue)}
          subtitle={totalSurplus > 0 ? `Reconciled dues (Net: ${formatCurrency(totalSpend - totalReimbursed)})` : "Sum of pending trip claims"}
          icon={ArrowUpRight}
          accentColor="amber"
          badge={{ text: hasDiscrepancy ? 'Discrepancy Flagged' : (pendingDue === 0 ? 'Settled' : 'Due Claim'), variant: pendingDue === 0 && !hasDiscrepancy ? 'success' : 'warning' }}
        />

        <SummaryCard
          title="Daily Average"
          value={formatCurrency(dailyAverage)}
          subtitle={`Across ${uniqueDates.size} active spending days`}
          icon={Calendar}
          accentColor="violet"
        />
      </div>

      {/* Interactive Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Trip:</span>
          <select
            value={selectedTrip}
            onChange={(e) => {
              setSelectedTrip(e.target.value);
              onSelectTrip(e.target.value);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Trips</option>
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

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Date Range:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
          />
        </div>
      </div>

      {/* Row 1: Category Breakdown & Daily Spending Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Category Breakdown */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Category Spending Distribution
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalSpend)}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(val: number) => [formatCurrency(val), 'Amount']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    {cat.name}
                  </div>
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white">
                    {formatCurrency(cat.value)} ({cat.percentage}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Daily Spending Timeline */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Daily Spend Timeline (₹)
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Avg: <strong className="text-blue-600">{formatCurrency(dailyAverage)}/day</strong>
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendData}>
                <defs>
                  <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => {
                    const parts = d.split('-');
                    return `${parts[1]}/${parts[2]}`;
                  }}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  formatter={(val: number) => [formatCurrency(val), 'Daily Spend']}
                  labelFormatter={(l) => formatDate(String(l))}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#analyticsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <span>Peak Day: {dailyTrendData.length > 0 ? formatDate([...dailyTrendData].sort((a, b) => b.amount - a.amount)[0]?.date) : 'N/A'}</span>
            <span>Total Active Days: {uniqueDates.size}</span>
          </div>
        </div>
      </div>

      {/* Row 2: Trip Comparison & Payment Methods Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Trip Comparison Bar Chart */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Trip Comparison: Spend vs Reimbursement
              </h3>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tripComparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  formatter={(val: number) => [formatCurrency(val), '']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="totalSpend" name="Total Spend" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reimbursed" name="Reimbursed" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending Due" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Payment Method Distribution */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Payment Method Share
              </h3>
            </div>
            <span className="text-xs text-slate-500">Total: {formatCurrency(totalSpend)}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={paymentMethodData}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <RechartsTooltip
                  formatter={(val: number) => [formatCurrency(val), 'Volume']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" name="Amount (₹)" fill="#10b981" radius={[0, 6, 6, 0]}>
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`pay-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Monthly Spend Breakdown */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Monthly Expenditure Overview
            </h3>
          </div>
          <span className="text-xs text-slate-500">Aug – Oct 2026</span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
              />
              <RechartsTooltip
                formatter={(val: number) => [formatCurrency(val), 'Monthly Spend']}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="amount" name="Spend (₹)" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 Expenses Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-5 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Top 10 Highest Single Expenses
            </h3>
          </div>
          <span className="text-xs text-slate-500">Sorted by amount</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {top10Expenses.map((exp, idx) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                          : idx === 2
                          ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {formatDate(exp.date)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                    {exp.description}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{exp.location || '—'}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{exp.paymentMethod || '—'}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {formatCurrency(exp.amount || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
