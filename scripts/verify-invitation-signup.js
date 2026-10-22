import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runInvitationSuite() {
  console.log('========================================================================');
  console.log('🧪 VERIFYING EXPENSE MANAGER INVITATION SIGNUP WORKFLOW');
  console.log('========================================================================\n');

  const tempBundlePath = path.resolve(__dirname, `temp_invite_test_bundle_${Date.now()}.mjs`);

  await esbuild.build({
    stdin: {
      contents: `
        export { backend } from '../src/services/backendService';
        export { createClientInvitationToken, verifyClientInvitationToken } from '../src/utils/token';
        export { generateInvitationToken, verifyInvitationToken } from '../server/_lib/tokenAuth';
        export { supabaseIsInviteCallback } from '../src/services/supabase';
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

  const {
    backend,
    createClientInvitationToken,
    verifyClientInvitationToken,
    generateInvitationToken,
    verifyInvitationToken,
    supabaseIsInviteCallback,
  } = await import(`file://${tempBundlePath}`);

  let passedTests = 0;
  const totalTests = 12;

  try {
    // ------------------------------------------------------------------------
    // Scenario 1: New invited user accepts invitation & creates account
    // ------------------------------------------------------------------------
    console.log('Scenario 1: New invited user accepts invitation & creates account...');
    backend.switchUser('owner');
    const inviteEmail = 'new-auditor@example.com';
    const newInv = backend.inviteManager(inviteEmail, 'manager');

    if (!newInv || newInv.email !== inviteEmail || newInv.status !== 'pending' || !newInv.token) {
      throw new Error('Valid invitation record not created');
    }

    // Verify NO premature active member was created in workspace
    const membersBefore = backend.getWorkspaceMembers();
    const prematureMember = membersBefore.find((m) => m.email.toLowerCase() === inviteEmail);
    if (prematureMember) {
      throw new Error('Must NOT prematurely create active member before invitation is accepted');
    }

    // New invited user accepts invitation with password
    backend.logout();
    const acceptRes = await backend.acceptInvitation({
      token: newInv.token,
      email: inviteEmail,
      password: 'password123',
      name: 'New Auditor',
    });

    if (!acceptRes.success || acceptRes.user?.email !== inviteEmail || acceptRes.user?.role !== 'manager') {
      throw new Error(`Acceptance failed: ${acceptRes.error}`);
    }

    // Verify member record was created ONLY upon acceptance
    const membersAfter = backend.getWorkspaceMembers();
    const acceptedMember = membersAfter.find((m) => m.email.toLowerCase() === inviteEmail);
    if (!acceptedMember || acceptedMember.role !== 'manager' || acceptedMember.status !== 'active') {
      throw new Error('Member record not created correctly upon acceptance');
    }
    console.log('   ✅ PASSED: New invited user accepted invitation, created account, and joined workspace');
    passedTests++;

    // ------------------------------------------------------------------------
    // Scenario 2: Existing registered user accepts invitation
    // ------------------------------------------------------------------------
    console.log('\nScenario 2: Existing registered user accepts invitation...');
    backend.logout();
    const existingEmail = 'existing-user@example.com';
    const regRes = await backend.registerWithCredentials('Existing User', existingEmail, 'securePass999');
    if (!regRes.success) throw new Error('Registration failed for existing user');

    // Owner invites this existing user
    backend.switchUser('owner');
    const invForExisting = backend.inviteManager(existingEmail, 'manager');

    // Existing user accepts invitation with their password
    backend.logout();
    const acceptExistingRes = await backend.acceptInvitation({
      token: invForExisting.token,
      email: existingEmail,
      password: 'securePass999',
    });
    if (!acceptExistingRes.success || acceptExistingRes.user?.role !== 'manager') {
      throw new Error(`Existing user acceptance failed: ${acceptExistingRes.error}`);
    }
    console.log('   ✅ PASSED: Existing user successfully accepted invitation and linked to workspace');
    passedTests++;

    // ------------------------------------------------------------------------
    // Scenario 3: Wrong email or invalid token is rejected
    // ------------------------------------------------------------------------
    console.log('\nScenario 3: Wrong email or invalid token is rejected...');
    const invalidRes = await backend.acceptInvitation({
      token: 'fake-invalid-token-xyz',
      email: 'attacker@example.com',
      password: 'password123',
    });
    if (invalidRes.success) throw new Error('Invalid token should have been rejected');

    backend.switchUser('owner');
    const validInv = backend.inviteManager('target-intended@example.com', 'manager');
    backend.logout();

    const mismatchRes = await backend.acceptInvitation({
      token: validInv.token,
      email: 'mismatched-email@example.com',
      password: 'password123',
    });
    if (mismatchRes.success) throw new Error('Mismatched email should have been rejected');
    console.log('   ✅ PASSED: Invalid token and mismatched emails are strictly rejected');
    passedTests++;

    // ------------------------------------------------------------------------
    // Scenario 4: Expired and revoked invitations are rejected
    // ------------------------------------------------------------------------
    console.log('\nScenario 4: Expired and revoked invitations are rejected...');
    backend.switchUser('owner');
    const revokedEmail = 'revoked-test@example.com';
    const revokedInv = backend.inviteManager(revokedEmail, 'manager');

    // Mark status revoked
    const invs = backend.getInvitations();
    const updatedInvs = invs.map((i) => (i.id === revokedInv.id ? { ...i, status: 'revoked' } : i));
    mockLocalStorage.setItem('atul_user_usr-owner-atul_invitations_v1', JSON.stringify(updatedInvs));
    mockLocalStorage.setItem('atul_expense_manager_invitations_v1', JSON.stringify(updatedInvs));

    backend.logout();
    const tryRevoked = await backend.acceptInvitation({
      token: revokedInv.token,
      email: revokedEmail,
      password: 'password123',
    });
    if (tryRevoked.success) throw new Error('Revoked invitation should not be accepted');

    // Expired token check
    const expiredToken = createClientInvitationToken('expired@example.com', 'manager', 'ws-atul-2026', Date.now() - 10000);
    const verifyExpired = verifyClientInvitationToken('expired@example.com', expiredToken, 'manager', 'ws-atul-2026', Date.now() - 10000);
    if (verifyExpired.valid) throw new Error('Expired token should fail validation');
    console.log('   ✅ PASSED: Expired and revoked invitations are safely rejected');
    passedTests++;

    // ------------------------------------------------------------------------
    // Scenario 5: Reusing an accepted invitation does not duplicate membership
    // ------------------------------------------------------------------------
    console.log('\nScenario 5: Reusing an accepted invitation does not duplicate membership...');
    backend.switchUser('owner');
    const reuseEmail = 'reuse-member@example.com';
    const invToReuse = backend.inviteManager(reuseEmail, 'manager');
    backend.logout();

    const firstAccept = await backend.acceptInvitation({
      token: invToReuse.token,
      email: reuseEmail,
      password: 'password123',
      name: 'Reuse Member',
    });
    if (!firstAccept.success) throw new Error('First acceptance failed');

    const count1 = backend.getWorkspaceMembers().filter((m) => m.email.toLowerCase() === reuseEmail).length;
    if (count1 !== 1) throw new Error(`Expected 1 member, found ${count1}`);

    const secondAccept = await backend.acceptInvitation({
      token: invToReuse.token,
      email: reuseEmail,
      password: 'password123',
    });
    if (secondAccept.success) throw new Error('Reusing accepted invitation must fail');

    const count2 = backend.getWorkspaceMembers().filter((m) => m.email.toLowerCase() === reuseEmail).length;
    if (count2 !== 1) throw new Error(`Member was duplicated! Found ${count2}`);
    console.log('   ✅ PASSED: Reusing accepted invitation rejected and no duplicate membership created');
    passedTests++;

    // ------------------------------------------------------------------------
    // Scenario 6: Profile creation failure can be safely retried
    // ------------------------------------------------------------------------
    console.log('\nScenario 6: Profile creation requirement and retry safety...');
    backend.switchUser('owner');
    const retryEmail = 'retry-profile@example.com';
    const invRetry = backend.inviteManager(retryEmail, 'manager');
    backend.logout();

    // First attempt: no password
    const failMissingPass = await backend.acceptInvitation({
      token: invRetry.token,
      email: retryEmail,
      password: '',
    });
    if (failMissingPass.success || !failMissingPass.requiresPassword) {
      throw new Error('Must require password and flag requiresPassword for new user');
    }

    // Second attempt: retry with valid password
    const retrySuccess = await backend.acceptInvitation({
      token: invRetry.token,
      email: retryEmail,
      password: 'newValidPassword123',
      name: 'Retry Success User',
    });
    if (!retrySuccess.success || retrySuccess.user?.email !== retryEmail) {
      throw new Error('Retry with valid password should have succeeded');
    }
    console.log('   ✅ PASSED: Missing password returns safe prompt and can be cleanly retried');
    passedTests++;

    // ------------------------------------------------------------------------
    // Scenario 7: Invitation status changes only after successful acceptance
    // ------------------------------------------------------------------------
    console.log('\nScenario 7: Invitation status changes only after successful acceptance...');
    backend.switchUser('owner');
    const statusEmail = 'status-test@example.com';
    const invStatus = backend.inviteManager(statusEmail, 'manager');

    // Status is pending initially
    const invBefore = backend.getInvitations().find((i) => i.id === invStatus.id);
    if (!invBefore || invBefore.status !== 'pending') {
      throw new Error('Invitation must be pending before acceptance');
    }

    // Accept invitation
    backend.logout();
    await backend.acceptInvitation({
      token: invStatus.token,
      email: statusEmail,
      password: 'password123',
    });

    // Check status is now accepted
    backend.switchUser('owner');
    const invAfter = backend.getInvitations().find((i) => i.id === invStatus.id);
    if (!invAfter || invAfter.status !== 'accepted') {
      throw new Error('Invitation must be accepted after acceptance');
    }
    console.log('   ✅ PASSED: Status remains pending until acceptance, then transitions to accepted');
    passedTests++;

    // ------------------------------------------------------------------------
    // Scenario 8: Accepted user receives intended role and correct access
    // ------------------------------------------------------------------------
    console.log('\nScenario 8: Accepted user receives intended role and RBAC enforcement...');
    backend.switchUser('owner');
    const rbacEmail = 'rbac-auditor@example.com';
    const invRbac = backend.inviteManager(rbacEmail, 'manager');
    backend.logout();

    await backend.acceptInvitation({
      token: invRbac.token,
      email: rbacEmail,
      password: 'password123',
    });

    const currentUser = backend.getCurrentUser();
    if (currentUser.role !== 'manager' || currentUser.status !== 'active') {
      throw new Error(`Expected role manager, got ${currentUser.role}`);
    }

    // Manager CAN read expenses
    const exps = backend.getExpenses();
    if (!Array.isArray(exps)) throw new Error('Manager could not read expenses');

    // Manager CANNOT add expense
    let addBlocked = false;
    try {
      backend.addExpense({
        description: 'Unauthorized add',
        amount: 100,
        date: '2026-10-22',
        category: 'Food',
        location: 'Pune',
        paidBy: 'Company Account',
        paymentMethod: 'UPI',
        tripId: null,
        verificationStatus: 'receipt_missing',
        status: 'valid',
      });
    } catch {
      addBlocked = true;
    }
    if (!addBlocked) throw new Error('Manager was able to add an expense in Read-Only Audit Mode');

    // Manager CANNOT invite others (role escalation prevented)
    let inviteBlocked = false;
    try {
      backend.inviteManager('other@example.com', 'manager');
    } catch {
      inviteBlocked = true;
    }
    if (!inviteBlocked) throw new Error('Manager was able to invite other users');

    console.log('   ✅ PASSED: User assigned manager role with strict read-only audit enforcement');
    passedTests++;

    // ------------------------------------------------------------------------
    // Scenario 9: Authentication session persists and re-login succeeds
    // ------------------------------------------------------------------------
    console.log('\nScenario 9: Authentication session persists and re-login succeeds...');
    const savedUserRaw = mockLocalStorage.getItem('atul_expense_manager_current_user_v1');
    if (!savedUserRaw) throw new Error('Current user not saved to localStorage');

    backend.logout();
    if (backend.isAuthenticated()) throw new Error('Still authenticated after logout');

    const loginRes = await backend.loginWithCredentials('rbac-auditor@example.com', 'password123');
    if (!loginRes.success || loginRes.user?.email !== 'rbac-auditor@example.com') {
      throw new Error(`Re-login failed: ${loginRes.error}`);
    }
    console.log('   ✅ PASSED: Session persists in storage and re-login works smoothly');
    passedTests++;

    // ------------------------------------------------------------------------
    // Scenario 10: Invitation link formatting and deployed URL verification
    // ------------------------------------------------------------------------
    console.log('\nScenario 10: Invitation link formatting and deployed URL verification...');
    const origin = 'https://atul-expense-manager.vercel.app';
    const email = 'colleague@enterprise.com';
    const role = 'manager';
    const token = createClientInvitationToken(email, role, 'ws-atul-2026', Date.now() + 7 * 24 * 60 * 60 * 1000);

    const inviteUrl = `${origin}/?mode=invite&email=${encodeURIComponent(email)}&role=${role}&token=${encodeURIComponent(token)}`;

    const url = new URL(inviteUrl);
    if (
      url.origin !== 'https://atul-expense-manager.vercel.app' ||
      url.searchParams.get('mode') !== 'invite' ||
      url.searchParams.get('email') !== email ||
      url.searchParams.get('role') !== 'manager' ||
      url.searchParams.get('token') !== token
    ) {
      throw new Error('Invitation link format incorrect');
    }

    // Verify server HMAC token verification
    const serverToken = generateInvitationToken(email, role, 'ws-atul-2026', 'test-secret-key-12345');
    const serverVerify = verifyInvitationToken(serverToken, email, 'test-secret-key-12345');
    if (!serverVerify.valid || serverVerify.payload?.email !== email || serverVerify.payload?.role !== role) {
      throw new Error('Server token verification failed');
    }
    console.log('   ✅ PASSED: Correct deployed URL format with cryptographic token and server verification');
    passedTests++;

    // ------------------------------------------------------------------------
    // Scenario 11: Google Sheets HTML email template & canonical URL resolution
    // ------------------------------------------------------------------------
    console.log('\nScenario 11: Google Sheets HTML email template & canonical URL resolution...');
    const serverInviteTs = fs.readFileSync(path.resolve(__dirname, '../server/auth/send-invite.ts'), 'utf-8');
    if (!serverInviteTs.includes('#0f9d58')) {
      throw new Error('Email template missing Google Sheets green branding (#0f9d58)');
    }
    if (!serverInviteTs.includes('Open Expense Manager')) {
      throw new Error('Email template missing prominent "Open Expense Manager" CTA button');
    }
    if (!serverInviteTs.includes('invited you to collaborate on Atul Expense Manager')) {
      throw new Error('Email template missing Google Sheets collaboration subject and header');
    }
    if (!serverInviteTs.includes('localhost') || !serverInviteTs.includes('https://atul-expense-manager.vercel.app')) {
      throw new Error('Email template handler missing canonical production URL resolution');
    }
    console.log('   ✅ PASSED: Google Sheets email template contains branding (#0f9d58), "Open Expense Manager" CTA, and production URL safeguard');
    passedTests++;

    // ------------------------------------------------------------------------
    // Scenario 12: Supabase Auth invite callback URL parsing (#access_token=...&type=invite)
    // ------------------------------------------------------------------------
    console.log('\nScenario 12: Supabase Auth invite callback parsing (#access_token=...&type=invite)...');
    globalThis.window.location.hash = '#access_token=sb-mock-token-xyz&type=invite&email=invited.auditor%40example.com';
    globalThis.window.location.search = '';
    const callbackResult = supabaseIsInviteCallback();
    if (!callbackResult.isInvite) {
      throw new Error('Failed to detect Supabase Auth invite callback from URL hash');
    }
    if (callbackResult.email !== 'invited.auditor@example.com') {
      throw new Error(`Expected email invited.auditor@example.com, got ${callbackResult.email}`);
    }
    if (callbackResult.token !== 'sb-mock-token-xyz') {
      throw new Error(`Expected token sb-mock-token-xyz, got ${callbackResult.token}`);
    }
    console.log('   ✅ PASSED: Supabase Auth invitation callback parsed correctly into active invite session');
    passedTests++;

    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} INVITATION SIGNUP TESTS PASSED (100%)!`);
    console.log('========================================================================\n');
  } finally {
    if (fs.existsSync(tempBundlePath)) {
      fs.unlinkSync(tempBundlePath);
    }
  }
}

runInvitationSuite().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
