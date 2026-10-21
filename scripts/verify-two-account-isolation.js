/**
 * AUTOMATED TWO-ACCOUNT ISOLATION VERIFICATION SUITE
 * 
 * Verifies strict per-user data isolation between two distinct test accounts
 * (User A: Alice vs User B: Bob) using direct backend/API calls.
 * 
 * Tests:
 * 1. Unauthenticated Guest Rejection (401 Unauthorized for mutations/direct getters)
 * 2. User A (Alice) Account Creation & Clean Workspace State
 * 3. User B (Bob) Account Creation & Clean Workspace State
 * 4. User B -> User A Cross-Account Direct API Attacks (Must be rejected with 403 Forbidden)
 *    - Direct Read of Expense, Trip, Reimbursement, Payment Proof
 *    - Direct Update of Expense, Trip, Reimbursement, Payment Proof, Review
 *    - Direct Deletion of Expense, Trip, Reimbursement, Payment Proof
 *    - Workspace Members, Invitations, Chat Messages, and Notifications isolation
 *    - Reset Database isolation (resetting personal account does not touch other accounts or baseline)
 * 5. User A -> User B Cross-Account Direct API Attacks (Must be rejected with 403 Forbidden)
 * 6. Primary Owner (Atul) Baseline Preservation (78 expenses, ₹17,136.00 valid spend, ₹10,000 reimb)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

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

async function runTwoAccountIsolationTests() {
  console.log('================================================================');
  console.log('🧪 VERIFY TWO-ACCOUNT DATA ISOLATION (DIRECT API CALLS)');
  console.log('================================================================\n');

  // Bundle backendService with esbuild for isolated Node test execution
  const tempBundlePath = path.resolve(rootDir, `.temp_test_two_account_${Date.now()}.mjs`);
  await esbuild.build({
    entryPoints: [path.resolve(rootDir, 'src/services/backendService.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: tempBundlePath,
    packages: 'external',
  });

  const { backendService: backend, INITIAL_OWNER, isOwnerEmail } = await import(`file://${tempBundlePath}`);

  try {
    // -------------------------------------------------------------
    // PHASE 1: Unauthenticated Guest Protection
    // -------------------------------------------------------------
    console.log('Phase 1: Testing Unauthenticated Session (Guest Direct API Rejection)...');
    backend.logout();
    assert(backend.isAuthenticated() === false, 'Session is unauthenticated');
    assert(backend.getExpenses().length === 0, 'Guest getExpenses() returns []');
    assert(backend.getTrips().length === 0, 'Guest getTrips() returns []');
    assert(backend.getReimbursements().length === 0, 'Guest getReimbursements() returns []');
    assert(backend.getPaymentProofs().length === 0, 'Guest getPaymentProofs() returns []');
    assert(backend.getWorkspaceMembers().length === 0, 'Guest getWorkspaceMembers() returns []');
    assert(backend.getInvitations().length === 0, 'Guest getInvitations() returns []');
    assert(backend.getMessages('conv-any').length === 0, 'Guest getMessages() returns []');
    assert(backend.getNotifications().length === 0, 'Guest getNotifications() returns []');

    // Direct Single-Item Getters MUST Reject Unauthenticated with 401
    let getExpGuestRejected = false;
    try {
      backend.getExpense('exp-001');
    } catch (err) {
      if (err.message && err.message.includes('401 Unauthorized')) getExpGuestRejected = true;
    }
    assert(getExpGuestRejected, 'Guest getExpense() rejects with 401 Unauthorized');

    let getTripGuestRejected = false;
    try {
      backend.getTrip('trip-001');
    } catch (err) {
      if (err.message && err.message.includes('401 Unauthorized')) getTripGuestRejected = true;
    }
    assert(getTripGuestRejected, 'Guest getTrip() rejects with 401 Unauthorized');

    let getReimbGuestRejected = false;
    try {
      backend.getReimbursement('reimb-001');
    } catch (err) {
      if (err.message && err.message.includes('401 Unauthorized')) getReimbGuestRejected = true;
    }
    assert(getReimbGuestRejected, 'Guest getReimbursement() rejects with 401 Unauthorized');

    let getProofGuestRejected = false;
    try {
      backend.getPaymentProof('proof-001');
    } catch (err) {
      if (err.message && err.message.includes('401 Unauthorized')) getProofGuestRejected = true;
    }
    assert(getProofGuestRejected, 'Guest getPaymentProof() rejects with 401 Unauthorized');

    // Mutations MUST Reject Unauthenticated with 401
    let addExpGuestRejected = false;
    try {
      backend.addExpense({ description: 'Hacked', amount: 100, date: '2026-10-19', category: 'Food' });
    } catch (err) {
      if (err.message && err.message.includes('401 Unauthorized')) addExpGuestRejected = true;
    }
    assert(addExpGuestRejected, 'Guest addExpense() rejects with 401 Unauthorized');

    let deleteExpGuestRejected = false;
    try {
      backend.deleteExpense('exp-001');
    } catch (err) {
      if (err.message && err.message.includes('401 Unauthorized')) deleteExpGuestRejected = true;
    }
    assert(deleteExpGuestRejected, 'Guest deleteExpense() rejects with 401 Unauthorized');

    // -------------------------------------------------------------
    // PHASE 2: User A (Alice) Setup & Personal Workspace
    // -------------------------------------------------------------
    console.log('\nPhase 2: Setting up Account A (Alice: alice@testcorp.com)...');
    const aliceReg = await backend.registerWithCredentials('Alice Cooper', 'alice@testcorp.com', 'AlicePassword123!');
    assert(aliceReg.success === true, 'Alice account registration succeeded');
    const alice = aliceReg.user;
    assert(backend.isAuthenticated() === true, 'Alice is authenticated');
    assert(alice.email === 'alice@testcorp.com', 'Alice email matches');
    assert(alice.role === 'owner', 'Alice is owner of her personal workspace');

    // Alice workspace starts empty
    assert(backend.getExpenses().length === 0, 'Alice expenses start empty ([])');
    assert(backend.getTrips().length === 0, 'Alice trips start empty ([])');
    assert(backend.getReimbursements().length === 0, 'Alice reimbursements start empty ([])');
    assert(backend.getPaymentProofs().length === 0, 'Alice payment proofs start empty ([])');
    assert(backend.getInvitations().length === 0, 'Alice invitations start empty ([])');
    assert(backend.getConversations().length === 0, 'Alice conversations start empty ([])');

    const aliceMembers = backend.getWorkspaceMembers();
    assert(aliceMembers.length === 1, 'Alice sees exactly 1 workspace member (herself)');
    assert(aliceMembers[0].email === 'alice@testcorp.com', 'Alice workspace member is Alice');
    assert(
      !aliceMembers.some((m) => m.email.toLowerCase() === 'atul.wendor@gmail.com' || m.email.toLowerCase() === 'praakj@gmail.com'),
      'Alice does NOT see Atul or Praakj in workspace members'
    );

    // Alice creates records across all entities
    const aliceExpense = backend.addExpense({
      description: 'Client Lunch at Taj Palace',
      amount: 2500,
      category: 'Food & Beverage',
      date: '2026-10-18',
      location: 'New Delhi',
      paymentMethod: 'Corporate Card',
      notes: 'Strategic deal lunch',
      status: 'valid',
    });
    assert(aliceExpense.ownerId === alice.id, 'Alice expense tagged with Alice ownerId');

    const aliceTrip = backend.addTrip({
      name: 'Bengaluru Annual Summit',
      destination: 'Bengaluru',
      startDate: '2026-10-25',
      endDate: '2026-10-28',
      budget: 35000,
      purpose: 'Keynote Speaker',
      status: 'upcoming',
    });
    assert(aliceTrip.ownerId === alice.id, 'Alice trip tagged with Alice ownerId');

    const aliceReimb = backend.addReimbursement({
      amount: 5000,
      reference: 'ALICE-ADV-101',
      date: '2026-10-18',
      method: 'Bank Transfer',
      notes: 'Travel advance deposit',
    });
    assert(aliceReimb.ownerId === alice.id, 'Alice reimbursement tagged with Alice ownerId');

    const aliceProof = backend.addPaymentProof({
      fileName: 'taj_palace_receipt_alice.pdf',
      fileType: 'application/pdf',
      fileSize: 204800,
      previewUrl: 'https://storage.googleapis.com/test/taj_palace.pdf',
      amount: 2500,
      proofType: 'invoice',
      paymentDate: '2026-10-18',
      expenseId: aliceExpense.id,
    });
    assert(aliceProof.importedBy === alice.id, 'Alice payment proof tagged with Alice importedBy');

    // Alice verifies direct read of her own records
    assert(backend.getExpense(aliceExpense.id)?.id === aliceExpense.id, 'Alice can getExpense() her own record');
    assert(backend.getTrip(aliceTrip.id)?.id === aliceTrip.id, 'Alice can getTrip() her own record');
    assert(backend.getReimbursement(aliceReimb.id)?.id === aliceReimb.id, 'Alice can getReimbursement() her own record');
    assert(backend.getPaymentProof(aliceProof.id)?.id === aliceProof.id, 'Alice can getPaymentProof() her own record');

    // -------------------------------------------------------------
    // PHASE 3: User B (Bob) Setup & Clean Isolation
    // -------------------------------------------------------------
    console.log('\nPhase 3: Setting up Account B (Bob: bob@acme.org)...');
    const bobReg = await backend.registerWithCredentials('Bob Dylan', 'bob@acme.org', 'BobPassword789!');
    assert(bobReg.success === true, 'Bob account registration succeeded');
    const bob = bobReg.user;
    assert(backend.isAuthenticated() === true, 'Bob is authenticated');
    assert(bob.email === 'bob@acme.org', 'Bob email matches');

    // Bob workspace starts empty
    assert(backend.getExpenses().length === 0, 'Bob expenses start empty ([])');
    assert(backend.getTrips().length === 0, 'Bob trips start empty ([])');
    assert(backend.getReimbursements().length === 0, 'Bob reimbursements start empty ([])');
    assert(backend.getPaymentProofs().length === 0, 'Bob payment proofs start empty ([])');

    const bobMembers = backend.getWorkspaceMembers();
    assert(bobMembers.length === 1, 'Bob sees only 1 member (himself)');
    assert(bobMembers[0].email === 'bob@acme.org', 'Bob workspace member is Bob');
    assert(!bobMembers.some((m) => m.email === alice.email), 'Bob does NOT see Alice in members');
    assert(!bobMembers.some((m) => m.email.toLowerCase() === 'atul.wendor@gmail.com'), 'Bob does NOT see Atul in members');

    // Bob logs his own records
    const bobExpense = backend.addExpense({
      description: 'Flight to Pune',
      amount: 4200,
      category: 'Transit',
      date: '2026-10-19',
      location: 'Pune',
      paymentMethod: 'UPI',
      notes: 'Customer meeting',
      status: 'valid',
    });
    assert(bobExpense.ownerId === bob.id, 'Bob expense tagged with Bob ownerId');

    const bobTrip = backend.addTrip({
      name: 'Pune Client Review',
      destination: 'Pune',
      startDate: '2026-10-19',
      endDate: '2026-10-20',
      budget: 10000,
      purpose: 'Client audit',
      status: 'in-progress',
    });
    assert(bobTrip.ownerId === bob.id, 'Bob trip tagged with Bob ownerId');

    const bobReimb = backend.addReimbursement({
      amount: 3000,
      reference: 'BOB-EXP-202',
      date: '2026-10-19',
      method: 'UPI',
      notes: 'Local conveyance settlement',
    });
    assert(bobReimb.ownerId === bob.id, 'Bob reimbursement tagged with Bob ownerId');

    const bobProof = backend.addPaymentProof({
      fileName: 'pune_flight_boarding_pass.pdf',
      fileType: 'application/pdf',
      fileSize: 102400,
      previewUrl: 'https://storage.googleapis.com/test/pune_flight.pdf',
      amount: 4200,
      proofType: 'ticket',
      paymentDate: '2026-10-19',
      expenseId: bobExpense.id,
    });
    assert(bobProof.importedBy === bob.id, 'Bob payment proof tagged with Bob importedBy');

    // -------------------------------------------------------------
    // PHASE 4: User B (Bob) Direct API Attack Against User A (Alice)
    // -------------------------------------------------------------
    console.log('\nPhase 4: User B (Bob) Direct API Attacks on User A (Alice) Records...');

    // 4.1 Direct Read Attack (getExpense, getTrip, getReimbursement, getPaymentProof)
    let bobReadAliceExpBlocked = false;
    try {
      backend.getExpense(aliceExpense.id);
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) bobReadAliceExpBlocked = true;
    }
    assert(bobReadAliceExpBlocked, 'Bob getExpense(aliceExpense.id) BLOCKED with 403 Forbidden');

    let bobReadAliceTripBlocked = false;
    try {
      backend.getTrip(aliceTrip.id);
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) bobReadAliceTripBlocked = true;
    }
    assert(bobReadAliceTripBlocked, 'Bob getTrip(aliceTrip.id) BLOCKED with 403 Forbidden');

    let bobReadAliceReimbBlocked = false;
    try {
      backend.getReimbursement(aliceReimb.id);
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) bobReadAliceReimbBlocked = true;
    }
    assert(bobReadAliceReimbBlocked, 'Bob getReimbursement(aliceReimb.id) BLOCKED with 403 Forbidden');

    let bobReadAliceProofBlocked = false;
    try {
      backend.getPaymentProof(aliceProof.id);
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) bobReadAliceProofBlocked = true;
    }
    assert(bobReadAliceProofBlocked, 'Bob getPaymentProof(aliceProof.id) BLOCKED with 403 Forbidden');

    // 4.2 Direct Update Attack
    let bobUpdateAliceExpBlocked = false;
    try {
      backend.updateExpense({
        ...aliceExpense,
        description: 'Tampered by Bob',
        amount: 99999,
      });
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) bobUpdateAliceExpBlocked = true;
    }
    assert(bobUpdateAliceExpBlocked, 'Bob updateExpense(aliceExpense) BLOCKED with 403 Forbidden');

    let bobUpdateAliceTripBlocked = false;
    try {
      backend.updateTrip({
        ...aliceTrip,
        name: 'Hacked Trip by Bob',
      });
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) bobUpdateAliceTripBlocked = true;
    }
    assert(bobUpdateAliceTripBlocked, 'Bob updateTrip(aliceTrip) BLOCKED with 403 Forbidden');

    let bobUpdateAliceReimbBlocked = false;
    try {
      backend.updateReimbursement({
        ...aliceReimb,
        amount: 999999,
      });
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) bobUpdateAliceReimbBlocked = true;
    }
    assert(bobUpdateAliceReimbBlocked, 'Bob updateReimbursement(aliceReimb) BLOCKED with 403 Forbidden');

    let bobUpdateAliceProofBlocked = false;
    try {
      backend.updatePaymentProof({
        ...aliceProof,
        amount: 999999,
      });
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) bobUpdateAliceProofBlocked = true;
    }
    assert(bobUpdateAliceProofBlocked, 'Bob updatePaymentProof(aliceProof) BLOCKED with 403 Forbidden');

    let bobReviewAliceProofBlocked = false;
    try {
      backend.reviewPaymentProof(aliceProof.id, 'verified', 'Illegally approved by Bob');
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) bobReviewAliceProofBlocked = true;
    }
    assert(bobReviewAliceProofBlocked, 'Bob reviewPaymentProof(aliceProof.id) BLOCKED with 403 Forbidden');

    // 4.3 Direct Deletion Attack
    let bobDeleteAliceExpBlocked = false;
    try {
      backend.deleteExpense(aliceExpense.id);
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) bobDeleteAliceExpBlocked = true;
    }
    assert(bobDeleteAliceExpBlocked, 'Bob deleteExpense(aliceExpense.id) BLOCKED with 403 Forbidden');

    let bobBulkDeleteAliceExpBlocked = false;
    try {
      backend.deleteMultipleExpenses([aliceExpense.id]);
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) bobBulkDeleteAliceExpBlocked = true;
    }
    assert(bobBulkDeleteAliceExpBlocked, 'Bob deleteMultipleExpenses([aliceExpense.id]) BLOCKED with 403 Forbidden');

    let bobDeleteAliceTripBlocked = false;
    try {
      backend.deleteTrip(aliceTrip.id);
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) bobDeleteAliceTripBlocked = true;
    }
    assert(bobDeleteAliceTripBlocked, 'Bob deleteTrip(aliceTrip.id) BLOCKED with 403 Forbidden');

    let bobDeleteAliceReimbBlocked = false;
    try {
      backend.deleteReimbursement(aliceReimb.id);
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) bobDeleteAliceReimbBlocked = true;
    }
    assert(bobDeleteAliceReimbBlocked, 'Bob deleteReimbursement(aliceReimb.id) BLOCKED with 403 Forbidden');

    let bobDeleteAliceProofBlocked = false;
    try {
      backend.deletePaymentProof(aliceProof.id);
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) bobDeleteAliceProofBlocked = true;
    }
    assert(bobDeleteAliceProofBlocked, 'Bob deletePaymentProof(aliceProof.id) BLOCKED with 403 Forbidden');

    // -------------------------------------------------------------
    // PHASE 5: User A (Alice) Direct API Attack Against User B (Bob)
    // -------------------------------------------------------------
    console.log('\nPhase 5: Switching to Alice & Testing Alice -> Bob Direct API Rejection...');
    const aliceRelogin = await backend.loginWithCredentials('alice@testcorp.com', 'AlicePassword123!');
    assert(aliceRelogin.success === true, 'Alice re-authenticated successfully');
    assert(backend.currentUser.id === alice.id, 'Session is Alice');

    // Verify Alice records are intact
    const aliceExpenses = backend.getExpenses();
    assert(aliceExpenses.length === 1, 'Alice still has her 1 expense record intact');
    assert(aliceExpenses[0].id === aliceExpense.id, 'Alice expense ID preserved');
    assert(aliceExpenses[0].description === 'Client Lunch at Taj Palace', 'Alice expense content untouched');
    assert(backend.getTrips().length === 1, 'Alice trip preserved intact');
    assert(backend.getReimbursements().length === 1, 'Alice reimbursement preserved intact');
    assert(backend.getPaymentProofs().length === 1, 'Alice payment proof preserved intact');

    // Alice attacks Bob's newly created records
    let aliceReadBobExpBlocked = false;
    try {
      backend.getExpense(bobExpense.id);
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) aliceReadBobExpBlocked = true;
    }
    assert(aliceReadBobExpBlocked, 'Alice getExpense(bobExpense.id) BLOCKED with 403 Forbidden');

    let aliceDeleteBobExpBlocked = false;
    try {
      backend.deleteExpense(bobExpense.id);
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) aliceDeleteBobExpBlocked = true;
    }
    assert(aliceDeleteBobExpBlocked, 'Alice deleteExpense(bobExpense.id) BLOCKED with 403 Forbidden');

    let aliceUpdateBobTripBlocked = false;
    try {
      backend.updateTrip({ ...bobTrip, name: 'Hacked by Alice' });
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) aliceUpdateBobTripBlocked = true;
    }
    assert(aliceUpdateBobTripBlocked, 'Alice updateTrip(bobTrip.id) BLOCKED with 403 Forbidden');

    let aliceDeleteBobReimbBlocked = false;
    try {
      backend.deleteReimbursement(bobReimb.id);
    } catch (err) {
      if (err.message && err.message.includes('403 Forbidden')) aliceDeleteBobReimbBlocked = true;
    }
    assert(aliceDeleteBobReimbBlocked, 'Alice deleteReimbursement(bobReimb.id) BLOCKED with 403 Forbidden');

    // 5.2 Bob calls resetAllData() (Must reset Bob's workspace to [] WITHOUT copying Atul's 78 records or touching Alice)
    console.log('\n   Testing Bob resetAllData() Personal Workspace Isolation...');
    await backend.loginWithCredentials('bob@acme.org', 'BobPassword789!');
    backend.resetAllData();
    const bobExpensesAfterReset = backend.getExpenses();
    assert(bobExpensesAfterReset.length === 0, 'Bob expenses reset to clean [] (does NOT copy baseline 78 records)');
    assert(backend.getTrips().length === 0, 'Bob trips reset to clean []');
    assert(backend.getReimbursements().length === 0, 'Bob reimbursements reset to clean []');
    assert(backend.getPaymentProofs().length === 0, 'Bob payment proofs reset to clean []');

    // Verify Alice records survived Bob reset intact
    await backend.loginWithCredentials('alice@testcorp.com', 'AlicePassword123!');
    assert(backend.getExpenses().length === 1, 'Alice records survived Bob reset untouched');

    // -------------------------------------------------------------
    // PHASE 6: Primary Workspace Owner (Atul) Baseline Integrity
    // -------------------------------------------------------------
    console.log('\nPhase 6: Verifying Primary Workspace Owner Baseline Financials (Atul)...');
    const atulLogin = await backend.loginWithCredentials('Atul.wendor@gmail.com', 'owner-login');
    assert(atulLogin.success === true, 'Atul login succeeded');
    assert(isOwnerEmail(backend.currentUser.email), 'Atul recognized as primary workspace owner');

    const atulExpenses = backend.getExpenses();
    assert(atulExpenses.length === 78, `Atul has all 78 baseline expenses (found ${atulExpenses.length})`);

    const validSpend = atulExpenses
      .filter((e) => e.status === 'valid' && typeof e.amount === 'number')
      .reduce((sum, e) => sum + e.amount, 0);
    assert(validSpend === 17136, `Atul total valid spend is exactly ₹17,136.00 (calculated ₹${validSpend})`);

    const atulReimbs = backend.getReimbursements();
    const reimbTotal = atulReimbs.reduce((sum, r) => sum + r.amount, 0);
    assert(reimbTotal === 10000, `Atul baseline reimbursement is ₹10,000.00 (calculated ₹${reimbTotal})`);

    const incompleteExp = atulExpenses.find((e) => e.id === 'exp-075');
    assert(Boolean(incompleteExp), 'Incomplete expense exp-075 (Row 80: Grabbit location gurgaon) is intact');
    assert(incompleteExp.amount === null, 'exp-075 amount is strictly null (never ₹0)');
    assert(incompleteExp.status === 'incomplete', 'exp-075 status is incomplete');

    assert(
      !atulExpenses.some((e) => e.id === aliceExpense.id || e.id === bobExpense.id),
      'Atul does NOT see Alice or Bob records in his baseline financial list'
    );

    const atulMembers = backend.getWorkspaceMembers();
    assert(atulMembers.some((m) => m.email.toLowerCase() === 'atul.wendor@gmail.com'), 'Atul is in workspace members');
    assert(atulMembers.some((m) => m.email.toLowerCase() === 'praakj@gmail.com'), 'Praakj is in Atul workspace members');
    assert(
      !atulMembers.some((m) => m.email === alice.email || m.email === bob.email),
      'Atul workspace members do NOT include personal users Alice or Bob'
    );

    console.log('\n================================================================');
    console.log(`🎉 ALL TWO-ACCOUNT ISOLATION TESTS PASSED (${passedTests}/${totalTests})`);
    console.log('================================================================\n');
  } finally {
    if (fs.existsSync(tempBundlePath)) {
      fs.unlinkSync(tempBundlePath);
    }
  }
}

runTwoAccountIsolationTests().catch((err) => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});
