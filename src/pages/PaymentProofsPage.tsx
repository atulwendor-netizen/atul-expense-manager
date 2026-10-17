import React, { useState, useMemo, useEffect } from 'react';
import {
  PaymentProof,
  PaymentProofStatus,
  GoogleDriveConfig,
  DriveFolderFile,
  Expense,
  Reimbursement,
  Trip,
  UserProfile,
} from '../types/index';
import { formatCurrency, formatDate } from '../utils/calculations';
import { SummaryCard } from '../components/SummaryCard';
import { DriveImportModal } from '../components/DriveImportModal';
import { ProofComparisonModal } from '../components/ProofComparisonModal';
import { DriveConfigModal } from '../components/DriveConfigModal';
import {
  FileCheck,
  HardDrive,
  Upload,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  AlertTriangle,
  Eye,
  ExternalLink,
  Filter,
  AlertCircle,
  Plus,
  Link as LinkIcon,
  FolderDown,
  FileText,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Lock,
  Folder,
  Trash2,
} from 'lucide-react';
import { DriveFileViewerModal } from '../components/DriveFileViewerModal';
import {
  parseGoogleDriveLink,
  formatFileSize,
  isImageFile,
  isPdfFile,
  fetchGoogleDriveFolderFiles,
  getDriveWebLink,
  checkGoogleAuthStatus,
  getGoogleAuthUrl,
  GoogleAuthStatus,
} from '../utils/googleDrive';
import { backend } from '../services/backendService';

