import { PaymentProof, DriveFolderFile, GoogleDriveConfig } from '../types/index';

// High-fidelity SVG receipt generator for interactive previews
export const createReceiptSvg = (title: string, amount: number, date: string, ref: string, category: string, extraNote?: string) => {
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
  folderId: '',
  folderName: 'Expense Manager Payment Proofs',
  isConnected: false,
  connectedAccountEmail: undefined,
  lastSyncedAt: new Date().toISOString(),
};

// Available files inside the Google Drive folder "Expense Manager Payment Proofs"
// Virtual categories supported: 'Service Visit', 'Local Operations', 'Other Trips'
export const initialDriveFolderFiles: DriveFolderFile[] = [];

// Clean initial payment proofs array (demo records removed)
export const initialPaymentProofs: PaymentProof[] = [];
