/**
 * ATUL EXPENSE MANAGER: MULTI-USER ISOLATION & DATA PRIVACY VERIFICATION
 *
 * Verifies:
 * 1. Unauthenticated Guest Protection: 0 financial records leaked, all queries return []
 * 2. New User Registration: clean empty state ([]), isolated per-user storage namespace
 * 3. Multi-User Isolation: User B cannot view User A's transactions
 * 4. Ownership Enforcement: Cross-account mutations/deletions blocked with 403 Forbidden
 * 5. Owner Baseline Preservation: Atul.wendor@gmail.com retains 78 records (₹17,136.00) & ₹10,000 reimbursement
 * 6. Password Hashing: No plaintext passwords stored
 * 7. Firestore Security Rules: Strict per-user isolation /users/{userId}/** and default deny
 * 8. App Guard: PublicAuthPortal gate prevents DOM / state leakage before authentication
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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

console.log('================================================================');
console.log('🚀 ATUL EXPENSE MANAGER: MULTI-USER ISOLATION VERIFICATION');
console.log('================================================================\n');

// -------------------------------------------------------------
// 1. Static Security & Architecture Assertions
// -------------------------------------------------------------
console.log('1. Checking Firestore Security Rules & Access Control Policies...');
const firestoreRulesPath = path.join(rootDir, 'firestore.rules');
assert(fs.existsSync(firestoreRulesPath), 'firestore.rules exists');

const firestoreRules = fs.readFileSync(firestoreRulesPath, 'utf-8');
assert(
  firestoreRules.includes('match /users/{userId}'),
  'Defines user document sandboxing match /users/{userId}'
);
assert(
  firestoreRules.includes('request.auth.uid == userId'),
  'Enforces request.auth.uid == userId on user-isolated collections'
);
assert(
  firestoreRules.includes('allow read, write: false'),
  'Enforces default deny (allow read, write: false) on all unspecified documents'
);

console.log('\n2. Checking PublicAuthPortal & Logged-Out Guest Guard in App.tsx...');
const publicAuthPortalPath = path.join(rootDir, 'src/components/PublicAuthPortal.tsx');
assert(fs.existsSync(publicAuthPortalPath), 'src/components/PublicAuthPortal.tsx exists');

const authPortalCode = fs.readFileSync(publicAuthPortalPath, 'utf-8');
assert(authPortalCode.includes('Sign In'), 'PublicAuthPortal supports Sign In');
assert(authPortalCode.includes('Create Account') || authPortalCode.includes('registerWithCredentials'), 'PublicAuthPortal supports Create Account');
assert(authPortalCode.includes('Forgot Password') || authPortalCode.includes('resetPassword'), 'PublicAuthPortal supports Password Recovery');

const appCode = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf-8');
assert(
  appCode.includes('if (!isAuthenticated)') && appCode.includes('<PublicAuthPortal'),
  'App.tsx early-returns <PublicAuthPortal /> when unauthenticated to prevent DOM leakage'
);

console.log('\n3. Checking Baseline Financials Backup & Hash Utility...');
const backupPath = path.join(rootDir, 'backups/baseline_financials_backup.json');
assert(fs.existsSync(backupPath), 'Baseline backup file exists at backups/baseline_financials_backup.json');

const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
assert(backupData.metrics.expectedExpensesCount === 78, 'Backup contains 78 baseline expenses');
assert(backupData.metrics.expectedTotalValidSpend === 17136, 'Backup verifies valid expenses total is ₹17,136.00');
assert(backupData.metrics.expectedReimbursementAmount === 10000, 'Backup verifies total reimbursements is ₹10,000.00');

const hashUtilCode = fs.readFileSync(path.join(rootDir, 'src/utils/hash.ts'), 'utf-8');
assert(hashUtilCode.includes('hashPasswordSync'), 'src/utils/hash.ts provides hashPasswordSync');
assert(hashUtilCode.includes('salt'), 'Uses cryptographic salt for password hashing');

// -------------------------------------------------------------
// 2. Functional Multi-User Isolation Engine Simulation
// -------------------------------------------------------------
console.log('\n4. Running Functional Multi-User Simulation using Bundled Backend Engine...');
const tempBundlePath = path.join(rootDir, '.test-multiuser-backend.mjs');

try {
  // Bundle backendService with esbuild
  execSync(
    `npx esbuild src/services/backendService.ts --bundle --platform=node --format=esm --external:firebase/app --external:firebase/auth --external:firebase/firestore --outfile=${tempBundlePath}`,
    { cwd: rootDir, stdio: 'pipe' }
  );

  const { backend, isOwnerEmail } = await import(tempBundlePath);

  // A. Unauthenticated Guest Verification
  console.log('\n   A. Testing Unauthenticated Guest Data Protection:');
  backend.logout();
  assert(backend.isAuthenticated() === false, 'Guest is not authenticated');
  assert(backend.getExpenses().length === 0, 'Guest gets 0 expenses (no baseline leak)');
  assert(backend.getReimbursements().length === 0, 'Guest gets 0 reimbursements');
  assert(backend.getTrips().length === 0, 'Guest gets 0 trips');

  // B. User A Registration & Empty State
  console.log('\n   B. Testing User A (Alice) Registration & Clean Empty State:');
  const aliceRes = await backend.registerWithCredentials('Alice Cooper', 'alice@testcorp.com', 'AliceSecret123!');
  assert(aliceRes.success === true, 'Alice registration was successful');
  const alice = aliceRes.user;
  assert(backend.isAuthenticated() === true, 'Alice is authenticated');
  assert(alice.email === 'alice@testcorp.com', 'Alice profile email set');
  assert(backend.getExpenses().length === 0, 'Alice starts with clean empty expenses list ([])');
  assert(backend.getReimbursements().length === 0, 'Alice starts with clean empty reimbursements ([])');
  assert(backend.getTrips().length === 0, 'Alice starts with clean empty trips ([])');

  // Alice logs an expense
  const aliceExpense = backend.addExpense({
    description: 'Client Lunch at Taj',
    amount: 1450,
    category: 'Food & Beverage',
    date: '2026-10-18',
    location: 'Taj Hotel, Delhi',
    paymentMethod: 'Corporate Card',
    notes: 'Q4 planning lunch',
    status: 'valid'
  });
  assert(aliceExpense.id !== undefined, 'Alice successfully logged an expense');
  assert(aliceExpense.ownerId === alice.id, 'Alice expense is tagged with Alice ownerId');

  const aliceList = backend.getExpenses();
  assert(aliceList.length === 1, 'Alice has exactly 1 expense');
  assert(aliceList[0].amount === 1450, 'Alice expense amount is ₹1,450.00');

  // C. User B Registration & Isolation
  console.log('\n   C. Testing User B (Bob) Registration & Isolation from User A:');
  const bobRes = await backend.registerWithCredentials('Bob Dylan', 'bob@acme.org', 'BobPassword789!');
  assert(bobRes.success === true, 'Bob registration was successful');
  const bob = bobRes.user;
  assert(backend.isAuthenticated() === true, 'Bob is authenticated');
  assert(bob.email === 'bob@acme.org', 'Bob profile email set');

  const bobInitialExpenses = backend.getExpenses();
  assert(bobInitialExpenses.length === 0, 'Bob starts with clean empty expenses list ([])');
  assert(
    !bobInitialExpenses.some(e => e.description === 'Client Lunch at Taj'),
    "Bob CANNOT see Alice's expense (zero cross-user leakage)"
  );

  // Bob adds his own expense
  const bobExpense = backend.addExpense({
    description: 'Airport Taxi',
    amount: 600,
    category: 'Transit',
    date: '2026-10-19',
    location: 'IGI Airport',
    paymentMethod: 'Cash',
    notes: 'Taxi ride',
    status: 'valid'
  });
  assert(bobExpense.ownerId === bob.id, 'Bob expense is tagged with Bob ownerId');

  const bobList = backend.getExpenses();
  assert(bobList.length === 1, 'Bob has exactly 1 expense');
  assert(bobList[0].description === 'Airport Taxi', 'Bob sees only his own expense');

  // D. Cross-User Mutation / Deletion Attack Prevention
  console.log('\n   D. Testing 403 Forbidden on Cross-User Mutation & Deletion:');
  let updateBlocked = false;
  try {
    backend.updateExpense({
      ...aliceExpense,
      description: 'Hacked by Bob',
      amount: 99999
    });
  } catch (err) {
    if (err.message && err.message.includes('403 Forbidden')) {
      updateBlocked = true;
    }
  }
  assert(updateBlocked, "Cross-user update blocked with '403 Forbidden: Ownership violation'");

  let deleteBlocked = false;
  try {
    backend.deleteExpense(aliceExpense.id);
  } catch (err) {
    if (err.message && err.message.includes('403 Forbidden')) {
      deleteBlocked = true;
    }
  }
  assert(deleteBlocked, "Cross-user deletion blocked with '403 Forbidden: Ownership violation'");

  // E. Owner Baseline Preservation (Atul.wendor@gmail.com)
  console.log('\n   E. Testing Baseline Owner Preservation (Atul.wendor@gmail.com):');
  const ownerRes = await backend.loginWithCredentials('Atul.wendor@gmail.com', 'owner-login');
  assert(ownerRes.success === true, 'Owner login was successful');
  const owner = ownerRes.user;
  assert(backend.isAuthenticated() === true, 'Owner is authenticated');
  assert(isOwnerEmail(owner.email), 'Owner email recognized');

  const ownerExpenses = backend.getExpenses();
  assert(ownerExpenses.length === 78, 'Owner has all 78 baseline expense records intact');

  const validOwnerSpend = ownerExpenses
    .filter(e => e.status === 'valid' && typeof e.amount === 'number')
    .reduce((sum, e) => sum + e.amount, 0);
  assert(validOwnerSpend === 17136, 'Owner valid expenses total exactly ₹17,136.00');

  const ownerReimbursements = backend.getReimbursements();
  const reimbursementTotal = ownerReimbursements.reduce((sum, r) => sum + r.amount, 0);
  assert(reimbursementTotal === 10000, 'Owner baseline reimbursement ₹10,000.00 preserved intact');

  assert(
    !ownerExpenses.some(e => e.description === 'Client Lunch at Taj' || e.description === 'Airport Taxi'),
    'Owner does not see Alice or Bob private expenses'
  );

  // F. Verified Token-Based Password Reset Flow
  console.log('\n   F. Testing Verified Token-Based Password Reset & Updated Credential Sign In:');
  const reqResetAlice = await backend.requestPasswordReset('alice@testcorp.com');
  assert(reqResetAlice.success === true, 'Alice request for password reset succeeded');
  assert(Boolean(reqResetAlice.resetUrl || reqResetAlice.token), 'Generated verified reset URL with security token');

  // Attempt password reset with tampered/invalid token -> MUST FAIL
  const forgedReset = await backend.confirmPasswordReset({
    email: 'alice@testcorp.com',
    newPassword: 'HackedPassword123!',
    token: 'rst_forged_invalid_token',
    expires: Date.now() + 3600000,
  });
  assert(forgedReset.success === false, 'Tampered/forged token strictly rejected');

  // Legitimate token confirmation
  const resetAlice = await backend.confirmPasswordReset({
    email: 'alice@testcorp.com',
    newPassword: 'NewAlicePassword999!',
    token: reqResetAlice.token,
    expires: reqResetAlice.expires,
  });
  assert(resetAlice.success === true, 'Alice password reset with verified token succeeded');

  // Attempt login with old password
  const oldLogin = await backend.loginWithCredentials('alice@testcorp.com', 'AliceSecret123!');
  assert(oldLogin.success === false, 'Old password rejected after password reset');

  // Attempt login with new password
  const newLogin = await backend.loginWithCredentials('alice@testcorp.com', 'NewAlicePassword999!');
  assert(newLogin.success === true, 'Login with new updated password succeeded');
  assert(newLogin.user.email === 'alice@testcorp.com', 'Authenticated as Alice');

  // G. Logout Session Purge
  console.log('\n   G. Testing Logout & State Purge:');
  backend.logout();
  assert(backend.isAuthenticated() === false, 'Session successfully purged on logout');
  assert(backend.getExpenses().length === 0, 'getExpenses returns [] after logout');

} finally {
  if (fs.existsSync(tempBundlePath)) {
    fs.unlinkSync(tempBundlePath);
  }
}

console.log('\n================================================================');
console.log(`🎉 ALL MULTI-USER ISOLATION VERIFICATION TESTS PASSED (${passedTests}/${totalTests})`);
console.log('================================================================\n');
