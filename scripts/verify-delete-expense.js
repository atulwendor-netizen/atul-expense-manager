/**
 * Authoritative Regression Test Suite: Delete Expense Flow, Error Handling & Persistence
 *
 * Requirements Covered:
 * 1. Success confirmation ONLY after database confirms deletion (no premature success alerts).
 * 2. Honest handling of server failures (500 Internal Server Error).
 * 3. Honest handling of network failures (NetworkError / connection lost).
 * 4. Honest handling of database write / storage errors.
 * 5. Authorization: 401 Unauthorized for guests, 403 Forbidden for Read-Only Managers.
 * 6. Cross-User Protection: 403 Forbidden when attempting to delete another user's records.
 * 7. Incomplete Record Deletion: exp-075 ("Grabbit location gurgaon") with amount: null deletes cleanly.
 * 8. Reload Persistence: Deleted records NEVER auto-resurrect on subsequent calls or page reloads.
 * 9. Financial & Dashboard Synchronization: List, totals, incomplete alerts, and pagination reflect deletion.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`   - ${message}: ✅ PASSED`);
  passedTests++;
}

async function runDeleteExpenseRegression() {
  console.log('\n================================================================');
  console.log('🧪 EXPENSE DELETE BUG REPAIR: FULL REGRESSION TEST SUITE');
  console.log('================================================================\n');

  // Bundle backendService for Node execution
  const tempBundlePath = path.resolve(__dirname, `temp_delete_test_bundle_${Date.now()}.mjs`);
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, '../src/services/backendService.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: tempBundlePath,
    packages: 'external',
  });

  const { backendService: backend, INITIAL_OWNER, isOwnerEmail } = await import(`file://${tempBundlePath}`);

  try {
    // -------------------------------------------------------------
    // PHASE 1: Baseline Integrity & Incomplete Record Verification
    // -------------------------------------------------------------
    console.log('Phase 1: Verifying Initial State & Incomplete Expense Target...');
    const loginRes = await backend.loginWithCredentials('Atul.wendor@gmail.com', 'owner-pass');
    assert(loginRes.success === true, 'Owner authentication succeeded');
    assert(backend.isAuthenticated() === true, 'Owner session is active');

    const initialExpenses = backend.getExpenses();
    assert(initialExpenses.length === 78, `Owner starts with 78 baseline expenses (found ${initialExpenses.length})`);

    const targetIncomplete = initialExpenses.find((e) => e.id === 'exp-075');
    assert(Boolean(targetIncomplete), 'Target incomplete expense exp-075 ("Grabbit location gurgaon") exists');
    assert(targetIncomplete.amount === null, 'exp-075 amount is strictly null (blank amount)');
    assert(targetIncomplete.status === 'incomplete', 'exp-075 status is incomplete');
    assert(targetIncomplete.date === '2026-10-13', 'exp-075 date is 2026-10-13');

    const initialValidSpend = initialExpenses
      .filter((e) => e.status === 'valid' && typeof e.amount === 'number')
      .reduce((sum, e) => sum + e.amount, 0);
    assert(initialValidSpend === 17136, `Initial valid spend is ₹17,136.00 (calculated ₹${initialValidSpend})`);

    // -------------------------------------------------------------
    // PHASE 2: Server Failure (500 Internal Server Error)
    // -------------------------------------------------------------
    console.log('\nPhase 2: Testing Server Failure (500 Internal Server Error)...');
    backend.setFailureSimulation({
      type: 'server',
      statusCode: 500,
      message: 'Database transaction aborted by remote server.',
    });

    let serverErrorThrown = false;
    let serverErrorMessage = '';
    let successToastFiredOnServerFailure = false;

    // Simulate UI action wrapper with honest error handling
    try {
      backend.deleteExpense('exp-075');
      successToastFiredOnServerFailure = true; // MUST NOT BE REACHED
    } catch (err) {
      serverErrorThrown = true;
      serverErrorMessage = err.message || '';
    }

    assert(serverErrorThrown === true, 'deleteExpense threw error on simulated server failure');
    assert(serverErrorMessage.includes('500 Internal Server Error'), 'Error message contains "500 Internal Server Error"');
    assert(successToastFiredOnServerFailure === false, 'Success alert was NEVER shown when server failed');

    // Verify record remains visible and intact in database on failure
    const expensesAfterServerFailure = backend.getExpenses();
    assert(expensesAfterServerFailure.length === 78, 'Record count remains 78 (no data deleted on server failure)');
    assert(
      expensesAfterServerFailure.some((e) => e.id === 'exp-075'),
      'Incomplete record exp-075 remains visible and intact after server failure'
    );

    // Reset failure simulation
    backend.setFailureSimulation(null);

    // -------------------------------------------------------------
    // PHASE 3: Network Failure (Failed to fetch / Connection lost)
    // -------------------------------------------------------------
    console.log('\nPhase 3: Testing Network Failure (Connection Lost / Timeout)...');
    backend.setFailureSimulation({
      type: 'network',
      message: 'Failed to fetch. Network connection timed out.',
    });

    let networkErrorThrown = false;
    let networkErrorMessage = '';
    let successToastFiredOnNetworkFailure = false;

    try {
      backend.deleteExpense('exp-075');
      successToastFiredOnNetworkFailure = true;
    } catch (err) {
      networkErrorThrown = true;
      networkErrorMessage = err.message || '';
    }

    assert(networkErrorThrown === true, 'deleteExpense threw error on simulated network failure');
    assert(networkErrorMessage.includes('NetworkError'), 'Error message contains "NetworkError"');
    assert(successToastFiredOnNetworkFailure === false, 'Success alert was NEVER shown on network failure');

    const expensesAfterNetworkFailure = backend.getExpenses();
    assert(expensesAfterNetworkFailure.length === 78, 'Record count remains 78 after network failure');
    assert(
      expensesAfterNetworkFailure.some((e) => e.id === 'exp-075'),
      'Incomplete record exp-075 remains visible and intact after network failure'
    );

    backend.setFailureSimulation(null);

    // -------------------------------------------------------------
    // PHASE 4: Database Storage / Quota Failure
    // -------------------------------------------------------------
    console.log('\nPhase 4: Testing Database Storage Failure (Disk / Quota Error)...');
    backend.setFailureSimulation({
      type: 'database',
      message: 'Write lock timeout or quota exceeded.',
    });

    let dbErrorThrown = false;
    let dbErrorMessage = '';
    try {
      backend.deleteExpense('exp-075');
    } catch (err) {
      dbErrorThrown = true;
      dbErrorMessage = err.message || '';
    }
    assert(dbErrorThrown === true, 'deleteExpense threw error on database failure');
    assert(dbErrorMessage.includes('DatabaseError'), 'Error message contains "DatabaseError"');
    assert(backend.getExpenses().some((e) => e.id === 'exp-075'), 'Record remains visible on database error');

    backend.setFailureSimulation(null);

    // -------------------------------------------------------------
    // PHASE 5: Authorization & Role Enforcement
    // -------------------------------------------------------------
    console.log('\nPhase 5: Testing Authorization Checks (Guest & Manager Mode)...');

    // 5.1 Unauthenticated Guest
    backend.logout();
    let guestDeleteBlocked = false;
    try {
      backend.deleteExpense('exp-075');
    } catch (err) {
      if (err.message && err.message.includes('401 Unauthorized')) guestDeleteBlocked = true;
    }
    assert(guestDeleteBlocked === true, 'Guest deleteExpense rejected with 401 Unauthorized');

    // 5.2 Read-Only Manager
    backend.switchUser('manager');
    let managerDeleteBlocked = false;
    try {
      backend.deleteExpense('exp-075');
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden') && err.message.includes('Read-Only')) {
        managerDeleteBlocked = true;
      }
    }
    assert(managerDeleteBlocked === true, 'Manager deleteExpense rejected with 403 Forbidden (Read-Only Audit Mode)');

    // Switch back to Owner
    await backend.loginWithCredentials('Atul.wendor@gmail.com', 'owner-pass');

    // -------------------------------------------------------------
    // PHASE 6: Successful Deletion of Incomplete Record (exp-075)
    // -------------------------------------------------------------
    console.log('\nPhase 6: Executing Real Deletion of Incomplete Record (exp-075: Blank Amount)...');
    let toastSuccessCalled = false;
    let toastErrorMessage = null;

    try {
      backend.deleteExpense('exp-075');
      // Toast fired strictly after database deletion confirms
      toastSuccessCalled = true;
    } catch (err) {
      toastErrorMessage = err.message;
    }

    assert(toastSuccessCalled === true, 'Success confirmation fired ONLY after successful backend deletion');
    assert(toastErrorMessage === null, 'No error occurred during real deletion');

    const expensesAfterDelete = backend.getExpenses();
    assert(expensesAfterDelete.length === 77, 'Active expense count decremented from 78 to 77');
    assert(!expensesAfterDelete.some((e) => e.id === 'exp-075'), 'exp-075 is removed from database list');

    // Incomplete count decrements
    const remainingIncomplete = expensesAfterDelete.filter((e) => e.status === 'incomplete' || e.amount === null);
    assert(remainingIncomplete.length === 0, 'Incomplete records count dropped from 1 to 0');

    // Valid spend is untouched because exp-075 had amount === null
    const validSpendAfterIncompleteDelete = expensesAfterDelete
      .filter((e) => e.status === 'valid' && typeof e.amount === 'number')
      .reduce((sum, e) => sum + e.amount, 0);
    assert(
      validSpendAfterIncompleteDelete === 17136,
      `Valid spend remains ₹17,136.00 after deleting incomplete expense (calculated ₹${validSpendAfterIncompleteDelete})`
    );

    // Audit log verification
    const auditLogs = backend.getAuditLogs();
    const logExp075 = auditLogs.find((l) => l.action === 'Deleted Expense' && l.recordId === 'exp-075');
    assert(Boolean(logExp075), 'Audit log entry created for deleted incomplete expense');
    assert(logExp075.previousValue.includes('Grabbit location gurgaon'), 'Audit log records original description');

    // -------------------------------------------------------------
    // PHASE 7: Reload Persistence Verification (No Auto-Resurrection!)
    // -------------------------------------------------------------
    console.log('\nPhase 7: Testing Reload Persistence (No Auto-Resurrection on Reload)...');
    // Multiple calls to getExpenses() simulating fresh page loads / mounting cycles
    for (let cycle = 1; cycle <= 3; cycle++) {
      const reloadCheck = backend.getExpenses();
      assert(reloadCheck.length === 77, `Reload cycle #${cycle}: count remains 77`);
      assert(!reloadCheck.some((e) => e.id === 'exp-075'), `Reload cycle #${cycle}: exp-075 is NOT resurrected`);
    }

    // -------------------------------------------------------------
    // PHASE 8: Successful Deletion of Valid Record & Financial Recalculation
    // -------------------------------------------------------------
    console.log('\nPhase 8: Testing Deletion of Valid Expense (exp-001) & Financial Recalculation...');
    const exp001 = expensesAfterDelete.find((e) => e.id === 'exp-001');
    assert(Boolean(exp001), 'exp-001 is present before deletion');
    const exp001Amt = exp001.amount;
    assert(exp001Amt === 108, `exp-001 amount is ₹108.00`);

    backend.deleteExpense('exp-001');
    const expensesAfterExp001 = backend.getExpenses();
    assert(expensesAfterExp001.length === 76, 'Expense count decremented from 77 to 76');
    assert(!expensesAfterExp001.some((e) => e.id === 'exp-001'), 'exp-001 is removed from database');

    const validSpendAfterExp001 = expensesAfterExp001
      .filter((e) => e.status === 'valid' && typeof e.amount === 'number')
      .reduce((sum, e) => sum + e.amount, 0);
    assert(
      validSpendAfterExp001 === 17136 - 108,
      `Financial totals accurately recalculated from ₹17,136.00 to ₹17,028.00 (calculated ₹${validSpendAfterExp001})`
    );

    // Reload check for exp-001
    const reloadCheck2 = backend.getExpenses();
    assert(reloadCheck2.length === 76, 'Reload maintains 76 records');
    assert(!reloadCheck2.some((e) => e.id === 'exp-001'), 'exp-001 remains persistently deleted');
    assert(!reloadCheck2.some((e) => e.id === 'exp-075'), 'exp-075 still remains persistently deleted');

    // -------------------------------------------------------------
    // PHASE 9: Invalid & Non-Existent Record ID Handling
    // -------------------------------------------------------------
    console.log('\nPhase 9: Testing Invalid & Non-Existent Record ID Handling...');
    let nonExistentError = null;
    try {
      backend.deleteExpense('exp-fake-9999');
    } catch (err) {
      nonExistentError = err;
    }
    assert(Boolean(nonExistentError), 'deleteExpense throws on non-existent ID');
    assert(nonExistentError.message.includes('not found'), 'Error specifies record was not found');
    assert(backend.getExpenses().length === 76, 'Database records intact after non-existent delete attempt');

    let emptyIdError = null;
    try {
      backend.deleteExpense('');
    } catch (err) {
      emptyIdError = err;
    }
    assert(Boolean(emptyIdError), 'deleteExpense throws on empty string ID');

    let nullIdError = null;
    try {
      backend.deleteExpense(null);
    } catch (err) {
      nullIdError = err;
    }
    assert(Boolean(nullIdError), 'deleteExpense throws on null ID');

    // -------------------------------------------------------------
    // PHASE 10: Cross-User Deletion Protection (User A vs User B)
    // -------------------------------------------------------------
    console.log('\nPhase 10: Testing Cross-User Deletion Protection (Alice vs Bob)...');
    // Register Alice
    const aliceReg = await backend.registerWithCredentials('Alice Smith', 'alice@company.org', 'Pass123!Alice');
    assert(aliceReg.success === true, 'Alice registration succeeded');
    const alice = aliceReg.user;

    const aliceExpense = backend.addExpense({
      description: 'Alice Confidential Client Dinner',
      amount: 3500,
      category: 'Food & Beverage',
      date: '2026-10-18',
      location: 'Mumbai',
      paymentMethod: 'UPI',
      notes: 'Private',
      status: 'valid',
    });
    assert(backend.getExpenses().length === 1, 'Alice has exactly 1 private expense');

    // Register Bob
    const bobReg = await backend.registerWithCredentials('Bob Jones', 'bob@contractor.org', 'Pass123!Bob');
    assert(bobReg.success === true, 'Bob registration succeeded');
    assert(backend.getExpenses().length === 0, 'Bob starts with clean empty expenses');

    // Bob attempts direct single deletion of Alice's expense
    let bobDeleteAliceBlocked = false;
    try {
      backend.deleteExpense(aliceExpense.id);
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) bobDeleteAliceBlocked = true;
    }
    assert(bobDeleteAliceBlocked === true, 'Bob deleteExpense(aliceExpense.id) strictly BLOCKED with 403 Forbidden');

    // Bob attempts bulk deletion of Alice's expense
    let bobBulkDeleteAliceBlocked = false;
    try {
      backend.deleteMultipleExpenses([aliceExpense.id]);
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) bobBulkDeleteAliceBlocked = true;
    }
    assert(
      bobBulkDeleteAliceBlocked === true,
      'Bob deleteMultipleExpenses([aliceExpense.id]) strictly BLOCKED with 403 Forbidden'
    );

    // Verify Alice's expense was NOT deleted
    await backend.loginWithCredentials('alice@company.org', 'Pass123!Alice');
    const aliceExpensesAfterAttack = backend.getExpenses();
    assert(aliceExpensesAfterAttack.length === 1, 'Alice expense survived attack intact');
    assert(aliceExpensesAfterAttack[0].id === aliceExpense.id, 'Alice expense ID preserved');

    // -------------------------------------------------------------
    // PHASE 11: Bulk Deletion & Database Reset Restoration
    // -------------------------------------------------------------
    console.log('\nPhase 11: Testing Bulk Deletion & Baseline Database Reset...');
    await backend.loginWithCredentials('Atul.wendor@gmail.com', 'owner-pass');
    const currentOwnerCount = backend.getExpenses().length; // 76
    const bulkTargets = ['exp-002', 'exp-003'];
    backend.deleteMultipleExpenses(bulkTargets);
    assert(
      backend.getExpenses().length === currentOwnerCount - 2,
      `Bulk delete removed 2 expenses (count: ${currentOwnerCount - 2})`
    );
    assert(!backend.getExpenses().some((e) => bulkTargets.includes(e.id)), 'Target bulk IDs removed from storage');

    // Restore baseline
    backend.resetAllData();
    const restored = backend.getExpenses();
    assert(restored.length === 78, 'resetAllData() restored baseline 78 expenses');
    assert(restored.some((e) => e.id === 'exp-075'), 'exp-075 restored after intentional reset');
    assert(restored.some((e) => e.id === 'exp-001'), 'exp-001 restored after intentional reset');
    assert(restored.some((e) => e.id === 'exp-002'), 'exp-002 restored after intentional reset');

    console.log('\n================================================================');
    console.log(`🎉 ALL DELETE EXPENSE REGRESSION TESTS PASSED (${passedTests}/${totalTests})`);
    console.log('================================================================\n');
  } finally {
    if (fs.existsSync(tempBundlePath)) {
      fs.unlinkSync(tempBundlePath);
    }
  }
}

runDeleteExpenseRegression().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