interface PaymentProofsPageProps {
  paymentProofs: PaymentProof[];
  googleDriveConfig: GoogleDriveConfig;
  driveFolderFiles: DriveFolderFile[];
  expenses: Expense[];
  reimbursements: Reimbursement[];
  trips: Trip[];
  currentUser: UserProfile;
  onAddProof: (proof: Omit<PaymentProof, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onImportBatch: (proofs: Array<Omit<PaymentProof, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  onReviewProof: (proofId: string, status: PaymentProofStatus, notes?: string) => void;
  onDeleteProof: (proofId: string) => void;
  onClearAllProofs?: () => void;
  onDeleteDriveFile?: (fileId: string) => void;
  onClearDriveFiles?: () => void;
  onUpdateDriveConfig: (partial: Partial<GoogleDriveConfig>) => void;
  onRefreshDriveFolder: () => void;
  onDiscussExpense?: (expense: Expense) => void;
  onNotify: (type: 'success' | 'warning' | 'info' | 'error', text: string) => void;
  isManager?: boolean;
}

export const PaymentProofsPage: React.FC<PaymentProofsPageProps> = ({
  paymentProofs,
  googleDriveConfig,
  driveFolderFiles,
  expenses,
  reimbursements,
  trips,
  currentUser,
  onAddProof: _onAddProof,
  onImportBatch,
  onReviewProof,
  onDeleteProof,
  onClearAllProofs,
  onDeleteDriveFile,
  onClearDriveFiles,
  onUpdateDriveConfig,
  onRefreshDriveFolder,
  onDiscussExpense,
  onNotify,
  isManager = false,
}) => {
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTripId, setSelectedTripId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'missing'>('cards');

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedProofForAudit, setSelectedProofForAudit] = useState<PaymentProof | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simple Google Drive Link Import state
  const [folderLinkInput, setFolderLinkInput] = useState<string>(() => {
    return (
      googleDriveConfig.folderUrl ||
      (googleDriveConfig.folderId
        ? `https://drive.google.com/drive/folders/${googleDriveConfig.folderId}`
        : 'https://drive.google.com/drive/folders/folder-gdrive-payment-proofs-2026')
    );
  });
  const [importedFiles, setImportedFiles] = useState<DriveFolderFile[]>(() => {
    return driveFolderFiles.filter((f) => !f.id.startsWith('gdrive-file-0'));
  });
  const [isImportingLink, setIsImportingLink] = useState(false);
  const [linkImportError, setLinkImportError] = useState<string | null>(null);
  const [activeViewerFile, setActiveViewerFile] = useState<DriveFolderFile | null>(null);
  const [fileFilter, setFileFilter] = useState<'all' | 'images' | 'pdfs'>('all');
  const [isFolderExpanded, setIsFolderExpanded] = useState<boolean>(true);
  const [serverAuthStatus, setServerAuthStatus] = useState<GoogleAuthStatus | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [folderViewMode, setFolderViewMode] = useState<'gallery' | 'embed'>('gallery');
  const [embeddedFolderId, setEmbeddedFolderId] = useState<string>(() => {
    return googleDriveConfig.folderId || 'folder-gdrive-payment-proofs-2026';
  });
  const [quickFileInput, setQuickFileInput] = useState<string>('');

  // Keep importedFiles synchronized with incoming driveFolderFiles (filtering demo files)
  useEffect(() => {
    setImportedFiles(driveFolderFiles.filter((f) => !f.id.startsWith('gdrive-file-0')));
  }, [driveFolderFiles]);

  // Purge legacy demo files & proofs from localStorage on mount
  useEffect(() => {
    try {
      const gdriveRaw = localStorage.getItem('atul_gdrive_files');
      if (gdriveRaw) {
        const parsed = JSON.parse(gdriveRaw);
        if (Array.isArray(parsed) && parsed.some((f: any) => f.id && f.id.startsWith('gdrive-file-0'))) {
          const cleaned = parsed.filter((f: any) => !f.id || !f.id.startsWith('gdrive-file-0'));
          localStorage.setItem('atul_gdrive_files', JSON.stringify(cleaned));
        }
      }
      const proofsRaw = localStorage.getItem('atul_payment_proofs');
      if (proofsRaw) {
        const parsed = JSON.parse(proofsRaw);
        if (Array.isArray(parsed) && parsed.some((p: any) => p.id && p.id.startsWith('proof-00'))) {
          const cleaned = parsed.filter((p: any) => !p.id || !p.id.startsWith('proof-00'));
          localStorage.setItem('atul_payment_proofs', JSON.stringify(cleaned));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Monitor Google OAuth Status & OAuth callback redirect parameters
  useEffect(() => {
    // 1. Fetch server-side OAuth status
    checkGoogleAuthStatus().then((status) => {
      setServerAuthStatus(status);
      if (status.isConnected && status.connectedEmail) {
        onUpdateDriveConfig({
          isConnected: true,
          connectedAccountEmail: status.connectedEmail,
        });
      }
    });

    // 2. Check for redirect query parameters from Google OAuth callback
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const gdriveAuth = urlParams.get('gdrive_auth');
      if (gdriveAuth === 'success') {
        const account = urlParams.get('account') || 'Google Account';
        onNotify('success', `Google Drive authorized successfully as ${account}!`);
        onUpdateDriveConfig({
          isConnected: true,
          connectedAccountEmail: account,
          lastSyncedAt: new Date().toISOString(),
        });
        setLinkImportError(null);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (gdriveAuth === 'error') {
        const errorMsg = urlParams.get('message') || 'Google Drive authorization was not completed.';
        setLinkImportError(errorMsg);
        onNotify('error', `Google Drive authorization error: ${errorMsg}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Initiate real Google OAuth 2.0 flow
  const handleAuthorizeDrive = async () => {
    if (isManager) {
      onNotify('warning', 'Google Drive authorization is restricted in Audit mode.');
      return;
    }

    setIsAuthorizing(true);
    try {
      const authInfo = await getGoogleAuthUrl(window.location.pathname);
      if (authInfo.isConfigured && authInfo.url) {
        onNotify('info', 'Redirecting to Google for OAuth authorization...');
        window.location.href = authInfo.url;
      } else {
        setIsConfigModalOpen(true);
        const missingList = authInfo.missing?.join(', ') || 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET';
        const msg = `Google Cloud OAuth credentials not configured on server: ${missingList}. Please configure your .env file or server environment.`;
        setLinkImportError(msg);
        onNotify('warning', msg);
      }
    } catch (err: any) {
      onNotify('error', err?.message || 'Failed to initiate Google authorization.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  // Filtered folder files for gallery
  const filteredDriveFiles = useMemo(() => {
    return importedFiles.filter((f) => {
      if (fileFilter === 'images') return isImageFile(f.mimeType, f.name);
      if (fileFilter === 'pdfs') return isPdfFile(f.mimeType, f.name);
      return true;
    });
  }, [importedFiles, fileFilter]);

  // Import / View Folder link handler
  const handleImportLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = folderLinkInput.trim();
    if (!trimmed) {
      const msg = 'Please paste a Google Drive folder or file link.';
      setLinkImportError(msg);
      onNotify('error', msg);
      return;
    }

    const parsed = parseGoogleDriveLink(trimmed);
    if (!parsed) {
      const msg = 'Invalid Google Drive link format. Expected https://drive.google.com/drive/folders/... or https://drive.google.com/file/d/...';
      setLinkImportError(msg);
      onNotify('error', msg);
      return;
    }

    setIsImportingLink(true);
    setLinkImportError(null);

    try {
      if (parsed.type === 'file') {
        let match = importedFiles.find((f) => f.id === parsed.id);
        if (!match) {
          match = {
            id: parsed.id,
            name: `Google_Drive_Payment_Proof_${parsed.id.substring(0, 8)}.png`,
            mimeType: 'image/png',
            size: 1024 * 350,
            webViewLink: getDriveWebLink(parsed.id),
            modifiedTime: new Date().toISOString(),
            virtualFolder: 'Direct Link',
          };
          setImportedFiles((prev) => [match!, ...prev.filter((p) => p.id !== match!.id)]);
          backend.addDriveFolderFile(match);
        }
        setActiveViewerFile(match);
        setIsImportingLink(false);
        onNotify('success', `Opened file from Google Drive link (${parsed.id}).`);
        return;
      }

      // Folder link
      setEmbeddedFolderId(parsed.id);
      onUpdateDriveConfig({
        folderId: parsed.id,
        folderUrl: trimmed,
        folderName: googleDriveConfig.folderName || 'Expense Manager Payment Proofs',
        lastSyncedAt: new Date().toISOString(),
      });

      try {
        const res = await fetchGoogleDriveFolderFiles(parsed.id, googleDriveConfig);
        if (res.success && res.files.length > 0) {
          setImportedFiles(res.files);
          setLinkImportError(null);
          setFolderViewMode('gallery');
          onNotify('success', `Successfully imported ${res.files.length} payment proof files from Google Drive.`);
        } else if (res.success && res.files.length === 0) {
          setImportedFiles([]);
          setLinkImportError(null);
          setFolderViewMode('embed');
          onNotify('info', 'Folder link connected. Displaying live folder explorer.');
        } else {
          // If API access requires OAuth or permissions, smoothly activate the Live Drive Folder Explorer
          setFolderViewMode('embed');
          setLinkImportError(null);
          onNotify('success', `Google Drive folder loaded! Displaying live folder explorer below.`);
        }
      } catch {
        setFolderViewMode('embed');
        setLinkImportError(null);
        onNotify('success', `Google Drive folder loaded in Live Explorer view.`);
      }
    } catch (err: any) {
      const msg = err?.message || 'Error communicating with Google Drive.';
      setLinkImportError(msg);
      onNotify('error', msg);
    } finally {
      setIsImportingLink(false);
    }
  };

  // Quick direct receipt file import
  const handleQuickFileImport = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickFileInput.trim();
    if (!trimmed) return;
    const parsed = parseGoogleDriveLink(trimmed);
    if (!parsed) {
      onNotify('error', 'Please paste a valid Google Drive file link.');
      return;
    }
    const fileId = parsed.id;
    let match = importedFiles.find((f) => f.id === fileId);
    if (!match) {
      const isPdf = trimmed.toLowerCase().includes('pdf');
      match = {
        id: fileId,
        name: `Receipt_${fileId.substring(0, 8)}${isPdf ? '.pdf' : '.png'}`,
        mimeType: isPdf ? 'application/pdf' : 'image/png',
        size: 1024 * 450,
        webViewLink: getDriveWebLink(fileId),
        modifiedTime: new Date().toISOString(),
        virtualFolder: 'Direct Proof Import',
      };
      setImportedFiles((prev) => [match!, ...prev.filter((p) => p.id !== match!.id)]);
      backend.addDriveFolderFile(match);
    }
    setQuickFileInput('');
    setActiveViewerFile(match);
    setFolderViewMode('gallery');
    onNotify('success', `Added payment proof from Drive link (${match.name}).`);
  };

  // Refresh Folder to discover newly added files without duplicates
  const handleRefreshFolder = async () => {
    setIsRefreshing(true);
    setLinkImportError(null);

    try {
      const parsed = parseGoogleDriveLink(folderLinkInput);
      const targetId = parsed?.id || googleDriveConfig.folderId || 'folder-gdrive-payment-proofs-2026';

      const res = await fetchGoogleDriveFolderFiles(targetId, googleDriveConfig);
      if (res.success) {
        const existingIds = new Set(importedFiles.map((f) => f.id));
        const newCount = res.files.filter((f) => !existingIds.has(f.id)).length;

        setImportedFiles(res.files);
        onRefreshDriveFolder();
        onNotify(
          'success',
          `Folder refreshed! Found ${res.files.length} files (${newCount > 0 ? `${newCount} newly added` : 'up to date'}).`
        );
      } else {
        setLinkImportError(res.errorMessage || 'Error refreshing Google Drive folder.');
        onNotify('error', res.errorMessage || 'Could not refresh folder.');
      }
    } catch (err: any) {
      onNotify('error', err?.message || 'Error refreshing Google Drive folder.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Simulate new upload for testing real folder refresh
  const handleSimulateNewUpload = () => {
    const newId = `gdrive-upload-${Date.now().toString(36)}`;
    const isPdf = Math.random() > 0.5;
    const newFile: DriveFolderFile = {
      id: newId,
      name: isPdf
        ? `Service_Visit_Hotel_GST_Invoice_${Date.now().toString().slice(-4)}.pdf`
        : `UPI_Payment_Proof_Lunch_${Date.now().toString().slice(-4)}.png`,
      mimeType: isPdf ? 'application/pdf' : 'image/png',
      size: isPdf ? 284000 : 195000,
      webViewLink: `https://drive.google.com/file/d/${newId}/view`,
      thumbnailLink: undefined,
      modifiedTime: new Date().toISOString(),
      virtualFolder: 'Service Visit',
    };

    backend.addDriveFolderFile(newFile);
    setImportedFiles((prev) => [newFile, ...prev]);
    onNotify('success', `Simulated new file in Drive folder: "${newFile.name}". Click "Refresh" to verify.`);
  };

  // Delete single file from Proofs Gallery
  const handleDeleteDriveFile = (fileId: string, fileName?: string) => {
    if (isManager) {
      onNotify('warning', 'Deleting gallery files is restricted in Audit mode.');
      return;
    }
    if (confirm(`Are you sure you want to remove ${fileName ? `"${fileName}"` : 'this file'} from the gallery?`)) {
      setImportedFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (onDeleteDriveFile) {
        onDeleteDriveFile(fileId);
      } else {
        backend.deleteDriveFolderFile(fileId);
      }
      onNotify('info', `Removed file from Proofs Gallery.`);
    }
  };

  // Clear all files from Proofs Gallery
  const handleClearDriveGallery = () => {
    if (isManager) {
      onNotify('warning', 'Clearing gallery files is restricted in Audit mode.');
      return;
    }
    if (confirm(`Are you sure you want to delete all files from the Proofs Gallery?`)) {
      setImportedFiles([]);
      if (onClearDriveFiles) {
        onClearDriveFiles();
      } else {
        backend.clearDriveFolderFiles();
      }
      onNotify('success', 'Cleared all files from Proofs Gallery.');
    }
  };

  // Clear all payment proofs
  const handleClearAllProofs = () => {
    if (isManager) {
      onNotify('warning', 'Deleting payment proofs is restricted in Audit mode.');
      return;
    }
    if (confirm(`Are you sure you want to delete all ${paymentProofs.length} payment proof records?`)) {
      if (onClearAllProofs) {
        onClearAllProofs();
      } else {
        backend.clearAllPaymentProofs();
      }
      onNotify('success', 'All payment proofs have been deleted.');
    }
  };

  // Delete individual payment proof
  const handleDeletePaymentProof = (proofId: string, fileName: string) => {
    if (isManager) {
      onNotify('warning', 'Deleting payment proofs is restricted in Audit mode.');
      return;
    }
    if (confirm(`Are you sure you want to delete payment proof "${fileName}"?`)) {
      onDeleteProof(proofId);
      onNotify('info', `Payment proof "${fileName}" deleted.`);
    }
  };

  // Filtered Proofs
  const filteredProofs = useMemo(() => {
    return paymentProofs.filter((p) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.fileName.toLowerCase().includes(q);
        const matchRef = p.transactionReference?.toLowerCase().includes(q);
        const matchNotes = p.notes?.toLowerCase().includes(q);
        const matchExp = p.expenseDescription?.toLowerCase().includes(q);
        const matchAmt = String(p.amount).includes(q);
        if (!matchName && !matchRef && !matchNotes && !matchExp && !matchAmt) {
          return false;
        }
      }

      // 2. Status
      if (selectedStatus !== 'all' && p.status !== selectedStatus) {
        return false;
      }

      // 3. Trip
      if (selectedTripId !== 'all' && p.tripId !== selectedTripId) {
        return false;
      }

      // 4. Proof Type
      if (selectedType !== 'all' && p.proofType !== selectedType) {
        return false;
      }

      return true;
    });
  }, [paymentProofs, searchQuery, selectedStatus, selectedTripId, selectedType]);

  // Expenses with missing proof
  const missingProofExpenses = useMemo(() => {
    const proofExpenseIds = new Set(paymentProofs.map((p) => p.expenseId).filter(Boolean));
    return expenses.filter((e) => {
      if (e.status !== 'valid' || e.amount === null) return false;
      if (selectedTripId !== 'all' && e.tripId !== selectedTripId) return false;
      return !proofExpenseIds.has(e.id) && !e.receipt;
    });
  }, [expenses, paymentProofs, selectedTripId]);

  // Metrics
  const metrics = useMemo(() => {
    const totalCount = paymentProofs.length;
    const totalAmount = paymentProofs.reduce((acc, p) => acc + (p.amount || 0), 0);
    const verified = paymentProofs.filter((p) => p.status === 'verified');
    const verifiedAmount = verified.reduce((acc, p) => acc + (p.amount || 0), 0);
    const pending = paymentProofs.filter((p) => p.status === 'pending');
    const flagged = paymentProofs.filter(
      (p) => p.isFlaggedDuplicate || p.status === 'needs_clarification' || p.status === 'rejected'
    );

    return {
      totalCount,
      totalAmount,
      verifiedCount: verified.length,
      verifiedAmount,
      verifiedPercent: totalCount > 0 ? Math.round((verified.length / totalCount) * 100) : 0,
      pendingCount: pending.length,
      flaggedCount: flagged.length,
      missingCount: missingProofExpenses.length,
    };
  }, [paymentProofs, missingProofExpenses]);

  const getStatusBadge = (status: PaymentProofStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-semibold">
            <CheckCircle2 className="h-3 w-3" /> Verified
          </span>
        );
      case 'needs_clarification':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[10px] font-semibold">
            <HelpCircle className="h-3 w-3" /> Clarification
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 px-2 py-0.5 text-[10px] font-semibold">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 px-2 py-0.5 text-[10px] font-semibold">
            <Clock className="h-3 w-3" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-dashboard-fade">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Payment Proofs & Drive Audit
            </h1>
            <span className="rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 text-xs font-bold">
              {paymentProofs.length} records
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>Dedicated Google Drive folder: <span className="font-semibold text-slate-700 dark:text-slate-300">"{googleDriveConfig.folderName}"</span></span>
            {serverAuthStatus?.isConnected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-semibold">
                <CheckCircle2 className="h-3 w-3" /> {serverAuthStatus.connectedEmail || 'OAuth Connected'}
              </span>
            )}
            <span>• Finance & Manager side-by-side verification</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <HardDrive className="h-4 w-4 text-blue-600" />
            <span>Drive Settings</span>
          </button>

          <button
            type="button"
            onClick={handleRefreshFolder}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Drive'}</span>
          </button>

          {!isManager && (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Import Proofs</span>
            </button>
          )}
        </div>
      </div>

      {/* Google Drive Folder Link Import & Files Viewer */}
      <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 p-5 shadow-sm dark:border-blue-900/60 dark:from-slate-900 dark:via-blue-950/20 dark:to-indigo-950/20 space-y-4">
        {/* Top Header of the Import Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <FolderDown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Google Drive Folder Link Import</span>
                <span className="rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold">
                  {importedFiles.length} files available
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paste your Google Drive folder link to import and view payment screenshots, bills, and PDFs inside Atul Expense Manager.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 shadow-xs transition-colors"
            >
              <HardDrive className="h-3.5 w-3.5 text-blue-600" />
              <span>Drive Settings & OAuth</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFolderExpanded(!isFolderExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title={isFolderExpanded ? 'Collapse folder files' : 'Expand folder files'}
            >
              {isFolderExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleImportLink} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              disabled={isManager || isImportingLink}
              value={folderLinkInput}
              onChange={(e) => {
                setFolderLinkInput(e.target.value);
                if (linkImportError) setLinkImportError(null);
              }}
              placeholder={
                isManager
                  ? 'Audit Mode: Google Drive folder link (Read-only view)'
                  : 'Paste Google Drive folder link (e.g. https://drive.google.com/drive/folders/...) or file link'
              }
              className="w-full rounded-xl border border-slate-300/80 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex items-center gap-2">
            {!isManager ? (
              <button
                type="submit"
                disabled={isImportingLink}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <FolderDown className={`h-4 w-4 ${isImportingLink ? 'animate-bounce' : ''}`} />
                <span>{isImportingLink ? 'Importing...' : 'Import / View'}</span>
              </button>
            ) : (
              <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                <Lock className="h-3.5 w-3.5 text-amber-500" />
                <span>Audit Mode</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleRefreshFolder}
              disabled={isRefreshing}
              title="Refresh folder to retrieve newly uploaded files"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Folder'}</span>
            </button>
          </div>
        </form>

        {/* Error / Permission Banner if authentication or permission failed */}
        {linkImportError && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 dark:border-amber-900/80 dark:bg-amber-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{linkImportError}</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  Private Google Drive folders require authorized Google credentials. Please connect your Google account with read-only access.
                </p>
              </div>
            </div>
            {!isManager ? (
              <button
                type="button"
                disabled={isAuthorizing}
                onClick={handleAuthorizeDrive}
                className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50 shadow-xs transition-colors"
              >
                <HardDrive className="h-3.5 w-3.5" />
                <span>{isAuthorizing ? 'Connecting...' : 'Authorize Drive'}</span>
              </button>
            ) : (
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                Auditor View: Authorization is managed by Account Owner.
              </span>
            )}
          </div>
        )}

        {/* Folder Files Viewer Grid (Expandable) */}
        {isFolderExpanded && (
          <div className="space-y-3 pt-2 border-t border-slate-200/70 dark:border-slate-800">
            {/* View Mode Switcher and Quick Direct File Import */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  View Mode:
                </span>
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/80 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setFolderViewMode('gallery')}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                      folderViewMode === 'gallery'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Proofs Gallery ({importedFiles.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFolderViewMode('embed')}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                      folderViewMode === 'embed'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Live Drive Explorer
                  </button>
                </div>
              </div>

              {!isManager && (
                <form onSubmit={handleQuickFileImport} className="flex items-center gap-1.5 w-full sm:w-auto">
                  <input
                    type="text"
                    value={quickFileInput}
                    onChange={(e) => setQuickFileInput(e.target.value)}
                    placeholder="Paste direct receipt/file link..."
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 w-full sm:w-64"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 text-xs font-bold transition-colors shadow-xs"
                  >
                    + Add Receipt
                  </button>
                </form>
              )}
            </div>

            {folderViewMode === 'embed' ? (
              /* Live Google Drive Embedded Folder View */
              <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 overflow-hidden shadow-sm animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2.5 bg-blue-50/80 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900 gap-2">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Live Google Drive Explorer ({embeddedFolderId})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://drive.google.com/drive/folders/${embeddedFolderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Open in Google Drive</span>
                    </a>
                  </div>
                </div>
                <div className="p-1 bg-slate-50 dark:bg-slate-950">
                  <iframe
                    src={`https://drive.google.com/embeddedfolderview?id=${embeddedFolderId}#grid`}
                    className="w-full h-[520px] rounded-lg border-0 bg-white dark:bg-slate-900"
                    title="Google Drive Folder Contents"
                  />
                </div>
                <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <p className="text-[11px]">
                    💡 <span className="font-semibold text-slate-700 dark:text-slate-300">Quick Tip:</span> Double-click any file inside the frame to preview it, or paste an individual receipt link above to link directly to an expense.
                  </p>
                </div>
              </div>
            ) : (
              <>
            {/* Filter Pills and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Filter Files:
                </span>
                <button
                  type="button"
                  onClick={() => setFileFilter('all')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    fileFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  All ({importedFiles.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFileFilter('images')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    fileFilter === 'images'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Screenshots & Images ({importedFiles.filter((f) => isImageFile(f.mimeType, f.name)).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFileFilter('pdfs')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    fileFilter === 'pdfs'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  PDF Documents ({importedFiles.filter((f) => isPdfFile(f.mimeType, f.name)).length})
                </button>
              </div>

              {/* Upload simulation button and Clear Gallery */}
              {!isManager && (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSimulateNewUpload}
                    title="Simulate adding a new file to Drive to test the Refresh feature"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Simulate New Upload</span>
                  </button>

                  {importedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearDriveGallery}
                      title="Delete all files from the Proofs Gallery"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Clear Gallery</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Files Grid */}
            {filteredDriveFiles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                <FileText className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {importedFiles.length === 0
                    ? 'Proofs Gallery is empty. Paste a Google Drive folder link or receipt link above to import payment proofs.'
                    : 'No files found matching the selected filter.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {filteredDriveFiles.map((file) => {
                  const isPdf = isPdfFile(file.mimeType, file.name);
                  const webLink = file.webViewLink || getDriveWebLink(file.id);

                  return (
                    <div
                      key={file.id}
                      className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-blue-600 transition-all"
                    >
                      <div>
                        {/* File Thumbnail Preview */}
                        <div
                          onClick={() => setActiveViewerFile(file)}
                          className="relative h-28 w-full rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200/60 dark:border-slate-800/60 mb-2.5 group-hover:opacity-95"
                        >
                          {file.thumbnailLink ? (
                            <img
                              src={file.thumbnailLink}
                              alt={file.name}
                              className="h-full w-full object-cover"
                            />
                          ) : isPdf ? (
                            <div className="flex flex-col items-center justify-center text-rose-500">
                              <FileText className="h-10 w-10" />
                              <span className="text-[10px] font-bold mt-1 uppercase">PDF Document</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-blue-500">
                              <ImageIcon className="h-10 w-10" />
                              <span className="text-[10px] font-bold mt-1 uppercase">Image File</span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow-sm">
                              <Eye className="h-3.5 w-3.5 text-blue-600" /> View
                            </span>
                          </div>
                        </div>

                        {/* File Details */}
                        <h4
                          title={file.name}
                          className="text-xs font-bold text-slate-900 dark:text-white truncate"
                        >
                          {file.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
                          <span>{formatFileSize(file.size)}</span>
                          <span className="font-medium text-slate-400">{file.virtualFolder || 'Drive'}</span>
                        </p>
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center justify-between gap-1 pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => setActiveViewerFile(file)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          <Eye className="h-3 w-3" />
                          <span>{isPdf ? 'View PDF' : 'Preview'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={webLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open original file in Google Drive"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Drive</span>
                          </a>

                          {!isManager && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDriveFile(file.id, file.name);
                              }}
                              title="Delete file from gallery"
                              className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
              </>
            )}
          </div>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <SummaryCard
          title="Payment Proofs"
          value={metrics.totalCount}
          subtitle={`Covering ${formatCurrency(metrics.totalAmount)}`}
          icon={FileCheck}
          accentColor="brand"
        />
        <SummaryCard
          title="Verified & Approved"
          value={metrics.verifiedCount}
          subtitle={`${metrics.verifiedPercent}% audit completed`}
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <SummaryCard
          title="Pending Audit"
          value={metrics.pendingCount}
          subtitle="Awaiting manager review"
          icon={Clock}
          accentColor="amber"
        />
        <SummaryCard
          title="Discrepancies / Flagged"
          value={metrics.flaggedCount}
          subtitle="Duplicates or mismatches"
          icon={AlertTriangle}
          accentColor="rose"
        />
        <SummaryCard
          title="Missing Proofs"
          value={metrics.missingCount}
          subtitle="Valid expenses lacking proof"
          icon={AlertCircle}
          accentColor="indigo"
        />
      </div>

      {/* Filter and View Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by file name, UTR / ref, amount, notes..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 pl-9 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800/80 dark:text-white"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1.5 self-start lg:self-auto bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Proof Cards ({filteredProofs.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Audit Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('missing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'missing'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Missing Proofs Audit ({missingProofExpenses.length})
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pr-2">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          {/* Status filter tabs */}
          {[
            { id: 'all', label: 'All Status' },
            { id: 'pending', label: 'Pending' },
            { id: 'verified', label: 'Verified' },
            { id: 'needs_clarification', label: 'Clarification' },
            { id: 'rejected', label: 'Rejected' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                selectedStatus === st.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {st.label}
            </button>
          ))}

          {/* Trip Scope Selector */}
          <select
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">All Trips & Scopes</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Proof Type Selector */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">All Proof Types</option>
            <option value="UPI Receipt">UPI Receipt</option>
            <option value="Train / Transit Ticket">Train / Transit Ticket</option>
            <option value="Hotel / Dorm Invoice">Hotel / Dorm Invoice</option>
            <option value="Bank Transfer Statement">Bank Transfer Statement</option>
            <option value="Cash Receipt">Cash Receipt</option>
            <option value="Porter Dispatch Bill">Porter Dispatch Bill</option>
            <option value="Other">Other</option>
          </select>

          {paymentProofs.length > 0 && !isManager && (
            <button
              type="button"
              onClick={handleClearAllProofs}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 transition-colors"
              title="Delete all payment proofs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete All Proofs</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: Proof Cards Grid */}
      {viewMode === 'cards' && (
        <>
          {filteredProofs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
              <HardDrive className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No Payment Proofs Found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No proofs match your current filters. Import files from Google Drive folder "{googleDriveConfig.folderName}" or reset filters.
              </p>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Upload className="h-4 w-4" />
                <span>Import Proofs Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProofs.map((proof) => {
                const linkedExpense = proof.expenseId
                  ? expenses.find((e) => e.id === proof.expenseId)
                  : null;

                const amountMismatch =
                  linkedExpense &&
                  linkedExpense.amount !== null &&
                  Math.abs(Number(linkedExpense.amount) - Number(proof.amount)) > 0.01;

                return (
                  <div
                    key={proof.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                  >
                    <div>
                      {/* Card Preview Banner */}
                      <div className="relative h-44 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-3 border-b border-slate-100 dark:border-slate-800/80 overflow-hidden">
                        {proof.previewUrl ? (
                          <img
                            src={proof.previewUrl}
                            alt={proof.fileName}
                            className="max-h-full w-auto object-contain transition-transform group-hover:scale-105 duration-200"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <FileCheck className="h-12 w-12 text-blue-500/40 mx-auto mb-1" />
                            <span className="text-xs font-medium text-slate-500">
                              {proof.proofType}
                            </span>
                          </div>
                        )}

                        {/* Status badge in top-left */}
                        <div className="absolute top-3 left-3">{getStatusBadge(proof.status)}</div>

                        {/* Drive pill in top-right */}
                        {proof.driveLink && (
                          <a
                            href={proof.driveLink}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute top-3 right-3 rounded-lg bg-slate-900/70 backdrop-blur-xs p-1.5 text-white hover:bg-slate-900 shadow-sm"
                            title="Open file in Google Drive"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}

                        {/* Duplicate Alert Banner */}
                        {proof.isFlaggedDuplicate && (
                          <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-amber-500/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-white flex items-center gap-1.5 shadow-sm">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span className="truncate">Duplicate Reference Detected</span>
                          </div>
                        )}
                      </div>

                      {/* Card Information */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                              {proof.proofType}
                            </span>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-1">
                              {proof.fileName}
                            </h3>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                              Amount
                            </span>
                            <span className="text-base font-black text-slate-900 dark:text-white">
                              {formatCurrency(proof.amount)}
                            </span>
                          </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <span>Date: </span>
                            <strong className="text-slate-700 dark:text-slate-200">
                              {formatDate(proof.paymentDate)}
                            </strong>
                          </div>
                          <div className="truncate">
                            <span>Ref: </span>
                            <strong className="font-mono text-slate-700 dark:text-slate-200">
                              {proof.transactionReference || '—'}
                            </strong>
                          </div>
                          <div className="col-span-2 truncate">
                            <span>Scope: </span>
                            <strong className="text-blue-600 dark:text-blue-400">
                              {proof.tripName || 'Service Visit'}
                            </strong>
                          </div>
                        </div>

                        {/* Linked Expense Status */}
                        {linkedExpense ? (
                          <div className={`rounded-xl p-2.5 text-xs flex items-center justify-between border ${
                            amountMismatch
                              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                          }`}>
                            <div className="truncate pr-2">
                              <span className="text-[10px] text-slate-400 block font-mono">
                                Linked Expense (Row #{linkedExpense.rawOriginal?.rowNumber || '—'})
                              </span>
                              <span className="font-semibold truncate block">
                                {linkedExpense.description}
                              </span>
                            </div>
                            <span className="font-bold shrink-0">
                              {formatCurrency(linkedExpense.amount)}
                            </span>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-2 text-center text-xs text-slate-400">
                            Unlinked payment proof
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-4 pt-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedProofForAudit(proof)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-slate-700 shadow-sm transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Audit & Compare</span>
                      </button>
                      {!isManager && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePaymentProof(proof.id, proof.fileName);
                          }}
                          title="Delete payment proof"
                          className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors shadow-xs"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW 2: Audit Table */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Proof Document</th>
                  <th className="py-3 px-4">Scope / Trip</th>
                  <th className="py-3 px-4">Linked Expense</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Ref / UTR</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reviewer</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProofs.map((proof) => {
                  const linkedExp = proof.expenseId
                    ? expenses.find((e) => e.id === proof.expenseId)
                    : null;

                  return (
                    <tr
                      key={proof.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedProofForAudit(proof)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-blue-600">
                            <FileCheck className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-white truncate block">
                              {proof.fileName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {proof.proofType}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {proof.tripName || 'Service Visit'}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate">
                        {linkedExp ? (
                          <div>
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                              {linkedExp.description}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Row #{linkedExp.rawOriginal?.rowNumber || '—'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unlinked</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(proof.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(proof.paymentDate)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {proof.transactionReference || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(proof.status)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {proof.reviewedByName ? (
                          <span>
                            {proof.reviewedByName}{' '}
                            <span className="text-[10px] text-slate-400">({proof.reviewedByRole})</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unreviewed</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedProofForAudit(proof)}
                            className="rounded-lg bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                          >
                            Audit
                          </button>
                          {!isManager && (
                            <button
                              type="button"
                              onClick={() => handleDeletePaymentProof(proof.id, proof.fileName)}
                              title="Delete proof"
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Missing Proofs Audit */}
      {viewMode === 'missing' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-indigo-600" />
                Missing Proofs Audit Checklist ({missingProofExpenses.length} valid expenses)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                These valid expenses currently have no linked payment proof or receipt document in the system.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Upload className="h-4 w-4" />
              <span>Import Drive Receipts</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Row #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Payment Method</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {missingProofExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                      #{expense.rawOriginal?.rowNumber || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {formatDate(expense.date)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {expense.description}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {expense.paymentMethod || 'UPI / Cash'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setIsImportModalOpen(true)}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Link Proof</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      <DriveImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        trips={trips}
        expenses={expenses}
        availableFiles={driveFolderFiles}
        existingProofs={paymentProofs}
        googleDriveConfig={googleDriveConfig}
        onImportBatch={(batch) => {
          onImportBatch(batch);
          onNotify('success', `Imported ${batch.length} payment proofs from Google Drive.`);
        }}
        onRefreshFolder={handleRefreshFolder}
        isManager={isManager}
      />

      <DriveConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={googleDriveConfig}
        onSaveConfig={(updated) => {
          onUpdateDriveConfig(updated);
          onNotify('success', 'Google Drive settings updated.');
        }}
        onRefreshFolder={handleRefreshFolder}
        isManager={isManager}
      />

      <ProofComparisonModal
        isOpen={Boolean(selectedProofForAudit)}
        onClose={() => setSelectedProofForAudit(null)}
        proof={selectedProofForAudit}
        expenses={expenses}
        reimbursements={reimbursements}
        trips={trips}
        currentUser={currentUser}
        onReviewProof={(proofId, status, notes) => {
          onReviewProof(proofId, status, notes);
          onNotify(
            'success',
            `Proof review updated to ${status.toUpperCase()}${notes ? `: ${notes}` : ''}`
          );
        }}
        onDeleteProof={(id) => {
          onDeleteProof(id);
          onNotify('success', 'Payment proof deleted successfully.');
        }}
        onDiscuss={onDiscussExpense}
        isManager={isManager}
      />

      {/* Drive File Preview Modal (Image zoom & Embedded PDF viewer) */}
      <DriveFileViewerModal
        file={activeViewerFile}
        isOpen={Boolean(activeViewerFile)}
        onClose={() => setActiveViewerFile(null)}
        isManager={isManager}
        onDeleteFile={(id) => {
          handleDeleteDriveFile(id, activeViewerFile?.name);
          setActiveViewerFile(null);
        }}
        onLinkToProof={(_file) => {
          setIsImportModalOpen(true);
        }}
      />
    </div>
  );
};
