export type ExpenseCategory =
  | 'Transit'
  | 'Food & Beverage'
  | 'Lodging'
  | 'Miscellaneous'
  | 'Porter'
  | string;

export type PaymentMethod =
  | 'Digital / UPI'
  | 'Cash'
  | 'Card'
  | 'Other'
  | string;

export type ExpenseStatus = 'valid' | 'incomplete';

export interface Expense {
  id: string;
  date: string;               // ISO date format YYYY-MM-DD or empty string for incomplete
  description: string;
  category: string;
  amount: number | null;      // null if missing in original sheet
  paymentMethod: string;
  location: string;
  notes: string;
  receipt: string | null;     // Data URL (image/pdf base64) or null
  receiptName?: string | null;
  tripId: string | null;      // Link to Trip
  status: ExpenseStatus;      // 'valid' or 'incomplete'
  createdAt?: string;
  updatedAt?: string;
  rawOriginal?: {
    rowNumber?: number;
    rawAmount?: string;
    rawDate?: string;
    rawCategory?: string;
    rawPayment?: string;
    rawNotes?: string;
  };
}

export interface Reimbursement {
  id: string;
  date: string;
  amount: number;
  reference: string;
  notes: string;
  tripId?: string | null;
  createdAt?: string;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  locations: string[];
  description?: string;
  isArchived?: boolean;
  createdAt?: string;
}

export interface DashboardMetrics {
  totalExpense: number;
  totalReimbursement: number;
  pendingReimbursement: number;
  totalTransactions: number;
  incompleteTransactions: number;
  tripDurationDays: number;
  dailyAverage: number;
  activeSpendingDays: number;
}

export * from './auth';

