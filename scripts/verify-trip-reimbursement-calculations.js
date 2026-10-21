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
          export { calculateTripFinancials, calculateDashboardMetrics, reconcileTripsSettlement, formatCurrency } from '../src/utils/calculations';
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
      reconcileTripsSettlement,
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
      assert(tripASummary.totalReimbursed === 16739, 'Trip A raw direct received is ₹16,739');
      assert(tripASummary.surplus === 284, 'Trip A has ₹284 direct surplus');
      assert(tripASummary.pendingDue === 0, 'Trip A pending claim is ₹0');

      assert(tripBSummary.totalSpend === 681, 'Trip B spend is ₹681');
      assert(tripBSummary.totalReimbursed === 0, 'Trip B raw direct received is ₹0');
      assert(tripBSummary.pendingDue === 681, 'Trip B raw pending claim is ₹681');

      // Now verify multi-trip authoritative reconciliation
      const reconciliation = reconcileTripsSettlement(trips, expenses, reimbursements);
      const recA = reconciliation.summaries.find((s) => s.tripId === 'trip-a');
      const recB = reconciliation.summaries.find((s) => s.tripId === 'trip-b');

      assert(recA.totalSpend === 16455, 'Reconciled Trip A spend is ₹16,455');
      assert(recA.totalReimbursed === 16455, 'Reconciled Trip A received ₹16,455 (100%)');
      assert(recA.pendingDue === 0, 'Reconciled Trip A pending is ₹0');
      assert(recA.surplus === 0, 'Reconciled Trip A surplus is ₹0');
      assert(recA.settlementPct === 100, 'Reconciled Trip A settlement is 100%');

      assert(recB.totalSpend === 681, 'Reconciled Trip B spend is ₹681');
      assert(recB.totalReimbursed === 284, 'Reconciled Trip B received ₹284 from excess allocation');
      assert(recB.pendingDue === 397, 'Reconciled Trip B pending is ₹397 (681 - 284)');
      assert(recB.surplus === 0, 'Reconciled Trip B surplus is ₹0');
      assert(recB.settlementPct === 42, 'Reconciled Trip B settlement is 42%');

      // Overall multi-trip dashboard metrics
      const dashboard = calculateDashboardMetrics(expenses, reimbursements, undefined, trips);
      assert(dashboard.totalExpense === 17136, 'Overall valid expenditure is ₹17,136');
      assert(dashboard.totalReimbursement === 16739, 'Overall reimbursement is ₹16,739');
      assert(dashboard.pendingReimbursement === 397, 'Overall pending reimbursement is ₹397');
      assert(dashboard.totalOverReimbursement === 0, 'Total over-reimbursement is ₹0');
      assert(dashboard.netBalance === 397, 'Net cross-trip balance is ₹397 (17136 - 16739)');
      assert(dashboard.hasDiscrepancy === false, 'Discrepancy flag is false');

      // Reconciliation Invariant: sum of trip pending == overall pending
      assert(recA.pendingDue + recB.pendingDue === dashboard.pendingReimbursement, 'Trip pending sum (0 + 397 = 397) matches overall pending');
      assert(recA.totalReimbursed + recB.totalReimbursed === dashboard.totalReimbursement, 'Trip reimbursed sum (16455 + 284 = 16739) matches overall reimbursed');
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

      // 9B: User Reported Exact Scenario (76 valid expenses = ₹17,028, Reimbursement = ₹17,028)
      // When ₹17,028 is spent and ₹17,028 is reimbursed, pending MUST BE ₹0 (No Amount Mismatch!)
      const current76Expenses = initialExpenses.filter((e) => e.id !== 'exp-071'); // exp-071 (108) deleted
      const currentReimbursements = [
        {
          id: 'reimb-001',
          amount: 17028,
          date: '2026-10-15',
          reference: 'REIMB-FULL-17028',
          tripId: 'trip-mumbai-pune-2026',
        },
      ];

      const currentMetrics = calculateDashboardMetrics(
        current76Expenses,
        currentReimbursements,
        undefined,
        initialTrips
      );

      const currentRec = reconcileTripsSettlement(initialTrips, current76Expenses, currentReimbursements);
      const curTrip1 = currentRec.summaries.find((s) => s.tripId === 'trip-mumbai-pune-2026');
      const curTrip2 = currentRec.summaries.find((s) => s.tripId === 'trip-local-work-2026');

      assert(currentMetrics.totalExpense === 17028, 'Current Total Expense is exactly ₹17,028');
      assert(currentMetrics.totalReimbursement === 17028, 'Current Total Reimbursement is exactly ₹17,028');
      assert(currentMetrics.pendingReimbursement === 0, 'Current Pending Reimbursement is strictly ₹0 (NO MISMATCH)');
      assert(currentMetrics.totalOverReimbursement === 0, 'Current Over-Reimbursement is strictly ₹0 (NO FALSE EXCESS)');
      assert(currentMetrics.hasDiscrepancy === false, 'Current Discrepancy Flag is FALSE');
      assert(currentMetrics.netBalance === 0, 'Current Net Balance is ₹0');

      assert(curTrip1.totalSpend === 16455, 'Trip 1 spend is ₹16,455');
      assert(curTrip1.totalReimbursed === 16455, 'Trip 1 attributed reimbursement is ₹16,455 (100%)');
      assert(curTrip1.pendingDue === 0, 'Trip 1 pending is ₹0');
      assert(curTrip1.surplus === 0, 'Trip 1 surplus is ₹0');
      assert(curTrip1.settlementPct === 100, 'Trip 1 settlement is 100%');

      assert(curTrip2.totalSpend === 573, 'Trip 2 spend is ₹573 (681 - 108)');
      assert(curTrip2.totalReimbursed === 573, 'Trip 2 attributed reimbursement is ₹573 (100%)');
      assert(curTrip2.pendingDue === 0, 'Trip 2 pending is ₹0');
      assert(curTrip2.surplus === 0, 'Trip 2 surplus is ₹0');
      assert(curTrip2.settlementPct === 100, 'Trip 2 settlement is 100%');

      assert(
        curTrip1.pendingDue + curTrip2.pendingDue === currentMetrics.pendingReimbursement,
        'Trip pending sum (0 + 0 = 0) perfectly matches overall pending (0)'
      );
      assert(
        curTrip1.totalReimbursed + curTrip2.totalReimbursed === currentMetrics.totalReimbursement,
        'Trip reimbursed sum (16455 + 573 = 17028) perfectly matches overall reimbursement (17028)'
      );

      // 9C: Baseline 77 expenses (₹17,136 spend) with ₹16,739 Reimbursement
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

      const rec77 = reconcileTripsSettlement(initialTrips, initialExpenses, userScenarioReimbursements);
      const userTrip1 = rec77.summaries.find((s) => s.tripId === 'trip-mumbai-pune-2026');
      const userTrip2 = rec77.summaries.find((s) => s.tripId === 'trip-local-work-2026');

      assert(userMetrics.totalExpense === 17136, 'User Scenario Total Expense is ₹17,136');
      assert(userMetrics.totalReimbursement === 16739, 'User Scenario Total Reimbursement is ₹16,739');
      assert(userMetrics.pendingReimbursement === 397, 'User Scenario Overall Pending is exactly ₹397 (17136 - 16739)');
      assert(userMetrics.totalOverReimbursement === 0, 'User Scenario Over-Reimbursement is ₹0');
      assert(userMetrics.hasDiscrepancy === false, 'User Scenario Discrepancy flag is false');

      assert(userTrip1.totalSpend === 16455, 'User Scenario Trip 1 spend = ₹16,455');
      assert(userTrip1.totalReimbursed === 16455, 'User Scenario Trip 1 reimbursed = ₹16,455 (100%)');
      assert(userTrip1.pendingDue === 0, 'User Scenario Trip 1 pending = ₹0');
      assert(userTrip1.settlementPct === 100, 'User Scenario Trip 1 settlement progress = 100%');

      assert(userTrip2.totalSpend === 681, 'User Scenario Trip 2 spend = ₹681');
      assert(userTrip2.totalReimbursed === 284, 'User Scenario Trip 2 reimbursed = ₹284');
      assert(userTrip2.pendingDue === 397, 'User Scenario Trip 2 pending = ₹397');
      assert(userTrip2.settlementPct === 42, 'User Scenario Trip 2 settlement = 42%');

      assert(
        userMetrics.pendingReimbursement === userTrip1.pendingDue + userTrip2.pendingDue,
        `Overall pending due (${userMetrics.pendingReimbursement}) matches sum of trip claims (${userTrip1.pendingDue} + ${userTrip2.pendingDue} = 397)`
      );
      assert(
        userMetrics.totalReimbursement === userTrip1.totalReimbursed + userTrip2.totalReimbursed,
        `Overall reimbursement (${userMetrics.totalReimbursement}) matches sum of trip reimbursements (${userTrip1.totalReimbursed} + ${userTrip2.totalReimbursed} = 16739)`
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
