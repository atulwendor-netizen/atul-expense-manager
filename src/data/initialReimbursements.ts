import { Reimbursement } from '../types/index';

export const initialReimbursements: Reimbursement[] = [
  {
    id: 'reimb-001',
    date: '2026-09-03',
    amount: 10000,
    reference: 'REIMB-ADV-10000',
    notes: 'Reimbursement received (Recorded in spreadsheet row 90)',
    tripId: 'trip-mumbai-pune-2026',
    createdAt: '2026-09-03T18:00:00Z'
  }
];
