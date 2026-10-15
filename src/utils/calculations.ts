import { Expense, Reimbursement, DashboardMetrics } from '../types/index';

/**
 * Calculates canonical dashboard metrics from a scoped dataset.
 * Follows the strict rule:
 * Daily Average = Total Expense / Active Spending Days
 * where Active Spending Days = number of unique dates containing valid expense records.
 */
export function calculateDashboardMetrics(
  expenses: Expense[],
  reimbursements: Reimbursement[],
  explicitDurationDays?: number
): DashboardMetrics {
  const validExpenses = expenses.filter(
    (e) => e.status === 'valid' && typeof e.amount === 'number' && e.amount !== null && !isNaN(e.amount)
  );
  const incompleteExpenses = expenses.filter(
    (e) => e.status === 'incomplete' || e.amount === null || isNaN(e.amount as number)
  );

  const totalExpense = validExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalReimbursement = reimbursements.reduce((sum, r) => sum + (r.amount || 0), 0);
  const pendingReimbursement = Math.max(0, totalExpense - totalReimbursement);
  const totalTransactions = validExpenses.length;
  const incompleteTransactions = incompleteExpenses.length;

  // Active unique dates with valid expenses
  const uniqueDates = new Set(validExpenses.map((e) => e.date).filter(Boolean));
  const activeSpendingDays = uniqueDates.size > 0 ? uniqueDates.size : 1;

  // Canonical Daily Average calculation across the board: Total Expense / Active Spending Days
  const dailyAverage = totalExpense > 0 ? Math.round(totalExpense / activeSpendingDays) : 0;

  // Trip duration in days
  const tripDurationDays = explicitDurationDays || activeSpendingDays;

  return {
    totalExpense,
    totalReimbursement,
    pendingReimbursement,
    totalTransactions,
    incompleteTransactions,
    tripDurationDays,
    dailyAverage,
    activeSpendingDays,
  };
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹--';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return 'No Date';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate && !endDate) return 'All Dates';
  if (startDate && !endDate) return `From ${formatDate(startDate)}`;
  if (!startDate && endDate) return `Up to ${formatDate(endDate)}`;
  if (startDate === endDate) return formatDate(startDate!);
  return `${formatDate(startDate!)} – ${formatDate(endDate!)}`;
}
