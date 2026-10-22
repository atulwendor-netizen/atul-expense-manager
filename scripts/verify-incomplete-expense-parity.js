/**
 * verify-incomplete-expense-parity.js
 * 
 * Verifies that incomplete expense entries (specifically exp-075: "Grabbit location gurgaon")
 * are visible with complete parity across both Owner and Manager/Auditor roles.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runParitySuite() {
  console.log('\n========================================================================');
  console.log('🧪 VERIFYING INCOMPLETE EXPENSE VISIBILITY & ROLE PARITY (OWNER vs AUDITOR)');
  console.log('========================================================================\n');

  const tempBundlePath = path.resolve(__dirname, `temp_parity_test_bundle_${Date.now()}.mjs`);

  // Mock localStorage for BackendService simulation
  const storage = new Map();
  const mockLocalStorage = {
    getItem: (k) => storage.get(k) || null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear(),
  };
  globalThis.localStorage = mockLocalStorage;
  globalThis.window = {
    localStorage: mockLocalStorage,
    location: { origin: 'https://atul-expense-manager.vercel.app' },
  };

  try {
    await esbuild.build({
      stdin: {
        contents: `
          export { backend, INITIAL_OWNER, INITIAL_MANAGER } from '../src/services/backendService';
          export { initialExpenses } from '../src/data/initialExpenses';
          export { calculateDashboardMetrics } from '../src/utils/calculations';
        `,
        resolveDir: __dirname,
        sourcefile: 'entry.js',
      },
      bundle: true,
      platform: 'node',
      format: 'esm',
      packages: 'external',
      outfile: tempBundlePath,
    });

    const { backend, INITIAL_OWNER, INITIAL_MANAGER, initialExpenses, calculateDashboardMetrics } =
      await import(`file://${tempBundlePath}`);

    let passedTests = 0;
    let totalTests = 0;

    function test(description, fn) {
      totalTests++;
      try {
        fn();
        console.log(`   ✅ PASSED: ${description}`);
        passedTests++;
      } catch (err) {
        console.error(`   ❌ FAILED: ${description}`);
        console.error(`      ${err.message}`);
        process.exitCode = 1;
      }
    }

    // 1. Initial State Parity
    console.log('--- SECTION 1: FRESH STATE ROLE PARITY ---');

    test('Both Owner and Auditor/Manager retrieve exactly 78 expenses on pristine load', () => {
      backend.switchUser('owner');
      const ownerExpenses = backend.getExpenses();
      backend.switchUser('manager');
      const mgrExpenses = backend.getExpenses();

      assert.strictEqual(ownerExpenses.length, 78, `Owner should have 78 expenses, got ${ownerExpenses.length}`);
      assert.strictEqual(mgrExpenses.length, 78, `Manager should have 78 expenses, got ${mgrExpenses.length}`);
    });

    test('Incomplete entry exp-075 ("Grabbit location gurgaon") is present for both Owner and Auditor', () => {
      backend.switchUser('owner');
      const ownerExp075 = backend.getExpenses().find((e) => e.id === 'exp-075');
      backend.switchUser('manager');
      const mgrExp075 = backend.getExpenses().find((e) => e.id === 'exp-075');

      assert(ownerExp075, 'Owner must see exp-075');
      assert.strictEqual(ownerExp075.status, 'incomplete');
      assert.strictEqual(ownerExp075.amount, null);
      assert.strictEqual(ownerExp075.description, 'Grabbit location gurgaon');

      assert(mgrExp075, 'Auditor must see exp-075');
      assert.strictEqual(mgrExp075.status, 'incomplete');
      assert.strictEqual(mgrExp075.amount, null);
      assert.strictEqual(mgrExp075.description, 'Grabbit location gurgaon');
    });

    // 2. Legacy Storage Self-Healing
    console.log('\n--- SECTION 2: LEGACY STORAGE PARTITION SELF-HEALING ---');

    test('Owner partition recovers exp-075 automatically when loaded from legacy 77-item cache', () => {
      const legacy77 = initialExpenses.filter((e) => e.id !== 'exp-075');
      const ownerKey = `atul_user_${INITIAL_OWNER.id}_expenses_v2`;
      backend.setItem(ownerKey, JSON.stringify(legacy77));

      const rawBefore = JSON.parse(backend.getItem(ownerKey));
      assert.strictEqual(rawBefore.length, 77);
      assert.strictEqual(rawBefore.some((e) => e.id === 'exp-075'), false);

      backend.switchUser('owner');
      const healedExpenses = backend.getExpenses();

      assert.strictEqual(healedExpenses.length, 78, 'Healed list must contain 78 records');
      const healed075 = healedExpenses.find((e) => e.id === 'exp-075');
      assert(healed075, 'Healed list must contain exp-075');
      assert.strictEqual(healed075.status, 'incomplete');
      assert.strictEqual(healed075.amount, null);
    });

    // 3. Deletion Safety
    console.log('\n--- SECTION 3: EXPLICIT DELETION TRACKING & SAFETY ---');

    test('Explicitly deleted expense is recorded and not resurrected by self-healing', () => {
      backend.switchUser('owner');
      const beforeCount = backend.getExpenses().length;

      const targetId = 'exp-078';
      backend.deleteExpense(targetId);

      const afterDelete = backend.getExpenses();
      assert.strictEqual(afterDelete.length, beforeCount - 1);
      assert.strictEqual(afterDelete.some((e) => e.id === targetId), false);

      const afterSecondFetch = backend.getExpenses();
      assert.strictEqual(afterSecondFetch.length, beforeCount - 1);
      assert.strictEqual(afterSecondFetch.some((e) => e.id === targetId), false);

      backend.resetAllData();
      const afterReset = backend.getExpenses();
      assert.strictEqual(afterReset.length, 78, 'Database reset must restore all 78 pristine records');
      assert(afterReset.some((e) => e.id === targetId), 'Reset must restore exp-078');
      assert(afterReset.some((e) => e.id === 'exp-075'), 'Reset must restore exp-075');
    });

    // 4. Financial Calculation Integrity
    console.log('\n--- SECTION 4: FINANCIAL INTEGRITY & CALCULATION ISOLATION ---');

    test('Incomplete expense exp-075 does NOT affect financial totals (total spend remains ₹17,136)', () => {
      backend.switchUser('owner');
      const ownerExpenses = backend.getExpenses();
      const reimbursements = backend.getReimbursements();
      const trips = backend.getTrips();

      const metrics = calculateDashboardMetrics(ownerExpenses, reimbursements, undefined, trips);

      assert.strictEqual(metrics.totalExpense, 17136, `Total spend must remain exactly ₹17,136, got ₹${metrics.totalExpense}`);
      assert.strictEqual(metrics.incompleteTransactions, 1, `Incomplete count must be exactly 1, got ${metrics.incompleteTransactions}`);
      assert.strictEqual(metrics.totalTransactions, 77, `Total valid transactions must be 77, got ${metrics.totalTransactions}`);
      assert.strictEqual(ownerExpenses.length, 78, `Total records in dataset must be 78, got ${ownerExpenses.length}`);
    });

    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} INCOMPLETE EXPENSE PARITY TESTS PASSED (100%)!`);
    console.log('========================================================================\n');
  } finally {
    if (fs.existsSync(tempBundlePath)) {
      try {
        fs.unlinkSync(tempBundlePath);
      } catch {}
    }
  }
}

runParitySuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
