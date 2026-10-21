import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function testDataFetch() {
  const tempBundlePath = path.resolve(rootDir, `.temp_test_fetch_${Date.now()}.mjs`);
  await esbuild.build({
    entryPoints: [path.resolve(rootDir, 'src/services/backendService.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: tempBundlePath,
    packages: 'external',
  });

  const { backendService: backend, INITIAL_OWNER, INITIAL_MANAGER, isOwnerEmail } = await import(`file://${tempBundlePath}`);

  console.log('--- TEST 1: Unauthenticated Guest ---');
  backend.logout();
  console.log('isAuthenticated:', backend.isAuthenticated());
  console.log('getExpenses:', backend.getExpenses().length);

  console.log('\n--- TEST 2: Login as INITIAL_OWNER (Atul.wendor@gmail.com) ---');
  const loginAtul = await backend.loginWithCredentials('Atul.wendor@gmail.com');
  console.log('Login result:', loginAtul.success, loginAtul.user?.email);
  console.log('getExpenses count:', backend.getExpenses().length);
  console.log('getTrips count:', backend.getTrips().length);
  console.log('getReimbursements count:', backend.getReimbursements().length);

  console.log('\n--- TEST 3: Login as Manager (manager@email.com) ---');
  backend.logout();
  const loginManager = await backend.loginWithCredentials('manager@email.com');
  console.log('Login result:', loginManager.success, loginManager.user?.email, loginManager.user?.role);
  console.log('getExpenses count for manager:', backend.getExpenses().length);
  console.log('getTrips count for manager:', backend.getTrips().length);
  console.log('getReimbursements count for manager:', backend.getReimbursements().length);

  console.log('\n--- TEST 4: Login as Praakj (praakj@gmail.com) ---');
  backend.logout();
  const loginPraakj = await backend.loginWithCredentials('praakj@gmail.com');
  console.log('Login result:', loginPraakj.success, loginPraakj.user?.email, loginPraakj.user?.role);
  console.log('getExpenses count for Praakj:', backend.getExpenses().length);

  console.log('\n--- TEST 5: New user registers (newuser@company.com) ---');
  backend.logout();
  const regNew = await backend.registerWithCredentials('New User', 'newuser@company.com', 'password123');
  console.log('Registration result:', regNew.success, regNew.user?.email, regNew.user?.role);
  console.log('getExpenses count for new user:', backend.getExpenses().length);

  console.log('\n--- TEST 6: What if user logs in with atul@atul-expenses.com ---');
  backend.logout();
  const loginAtulLegacy = await backend.loginWithCredentials('atul@atul-expenses.com');
  console.log('Login result:', loginAtulLegacy.success, loginAtulLegacy.user?.email);
  console.log('getExpenses count for atul@atul-expenses.com:', backend.getExpenses().length);
}

testDataFetch().catch(console.error);
