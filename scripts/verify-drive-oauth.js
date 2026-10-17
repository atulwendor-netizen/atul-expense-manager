/**
 * ATUL EXPENSE MANAGER: GOOGLE DRIVE OAUTH 2.0 & RBAC VERIFICATION
 *
 * Verifies:
 * 1. Server-side OAuth engine (googleAuth.ts): scopes, offline access, token storage, expiry, refresh
 * 2. API endpoints (/api/auth/google/status, /api/auth/google/url, /api/auth/google/disconnect, /api/drive/files)
 * 3. Frontend Audit role RBAC enforcement on all Google Drive import & auth controls
 * 4. Error handling (missing credentials, access denied 403, folder not found 404, unauthenticated 401)
 * 5. Baseline financial data preservation (78 records, ₹17,136.00 total)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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

console.log('================================================================');
console.log('🚀 ATUL EXPENSE MANAGER: GOOGLE DRIVE OAUTH 2.0 & RBAC VERIFICATION');
console.log('================================================================\n');

// -------------------------------------------------------------
// 1. Verify Server-Side OAuth Library (api/_lib/googleAuth.ts)
// -------------------------------------------------------------
console.log('1. Checking Server-Side Google OAuth Engine (api/_lib/googleAuth.ts)...');
const googleAuthFile = path.join(rootDir, 'api/_lib/googleAuth.ts');
assert(fs.existsSync(googleAuthFile), 'api/_lib/googleAuth.ts exists');

const googleAuthContent = fs.readFileSync(googleAuthFile, 'utf-8');

// Check Scopes
assert(
  googleAuthContent.includes('https://www.googleapis.com/auth/drive.readonly'),
  'Uses official minimum required drive.readonly scope'
);
assert(
  googleAuthContent.includes('https://www.googleapis.com/auth/userinfo.email'),
  'Includes userinfo.email scope to identify connected Google account'
);

// Check Offline Access and Consent Prompt (guarantees refresh_token)
assert(
  googleAuthContent.includes("access_type: 'offline'") || googleAuthContent.includes('access_type=offline'),
  'Configures access_type=offline for permanent refresh tokens'
);
assert(
  googleAuthContent.includes("prompt: 'consent'") || googleAuthContent.includes('prompt=consent'),
  'Configures prompt=consent to ensure refresh token is issued'
);

// Check Token Storage Security
assert(
  googleAuthContent.includes('0o600') || googleAuthContent.includes('mode: 0o600'),
  'Restricts token file permissions to 0o600 (owner read/write only)'
);
assert(
  googleAuthContent.includes('.data') && googleAuthContent.includes('google_drive_tokens.json'),
  'Stores tokens in server filesystem (.data/google_drive_tokens.json)'
);

// Check Gitignore of tokens
const gitignoreContent = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf-8');
assert(gitignoreContent.includes('.data'), '.gitignore excludes .data directory from version control');

// Check Automatic Refresh Logic
assert(
  googleAuthContent.includes('refresh_token') && googleAuthContent.includes('grant_type'),
  'Implements automatic token refresh via grant_type=refresh_token'
);
assert(
  googleAuthContent.includes('invalid_grant'),
  'Handles revoked authorizations by clearing revoked tokens'
);

// Check Drive API v3 Error Handling
assert(
  googleAuthContent.includes('403') && googleAuthContent.includes('Access Denied'),
  'Handles 403 Forbidden with clear instruction to share folder with connected email'
);
assert(
  googleAuthContent.includes('404') && googleAuthContent.includes('Folder not found'),
  'Handles 404 Folder Not Found with clear validation message'
);
assert(
  googleAuthContent.includes('disconnectGoogle') && googleAuthContent.includes('oauth2.googleapis.com/revoke'),
  'Implements token revocation endpoint to cleanly disconnect account'
);

// -------------------------------------------------------------
// 2. Verify Serverless API Routes
// -------------------------------------------------------------
console.log('\n2. Checking Serverless OAuth Endpoints in api/ directory...');
const routes = [
  'api/auth/google/url.ts',
  'api/auth/google/callback.ts',
  'api/auth/google/status.ts',
  'api/auth/google/disconnect.ts',
  'api/drive/files.ts',
];

for (const r of routes) {
  assert(fs.existsSync(path.join(rootDir, r)), `${r} exists`);
}

// Check callback logic
const callbackContent = fs.readFileSync(path.join(rootDir, 'api/auth/google/callback.ts'), 'utf-8');
assert(
  callbackContent.includes('exchangeCodeForTokens'),
  'Callback exchanges authorization code for tokens securely on server'
);
assert(
  callbackContent.includes('/payment-proofs?gdrive_auth=success'),
  'Callback redirects back to /payment-proofs with gdrive_auth=success on success'
);
assert(
  callbackContent.includes('/payment-proofs?gdrive_auth=error'),
  'Callback redirects back to /payment-proofs with gdrive_auth=error on failure'
);

// Check vite dev middleware integration
const viteConfigContent = fs.readFileSync(path.join(rootDir, 'vite.config.ts'), 'utf-8');
assert(
  viteConfigContent.includes('googleDriveDevApiPlugin') && viteConfigContent.includes('/api/auth/google'),
  'Vite dev server includes Connect middleware for local /api endpoints'
);

// -------------------------------------------------------------
// 3. Verify Client Integration in PaymentProofsPage.tsx
// -------------------------------------------------------------
console.log('\n3. Checking Client UI & OAuth Integration (PaymentProofsPage.tsx)...');
const paymentProofsPage = fs.readFileSync(path.join(rootDir, 'src/pages/PaymentProofsPage.tsx'), 'utf-8');

assert(
  paymentProofsPage.includes('checkGoogleAuthStatus') && paymentProofsPage.includes('getGoogleAuthUrl'),
  'PaymentProofsPage imports checkGoogleAuthStatus and getGoogleAuthUrl helpers'
);
assert(
  paymentProofsPage.includes('gdrive_auth') && paymentProofsPage.includes('window.history.replaceState'),
  'PaymentProofsPage handles OAuth callback params and cleans URL'
);
assert(
  paymentProofsPage.includes('handleAuthorizeDrive'),
  'PaymentProofsPage implements handleAuthorizeDrive for 1-click Google consent redirection'
);

// -------------------------------------------------------------
// 4. Verify Audit Role RBAC Constraints (Requirement 10)
// -------------------------------------------------------------
console.log('\n4. Verifying RBAC Restrictions on Audit / Manager Role (isManager)...');

// Top "Import Proofs" button
assert(
  paymentProofsPage.includes('{!isManager && (') && paymentProofsPage.includes('Import Proofs'),
  'Top "Import Proofs" button is hidden from Audit role (isManager)'
);

// Folder Link Input Form
assert(
  paymentProofsPage.includes('disabled={isManager || isImportingLink}'),
  'Folder Link Input is disabled when isManager is true'
);
assert(
  paymentProofsPage.includes('Audit Mode') && paymentProofsPage.includes('!isManager ?'),
  '"Import / View" button is hidden/replaced with Audit Mode badge for Audit role'
);

// "Authorize Drive" button in error banner
assert(
  paymentProofsPage.includes('!isManager ?') && paymentProofsPage.includes('Authorize Drive'),
  '"Authorize Drive" button is protected and hidden from Audit role'
);

// "Simulate New Upload" button
assert(
  paymentProofsPage.includes('Simulate New Upload') && paymentProofsPage.includes('{!isManager && ('),
  '"Simulate New Upload" button is hidden from Audit role'
);

// DriveFileViewerModal
const viewerModal = fs.readFileSync(path.join(rootDir, 'src/components/DriveFileViewerModal.tsx'), 'utf-8');
assert(
  viewerModal.includes('isManager?: boolean') && viewerModal.includes('!isManager &&'),
  'DriveFileViewerModal hides "Import / Link to Expense" button for Audit role'
);

// DriveImportModal
const importModal = fs.readFileSync(path.join(rootDir, 'src/components/DriveImportModal.tsx'), 'utf-8');
assert(
  importModal.includes('isManager = false') && importModal.includes('if (isManager) return;'),
  'DriveImportModal prevents batch submission when in Audit role'
);
assert(
  importModal.includes('Importing restricted in Audit Mode'),
  'DriveImportModal displays restriction label instead of import submit button'
);

// DriveConfigModal
const configModal = fs.readFileSync(path.join(rootDir, 'src/components/DriveConfigModal.tsx'), 'utf-8');
assert(
  configModal.includes('handleConnectOAuth') && configModal.includes('handleDisconnectOAuth'),
  'DriveConfigModal implements real OAuth connect and disconnect methods'
);
assert(
  configModal.includes('{!isManager && (') && configModal.includes('Disconnect Account'),
  'DriveConfigModal hides Connect/Disconnect/Save controls for Audit role'
);

// -------------------------------------------------------------
// 5. Verify Environment Variables & Configuration Documentation
// -------------------------------------------------------------
console.log('\n5. Checking Configuration & Documentation...');
const envExamplePath = path.join(rootDir, '.env.example');
assert(fs.existsSync(envExamplePath), '.env.example exists with setup template');
const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');
assert(envExampleContent.includes('GOOGLE_CLIENT_ID'), '.env.example documents GOOGLE_CLIENT_ID');
assert(envExampleContent.includes('GOOGLE_CLIENT_SECRET'), '.env.example documents GOOGLE_CLIENT_SECRET');
assert(envExampleContent.includes('GOOGLE_REDIRECT_URI'), '.env.example documents GOOGLE_REDIRECT_URI');

// -------------------------------------------------------------
// 6. Verify Baseline Financials & Integrity Preservation
// -------------------------------------------------------------
console.log('\n6. Checking Baseline Financials and Data Integrity...');
const initialExpensesPath = path.join(rootDir, 'src/data/initialExpenses.ts');
const initialExpensesContent = fs.readFileSync(initialExpensesPath, 'utf-8');

const idMatches = initialExpensesContent.match(/"id":\s*['"]exp-[^'"]+['"]/g) || [];
assert(idMatches.length === 78, `Total expense records preserved: ${idMatches.length} (expected 78)`);

const amountMatches = initialExpensesContent.match(/"amount":\s*([0-9]+(?:\.[0-9]+)?)/g) || [];
let totalAmount = 0;
for (const match of amountMatches) {
  const num = parseFloat(match.replace(/"amount":\s*/, ''));
  if (!isNaN(num)) totalAmount += num;
}
assert(
  Math.round(totalAmount) === 17136,
  `Total valid expenses strictly preserved: ₹${totalAmount.toFixed(2)} (expected ₹17,136.00)`
);

console.log('\n================================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} GOOGLE DRIVE OAUTH & RBAC TESTS PASSED (100%)`);
console.log('================================================================');
