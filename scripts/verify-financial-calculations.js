/**
 * Authoritative Financial Calculations Verification & Regression Suite
 *
 * Verifies:
 * 1. Stored records baseline figures (78 records, 77 valid, 1 incomplete, ₹17,136.00 valid total).
 * 2. Category totals and mathematical sum consistency (Transit ₹5,133, Food & Beverage ₹6,377, Lodging ₹5,040, Miscellaneous ₹366, Uncategorized ₹138, Porter ₹82).
 * 3. Reimbursements and dynamic pending balance: max(0, Total Expenses - Total Reimbursements).
 * 4. Trip allocations, per-trip sums, duration days vs active spending days, and daily average.
 * 5. Normal, boundary, and incomplete cases (zero, negative, fractional paise, null/NaN, empty dataset).
 * 6. Currency parsing, formatting, and rounding precision.
 * 7. Cross-view consistency across Cards, Tables, Category Breakdown, Trend Chart, Reports, and Excel Exports.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`   - ${message}: ✅ PASSED`);
  passedTests++;
}

async function runFinancialAuditSuite() {
  console.log('\n================================================================');
  console.log('🧪 FINANCIAL CALCULATIONS & INTEGRITY: AUTHORITATIVE TEST SUITE');
  console.log('================================================================\n');

  const tempBundlePath = path.resolve(__dirname, `temp_fin_test_bundle_${Date.now()}.mjs`);
  await esbuild.build({
    stdin: {
      contents: `
        export { initialExpenses } from '../src/data/initialExpenses';
        export { initialTrips } from '../src/data/initialTrips';
        export { initialReimbursements } from '../src/data/initialReimbursements';
        export { calculateDashboardMetrics, formatCurrency, formatDate, formatDateRange } from '../src/utils/calculations';
        export { formatExpensesForExport } from '../src/utils/export';
      `,
      resolveDir: __dirname,
      sourcefile: 'entry.js',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: tempBundlePath,
    packages: 'external',
  });

  const {
    initialExpenses,
    initialTrips,
    initialReimbursements,
    calculateDashboardMetrics,
    formatCurrency,
    formatDate,
    formatDateRange,
    formatExpensesForExport,
  } = await import(`file://${tempBundlePath}`);

  try {
    // ------------------------------------------------------------------------
    // SECTION 1: Baseline Stored Records Audit & Formula Grounding
    // ------------------------------------------------------------------------
    console.log('Section 1: Baseline Records & Mathematical Grounding...');
    assert(initialExpenses.length === 78, `Total expense records in stored baseline is exactly 78 (found ${initialExpenses.length})`);
    assert(initialTrips.length === 2, `Total trips in stored baseline is exactly 2 (found ${initialTrips.length})`);
    assert(initialReimbursements.length === 1, `Total reimbursements in stored baseline is exactly 1 (found ${initialReimbursements.length})`);

    const validExpenses = initialExpenses.filter(
      (e) => e.status === 'valid' && typeof e.amount === 'number' && !isNaN(e.amount)
    );
    assert(validExpenses.length === 77, `Valid expenses count is exactly 77 (found ${validExpenses.length})`);

    const totalValidSpend = validExpenses.reduce((sum, e) => sum + e.amount, 0);
    assert(totalValidSpend === 17136, `Total valid expenditure is exactly ₹17,136.00 (calculated ${totalValidSpend})`);

    const totalReimbursed = initialReimbursements.reduce((sum, r) => sum + r.amount, 0);
    assert(totalReimbursed === 10000, `Total reimbursed amount is exactly ₹10,000.00 (calculated ${totalReimbursed})`);

    const expectedPending = Math.max(0, totalValidSpend - totalReimbursed);
    assert(expectedPending === 7136, `Pending reimbursement due to employee is exactly ₹7,136.00 (calculated ${expectedPending})`);

    // Incomplete record verification
    const incompleteExpenses = initialExpenses.filter(
      (e) => e.status === 'incomplete' || e.amount === null || isNaN(e.amount)
    );
    assert(incompleteExpenses.length === 1, `Exactly 1 incomplete record found in baseline (found ${incompleteExpenses.length})`);
    const incTarget = incompleteExpenses[0];
    assert(incTarget.id === 'exp-075', `Incomplete record has expected ID 'exp-075' (found ${incTarget.id})`);
    assert(incTarget.amount === null, `Incomplete record amount is strictly null (never silently coerced to ₹0)`);
    assert(incTarget.date === '2026-10-13', `Incomplete record date is '2026-10-13' (found ${incTarget.date})`);

    // ------------------------------------------------------------------------
    // SECTION 2: Category Totals & Cross-View Alignment
    // ------------------------------------------------------------------------
    console.log('\nSection 2: Category Totals & Mathematical Sum Consistency...');
    const expectedCategoryTotals = {
      'Transit': 5133,
      'Food & Beverage': 6377,
      'Lodging': 5040,
      'Miscellaneous': 366,
      'Uncategorized': 138,
      'Porter': 82,
    };

    const actualCategoryTotals = {};
    validExpenses.forEach((e) => {
      const cat = e.category || 'Uncategorized';
      actualCategoryTotals[cat] = (actualCategoryTotals[cat] || 0) + e.amount;
    });

    let catSum = 0;
    for (const [catName, expectedAmount] of Object.entries(expectedCategoryTotals)) {
      const actualAmount = actualCategoryTotals[catName] || 0;
      assert(
        actualAmount === expectedAmount,
        `Category "${catName}" total is exactly ₹${expectedAmount.toLocaleString('en-IN')} (calculated ₹${actualAmount.toLocaleString('en-IN')})`
      );
      catSum += actualAmount;
    }
    assert(catSum === totalValidSpend, `Sum of all categories (₹${catSum}) exactly equals total valid spend (₹${totalValidSpend})`);

    // Check uncategorized items specifically
    const uncatExpenses = initialExpenses.filter((e) => e.category === 'Uncategorized' || !e.category);
    assert(uncatExpenses.length === 2, `2 records are explicitly in 'Uncategorized' (found ${uncatExpenses.length})`);
    const uncatIds = uncatExpenses.map((e) => e.id).sort();
    assert(uncatIds[0] === 'exp-071' && uncatIds[1] === 'exp-074', `Uncategorized record IDs are 'exp-071' and 'exp-074'`);
    assert(uncatExpenses.reduce((s, e) => s + (e.amount || 0), 0) === 138, `Uncategorized total is ₹108 + ₹30 = ₹138.00`);

    // ------------------------------------------------------------------------
    // SECTION 3: Trip Allocations & Multi-Counting Prevention
    // ------------------------------------------------------------------------
    console.log('\nSection 3: Trip Allocations, Date Ranges, & Duplicate Counting Audit...');
    
    // Trip 1: Mumbai - Pune
    const trip1 = initialTrips.find((t) => t.id === 'trip-mumbai-pune-2026');
    assert(trip1 !== undefined, `Found Trip 1: "Service Visit" (trip-mumbai-pune-2026)`);
    const trip1Exps = initialExpenses.filter((e) => e.tripId === trip1.id);
    const trip1Valids = trip1Exps.filter((e) => e.status === 'valid' && typeof e.amount === 'number' && !isNaN(e.amount));
    const trip1Spend = trip1Valids.reduce((s, e) => s + e.amount, 0);
    assert(trip1Valids.length === 69, `Trip 1 valid records count is 69 (found ${trip1Valids.length})`);
    assert(trip1Spend === 16455, `Trip 1 total spend is exactly ₹16,455.00 (calculated ₹${trip1Spend})`);

    const trip1Reimbs = initialReimbursements.filter((r) => r.tripId === trip1.id);
    const trip1ReimbTotal = trip1Reimbs.reduce((s, r) => s + r.amount, 0);
    assert(trip1ReimbTotal === 10000, `Trip 1 allocated reimbursement is ₹10,000.00 (calculated ₹${trip1ReimbTotal})`);
    const trip1Pending = Math.max(0, trip1Spend - trip1ReimbTotal);
    assert(trip1Pending === 6455, `Trip 1 pending claim is ₹6,455.00 (calculated ₹${trip1Pending})`);

    // Trip 1 dates
    const trip1Dates = Array.from(new Set(trip1Valids.map((e) => e.date).filter(Boolean))).sort();
    assert(trip1Dates.length === 15, `Trip 1 contains exactly 15 active spending dates (found ${trip1Dates.length})`);
    const trip1DailyAvg = Math.round(trip1Spend / trip1Dates.length);
    assert(trip1DailyAvg === 1097, `Trip 1 daily average is exactly ₹1,097/day (16,455 / 15 = 1,097)`);

    // Trip 2: Local Operations
    const trip2 = initialTrips.find((t) => t.id === 'trip-local-work-2026');
    assert(trip2 !== undefined, `Found Trip 2: "Local Operations (Gurgaon & Delhi)" (trip-local-work-2026)`);
    const trip2Exps = initialExpenses.filter((e) => e.tripId === trip2.id);
    const trip2Valids = trip2Exps.filter((e) => e.status === 'valid' && typeof e.amount === 'number' && !isNaN(e.amount));
    const trip2Spend = trip2Valids.reduce((s, e) => s + e.amount, 0);
    assert(trip2Valids.length === 8, `Trip 2 valid records count is 8 (found ${trip2Valids.length})`);
    assert(trip2Spend === 681, `Trip 2 total spend is exactly ₹681.00 (calculated ₹${trip2Spend})`);

    const trip2Incomplete = trip2Exps.filter((e) => e.status === 'incomplete' || e.amount === null);
    assert(trip2Incomplete.length === 1, `Trip 2 contains exactly 1 incomplete record (exp-075)`);
    assert(trip2Incomplete[0].id === 'exp-075', `Trip 2 incomplete record ID is 'exp-075'`);

    const trip2Reimbs = initialReimbursements.filter((r) => r.tripId === trip2.id);
    const trip2ReimbTotal = trip2Reimbs.reduce((s, r) => s + r.amount, 0);
    assert(trip2ReimbTotal === 0, `Trip 2 has ₹0 reimbursement credits`);
    const trip2Pending = Math.max(0, trip2Spend - trip2ReimbTotal);
    assert(trip2Pending === 681, `Trip 2 pending claim is ₹681.00 (calculated ₹${trip2Pending})`);

    const trip2Dates = Array.from(new Set(trip2Valids.map((e) => e.date).filter(Boolean))).sort();
    assert(trip2Dates.length === 3, `Trip 2 contains 3 active spending dates (Sep 11, Sep 22, Oct 12)`);
    const trip2DailyAvg = Math.round(trip2Spend / trip2Dates.length);
    assert(trip2DailyAvg === 227, `Trip 2 daily average across active dates is ₹227/day (681 / 3 = 227)`);

    // Sum verification across trips
    assert(trip1Spend + trip2Spend === totalValidSpend, `Sum of Trip 1 and Trip 2 spends (₹16,455 + ₹681 = ₹17,136) matches overall valid total`);
    assert(trip1Pending + trip2Pending === expectedPending, `Sum of Trip 1 and Trip 2 pending (₹6,455 + ₹681 = ₹7,136) matches overall pending`);

    // Zero unassigned expenses
    const unassignedExps = initialExpenses.filter((e) => !e.tripId);
    assert(unassignedExps.length === 0, `No expenses are orphaned without a tripId (found ${unassignedExps.length})`);

    // Zero cross-trip double counting
    const expensesWithMultipleTrips = initialExpenses.filter((e) => Array.isArray(e.tripId));
    assert(expensesWithMultipleTrips.length === 0, `No expenses have multi-trip array assignment (0 double-counted)`);

    // ------------------------------------------------------------------------
    // SECTION 4: Daily Average & Dashboard Metrics Formula Grounding
    // ------------------------------------------------------------------------
    console.log('\nSection 4: Daily Average & Dashboard Metrics Verification...');
    const allUniqueDates = Array.from(new Set(validExpenses.map((e) => e.date).filter(Boolean))).sort();
    assert(allUniqueDates.length === 18, `Total active spending days across all valid expenses is 18 (found ${allUniqueDates.length})`);
    assert(allUniqueDates[0] === '2026-08-20', `Earliest active spending date is '2026-08-20'`);
    assert(allUniqueDates[allUniqueDates.length - 1] === '2026-10-12', `Latest active spending date is '2026-10-12'`);

    const metricsOverall = calculateDashboardMetrics(initialExpenses, initialReimbursements);
    assert(metricsOverall.totalExpense === 17136, `calculateDashboardMetrics totalExpense is 17136`);
    assert(metricsOverall.totalReimbursement === 10000, `calculateDashboardMetrics totalReimbursement is 10000`);
    assert(metricsOverall.pendingReimbursement === 7136, `calculateDashboardMetrics pendingReimbursement is 7136`);
    assert(metricsOverall.totalTransactions === 77, `calculateDashboardMetrics totalTransactions is 77`);
    assert(metricsOverall.incompleteTransactions === 1, `calculateDashboardMetrics incompleteTransactions is 1`);
    assert(metricsOverall.activeSpendingDays === 18, `calculateDashboardMetrics activeSpendingDays is 18`);
    
    // Canonical Daily Average = Total Expense / Active Spending Days
    // 17136 / 18 = 952 (Math.round(17136 / 18) = 952)
    assert(metricsOverall.dailyAverage === 952, `Canonical daily average is ₹952/day (calculated ${metricsOverall.dailyAverage})`);

    // Duration days without explicit trip should match active spending days
    assert(metricsOverall.tripDurationDays === 18, `tripDurationDays defaults to 18 active spending days when no explicit trip is specified`);

    // ------------------------------------------------------------------------
    // SECTION 5: Currency Parsing, Formatting, and Decimals
    // ------------------------------------------------------------------------
    console.log('\nSection 5: Currency Formatting & Precision Verification...');
    assert(formatCurrency(17136) === '₹17,136', `formatCurrency(17136) formats cleanly as '₹17,136'`);
    assert(formatCurrency(0) === '₹0', `formatCurrency(0) formats as '₹0'`);
    assert(formatCurrency(108.5) === '₹108.50', `formatCurrency(108.5) preserves paise precision as '₹108.50'`);
    assert(formatCurrency(108.75) === '₹108.75', `formatCurrency(108.75) preserves two decimal places as '₹108.75'`);
    assert(formatCurrency(null) === '₹--', `formatCurrency(null) safely returns '₹--'`);
    assert(formatCurrency(undefined) === '₹--', `formatCurrency(undefined) safely returns '₹--'`);
    assert(formatCurrency(NaN) === '₹--', `formatCurrency(NaN) safely returns '₹--'`);
    assert(formatCurrency(-50) === '-₹50', `formatCurrency(-50) formats negative numbers as '-₹50'`);

    // Date formatting
    assert(
      formatDateRange('2026-08-20', '2026-09-03') === `${formatDate('2026-08-20')} – ${formatDate('2026-09-03')}`,
      `formatDateRange formats multi-date range cleanly`
    );
    assert(formatDateRange('2026-08-20', '2026-08-20') === '20 Aug 2026', `formatDateRange with identical dates returns single date`);

    // ------------------------------------------------------------------------
    // SECTION 6: Unit Tests for Boundary & Incomplete Cases
    // ------------------------------------------------------------------------
    console.log('\nSection 6: Boundary & Incomplete Cases Unit Tests...');

    // Case A: Over-reimbursement (Total Reimbursement > Total Expense)
    const overReimbResult = calculateDashboardMetrics(
      [
        { id: 't1', status: 'valid', amount: 500, date: '2026-10-01', description: 'Item 1', category: 'Transit', paymentMethod: 'UPI', location: '', notes: '', receipt: null, tripId: null },
      ],
      [
        { id: 'r1', amount: 1500, date: '2026-10-02', reference: 'REF-1', notes: '' },
      ]
    );
    assert(overReimbResult.totalExpense === 500, `Over-reimbursement totalExpense is 500`);
    assert(overReimbResult.totalReimbursement === 1500, `Over-reimbursement totalReimbursement is 1500`);
    assert(overReimbResult.pendingReimbursement === 0, `Pending reimbursement floors at 0 via Math.max(0, -1000)`);

    // Case B: Zero reimbursement (Full amount pending)
    const zeroReimbResult = calculateDashboardMetrics(
      [
        { id: 't1', status: 'valid', amount: 800, date: '2026-10-01', description: 'Item 1', category: 'Transit', paymentMethod: 'UPI', location: '', notes: '', receipt: null, tripId: null },
      ],
      []
    );
    assert(zeroReimbResult.pendingReimbursement === 800, `Zero reimbursement leaves full 800 pending`);

    // Case C: Empty dataset
    const emptyResult = calculateDashboardMetrics([], []);
    assert(emptyResult.totalExpense === 0, `Empty dataset totalExpense is 0`);
    assert(emptyResult.totalReimbursement === 0, `Empty dataset totalReimbursement is 0`);
    assert(emptyResult.pendingReimbursement === 0, `Empty dataset pendingReimbursement is 0`);
    assert(emptyResult.dailyAverage === 0, `Empty dataset dailyAverage is 0`);
    assert(emptyResult.totalTransactions === 0, `Empty dataset totalTransactions is 0`);
    assert(emptyResult.incompleteTransactions === 0, `Empty dataset incompleteTransactions is 0`);

    // Case D: Incomplete record with null amount must NOT be counted as valid or ₹0
    const mixedResult = calculateDashboardMetrics(
      [
        { id: 't1', status: 'valid', amount: 450, date: '2026-10-01', description: 'Valid Item', category: 'Food', paymentMethod: 'UPI', location: '', notes: '', receipt: null, tripId: null },
        { id: 't2', status: 'incomplete', amount: null, date: '2026-10-02', description: 'Missing Amount Item', category: 'Transit', paymentMethod: 'UPI', location: '', notes: '', receipt: null, tripId: null },
        { id: 't3', status: 'valid', amount: NaN, date: '2026-10-03', description: 'Corrupted NaN Item', category: 'Transit', paymentMethod: 'UPI', location: '', notes: '', receipt: null, tripId: null },
      ],
      []
    );
    assert(mixedResult.totalExpense === 450, `Only valid record amount (450) is summed; null and NaN safely excluded`);
    assert(mixedResult.totalTransactions === 1, `Total valid transactions is 1`);
    assert(mixedResult.incompleteTransactions === 2, `Incomplete transactions count is 2`);

    // Case E: Single date with multiple transactions (Active spending days check)
    const multiTxnSingleDate = calculateDashboardMetrics(
      [
        { id: 't1', status: 'valid', amount: 100, date: '2026-10-01', description: 'Item 1', category: 'Food', paymentMethod: 'UPI', location: '', notes: '', receipt: null, tripId: null },
        { id: 't2', status: 'valid', amount: 200, date: '2026-10-01', description: 'Item 2', category: 'Transit', paymentMethod: 'UPI', location: '', notes: '', receipt: null, tripId: null },
        { id: 't3', status: 'valid', amount: 300, date: '2026-10-01', description: 'Item 3', category: 'Lodging', paymentMethod: 'UPI', location: '', notes: '', receipt: null, tripId: null },
      ],
      []
    );
    assert(multiTxnSingleDate.activeSpendingDays === 1, `Multiple transactions on same date counts as 1 active spending day`);
    assert(multiTxnSingleDate.dailyAverage === 600, `Daily average on 1 active day is 600 / 1 = 600`);

    // ------------------------------------------------------------------------
    // SECTION 7: Export Formatter Consistency Audit
    // ------------------------------------------------------------------------
    console.log('\nSection 7: Excel / CSV Export Formatter Consistency...');
    const exportRows = formatExpensesForExport(initialExpenses, initialTrips);
    assert(exportRows.length === 78, `Export formats all 78 expenses`);
    
    const exportIncomplete = exportRows.filter((r) => r['Amount (₹)'] === 'Missing / Incomplete');
    assert(exportIncomplete.length === 1, `Export explicitly writes 'Missing / Incomplete' for exp-075 (found ${exportIncomplete.length})`);
    assert(exportIncomplete[0]['Description'] === 'Grabbit location gurgaon', `Incomplete row description matches target`);
    assert(exportIncomplete[0]['Status'] === 'Incomplete', `Export status column reports 'Incomplete'`);

    const exportValids = exportRows.filter((r) => typeof r['Amount (₹)'] === 'number');
    assert(exportValids.length === 77, `Export contains exactly 77 numeric amount rows`);
    const exportTotalSpend = exportValids.reduce((s, r) => s + r['Amount (₹)'], 0);
    assert(exportTotalSpend === 17136, `Sum of export numeric amounts is exactly ₹17,136.00`);

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} FINANCIAL CALCULATION TESTS PASSED!`);
    console.log('================================================================\n');
  } finally {
    if (fs.existsSync(tempBundlePath)) {
      try {
        fs.unlinkSync(tempBundlePath);
      } catch {}
    }
  }
}

runFinancialAuditSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
