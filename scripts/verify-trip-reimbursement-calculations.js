/**
 * Authoritative Regression Test Suite: Trip Reimbursement & Settlement Calculations
 *
 * Covers 9 dedicated regression scenarios required for financial integrity:
 * 1. Fully reimbursed trip (spend == reimbursed, pending == 0, settlement == 100%).
 * 2. Partially reimbursed trip (spend > reimbursed, pending > 0, settlement < 100%).
 * 3. No reimbursements (reimbursed == 0, pending == total spend, settlement == 0%).
 * 4. Reimbursement greater than eligible spending (uncapped %, surplus surfaced, flagged).
 * 5. Duplicate reimbursement record (overpayment detected, audit flag raised).
 * 6. Reimbursement assigned to the wrong trip (trip surplus isolated, other trip pending NOT netted).
 * 7. Incomplete expense with a missing amount (null amount excluded from sums, tracked in count).
 * 8. Multiple trips with separate reimbursement allocations (per-trip isolation).
 * 9. Mathematical consistency between overall dashboard totals and trip-level summaries.
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

async function runTripReimbursementAuditSuite() {
  console.log('\n========================================================================');
  console.log('🧪 TRIP REIMBURSEMENT MISMATCH & SETTLEMENT CALCULATIONS: REGRESSION SUITE');
  console.log('========================================================================\n');

  const tempBundlePath = path.resolve(__dirname, `temp_trip_calc_test_${Date.now()}.mjs`);
  try {
    await esbuild.build({
      stdin: {
        contents: `
          export { initialExpenses } from '../src/data/initialExpenses';
          export { initialTrips } from '../src/data/initialTrips';
          export { initialReimbursements } from '../src/data/initialReimbursements';
          export { calculateTripFinancials, calculateDashboardMetrics, formatCurrency } from '../src/utils/calculations';
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
      calculateTripFinancials,
      calculateDashboardMetrics,
      formatCurrency,
    } = await import(`file://${tempBundlePath}`);

    // -------------------------------------------------------------------------
    // TEST 1: Fully Reimbursed Trip
    // -------------------------------------------------------------------------
    console.log('Test 1: Fully Reimbursed Trip (100% Settlement)...');
    {
      const expenses = [
        { id: 'e1', tripId: 'trip-1', amount: 3000, date: '2026-08-01', status: 'valid' },
        { id: 'e2', tripId: 'trip-1', amount: 2000, date: '2026-08-02', status: 'valid' },
      ];
      const reimbursements = [
        { id: 'r1', tripId: 'trip-1', amount: 5000, date: '2026-08-05' },
      ];

      const res = calculateTripFinancials('trip-1', expenses, reimbursements);
      assert(res.totalSpend === 5000, 'Total spend is exactly ₹5,000');
      assert(res.totalReimbursed === 5000, 'Total reimbursed is exactly ₹5,000');
      assert(res.pendingDue === 0, 'Pending due is ₹0');
      assert(res.surplus === 0, 'Surplus is ₹0');
      assert(res.isOverReimbursed === false, 'isOverReimbursed is false');
      assert(res.settlementPct === 100, 'Settlement percentage is exactly 100%');
      assert(res.validCount === 2, 'Valid count is 2');
      assert(res.activeSpendingDays === 2, 'Active spending days is 2');
      assert(res.dailyAverage === 2500, 'Daily average is ₹2,500/day (5000 / 2)');
    }

    // -------------------------------------------------------------------------
    // TEST 2: Partially Reimbursed Trip
    // -------------------------------------------------------------------------
    console.log('\nTest 2: Partially Reimbursed Trip...');
    {
      const expenses = [
        { id: 'e1', tripId: 'trip-2', amount: 6000, date: '2026-08-10', status: 'valid' },
        { id: 'e2', tripId: 'trip-2', amount: 4000, date: '2026-08-11', status: 'valid' },
      ];
      const reimbursements = [
        { id: 'r1', tripId: 'trip-2', amount: 6000, date: '2026-08-15' },
      ];

      const res = calculateTripFinancials('trip-2', expenses, reimbursements);
      assert(res.totalSpend === 10000, 'Total spend is ₹10,000');
      assert(res.totalReimbursed === 6000, 'Total reimbursed is ₹6,000');
      assert(res.pendingDue === 4000, 'Pending balance due to employee is ₹4,000');
      assert(res.surplus === 0, 'Surplus is ₹0');
      assert(res.isOverReimbursed === false, 'isOverReimbursed is false');
      assert(res.settlementPct === 60, 'Settlement percentage is 60%');
    }

    // -------------------------------------------------------------------------
    // TEST 3: No Reimbursements
    // -------------------------------------------------------------------------
    console.log('\nTest 3: No Reimbursements...');
    {
      const expenses = [
        { id: 'e1', tripId: 'trip-3', amount: 3500, date: '2026-09-01', status: 'valid' },
      ];
      const reimbursements = [];

      const res = calculateTripFinancials('trip-3', expenses, reimbursements);
      assert(res.totalSpend === 3500, 'Total spend is ₹3,500');
      assert(res.totalReimbursed === 0, 'Total reimbursed is ₹0');
      assert(res.pendingDue === 3500, 'Entire ₹3,500 is pending');
      assert(res.surplus === 0, 'Surplus is ₹0');
      assert(res.isOverReimbursed === false, 'isOverReimbursed is false');
      assert(res.settlementPct === 0, 'Settlement percentage is 0%');
    }

    // -------------------------------------------------------------------------
    // TEST 4: Reimbursement Greater Than Eligible Spending (Over-Reimbursement)
    // -------------------------------------------------------------------------
    console.log('\nTest 4: Reimbursement Greater Than Eligible Spending...');
    {
      // Reproduction values: Service Visit spend ₹16,455, reimbursed ₹16,739
      const expenses = [
        { id: 'e1', tripId: 'trip-mumbai-pune-2026', amount: 16455, date: '2026-08-20', status: 'valid' },
      ];
      const reimbursements = [
        { id: 'r1', tripId: 'trip-mumbai-pune-2026', amount: 16739, date: '2026-10-15' },
      ];

      const res = calculateTripFinancials('trip-mumbai-pune-2026', expenses, reimbursements);
      assert(res.totalSpend === 16455, 'Trip spend is ₹16,455');
      assert(res.totalReimbursed === 16739, 'Reimbursed amount is ₹16,739');
      assert(res.pendingDue === 0, 'Pending claim from company is ₹0 (not negative)');
      assert(res.surplus === 284, 'Surplus over-reimbursement is exactly ₹284 (16739 - 16455)');
      assert(res.isOverReimbursed === true, 'isOverReimbursed flag is strictly TRUE');
      assert(res.settlementPct === 102, 'Settlement percentage is 102% (NOT capped at 100%)');
    }

    // -------------------------------------------------------------------------
    // TEST 5: Duplicate Reimbursement Record
    // -------------------------------------------------------------------------
    console.log('\nTest 5: Duplicate Reimbursement Record...');
    {
      const expenses = [
        { id: 'e1', tripId: 'trip-dup', amount: 5000, date: '2026-08-01', status: 'valid' },
      ];
      // Accidental duplicate entry
      const reimbursements = [
        { id: 'r1', tripId: 'trip-dup', amount: 5000, reference: 'REF-DUP-1', date: '2026-08-10' },
        { id: 'r2', tripId: 'trip-dup', amount: 5000, reference: 'REF-DUP-1', date: '2026-08-10' },
      ];

      const res = calculateTripFinancials('trip-dup', expenses, reimbursements);
      assert(res.totalSpend === 5000, 'Trip spend is ₹5,000');
      assert(res.totalReimbursed === 10000, 'Sum of reimbursements detects duplicate total ₹10,000');
      assert(res.pendingDue === 0, 'Pending claim is ₹0');
      assert(res.surplus === 5000, 'Surplus exposes full duplicate ₹5,000 for audit remediation');
      assert(res.isOverReimbursed === true, 'Flagged as over-reimbursed');
      assert(res.settlementPct === 200, 'Settlement progress is 200% (surfaces double payment immediately)');
    }

    // -------------------------------------------------------------------------
    // TEST 6: Misallocated Reimbursement (Wrong Trip Assignment)
    // -------------------------------------------------------------------------
    console.log('\nTest 6: Misallocated Reimbursement (No Silent Cross-Trip Netting)...');
    {
      const trips = [
        { id: 'trip-a', name: 'Service Visit' },
        { id: 'trip-b', name: 'Local Operations' },
      ];

      // Trip A spend: 16,455. Trip B spend: 681 (including 284 Sep expenses)
      const expenses = [
        { id: 'e1', tripId: 'trip-a', amount: 16455, date: '2026-08-20', status: 'valid' },
        { id: 'e2', tripId: 'trip-b', amount: 284, date: '2026-09-11', status: 'valid' },
        { id: 'e3', tripId: 'trip-b', amount: 397, date: '2026-10-12', status: 'valid' },
      ];

      // Company paid ₹16,739 intending to settle Trip A + Trip B Sep expenses, but misallocated entirely to Trip A
      const reimbursements = [
        { id: 'r1', tripId: 'trip-a', amount: 16739, date: '2026-10-15' },
      ];

      const tripASummary = calculateTripFinancials('trip-a', expenses, reimbursements);
      const tripBSummary = calculateTripFinancials('trip-b', expenses, reimbursements);

      assert(tripASummary.totalSpend === 16455, 'Trip A spend is ₹16,455');
      assert(tripASummary.totalReimbursed === 16739, 'Trip A received ₹16,739');
      assert(tripASummary.surplus === 284, 'Trip A has ₹284 surplus');
      assert(tripASummary.pendingDue === 0, 'Trip A pending claim is ₹0');

      assert(tripBSummary.totalSpend === 681, 'Trip B spend is ₹681');
      assert(tripBSummary.totalReimbursed === 0, 'Trip B received ₹0');
      assert(tripBSummary.pendingDue === 681, 'Trip B pending claim is strictly ₹681');

      // Now verify multi-trip dashboard metrics
      const dashboard = calculateDashboardMetrics(expenses, reimbursements, undefined, trips);
      assert(dashboard.totalExpense === 17136, 'Overall valid expenditure is ₹17,136');
      assert(dashboard.totalReimbursement === 16739, 'Overall reimbursement is ₹16,739');

      // CRUCIAL BUSINESS RULE: Overall pending must NOT silently net Trip A's surplus against Trip B's claim!
      assert(dashboard.pendingReimbursement === 681, 'Overall pending due is reconciled sum of claims: ₹681 (NOT netted to ₹397)');
      assert(dashboard.totalOverReimbursement === 284, 'Total over-reimbursement surfaces ₹284 surplus advance');
      assert(dashboard.netBalance === 397, 'Net cross-trip balance is ₹397 (17136 - 16739)');
      assert(dashboard.hasDiscrepancy === true, 'Discrepancy flag is TRUE');
    }

    // -------------------------------------------------------------------------
    // TEST 7: Incomplete Expense with Missing Amount
    // -------------------------------------------------------------------------
    console.log('\nTest 7: Incomplete Expense with Missing Amount...');
    {
      const expenses = [
        { id: 'e1', tripId: 'trip-inc', amount: 500, date: '2026-10-01', status: 'valid' },
        { id: 'exp-075', tripId: 'trip-inc', amount: null, date: '2026-10-13', status: 'incomplete' },
        { id: 'e3', tripId: 'trip-inc', amount: NaN, date: '2026-10-14', status: 'incomplete' },
      ];
      const reimbursements = [
        { id: 'r1', tripId: 'trip-inc', amount: 500, date: '2026-10-15' },
      ];

      const res = calculateTripFinancials('trip-inc', expenses, reimbursements);
      assert(res.totalSpend === 500, 'Valid spend is strictly ₹500 (null/NaN never coerced to 0)');
      assert(res.validCount === 1, 'Valid expense count is 1');
      assert(res.incompleteCount === 2, 'Incomplete records count is exactly 2');
      assert(res.pendingDue === 0, 'Pending claim is ₹0');
      assert(res.settlementPct === 100, 'Settlement percentage is 100%');
    }

    // -------------------------------------------------------------------------
    // TEST 8: Multiple Trips with Separate Reimbursement Allocations
    // -------------------------------------------------------------------------
    console.log('\nTest 8: Multiple Trips with Separate Allocations...');
    {
      const trips = [
        { id: 't1', name: 'Trip 1' },
        { id: 't2', name: 'Trip 2' },
        { id: 't3', name: 'Trip 3' },
      ];

      const expenses = [
        { id: 'e1', tripId: 't1', amount: 8000, date: '2026-08-01', status: 'valid' },
        { id: 'e2', tripId: 't2', amount: 5000, date: '2026-08-02', status: 'valid' },
        { id: 'e3', tripId: 't3', amount: 2000, date: '2026-08-03', status: 'valid' },
      ];

      const reimbursements = [
        { id: 'r1', tripId: 't1', amount: 8000, date: '2026-08-10' }, // 100% settled
        { id: 'r2', tripId: 't2', amount: 3000, date: '2026-08-11' }, // 2000 pending
        // t3 has 0 reimbursements -> 2000 pending
      ];

      const s1 = calculateTripFinancials('t1', expenses, reimbursements);
      const s2 = calculateTripFinancials('t2', expenses, reimbursements);
      const s3 = calculateTripFinancials('t3', expenses, reimbursements);

      assert(s1.pendingDue === 0 && s1.surplus === 0, 'Trip 1 has 0 pending and 0 surplus');
      assert(s2.pendingDue === 2000 && s2.surplus === 0, 'Trip 2 has 2000 pending and 0 surplus');
      assert(s3.pendingDue === 2000 && s3.surplus === 0, 'Trip 3 has 2000 pending and 0 surplus');

      const dashboard = calculateDashboardMetrics(expenses, reimbursements, undefined, trips);
      assert(dashboard.totalExpense === 15000, 'Total expense is ₹15,000');
      assert(dashboard.totalReimbursement === 11000, 'Total reimbursed is ₹11,000');
      assert(dashboard.pendingReimbursement === 4000, 'Overall pending reimbursement is ₹4,000 (2000 + 2000)');
      assert(dashboard.totalOverReimbursement === 0, 'No over-reimbursement (₹0)');
      assert(dashboard.hasDiscrepancy === false, 'No discrepancy');
      assert(dashboard.netBalance === 4000, 'Net balance is ₹4,000');
    }

    // -------------------------------------------------------------------------
    // TEST 9: Consistency Between Overall Dashboard and Trip-Level Summaries
    // -------------------------------------------------------------------------
    console.log('\nTest 9: Mathematical Consistency (Trip vs Overall Totals)...');
    {
      // 9A: Authoritative Baseline (78 expenses, ₹10,000 reimbursement)
      const baselineMetrics = calculateDashboardMetrics(
        initialExpenses,
        initialReimbursements,
        undefined,
        initialTrips
      );

      const trip1 = calculateTripFinancials('trip-mumbai-pune-2026', initialExpenses, initialReimbursements);
      const trip2 = calculateTripFinancials('trip-local-work-2026', initialExpenses, initialReimbursements);

      assert(trip1.totalSpend === 16455, 'Trip 1 spend = ₹16,455');
      assert(trip1.totalReimbursed === 10000, 'Trip 1 reimbursed = ₹10,000');
      assert(trip1.pendingDue === 6455, 'Trip 1 pending = ₹6,455');

      assert(trip2.totalSpend === 681, 'Trip 2 spend = ₹681');
      assert(trip2.totalReimbursed === 0, 'Trip 2 reimbursed = ₹0');
      assert(trip2.pendingDue === 681, 'Trip 2 pending = ₹681');

      assert(
        trip1.totalSpend + trip2.totalSpend === baselineMetrics.totalExpense,
        `Sum of trip spends (${trip1.totalSpend} + ${trip2.totalSpend} = ${baselineMetrics.totalExpense}) matches overall totalExpense`
      );
      assert(
        trip1.totalReimbursed + trip2.totalReimbursed === baselineMetrics.totalReimbursement,
        `Sum of trip reimbursements (${trip1.totalReimbursed} + ${trip2.totalReimbursed} = ${baselineMetrics.totalReimbursement}) matches overall totalReimbursement`
      );
      assert(
        trip1.pendingDue + trip2.pendingDue === baselineMetrics.pendingReimbursement,
        `Sum of trip pending claims (${trip1.pendingDue} + ${trip2.pendingDue} = ${baselineMetrics.pendingReimbursement}) matches overall pendingReimbursement`
      );
      assert(baselineMetrics.pendingReimbursement === 7136, 'Baseline overall pending is exactly ₹7,136');

      // 9B: User Reported Over-Reimbursement State (₹16,739 paid to Trip 1)
      const userScenarioReimbursements = [
        {
          id: 'reimb-001',
          amount: 16739,
          date: '2026-10-15',
          reference: 'UTR-COMPANY-16739',
          tripId: 'trip-mumbai-pune-2026',
        },
      ];

      const userMetrics = calculateDashboardMetrics(
        initialExpenses,
        userScenarioReimbursements,
        undefined,
        initialTrips
      );

      const userTrip1 = calculateTripFinancials('trip-mumbai-pune-2026', initialExpenses, userScenarioReimbursements);
      const userTrip2 = calculateTripFinancials('trip-local-work-2026', initialExpenses, userScenarioReimbursements);

      assert(userTrip1.totalSpend === 16455, 'User Scenario Trip 1 spend = ₹16,455');
      assert(userTrip1.totalReimbursed === 16739, 'User Scenario Trip 1 reimbursed = ₹16,739');
      assert(userTrip1.pendingDue === 0, 'User Scenario Trip 1 pending = ₹0');
      assert(userTrip1.surplus === 284, 'User Scenario Trip 1 surplus = ₹284');
      assert(userTrip1.settlementPct === 102, 'User Scenario Trip 1 settlement progress = 102% (NOT capped)');

      assert(userTrip2.totalSpend === 681, 'User Scenario Trip 2 spend = ₹681');
      assert(userTrip2.totalReimbursed === 0, 'User Scenario Trip 2 reimbursed = ₹0');
      assert(userTrip2.pendingDue === 681, 'User Scenario Trip 2 pending = ₹681');

      // Reconciled Pending Claim across trips
      assert(
        userMetrics.pendingReimbursement === userTrip1.pendingDue + userTrip2.pendingDue,
        `Overall pending due (${userMetrics.pendingReimbursement}) matches sum of trip claims (${userTrip1.pendingDue} + ${userTrip2.pendingDue} = 681)`
      );
      assert(userMetrics.pendingReimbursement === 681, 'Overall pending claim is strictly ₹681 (no silent netting)');
      assert(userMetrics.totalOverReimbursement === 284, 'Overall over-reimbursement surfaces ₹284');
      assert(userMetrics.netBalance === 397, 'Net cross-trip balance is ₹397 (681 - 284 = 397)');

      // Mathematical Reconciliation Equation Verification:
      // OverallPending - TotalOverReimbursement == NetBalance == TotalExpense - TotalReimbursement
      assert(
        userMetrics.pendingReimbursement - userMetrics.totalOverReimbursement === userMetrics.netBalance,
        `Reconciliation invariant holds: Pending (${userMetrics.pendingReimbursement}) - Surplus (${userMetrics.totalOverReimbursement}) = Net (${userMetrics.netBalance})`
      );
    }

    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TRIP REIMBURSEMENT REGRESSION TESTS PASSED (100%)!`);
    console.log('========================================================================\n');
  } finally {
    if (fs.existsSync(tempBundlePath)) {
      fs.unlinkSync(tempBundlePath);
    }
  }
}

runTripReimbursementAuditSuite().catch((err) => {
  console.error('Fatal error during trip reimbursement verification:', err);
  process.exit(1);
});
