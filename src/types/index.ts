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

export type PaymentProofType =
  | 'UPI Receipt'
  | 'Train / Transit Ticket'
  | 'Hotel / Dorm Invoice'
  | 'Bank Transfer Statement'
  | 'Cash Receipt'
  | 'Porter Dispatch Bill'
  | 'Other';

export type PaymentProofStatus =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'needs_clarification';

export interface PaymentProof {
  id: string;
  workspaceId: string;
  driveFileId?: string | null;
  driveLink?: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  previewUrl?: string | null;
  thumbnailUrl?: string | null;
  tripId: string | null;
  tripName?: string | null;
  expenseId?: string | null;
  expenseDescription?: string | null;
  reimbursementId?: string | null;
  proofType: PaymentProofType;
  paymentDate: string;
  amount: number;
  transactionReference?: string | null;
  notes?: string | null;
  status: PaymentProofStatus;
  importedBy: string;
  importedByName: string;
  importedAt: string;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedByRole?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  isFlaggedDuplicate?: boolean;
  duplicateReason?: string | null;
  ocrExtractedData?: {
    extractedAmount?: number | null;
    extractedDate?: string | null;
    extractedReference?: string | null;
    confidence?: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleDriveConfig {
  clientId: string;
  apiKey?: string;
  folderId: string;
  folderName: string;
  folderUrl?: string;
  accessToken?: string;
  isConnected: boolean;
  connectedAccountEmail?: string;
  lastSyncedAt?: string;
}

export interface DriveFolderFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  webViewLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
  virtualFolder?: string;
}

export * from './auth';

