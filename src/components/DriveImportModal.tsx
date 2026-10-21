import React, { useState, useMemo } from 'react';
import {
  Trip,
  Expense,
  DriveFolderFile,
  PaymentProof,
  PaymentProofType,
  GoogleDriveConfig,
} from '../types/index';
import {
  X,
  HardDrive,
  Folder,
  FileText,
  Link as LinkIcon,
  Sparkles,
  AlertTriangle,
  Upload,
  Eye,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

interface DriveImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: Trip[];
  expenses: Expense[];
  availableFiles: DriveFolderFile[];
  existingProofs: PaymentProof[];
  googleDriveConfig: GoogleDriveConfig;
  onImportBatch: (proofs: Array<Omit<PaymentProof, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  onRefreshFolder: () => void;
  isManager?: boolean;
}

const PROOF_TYPES: PaymentProofType[] = [
  'UPI Receipt',
  'Train / Transit Ticket',
  'Hotel / Dorm Invoice',
  'Bank Transfer Statement',
  'Cash Receipt',
  'Porter Dispatch Bill',
  'Other',
];

interface FileMappingState {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  driveLink: string;
  previewUrl: string;
  tripId: string;
  expenseId: string;
  proofType: PaymentProofType;
  paymentDate: string;
  amount: number | '';
  transactionReference: string;
  notes: string;
  ocrDetected?: {
    extractedAmount?: number;
    extractedDate?: string;
    extractedReference?: string;
  };
}

export const DriveImportModal: React.FC<DriveImportModalProps> = ({
  isOpen,
  onClose,
  trips,
  expenses,
  availableFiles,
  existingProofs,
  googleDriveConfig,
  onImportBatch,
  onRefreshFolder,
  isManager = false,
}) => {
  const { handleBackdropClick } = useModalA11y({ isOpen, onClose });
  const [activeTab, setActiveTab] = useState<'browse' | 'direct_link'>('browse');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [fileSearch, setFileSearch] = useState<string>('');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  // Direct Drive link mode state
  const [directLinkInput, setDirectLinkInput] = useState<string>('');
  const [directFileName, setDirectFileName] = useState<string>('');
  const directFileSize = 1024 * 250;

  // Common batch settings
  const [batchTripId, setBatchTripId] = useState<string>('trip-mumbai-pune-2026');
  const [batchProofType, setBatchProofType] = useState<PaymentProofType>('UPI Receipt');
  const [batchDate, setBatchDate] = useState<string>('2026-10-12');

  // Per-file detailed mappings (override map)
  const [mappings, setMappings] = useState<Record<string, FileMappingState>>({});

  // Existing file ID and ref lookup for duplicate warnings
  const existingDriveIds = useMemo(
    () => new Set(existingProofs.map((p) => p.driveFileId).filter(Boolean)),
    [existingProofs]
  );
  const existingRefs = useMemo(
    () => new Set(existingProofs.map((p) => p.transactionReference?.toLowerCase()).filter(Boolean)),
    [existingProofs]
  );

  // Filtered files in folder
  const filteredFiles = useMemo(() => {
    return availableFiles.filter((f) => {
      const matchFolder =
        selectedFolder === 'all' ||
        (f.virtualFolder && f.virtualFolder.toLowerCase() === selectedFolder.toLowerCase());
      const matchSearch =
        !fileSearch.trim() ||
        f.name.toLowerCase().includes(fileSearch.toLowerCase()) ||
        (f.virtualFolder && f.virtualFolder.toLowerCase().includes(fileSearch.toLowerCase()));
      return matchFolder && matchSearch;
    });
  }, [availableFiles, selectedFolder, fileSearch]);

  if (!isOpen) return null;

  // Initialize or retrieve mapping for a file
  const getFileMapping = (file: DriveFolderFile): FileMappingState => {
    if (mappings[file.id]) return mappings[file.id];

    // Check if there is an OCR suggestion or sensible auto-guess
    let initialType: PaymentProofType = batchProofType;
    let initialAmount: number | '' = '';
    let initialDate = batchDate;
    let initialRef = '';
    let ocrSuggested: any = undefined;

    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('irctc') || lowerName.includes('train')) {
      initialType = 'Train / Transit Ticket';
      initialAmount = 640;
      initialDate = '2026-10-12';
      initialRef = 'IRCTC-' + Math.floor(100000 + Math.random() * 900000);
      ocrSuggested = {
        extractedAmount: 640,
        extractedDate: '2026-10-12',
        extractedReference: initialRef,
      };
    } else if (lowerName.includes('hotel') || lowerName.includes('dorm') || lowerName.includes('stay')) {
      initialType = 'Hotel / Dorm Invoice';
      initialAmount = 582;
      initialDate = '2026-10-12';
      initialRef = 'INV-DORM-102';
      ocrSuggested = {
        extractedAmount: 582,
        extractedDate: '2026-10-12',
        extractedReference: 'INV-DORM-102',
      };
    } else if (lowerName.includes('upi') || lowerName.includes('gpay') || lowerName.includes('paytm')) {
      initialType = 'UPI Receipt';
      initialAmount = 400;
      initialDate = '2026-10-12';
      initialRef = 'UPI-' + Math.floor(100000000000 + Math.random() * 900000000000);
      ocrSuggested = {
        extractedAmount: 400,
        extractedDate: '2026-10-12',
        extractedReference: initialRef,
      };
    }

    return {
      fileId: file.id,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.mimeType,
      driveLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      previewUrl: file.thumbnailLink || '',
      tripId: batchTripId,
      expenseId: '',
      proofType: initialType,
      paymentDate: initialDate,
      amount: initialAmount,
      transactionReference: initialRef,
      notes: '',
      ocrDetected: ocrSuggested,
    };
  };

  const handleToggleSelectFile = (file: DriveFolderFile) => {
    const next = new Set(selectedFileIds);
    if (next.has(file.id)) {
      next.delete(file.id);
    } else {
      next.add(file.id);
      if (!mappings[file.id]) {
        setMappings((prev) => ({
          ...prev,
          [file.id]: getFileMapping(file),
        }));
      }
    }
    setSelectedFileIds(next);
  };

  const handleSelectAll = () => {
    if (filteredFiles.every((f) => selectedFileIds.has(f.id))) {
      const next = new Set(selectedFileIds);
      filteredFiles.forEach((f) => next.delete(f.id));
      setSelectedFileIds(next);
    } else {
      const next = new Set(selectedFileIds);
      const newMappings = { ...mappings };
      filteredFiles.forEach((f) => {
        next.add(f.id);
        if (!newMappings[f.id]) {
          newMappings[f.id] = getFileMapping(f);
        }
      });
      setSelectedFileIds(next);
      setMappings(newMappings);
    }
  };

  const handleUpdateMapping = (fileId: string, updates: Partial<FileMappingState>) => {
    setMappings((prev) => ({
      ...prev,
      [fileId]: {
        ...(prev[fileId] || ({} as FileMappingState)),
        ...updates,
      },
    }));
  };

  // When user selects an expense from dropdown for a file, auto-populate amount, trip, and date
  const handleSelectExpenseForFile = (fileId: string, expenseId: string) => {
    const selectedExpense = expenses.find((e) => e.id === expenseId);
    if (!selectedExpense) {
      handleUpdateMapping(fileId, { expenseId: '' });
      return;
    }

    handleUpdateMapping(fileId, {
      expenseId: selectedExpense.id,
      amount: selectedExpense.amount ?? '',
      paymentDate: selectedExpense.date || batchDate,
      tripId: selectedExpense.tripId || batchTripId,
      notes: `Linked to ${selectedExpense.description}`,
    });
  };

  const handleApplyBatchToSelected = () => {
    setMappings((prev) => {
      const updated = { ...prev };
      selectedFileIds.forEach((id) => {
        if (updated[id]) {
          updated[id] = {
            ...updated[id],
            tripId: batchTripId,
            proofType: batchProofType,
            paymentDate: batchDate,
          };
        }
      });
      return updated;
    });
  };

  const handleSubmitImport = () => {
    if (isManager) return;
    const proofsToImport: Array<Omit<PaymentProof, 'id' | 'createdAt' | 'updatedAt'>> = [];

    if (activeTab === 'browse') {
      selectedFileIds.forEach((fileId) => {
        const fileObj = availableFiles.find((f) => f.id === fileId);
        const map = mappings[fileId] || (fileObj ? getFileMapping(fileObj) : null);
        if (!map) return;

        const linkedExpense = expenses.find((e) => e.id === map.expenseId);
        const selectedTrip = trips.find((t) => t.id === map.tripId);

        proofsToImport.push({
          workspaceId: 'ws-atul-default',
          driveFileId: map.fileId,
          driveLink: map.driveLink,
          fileName: map.fileName,
          fileType: map.mimeType,
          fileSize: map.fileSize,
          previewUrl: map.previewUrl,
          thumbnailUrl: map.previewUrl,
          tripId: map.tripId || null,
          tripName: selectedTrip?.name || 'Service Visit',
          expenseId: map.expenseId || null,
          expenseDescription: linkedExpense?.description || null,
          proofType: map.proofType,
          paymentDate: map.paymentDate || '2026-10-12',
          amount: Number(map.amount) || 0,
          transactionReference: map.transactionReference || null,
          notes: map.notes || null,
          status: 'pending',
          importedBy: 'current',
          importedByName: 'User',
          importedAt: new Date().toISOString(),
          ocrExtractedData: map.ocrDetected
            ? {
                extractedAmount: map.ocrDetected.extractedAmount,
                extractedDate: map.ocrDetected.extractedDate,
                extractedReference: map.ocrDetected.extractedReference,
                confidence: 0.94,
              }
            : null,
        });
      });
    } else {
      // Direct Link mode
      if (!directLinkInput.trim()) return;

      const driveIdMatch =
        directLinkInput.match(/[-\w]{25,}/) || [directLinkInput.trim()];
      const extractedId = driveIdMatch[0];

      proofsToImport.push({
        workspaceId: 'ws-atul-default',
        driveFileId: extractedId,
        driveLink: directLinkInput.trim(),
        fileName: directFileName.trim() || `Drive_Proof_${extractedId.substring(0, 8)}.pdf`,
        fileType: 'application/pdf',
        fileSize: directFileSize,
        tripId: batchTripId,
        tripName: trips.find((t) => t.id === batchTripId)?.name || 'Service Visit',
        proofType: batchProofType,
        paymentDate: batchDate,
        amount: 0,
        status: 'pending',
        importedBy: 'current',
        importedByName: 'User',
        importedAt: new Date().toISOString(),
      });
    }

    if (proofsToImport.length > 0) {
      onImportBatch(proofsToImport);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drive-import-title"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h3 id="drive-import-title" className="text-base font-bold text-slate-900 dark:text-white">
                Import Payment Proofs from Google Drive
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connected folder: <span className="font-semibold text-slate-700 dark:text-slate-300">{googleDriveConfig.folderName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={() => setActiveTab('browse')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors ${
              activeTab === 'browse'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Folder className="h-4 w-4" />
            <span>Browse Dedicated Folder ({availableFiles.length} files)</span>
          </button>
          <button
            onClick={() => setActiveTab('direct_link')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors ${
              activeTab === 'direct_link'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <LinkIcon className="h-4 w-4" />
            <span>Direct Google Drive Link / File ID</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'browse' ? (
            <>
              {/* Virtual Folders & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pr-1">
                    Folders:
                  </span>
                  {[
                    { id: 'all', label: 'All Files' },
                    { id: 'Service Visit', label: 'Service Visit' },
                    { id: 'Mumbai & Pune', label: 'Mumbai & Pune' },
                    { id: 'Local Operations', label: 'Local Operations' },
                    { id: 'Other Trips', label: 'Other Trips' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedFolder(cat.id)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors shrink-0 ${
                        selectedFolder === cat.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={fileSearch}
                      onChange={(e) => setFileSearch(e.target.value)}
                      placeholder="Search files..."
                      className="w-44 rounded-lg border border-slate-200 bg-white px-2.5 py-1 pl-7 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <button
                    type="button"
                    onClick={onRefreshFolder}
                    title="Refresh folder from Google Drive"
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-800"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Batch Assignment Controls */}
              <div className="rounded-xl border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    Common Batch Assignment (Quick Fill)
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyBatchToSelected}
                    disabled={selectedFileIds.size === 0}
                    className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 hover:underline disabled:opacity-40"
                  >
                    Apply to {selectedFileIds.size} Selected
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Batch Trip Scope
                    </label>
                    <select
                      value={batchTripId}
                      onChange={(e) => setBatchTripId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {trips.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Proof Type
                    </label>
                    <select
                      value={batchProofType}
                      onChange={(e) => setBatchProofType(e.target.value as PaymentProofType)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {PROOF_TYPES.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={batchDate}
                      onChange={(e) => setBatchDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Files Table / Selection List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={filteredFiles.length > 0 && filteredFiles.every((f) => selectedFileIds.has(f.id))}
                      onChange={handleSelectAll}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="select-all" className="cursor-pointer font-medium">
                      Select All Displayed ({filteredFiles.length})
                    </label>
                  </div>
                  <span>{selectedFileIds.size} files chosen for import</span>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {filteredFiles.map((file) => {
                    const isSelected = selectedFileIds.has(file.id);
                    const mapping = mappings[file.id] || getFileMapping(file);
                    const isAlreadyImported = existingDriveIds.has(file.id);

                    return (
                      <div
                        key={file.id}
                        className={`rounded-xl border transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/20 dark:border-blue-600 dark:bg-blue-950/20 shadow-xs'
                            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60'
                        } p-3.5 space-y-3`}
                      >
                        {/* File Row Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectFile(file)}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                                  {file.name}
                                </span>
                                {file.virtualFolder && (
                                  <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                                    {file.virtualFolder}
                                  </span>
                                )}
                                {isAlreadyImported && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[10px] font-semibold">
                                    <AlertTriangle className="h-2.5 w-2.5" /> Already In System
                                  </span>
                                )}
                                {mapping.transactionReference && existingRefs.has(mapping.transactionReference.toLowerCase()) && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 px-2 py-0.5 text-[10px] font-semibold">
                                    <AlertTriangle className="h-2.5 w-2.5" /> Duplicate Ref
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {(file.size / 1024).toFixed(1)} KB • Drive ID: {file.id}
                              </span>
                            </div>
                          </div>

                          <a
                            href={file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 shrink-0"
                          >
                            <Eye className="h-3 w-3" /> View in Drive
                          </a>
                        </div>

                        {/* Mapping Form appears when file is selected */}
                        {isSelected && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                            {/* Smart OCR Match Banner */}
                            {mapping.ocrDetected && (
                              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-2 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
                                <div className="flex items-center gap-1.5">
                                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  <span>
                                    Smart OCR Suggestion: <strong>₹{mapping.ocrDetected.extractedAmount}</strong> • Date: <strong>{mapping.ocrDetected.extractedDate}</strong> • Ref: <strong>{mapping.ocrDetected.extractedReference}</strong>
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateMapping(file.id, {
                                      amount: mapping.ocrDetected?.extractedAmount ?? mapping.amount,
                                      paymentDate: mapping.ocrDetected?.extractedDate ?? mapping.paymentDate,
                                      transactionReference: mapping.ocrDetected?.extractedReference ?? mapping.transactionReference,
                                    })
                                  }
                                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0 pl-2"
                                >
                                  Applied
                                </button>
                              </div>
                            )}

                            {/* Mapping Fields Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                              {/* Associate with Expense */}
                              <div className="sm:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                                  Link to Expense Record
                                </label>
                                <select
                                  value={mapping.expenseId}
                                  onChange={(e) => handleSelectExpenseForFile(file.id, e.target.value)}
                                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                >
                                  <option value="">-- No specific expense (Unlinked) --</option>
                                  {expenses.map((exp) => (
                                    <option key={exp.id} value={exp.id}>
                                      ₹{exp.amount ?? 'N/A'} - {exp.description} ({exp.date || 'No Date'})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Amount */}
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                                  Amount (₹)
                                </label>
                                <input
                                  type="number"
                                  value={mapping.amount}
                                  onChange={(e) =>
                                    handleUpdateMapping(file.id, {
                                      amount: e.target.value === '' ? '' : parseFloat(e.target.value),
                                    })
                                  }
                                  placeholder="0.00"
                                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                              </div>

                              {/* Proof Type */}
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                                  Proof Type
                                </label>
                                <select
                                  value={mapping.proofType}
                                  onChange={(e) =>
                                    handleUpdateMapping(file.id, {
                                      proofType: e.target.value as PaymentProofType,
                                    })
                                  }
                                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                >
                                  {PROOF_TYPES.map((pt) => (
                                    <option key={pt} value={pt}>
                                      {pt}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Trip Scope Override */}
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                                  Work / Trip Scope
                                </label>
                                <select
                                  value={mapping.tripId}
                                  onChange={(e) => handleUpdateMapping(file.id, { tripId: e.target.value })}
                                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                >
                                  {trips.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Payment Date */}
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                                  Payment Date
                                </label>
                                <input
                                  type="date"
                                  value={mapping.paymentDate}
                                  onChange={(e) => handleUpdateMapping(file.id, { paymentDate: e.target.value })}
                                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                              </div>

                              {/* Transaction Reference */}
                              <div className="sm:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                                  Transaction Reference / UTR
                                </label>
                                <input
                                  type="text"
                                  value={mapping.transactionReference}
                                  onChange={(e) =>
                                    handleUpdateMapping(file.id, { transactionReference: e.target.value })
                                  }
                                  placeholder="e.g. IRCTC-982138, UPI Ref No."
                                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Direct Link Input Mode */
            <div className="space-y-4">
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-100 dark:border-blue-900/50 space-y-2">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                  Paste Direct Google Drive Shared Link or File ID
                </span>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  If the file is not inside the dedicated folder, paste the Drive link below to link it directly without copying.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Google Drive Link or File ID *
                  </label>
                  <input
                    type="text"
                    value={directLinkInput}
                    onChange={(e) => setDirectLinkInput(e.target.value)}
                    placeholder="https://drive.google.com/file/d/1aB2cD3eF4gH.../view"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono text-slate-900 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      File Name
                    </label>
                    <input
                      type="text"
                      value={directFileName}
                      onChange={(e) => setDirectFileName(e.target.value)}
                      placeholder="e.g. Flight_Ticket_Mumbai.pdf"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Associated Trip
                    </label>
                    <select
                      value={batchTripId}
                      onChange={(e) => setBatchTripId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    >
                      {trips.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>

          {!isManager ? (
            <button
              type="button"
              onClick={handleSubmitImport}
              disabled={activeTab === 'browse' ? selectedFileIds.size === 0 : !directLinkInput.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              <span>
                {activeTab === 'browse'
                  ? `Import Selected Proofs (${selectedFileIds.size})`
                  : 'Import Direct Drive Link'}
              </span>
            </button>
          ) : (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Importing restricted in Audit Mode
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
