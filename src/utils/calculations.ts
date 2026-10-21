import { Expense, Reimbursement, DashboardMetrics, Trip } from '../types/index';

export interface TripFinancialSummary {
  tripId: string;
  totalSpend: number;
  totalReimbursed: number;
  pendingDue: number;
  surplus: number;
  settlementPct: number;
  isOverReimbursed: boolean;
  validCount: number;
  incompleteCount: number;
  activeSpendingDays: number;
  dailyAverage: number;
}

/**
 * Calculates financial metrics for a single trip or scope.
 * Prevents capping settlement progress at 100% to clearly surface over-reimbursements.
 */
export function calculateTripFinancials(
  tripId: string | null,
  expenses: Expense[],
  reimbursements: Reimbursement[],
  explicitDurationDays?: number
): TripFinancialSummary {
  const tripExpenses = tripId
    ? expenses.filter((e) => e.tripId === tripId)
    : expenses.filter((e) => !e.tripId);
  const validExpenses = tripExpenses.filter(
    (e) => e.status === 'valid' && typeof e.amount === 'number' && e.amount !== null && !isNaN(e.amount)
  );
  const incompleteCount = tripExpenses.filter(
    (e) => e.status === 'incomplete' || e.amount === null || isNaN(e.amount as number)
  ).length;

  const totalSpend = validExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const tripReimbursements = tripId
    ? reimbursements.filter((r) => r.tripId === tripId)
    : reimbursements.filter((r) => !r.tripId);
  const totalReimbursed = tripReimbursements.reduce((sum, r) => sum + (r.amount || 0), 0);

  const pendingDue = Math.max(0, totalSpend - totalReimbursed);
  const surplus = Math.max(0, totalReimbursed - totalSpend);
  const isOverReimbursed = totalReimbursed > totalSpend;

  // Un-capped settlement percentage to expose over-reimbursement
  const settlementPct = totalSpend > 0
    ? Math.round((totalReimbursed / totalSpend) * 100)
    : totalReimbursed > 0
    ? 100
    : 0;

  const uniqueDates = new Set(validExpenses.map((e) => e.date).filter(Boolean));
  const activeSpendingDays = uniqueDates.size > 0 ? uniqueDates.size : (explicitDurationDays || 1);
  const dailyAverage = activeSpendingDays > 0 ? Math.round(totalSpend / activeSpendingDays) : 0;

  return {
    tripId: tripId || 'unallocated',
    totalSpend,
    totalReimbursed,
    pendingDue,
    surplus,
    settlementPct,
    isOverReimbursed,
    validCount: validExpenses.length,
    incompleteCount,
    activeSpendingDays,
    dailyAverage,
  };
}

/**
 * Calculates canonical dashboard metrics from a scoped dataset.
 * Follows the strict business rule:
 * 1. Daily Average = Total Expense / Active Spending Days (unique dates with valid expenses).
 * 2. In multi-trip scopes, Pending Reimbursement is the SUM of pending claims across trips
 *    and does NOT silently net one trip's over-allocation against another trip's pending dues.
 * 3. Overpayments are surfaced explicitly as totalOverReimbursement and flagged.
 */
export function calculateDashboardMetrics(
  expenses: Expense[],
  reimbursements: Reimbursement[],
  explicitDurationDays?: number,
  trips?: Trip[]
): DashboardMetrics {
  const validExpenses = expenses.filter(
    (e) => e.status === 'valid' && typeof e.amount === 'number' && e.amount !== null && !isNaN(e.amount)
  );
  const incompleteExpenses = expenses.filter(
    (e) => e.status === 'incomplete' || e.amount === null || isNaN(e.amount as number)
  );

  const totalExpense = validExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalReimbursement = reimbursements.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalTransactions = validExpenses.length;
  const incompleteTransactions = incompleteExpenses.length;

  // Collect distinct trip IDs across expenses and reimbursements
  const tripIds = new Set<string>();
  if (trips && trips.length > 0) {
    trips.forEach((t) => tripIds.add(t.id));
  } else {
    validExpenses.forEach((e) => {
      if (e.tripId) tripIds.add(e.tripId);
    });
    reimbursements.forEach((r) => {
      if (r.tripId) tripIds.add(r.tripId);
    });
  }

  let pendingReimbursement = 0;
  let totalOverReimbursement = 0;

  if (tripIds.size > 1) {
    // Multi-trip scope: Reconcile by summing pending claims per trip without silent netting
    tripIds.forEach((tId) => {
      const summary = calculateTripFinancials(tId, validExpenses, reimbursements);
      pendingReimbursement += summary.pendingDue;
      totalOverReimbursement += summary.surplus;
    });

    // Also account for unallocated expenses/reimbursements
    const unallocatedSummary = calculateTripFinancials(null, validExpenses, reimbursements);
    pendingReimbursement += unallocatedSummary.pendingDue;
    totalOverReimbursement += unallocatedSummary.surplus;
  } else {
    // Single trip scope or single pool: Standard formula
    pendingReimbursement = Math.max(0, totalExpense - totalReimbursement);
    totalOverReimbursement = Math.max(0, totalReimbursement - totalExpense);
  }

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
    totalOverReimbursement,
    netBalance: totalExpense - totalReimbursement,
    hasDiscrepancy: totalOverReimbursement > 0,
  };
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹--';
  }
  const hasDecimals = !Number.isInteger(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
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
