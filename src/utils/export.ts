import * as XLSX from 'xlsx';
import { Expense, Reimbursement, Trip } from '../types/index';

export function formatExpensesForExport(expenses: Expense[], trips: Trip[]) {
  const tripMap = new Map(trips.map((t) => [t.id, t.name]));

  return expenses.map((e, index) => ({
    '#': index + 1,
    'Date': e.date || 'Unspecified',
    'Description': e.description || '',
    'Category': e.category || 'Uncategorized',
    'Amount (₹)': e.amount !== null && e.amount !== undefined ? e.amount : 'Missing / Incomplete',
    'Payment Method': e.paymentMethod || 'Not Specified',
    'Location': e.location || 'Not Specified',
    'Trip': (e.tripId && tripMap.get(e.tripId)) || 'No Trip Assigned',
    'Notes': e.notes || '',
    'Status': e.status === 'valid' ? 'Valid' : 'Incomplete',
    'Has Receipt': e.receipt ? 'Yes' : 'No',
  }));
}

export function exportExpensesToCSV(expenses: Expense[], trips: Trip[], filename = 'atul_expenses.csv') {
  const data = formatExpensesForExport(expenses, trips);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportExpensesToExcel(expenses: Expense[], trips: Trip[], filename = 'atul_expenses.xlsx') {
  const data = formatExpensesForExport(expenses, trips);
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Column width auto-sizing
  const colWidths = [
    { wch: 5 },  // #
    { wch: 14 }, // Date
    { wch: 36 }, // Description
    { wch: 18 }, // Category
    { wch: 14 }, // Amount
    { wch: 16 }, // Payment Method
    { wch: 22 }, // Location
    { wch: 24 }, // Trip
    { wch: 34 }, // Notes
    { wch: 12 }, // Status
    { wch: 12 }, // Has Receipt
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
  XLSX.writeFile(workbook, filename);
}

export function exportReimbursementClaimToExcel(
  expenses: Expense[],
  reimbursements: Reimbursement[],
  trips: Trip[],
  filename = 'atul_reimbursement_claim.xlsx'
) {
  const tripMap = new Map(trips.map((t) => [t.id, t.name]));

  // Sheet 1: Summary Sheet
  const totalExpense = expenses
    .filter((e) => e.status === 'valid' && typeof e.amount === 'number' && !isNaN(e.amount))
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalReimbursed = reimbursements.reduce((sum, r) => sum + (r.amount || 0), 0);
  const pendingDue = Math.max(0, totalExpense - totalReimbursed);

  const summaryData = [
    { 'Financial Metric': 'Report Title', 'Value': 'ATUL EXPENSE MANAGER - TRAVEL & REIMBURSEMENT CLAIM' },
    { 'Financial Metric': 'Generated On', 'Value': new Date().toLocaleDateString('en-IN') },
    { 'Financial Metric': 'Total Claimed Spend', 'Value': `₹${totalExpense.toLocaleString('en-IN')}` },
    { 'Financial Metric': 'Total Reimbursements Received', 'Value': `₹${totalReimbursed.toLocaleString('en-IN')}` },
    { 'Financial Metric': 'Net Pending Due to Employee', 'Value': `₹${pendingDue.toLocaleString('en-IN')}` },
    { 'Financial Metric': 'Valid Transactions Count', 'Value': expenses.filter((e) => e.status === 'valid' && typeof e.amount === 'number' && !isNaN(e.amount)).length },
    { 'Financial Metric': 'Incomplete / Unresolved Records', 'Value': expenses.filter((e) => e.status === 'incomplete' || e.amount === null || isNaN(e.amount as number)).length },
    { 'Financial Metric': 'Reimbursement Credits Count', 'Value': reimbursements.length },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 32 }, { wch: 45 }];

  // Sheet 2: Itemized Expenses
  const expenseData = formatExpensesForExport(expenses, trips);
  const expenseSheet = XLSX.utils.json_to_sheet(expenseData);
  expenseSheet['!cols'] = [
    { wch: 5 }, { wch: 14 }, { wch: 36 }, { wch: 18 }, { wch: 14 },
    { wch: 16 }, { wch: 22 }, { wch: 24 }, { wch: 34 }, { wch: 12 }, { wch: 12 },
  ];

  // Sheet 3: Reimbursement Credits
  const reimbData = reimbursements.map((r, idx) => ({
    '#': idx + 1,
    'Payment Date': r.date,
    'Reference / UTR': r.reference,
    'Amount (₹)': r.amount,
    'Allocated Trip': (r.tripId && tripMap.get(r.tripId)) || 'Unallocated / General',
    'Notes': r.notes,
  }));
  const reimbSheet = XLSX.utils.json_to_sheet(reimbData);
  reimbSheet['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 24 }, { wch: 15 }, { wch: 24 }, { wch: 35 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');
  XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Itemized Expenses');
  XLSX.utils.book_append_sheet(workbook, reimbSheet, 'Reimbursements');

  XLSX.writeFile(workbook, filename);
}
