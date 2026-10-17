import { PaymentProof, DriveFolderFile, GoogleDriveConfig } from '../types/index';

// High-fidelity SVG receipt previews for immediate interactive visualization
const createReceiptSvg = (title: string, amount: number, date: string, ref: string, category: string, extraNote?: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="780" viewBox="0 0 600 780" style="background:#ffffff;font-family:system-ui,-apple-system,sans-serif">
    <rect width="600" height="780" fill="#f8fafc"/>
    <rect x="30" y="30" width="540" height="720" rx="20" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
    
    <!-- Header Banner -->
    <rect x="30" y="30" width="540" height="110" rx="20" fill="#0f172a"/>
    <circle cx="75" cy="85" r="24" fill="#3b82f6"/>
    <path d="M67 85l6 6 12-12" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="115" y="75" font-size="18" font-weight="bold" fill="#ffffff">OFFICIAL PAYMENT PROOF</text>
    <text x="115" y="100" font-size="12" fill="#94a3b8">Atul Enterprise Expense Audit • Verified Document</text>
    <rect x="440" y="68" width="105" height="32" rx="8" fill="#1e293b" stroke="#334155"/>
    <text x="492" y="89" font-size="11" font-weight="bold" fill="#38bdf8" text-anchor="middle">GOOGLE DRIVE</text>
    
    <!-- Amount Display -->
    <rect x="60" y="165" width="480" height="110" rx="16" fill="#f1f5f9" stroke="#cbd5e1"/>
    <text x="90" y="200" font-size="12" font-weight="600" fill="#64748b" text-transform="uppercase">TRANSACTION AMOUNT</text>
    <text x="90" y="250" font-size="38" font-weight="900" fill="#0f172a">₹${amount.toLocaleString('en-IN')}.00</text>
    <rect x="420" y="195" width="95" height="30" rx="15" fill="#dcfce7"/>
    <text x="467" y="215" font-size="12" font-weight="bold" fill="#15803d" text-anchor="middle">PAID</text>

    <!-- Details Grid -->
    <g transform="translate(60, 310)">
      <text x="0" y="0" font-size="11" font-weight="600" fill="#64748b">PROOF TITLE</text>
      <text x="0" y="24" font-size="14" font-weight="bold" fill="#1e293b">${title}</text>
      <line x1="0" y1="38" x2="480" y2="38" stroke="#e2e8f0"/>

      <text x="0" y="65" font-size="11" font-weight="600" fill="#64748b">TRANSACTION REFERENCE / UTR / PNR</text>
      <text x="0" y="89" font-size="14" font-family="monospace" font-weight="bold" fill="#2563eb">${ref}</text>
      <line x1="0" y1="103" x2="480" y2="103" stroke="#e2e8f0"/>

      <text x="0" y="130" font-size="11" font-weight="600" fill="#64748b">PAYMENT DATE</text>
      <text x="0" y="154" font-size="14" font-weight="bold" fill="#1e293b">${date}</text>
      <line x1="0" y1="168" x2="480" y2="168" stroke="#e2e8f0"/>

      <text x="0" y="195" font-size="11" font-weight="600" fill="#64748b">CATEGORY / SCOPE</text>
      <text x="0" y="219" font-size="14" font-weight="bold" fill="#1e293b">${category}</text>
      <line x1="0" y1="233" x2="480" y2="233" stroke="#e2e8f0"/>

      ${extraNote ? `
      <text x="0" y="260" font-size="11" font-weight="600" fill="#64748b">AUDIT NOTES</text>
      <text x="0" y="284" font-size="13" fill="#475569">${extraNote}</text>
      ` : ''}
    </g>

    <!-- Security Watermark -->
    <g transform="translate(60, 680)">
      <rect width="480" height="45" rx="10" fill="#f8fafc" stroke="#e2e8f0"/>
      <circle cx="25" cy="22" r="8" fill="#10b981"/>
      <text x="45" y="26" font-size="11" font-weight="bold" fill="#0f172a">Digitally Synchronized via Google Drive Payment Proofs</text>
      <text x="440" y="26" font-size="11" font-weight="mono" fill="#64748b" text-anchor="end">SHA-256 Verified</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const initialGoogleDriveConfig: GoogleDriveConfig = {
  clientId: '782910482910-atulekxpensemanager.apps.googleusercontent.com',
  folderId: 'folder-gdrive-payment-proofs-2026',
  folderName: 'Expense Manager Payment Proofs',
  isConnected: true,
  connectedAccountEmail: 'Atul.wendor@gmail.com',
  lastSyncedAt: '2026-10-17T12:00:00Z',
};

// Available files inside the Google Drive folder "Expense Manager Payment Proofs"
export const initialDriveFolderFiles: DriveFolderFile[] = [
  {
    id: 'gdrive-file-01',
    name: 'IRCTC_Train_Ticket_Mumbai_to_Pune_Aug25.pdf',
    mimeType: 'application/pdf',
    size: 245760,
    webViewLink: 'https://drive.google.com/file/d/1A_Mumbai_Pune_Train_Ticket_Aug25/view',
    thumbnailLink: createReceiptSvg('Mumbai to Pune Train Booking (IRCTC)', 640, '2026-08-25', 'PNR-8429104821', 'Transit / Service Visit', 'Confirmed AC Chair Car reservation ticket'),
    modifiedTime: '2026-08-25T14:30:00Z',
    virtualFolder: 'Service Visit',
  },
  {
    id: 'gdrive-file-02',
    name: 'IRCTC_Pune_to_Mumbai_Train_Booking_Aug26.pdf',
    mimeType: 'application/pdf',
    size: 251900,
    webViewLink: 'https://drive.google.com/file/d/2B_Pune_Mumbai_Train_Aug26/view',
    thumbnailLink: createReceiptSvg('Pune to Mumbai Train Return Ticket', 640, '2026-08-26', 'PNR-9201948210', 'Transit / Service Visit', 'Return leg travel IRCTC ticket reservation'),
    modifiedTime: '2026-08-26T16:00:00Z',
    virtualFolder: 'Service Visit',
  },
  {
    id: 'gdrive-file-03',
    name: 'Dorm_Stay_Lodging_Invoice_Aug28.pdf',
    mimeType: 'application/pdf',
    size: 312000,
    webViewLink: 'https://drive.google.com/file/d/3C_Dorm_Stay_Invoice_Aug28/view',
    thumbnailLink: createReceiptSvg('Dorm Stay Lodging Bill', 582, '2026-08-28', 'INV-DORM-20260828', 'Lodging / Service Visit', '2 Nights stay at Mumbai accommodation'),
    modifiedTime: '2026-08-28T19:00:00Z',
    virtualFolder: 'Service Visit',
  },
  {
    id: 'gdrive-file-04',
    name: 'Dorm_Stay_Aug29_Receipt.jpg',
    mimeType: 'image/jpeg',
    size: 420800,
    webViewLink: 'https://drive.google.com/file/d/4D_Dorm_Stay_Receipt_Aug29/view',
    thumbnailLink: createReceiptSvg('Dorm Stay Extension Night', 540, '2026-08-29', 'INV-DORM-20260829', 'Lodging / Service Visit', 'Single dorm night lodging official receipt'),
    modifiedTime: '2026-08-29T20:30:00Z',
    virtualFolder: 'Service Visit',
  },
  {
    id: 'gdrive-file-05',
    name: 'UPI_Food_Allowance_Lunch_Aug20.png',
    mimeType: 'image/png',
    size: 180400,
    webViewLink: 'https://drive.google.com/file/d/5E_Food_Allowance_Aug20/view',
    thumbnailLink: createReceiptSvg('Food Allowance Day Meal', 400, '2026-08-20', 'UPI-20260820-9941', 'Food & Beverage / Service Visit', 'Daily client visit meal allowance digital payment'),
    modifiedTime: '2026-08-20T14:15:00Z',
    virtualFolder: 'Service Visit',
  },
  {
    id: 'gdrive-file-06',
    name: 'Dwarka_Sector10_Metro_Card_Recharge.png',
    mimeType: 'image/png',
    size: 145000,
    webViewLink: 'https://drive.google.com/file/d/6F_Dwarka_Metro_Oct12/view',
    thumbnailLink: createReceiptSvg('IFFCO Chowk to Dwarka Metro Recharge', 64, '2026-10-12', 'DMRC-METRO-6401', 'Transit / Local Operations', 'DMRC Smart Card payment for client office transit'),
    modifiedTime: '2026-10-12T11:00:00Z',
    virtualFolder: 'Local Operations',
  },
  {
    id: 'gdrive-file-07',
    name: 'Porter_Intercity_Dispatch_Receipt.pdf',
    mimeType: 'application/pdf',
    size: 198000,
    webViewLink: 'https://drive.google.com/file/d/7G_Porter_Dispatch_Oct12/view',
    thumbnailLink: createReceiptSvg('Porter Courier Dispatch Payment', 82, '2026-10-12', 'PORTER-DISP-8821', 'Porter / Local Operations', 'Courier / equipment dispatch to client site'),
    modifiedTime: '2026-10-12T15:30:00Z',
    virtualFolder: 'Local Operations',
  },
  {
    id: 'gdrive-file-08',
    name: 'Bank_Transfer_10000_Advance_Settlement.pdf',
    mimeType: 'application/pdf',
    size: 450000,
    webViewLink: 'https://drive.google.com/file/d/8H_Advance_Reimbursement_10000/view',
    thumbnailLink: createReceiptSvg('Company Advance Reimbursement Payment', 10000, '2026-09-03', 'NEFT-AXIS-20260903-8891', 'Reimbursement Settlement', 'Official company advance payment received in travel account'),
    modifiedTime: '2026-09-03T18:00:00Z',
    virtualFolder: 'Other Trips',
  },
];

export const initialPaymentProofs: PaymentProof[] = [
  {
    id: 'proof-001',
    workspaceId: 'ws-atul-2026',
    driveFileId: 'gdrive-file-01',
    driveLink: 'https://drive.google.com/file/d/1A_Mumbai_Pune_Train_Ticket_Aug25/view',
    fileName: 'IRCTC_Train_Ticket_Mumbai_to_Pune_Aug25.pdf',
    fileType: 'application/pdf',
    fileSize: 245760,
    previewUrl: initialDriveFolderFiles[0].thumbnailLink,
    thumbnailUrl: initialDriveFolderFiles[0].thumbnailLink,
    tripId: 'trip-mumbai-pune-2026',
    tripName: 'Service Visit',
    expenseId: 'exp-026',
    expenseDescription: 'Mumbai to Pune Transit',
    proofType: 'Train / Transit Ticket',
    paymentDate: '2026-08-25',
    amount: 640,
    transactionReference: 'PNR-8429104821',
    notes: 'IRCTC AC Chair car ticket attached for transit audit.',
    status: 'verified',
    importedBy: 'usr-owner-atul',
    importedByName: 'Atul',
    importedAt: '2026-08-25T16:00:00Z',
    reviewedBy: 'usr-mgr-auditor',
    reviewedByName: 'Auditor Manager',
    reviewedByRole: 'manager',
    reviewedAt: '2026-08-25T17:30:00Z',
    reviewNotes: 'Verified against IRCTC PNR portal and expense row #28. Exact match of ₹640 on 25 Aug 2026.',
    isFlaggedDuplicate: false,
    duplicateReason: null,
    ocrExtractedData: {
      extractedAmount: 640,
      extractedDate: '2026-08-25',
      extractedReference: 'PNR-8429104821',
      confidence: 0.98,
    },
    createdAt: '2026-08-25T16:00:00Z',
    updatedAt: '2026-08-25T17:30:00Z',
  },
  {
    id: 'proof-002',
    workspaceId: 'ws-atul-2026',
    driveFileId: 'gdrive-file-02',
    driveLink: 'https://drive.google.com/file/d/2B_Pune_Mumbai_Train_Aug26/view',
    fileName: 'IRCTC_Pune_to_Mumbai_Train_Booking_Aug26.pdf',
    fileType: 'application/pdf',
    fileSize: 251900,
    previewUrl: initialDriveFolderFiles[1].thumbnailLink,
    thumbnailUrl: initialDriveFolderFiles[1].thumbnailLink,
    tripId: 'trip-mumbai-pune-2026',
    tripName: 'Service Visit',
    expenseId: 'exp-034',
    expenseDescription: 'Pune to Mumbai Train Booking',
    proofType: 'Train / Transit Ticket',
    paymentDate: '2026-08-26',
    amount: 640,
    transactionReference: 'PNR-9201948210',
    notes: 'Return journey booking from Pune station back to Mumbai.',
    status: 'verified',
    importedBy: 'usr-owner-atul',
    importedByName: 'Atul',
    importedAt: '2026-08-26T17:00:00Z',
    reviewedBy: 'usr-mgr-auditor',
    reviewedByName: 'Auditor Manager',
    reviewedByRole: 'manager',
    reviewedAt: '2026-08-26T18:00:00Z',
    reviewNotes: 'Verified return train ticket. Amount and date match expense #34.',
    isFlaggedDuplicate: false,
    duplicateReason: null,
    ocrExtractedData: {
      extractedAmount: 640,
      extractedDate: '2026-08-26',
      extractedReference: 'PNR-9201948210',
      confidence: 0.97,
    },
    createdAt: '2026-08-26T17:00:00Z',
    updatedAt: '2026-08-26T18:00:00Z',
  },
  {
    id: 'proof-003',
    workspaceId: 'ws-atul-2026',
    driveFileId: 'gdrive-file-03',
    driveLink: 'https://drive.google.com/file/d/3C_Dorm_Stay_Invoice_Aug28/view',
    fileName: 'Dorm_Stay_Lodging_Invoice_Aug28.pdf',
    fileType: 'application/pdf',
    fileSize: 312000,
    previewUrl: initialDriveFolderFiles[2].thumbnailLink,
    thumbnailUrl: initialDriveFolderFiles[2].thumbnailLink,
    tripId: 'trip-mumbai-pune-2026',
    tripName: 'Service Visit',
    expenseId: 'exp-035',
    expenseDescription: 'Dorm Stay',
    proofType: 'Hotel / Dorm Invoice',
    paymentDate: '2026-08-28',
    amount: 582,
    transactionReference: 'INV-DORM-20260828',
    notes: 'Official accommodation bill with GST invoice number.',
    status: 'pending',
    importedBy: 'usr-owner-atul',
    importedByName: 'Atul',
    importedAt: '2026-08-28T20:00:00Z',
    reviewedBy: null,
    reviewedByName: null,
    reviewedByRole: null,
    reviewedAt: null,
    reviewNotes: null,
    isFlaggedDuplicate: false,
    duplicateReason: null,
    ocrExtractedData: {
      extractedAmount: 582,
      extractedDate: '2026-08-28',
      extractedReference: 'INV-DORM-20260828',
      confidence: 0.95,
    },
    createdAt: '2026-08-28T20:00:00Z',
    updatedAt: '2026-08-28T20:00:00Z',
  },
  {
    id: 'proof-004',
    workspaceId: 'ws-atul-2026',
    driveFileId: 'gdrive-file-05',
    driveLink: 'https://drive.google.com/file/d/5E_Food_Allowance_Aug20/view',
    fileName: 'UPI_Food_Allowance_Lunch_Aug20.png',
    fileType: 'image/png',
    fileSize: 180400,
    previewUrl: initialDriveFolderFiles[4].thumbnailLink,
    thumbnailUrl: initialDriveFolderFiles[4].thumbnailLink,
    tripId: 'trip-mumbai-pune-2026',
    tripName: 'Service Visit',
    expenseId: 'exp-002',
    expenseDescription: 'food allowance',
    proofType: 'UPI Receipt',
    paymentDate: '2026-08-20',
    amount: 400,
    transactionReference: 'UPI-20260820-9941',
    notes: 'Google Pay UPI receipt screenshot for lunch meal.',
    status: 'pending',
    importedBy: 'usr-owner-atul',
    importedByName: 'Atul',
    importedAt: '2026-08-20T15:00:00Z',
    reviewedBy: null,
    reviewedByName: null,
    reviewedByRole: null,
    reviewedAt: null,
    reviewNotes: null,
    isFlaggedDuplicate: false,
    duplicateReason: null,
    ocrExtractedData: {
      extractedAmount: 400,
      extractedDate: '2026-08-20',
      extractedReference: 'UPI-20260820-9941',
      confidence: 0.96,
    },
    createdAt: '2026-08-20T15:00:00Z',
    updatedAt: '2026-08-20T15:00:00Z',
  },
  {
    id: 'proof-005',
    workspaceId: 'ws-atul-2026',
    driveFileId: 'gdrive-file-08',
    driveLink: 'https://drive.google.com/file/d/8H_Advance_Reimbursement_10000/view',
    fileName: 'Bank_Transfer_10000_Advance_Settlement.pdf',
    fileType: 'application/pdf',
    fileSize: 450000,
    previewUrl: initialDriveFolderFiles[7].thumbnailLink,
    thumbnailUrl: initialDriveFolderFiles[7].thumbnailLink,
    tripId: 'trip-mumbai-pune-2026',
    tripName: 'Service Visit',
    expenseId: null,
    reimbursementId: 'reimb-001',
    expenseDescription: 'Advance Reimbursement ₹10,000 (Row 90)',
    proofType: 'Bank Transfer Statement',
    paymentDate: '2026-09-03',
    amount: 10000,
    transactionReference: 'NEFT-AXIS-20260903-8891',
    notes: 'Official bank transfer acknowledgement for ₹10,000 company advance payment.',
    status: 'verified',
    importedBy: 'usr-owner-atul',
    importedByName: 'Atul',
    importedAt: '2026-09-03T18:30:00Z',
    reviewedBy: 'usr-mgr-auditor',
    reviewedByName: 'Auditor Manager',
    reviewedByRole: 'manager',
    reviewedAt: '2026-09-03T19:00:00Z',
    reviewNotes: 'Reconciliation Equality confirmed: ₹10,000 advance matches bank ledger credit.',
    isFlaggedDuplicate: false,
    duplicateReason: null,
    ocrExtractedData: {
      extractedAmount: 10000,
      extractedDate: '2026-09-03',
      extractedReference: 'NEFT-AXIS-20260903-8891',
      confidence: 0.99,
    },
    createdAt: '2026-09-03T18:30:00Z',
    updatedAt: '2026-09-03T19:00:00Z',
  },
];
