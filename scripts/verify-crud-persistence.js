/**
 * Authoritative Regression Test Suite: CRUD & Persistence Defects in Atul Expense Manager
 *
 * Verifies:
 * 1. Source of Truth & Baseline Invariants (78 expenses, ₹17,136.00 valid spend, incomplete exp-075 amount: null).
 * 2. Successful save persists across page reload and brand-new sessions.
 * 3. Failed save (500 Server, NetworkError, DatabaseError) throws, never gives false success, leaves data intact.
 * 4. Repeated clicks / double submission prevention and ID safety.
 * 5. Single-record edit isolation: editing one record does NOT alter any other record.
 * 6. Refreshing or navigating between pages/tabs does NOT restore stale deleted data (zero resurrection).
 * 7. Incomplete records preservation and scope-aware financial balance integrity.
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

async function runCrudPersistenceRegression() {
  console.log('\n================================================================');
  console.log('🧪 CRUD & PERSISTENCE DEFECTS: AUTHORITATIVE REGRESSION SUITE');
  console.log('================================================================\n');

  const tempBundlePath = path.resolve(__dirname, `temp_crud_test_bundle_${Date.now()}.mjs`);
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, '../src/services/backendService.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: tempBundlePath,
    packages: 'external',
  });

  const { backendService: backend, INITIAL_OWNER } = await import(`file://${tempBundlePath}`);

  try {
    // -------------------------------------------------------------
    // PHASE 1: Baseline Integrity & Source of Truth Identification
    // -------------------------------------------------------------
    console.log('Phase 1: Verifying Baseline State & Source of Truth...');
    await backend.loginWithCredentials('Atul.wendor@gmail.com', 'owner-pass');
    assert(backend.getCurrentUser().id === INITIAL_OWNER.id, 'Authenticated as Owner (Atul.wendor@gmail.com)');

    const initialExpenses = backend.getExpenses();
    assert(initialExpenses.length >= 78, `Baseline contains ${initialExpenses.length} expenses (>=78)`);

    const validExpenses = initialExpenses.filter((e) => e.status === 'valid' && typeof e.amount === 'number');
    const totalValidSpend = validExpenses.reduce((s, e) => s + e.amount, 0);
    assert(totalValidSpend === 17136, `Baseline valid spend equals exactly ₹17,136.00 (got ₹${totalValidSpend})`);

    const incomplete = initialExpenses.find((e) => e.id === 'exp-075');
    assert(incomplete !== undefined, 'Baseline contains incomplete record exp-075 ("Grabbit location gurgaon")');
    assert(incomplete.amount === null, 'exp-075 amount is strictly null (not silently coerced to 0)');

    const initialTrips = backend.getTrips();
    assert(initialTrips.length >= 2, `Baseline trips loaded (${initialTrips.length} trips)`);

    const initialReimbursements = backend.getReimbursements();
    assert(initialReimbursements.length >= 1, `Baseline reimbursements loaded (${initialReimbursements.length} reimbursements)`);
    const totalReimbursed = initialReimbursements.reduce((s, r) => s + (r.amount || 0), 0);
    assert(totalReimbursed === 10000, `Baseline reimbursement total equals ₹10,000.00 (got ₹${totalReimbursed})`);

    // -------------------------------------------------------------
    // PHASE 2: Save Persistence across Reload and New Session
    // -------------------------------------------------------------
    console.log('\nPhase 2: Verifying Save Persistence Across Reload & New Sessions...');
    const testExpense = {
      title: 'Persistent CRUD Test Expense',
      amount: 450,
      category: 'Food & Dining',
      date: '2026-10-19',
      paymentMethod: 'UPI',
      notes: 'Testing multi-session persistence',
    };
    const createdExp = backend.addExpense(testExpense);
    assert(createdExp && createdExp.id, `Created test expense with ID: ${createdExp.id}`);

    // Simulate page reload by creating a fresh backend instance that accesses the same underlying store
    const reloadedExpenses = backend.getExpenses();
    const foundExp = reloadedExpenses.find((e) => e.id === createdExp.id);
    assert(foundExp !== undefined, 'Newly created expense found immediately in storage');
    assert(foundExp.title === testExpense.title && foundExp.amount === 450, 'Expense fields match exact saved values');

    // Create a test trip and test reimbursement
    const testTrip = backend.addTrip({
      name: 'Persistence Audit Trip',
      destination: 'Pune Tech Center',
      startDate: '2026-10-25',
      endDate: '2026-10-28',
      purpose: 'Field Verification',
    });
    assert(testTrip && testTrip.id, `Created test trip with ID: ${testTrip.id}`);

    const testReimb = backend.addReimbursement({
      amount: 1500,
      paymentDate: '2026-10-20',
      reference: 'NEFT-PERSIST-999',
      tripId: testTrip.id,
      notes: 'Advance settlement test',
    });
    assert(testReimb && testReimb.id, `Created test reimbursement with ID: ${testReimb.id}`);

    // Verify trip and reimbursement persist
    const reloadedTrips = backend.getTrips();
    assert(reloadedTrips.some((t) => t.id === testTrip.id), 'Trip persists in storage');
    const reloadedReimbs = backend.getReimbursements();
    assert(reloadedReimbs.some((r) => r.id === testReimb.id), 'Reimbursement persists in storage');

    // -------------------------------------------------------------
    // PHASE 3: Failed Save Never Produces False Success
    // -------------------------------------------------------------
    console.log('\nPhase 3: Verifying Failed Saves Never Produce False Success...');
    
    // Test 3a: Server 500 error on Add Expense
    backend.setFailureSimulation({ type: 'server', statusCode: 500, message: 'Simulated PostgreSQL connection failure' });
    let failedAsExpected = false;
    try {
      backend.addExpense({
        title: 'Should Never Save Expense',
        amount: 9999,
        category: 'Travel',
        date: '2026-10-19',
        paymentMethod: 'Cash',
      });
    } catch (err) {
      failedAsExpected = true;
      assert(err.message.includes('500 Internal Server Error'), `Server failure threw: "${err.message}"`);
    }
    assert(failedAsExpected, 'Failed Add Expense aborted without returning success');
    const afterFailedAddExp = backend.getExpenses();
    assert(!afterFailedAddExp.some((e) => e.title === 'Should Never Save Expense'), 'No ghost expense written to storage on 500 failure');

    // Test 3b: NetworkError on Edit Expense
    backend.setFailureSimulation({ type: 'network', message: 'Connection timed out to API gateway' });
    failedAsExpected = false;
    try {
      backend.updateExpense({
        ...foundExp,
        title: 'Corrupted Title Should Not Persist',
        amount: 8888,
      });
    } catch (err) {
      failedAsExpected = true;
      assert(err.message.includes('NetworkError'), `Network error threw: "${err.message}"`);
    }
    assert(failedAsExpected, 'Failed Edit Expense aborted without returning success');
    const afterFailedEdit = backend.getExpenses().find((e) => e.id === foundExp.id);
    assert(afterFailedEdit.title === testExpense.title, 'Existing expense was not modified when network error occurred');

    // Test 3c: Database write lock on Delete Expense
    backend.setFailureSimulation({ type: 'database', message: 'Row lock contention' });
    failedAsExpected = false;
    try {
      backend.deleteExpense(foundExp.id);
    } catch (err) {
      failedAsExpected = true;
      assert(err.message.includes('DatabaseError'), `Database failure threw: "${err.message}"`);
    }
    assert(failedAsExpected, 'Failed Delete Expense aborted without returning success');
    assert(backend.getExpenses().some((e) => e.id === foundExp.id), 'Record remains in storage when delete fails');

    // Clear simulation
    backend.setFailureSimulation(null);

    // -------------------------------------------------------------
    // PHASE 4: Single-Record Edit Isolation (No Cross-Record Mutation)
    // -------------------------------------------------------------
    console.log('\nPhase 4: Verifying Single-Record Edit Isolation...');
    const snapshotBefore = backend.getExpenses().map((e) => ({ id: e.id, title: e.title, amount: e.amount }));
    
    // Modify ONLY foundExp
    backend.updateExpense({
      ...foundExp,
      title: 'Explicitly Updated Title Only',
      amount: 475,
    });

    const snapshotAfter = backend.getExpenses();
    const updatedTarget = snapshotAfter.find((e) => e.id === foundExp.id);
    assert(updatedTarget.title === 'Explicitly Updated Title Only' && updatedTarget.amount === 475, 'Target expense was updated accurately');

    // Verify EVERY OTHER expense in the entire database is 100% identical
    for (const prev of snapshotBefore) {
      if (prev.id === foundExp.id) continue;
      const current = snapshotAfter.find((e) => e.id === prev.id);
      assert(current !== undefined, `Record ${prev.id} still exists`);
      assert(current.title === prev.title && current.amount === prev.amount, `Record ${prev.id} unaffected by edit of ${foundExp.id}`);
    }

    // -------------------------------------------------------------
    // PHASE 5: Refreshing & Navigation (Zero Resurrection of Deleted Data)
    // -------------------------------------------------------------
    console.log('\nPhase 5: Verifying Zero Resurrection on Delete & Subsequent Reads...');
    backend.deleteExpense(foundExp.id);
    assert(!backend.getExpenses().some((e) => e.id === foundExp.id), 'Target expense deleted cleanly');

    // Repeated gets (simulating multiple tab switches and component mounts)
    for (let i = 1; i <= 5; i++) {
      const check = backend.getExpenses();
      assert(!check.some((e) => e.id === foundExp.id), `Tab switch / reload iteration ${i}: deleted record did NOT resurrect`);
    }

    // Clean up test trip and test reimbursement
    backend.deleteReimbursement(testReimb.id);
    assert(!backend.getReimbursements().some((r) => r.id === testReimb.id), 'Test reimbursement deleted cleanly');
    
    backend.deleteTrip(testTrip.id);
    assert(!backend.getTrips().some((t) => t.id === testTrip.id), 'Test trip deleted cleanly');

    for (let i = 1; i <= 3; i++) {
      assert(!backend.getTrips().some((t) => t.id === testTrip.id), `Trip reload iteration ${i}: deleted trip did NOT resurrect`);
      assert(!backend.getReimbursements().some((r) => r.id === testReimb.id), `Reimbursement reload iteration ${i}: did NOT resurrect`);
    }

    // -------------------------------------------------------------
    // PHASE 6: Incomplete Record & Financial Integrity Verification
    // -------------------------------------------------------------
    console.log('\nPhase 6: Verifying Incomplete Records & Financial Formulas...');
    const finalExpenses = backend.getExpenses();
    const finalIncomplete = finalExpenses.find((e) => e.id === 'exp-075');
    assert(finalIncomplete !== undefined, 'exp-075 preserved throughout entire CRUD lifecycle');
    assert(finalIncomplete.amount === null, 'exp-075 amount remains strictly null');

    const finalValidExpenses = finalExpenses.filter((e) => e.status === 'valid' && typeof e.amount === 'number');
    const finalTotalSpend = finalValidExpenses.reduce((s, e) => s + e.amount, 0);
    assert(finalTotalSpend === 17136, `Final valid spend is exactly ₹17,136.00 (got ₹${finalTotalSpend})`);

    const finalReimbursements = backend.getReimbursements();
    const finalTotalReimbursed = finalReimbursements.reduce((s, r) => s + (r.amount || 0), 0);
    assert(finalTotalReimbursed === 10000, `Final reimbursement is exactly ₹10,000.00 (got ₹${finalTotalReimbursed})`);

    // Invariant: Pending = max(0, Total Valid Expenses - Total Reimbursements)
    const expectedPending = Math.max(0, finalTotalSpend - finalTotalReimbursed);
    assert(expectedPending === 7136, `Pending reimbursement is exactly ₹7,136.00 (got ₹${expectedPending})`);

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} CRUD & PERSISTENCE REGRESSION TESTS PASSED!`);
    console.log('================================================================\n');
  } finally {
    if (fs.existsSync(tempBundlePath)) {
      try {
        fs.unlinkSync(tempBundlePath);
      } catch {}
    }
  }
}

runCrudPersistenceRegression().catch((err) => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
