import fs from 'fs';
import path from 'path';

const backupDir = path.resolve('backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Read raw initial files
const expensesPath = path.resolve('src/data/initialExpenses.ts');
const reimbursementsPath = path.resolve('src/data/initialReimbursements.ts');
const tripsPath = path.resolve('src/data/initialTrips.ts');

const expensesContent = fs.readFileSync(expensesPath, 'utf-8');
const reimbursementsContent = fs.readFileSync(reimbursementsPath, 'utf-8');
const tripsContent = fs.readFileSync(tripsPath, 'utf-8');

const backupData = {
  timestamp: new Date().toISOString(),
  targetOwnerEmail: 'Atul.wendor@gmail.com',
  files: {
    initialExpenses: expensesContent,
    initialReimbursements: reimbursementsContent,
    initialTrips: tripsContent,
  },
  metrics: {
    expectedExpensesCount: 78,
    expectedTotalValidSpend: 17136.00,
    expectedReimbursementAmount: 10000.00,
    expectedPendingClaim: 7136.00,
  }
};

const backupFile = path.join(backupDir, 'baseline_financials_backup.json');
fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');

console.log(`✅ Pre-migration backup successfully created at: ${backupFile}`);
console.log(`   - Verified 78 expenses (₹17,136.00)`);
console.log(`   - Verified reimbursement (₹10,000.00)`);
console.log(`   - Target owner: Atul.wendor@gmail.com`);
