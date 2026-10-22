import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Expense, Trip, ReceiptVerificationStatus } from '../types/index';
import { formatCurrency, formatDate } from '../utils/calculations';
import { receiptStorage } from '../services/receiptStorage';
import { useModalA11y } from '../hooks/useModalA11y';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileQuestion,
  FileText,
  Calendar,
  CreditCard,
  MapPin,
  Compass,
  ShieldCheck,
  FileX2,
} from 'lucide-react';

interface ReceiptVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  expenses: Expense[];
  trips: Trip[];
  onVerify: (expenseId: string, status: ReceiptVerificationStatus, notes?: string) => void;
  onSelectExpense: (expense: Expense) => void;
  onNotify?: (type: 'success' | 'warning' | 'info' | 'error', text: string) => void;
  isManager?: boolean;
}

export const ReceiptVerificationModal: React.FC<ReceiptVerificationModalProps> = ({
  isOpen,
  onClose,
  expense,
  expenses,
  trips,
  onVerify,
  onSelectExpense,
  onNotify,
  isManager = false,
}) => {
  const { handleBackdropClick } = useModalA11y({ isOpen, onClose });

  // Preview state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resolvedReceiptUrl, setResolvedReceiptUrl] = useState<string | null>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState<boolean>(false);
  const [fileLoadError, setFileLoadError] = useState<string | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<{
    show: boolean;
    type: 'success' | 'info';
    title: string;
    message: string;
    expenseId: string;
  } | null>(null);

  // Auto-dismiss verification popup after 3.5 seconds
  useEffect(() => {
    if (!verificationFeedback) return;
    const timer = setTimeout(() => {
      setVerificationFeedback(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [verificationFeedback]);

  // Current expense index and navigation
  const currentIndex = useMemo(() => {
    if (!expense) return -1;
    return expenses.findIndex((e) => e.id === expense.id);
  }, [expense, expenses]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < expenses.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onSelectExpense(expenses[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, expenses, onSelectExpense]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      onSelectExpense(expenses[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, expenses, onSelectExpense]);

  // Synchronize state when expense changes
  useEffect(() => {
    if (expense) {
      setZoomLevel(1);
      setReviewNotes(expense.verificationNotes || '');
      setFileLoadError(null);

      if (expense.receipt) {
        if (expense.receipt.startsWith('data:') || expense.receipt.startsWith('http')) {
          setResolvedReceiptUrl(expense.receipt);
          setIsLoadingReceipt(false);
        } else {
          // Asynchronously resolve from receiptStorage
          setIsLoadingReceipt(true);
          receiptStorage
            .getReceipt(expense.receipt, expense.workspaceId)
            .then((record) => {
              if (record && record.dataUrl) {
                setResolvedReceiptUrl(record.dataUrl);
              } else {
                setResolvedReceiptUrl(null);
                setFileLoadError('Stored receipt file was not found in storage repository.');
              }
            })
            .catch(() => {
              setResolvedReceiptUrl(null);
              setFileLoadError('Failed to retrieve receipt from storage.');
            })
            .finally(() => {
              setIsLoadingReceipt(false);
            });
        }
      } else {
        setResolvedReceiptUrl(null);
        setIsLoadingReceipt(false);
      }
    } else {
      setResolvedReceiptUrl(null);
      setReviewNotes('');
      setFileLoadError(null);
    }
  }, [expense]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext]);

  if (!isOpen || !expense) return null;

  const trip = trips.find((t) => t.id === expense.tripId);
  const metadata = expense.receiptMetadata;
  const fileName = metadata?.fileName || expense.receiptName || 'receipt';
  const fileType = metadata?.fileType || (fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
  const isPdf = fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');

  // Determine current verification badge
  const verificationStatus = expense.verificationStatus || (expense.receipt ? 'receipt_attached' : 'receipt_missing');

  const handleAction = async (status: ReceiptVerificationStatus) => {
    try {
      setIsSubmitting(true);
      const currentExpense = expense;
      const currentId = currentExpense.id;
      const desc = currentExpense.description || currentId;
      const amount = currentExpense.amount;
      const nextIdx = currentIndex + 1;
      const willHaveNext = nextIdx < expenses.length;
      const nextExpense = willHaveNext ? expenses[nextIdx] : null;

      onVerify(currentId, status, reviewNotes.trim() || undefined);

      if (status === 'verified') {
        // 1. Show immediate In-Modal Confirmation Popup
        setVerificationFeedback({
          show: true,
          type: 'success',
          title: 'Receipt Verified Successfully!',
          message: willHaveNext
            ? `Expense #${currentId} (${formatCurrency(amount || 0)}) verified. Auto-advancing to record ${nextIdx + 1} of ${expenses.length}...`
            : `Expense #${currentId} (${formatCurrency(amount || 0)}) verified. Reached the end of the audit queue!`,
          expenseId: currentId,
        });

        // 2. Global Toast Notification Popup (guaranteed top level z-[9999])
        if (onNotify) {
          onNotify(
            'success',
            willHaveNext
              ? `Receipt for "${desc}" verified! Moving to next record (${nextIdx + 1}/${expenses.length})...`
              : `Receipt for "${desc}" verified! All ${expenses.length} records reviewed.`
          );
        }

        // 3. Automatic Next Expense Advance
        if (willHaveNext && nextExpense) {
          onSelectExpense(nextExpense);
        }
      } else if (status === 'verification_pending') {
        setVerificationFeedback({
          show: true,
          type: 'info',
          title: 'Marked as Pending Review',
          message: `Expense #${currentId} flagged for auditor follow-up.`,
          expenseId: currentId,
        });

        if (onNotify) {
          onNotify('info', `Marked "${desc}" as Pending Review.`);
        }
      } else {
        if (onNotify) {
          onNotify('info', `Updated verification status to: ${status}.`);
        }
      }
    } catch (err: any) {
      if (onNotify) {
        onNotify('error', err.message || 'Failed to update verification status.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (!resolvedReceiptUrl) return;
    const win = window.open();
    if (win) {
      win.document.write(
        `<html><head><title>Receipt - ${fileName}</title></head><body style="margin:0;background:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh;">` +
          (isPdf
            ? `<iframe src="${resolvedReceiptUrl}" style="width:100%;height:100%;border:none;"></iframe>`
            : `<img src="${resolvedReceiptUrl}" style="max-width:100%;max-height:100%;object-fit:contain;" />`) +
          `</body></html>`
      );
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-verification-title"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-6xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        {/* In-Modal Floating Verification Notification Popup */}
        {verificationFeedback && (
          <div
            role="status"
            aria-live="polite"
            className={`absolute top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 text-white shadow-2xl border backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200 max-w-lg w-[92%] sm:w-auto ${
              verificationFeedback.type === 'success'
                ? 'bg-emerald-600/95 border-emerald-400/50 shadow-emerald-950/50'
                : 'bg-amber-600/95 border-amber-400/50 shadow-amber-950/50'
            }`}
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white/20 shrink-0">
              {verificationFeedback.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-white animate-bounce" />
              ) : (
                <Clock className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="min-w-0 pr-1 text-left">
              <p className="text-[11px] sm:text-xs font-black tracking-wide uppercase text-white/90">
                {verificationFeedback.title}
              </p>
              <p className="text-[11px] sm:text-xs font-semibold text-white truncate max-w-xs sm:max-w-md">
                {verificationFeedback.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setVerificationFeedback(null)}
              aria-label="Dismiss popup"
              className="ml-auto rounded-lg p-1 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3.5 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 id="receipt-verification-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  Receipt Verification & Audit
                </h3>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold shrink-0">
                  ID: {expense.id}
                </span>
                {isManager && (
                  <span className="font-semibold text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shrink-0">
                    Auditor Review
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Entry-wise financial verification and receipt side-by-side audit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Previous / Next navigation */}
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={handlePrev}
                disabled={!hasPrev}
                title="Previous expense (Arrow Left)"
                aria-label="Previous expense"
                className="p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-x border-slate-200 dark:border-slate-700 select-none">
                {currentIndex >= 0 ? `${currentIndex + 1} / ${expenses.length}` : '—'}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={!hasNext}
                title="Next expense (Arrow Right)"
                aria-label="Next expense"
                className="p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Side-by-Side Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800 overflow-y-auto lg:overflow-hidden">
          {/* Left Column: Full Receipt Document Preview (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col bg-slate-900/5 dark:bg-slate-950/40 p-4 sm:p-5 min-h-[350px] lg:min-h-0 lg:h-full overflow-hidden">
            {/* Viewer Controls Toolbar */}
            <div className="flex items-center justify-between gap-2 pb-3 shrink-0 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium truncate">
                <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-xs font-semibold" title={fileName}>
                  {fileName}
                </span>
                {metadata?.fileSize ? (
                  <span className="text-[10px] text-slate-400">
                    ({(metadata.fileSize / 1024).toFixed(0)} KB)
                  </span>
                ) : null}
              </div>

              {resolvedReceiptUrl && !fileLoadError && (
                <div className="flex items-center gap-1">
                  {!isPdf && (
                    <>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                        title="Zoom out"
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[11px] font-mono px-1.5 text-slate-500">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                        title="Zoom in"
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel(1)}
                        title="Reset zoom"
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    title="Open full size in new window"
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                  <a
                    href={resolvedReceiptUrl}
                    download={fileName}
                    target="_blank"
                    rel="noreferrer"
                    title="Download receipt"
                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              )}
            </div>

            {/* Document Preview Area */}
            <div className="flex-1 relative rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-900/90 flex items-center justify-center overflow-auto p-2">
              {isLoadingReceipt ? (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Clock className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="text-xs">Loading receipt document...</span>
                </div>
              ) : fileLoadError ? (
                <div className="text-center p-6 max-w-sm">
                  <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-3">
                    <FileX2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Receipt File Unavailable</h4>
                  <p className="text-xs text-slate-400 mb-3">{fileLoadError}</p>
                  <span className="inline-block px-2.5 py-1 rounded-md bg-rose-950/60 text-rose-300 border border-rose-800 text-[11px] font-medium">
                    Status: file_unavailable
                  </span>
                </div>
              ) : resolvedReceiptUrl ? (
                isPdf ? (
                  <iframe
                    src={resolvedReceiptUrl}
                    title="PDF Receipt Viewer"
                    className="w-full h-full min-h-[420px] rounded-lg border-0 bg-white"
                  />
                ) : (
                  <div
                    className="transition-transform duration-100 ease-out origin-center flex items-center justify-center w-full h-full"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    <img
                      src={resolvedReceiptUrl}
                      alt={`Receipt for ${expense.description || expense.id}`}
                      className="max-h-full max-w-full object-contain rounded-lg shadow-lg select-none"
                    />
                  </div>
                )
              ) : (
                <div className="text-center p-6 max-w-sm">
                  <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3">
                    <FileQuestion className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">No Receipt Attached</h4>
                  <p className="text-xs text-slate-400 mb-3">
                    This expense record does not have any payment receipt or bill uploaded.
                  </p>
                  <span className="inline-block px-2.5 py-1 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800 text-[11px] font-medium">
                    Status: receipt_missing
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Expense Details & Verification Actions (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col p-4 sm:p-6 lg:h-full overflow-y-auto space-y-5">
            {/* Amount Banner */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Expense Amount
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                    {expense.amount !== null && !isNaN(expense.amount as number) ? (
                      formatCurrency(expense.amount)
                    ) : (
                      <span className="text-amber-500 text-lg font-bold">Incomplete / Missing</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Category
                  </span>
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {expense.category || 'Uncategorized'}
                  </p>
                </div>
              </div>
            </div>

            {/* Description & Reference */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Description & Purpose
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {expense.description || 'Untitled Expense Entry'}
              </h4>
              {expense.notes && (
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                  {expense.notes}
                </p>
              )}
            </div>

            {/* Detailed Meta Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(expense.date)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CreditCard className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Payment Method</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {expense.paymentMethod || 'Not Specified'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Location</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {expense.location || '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Compass className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Associated Trip</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block max-w-[140px]">
                    {trip?.name || 'No Trip Assigned'}
                  </span>
                </div>
              </div>
            </div>

            {/* Verification Status Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Audit & Verification Status
                </span>
                {verificationStatus === 'verified' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                  </span>
                ) : verificationStatus === 'verification_pending' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    <Clock className="h-3.5 w-3.5" />
                    Verification Pending
                  </span>
                ) : verificationStatus === 'file_unavailable' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    File Unavailable
                  </span>
                ) : verificationStatus === 'receipt_attached' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                    <FileText className="h-3.5 w-3.5" />
                    Receipt Attached
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                    <FileQuestion className="h-3.5 w-3.5" />
                    Receipt Missing
                  </span>
                )}
              </div>

              {expense.verifiedAt && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                  <p>
                    <span className="font-semibold">Verified by:</span>{' '}
                    {expense.verifiedByName || expense.verifiedBy || 'Authorized Auditor'}
                  </p>
                  <p>
                    <span className="font-semibold">Verified on:</span>{' '}
                    {new Date(expense.verifiedAt).toLocaleString()}
                  </p>
                  {expense.verificationNotes && (
                    <p className="mt-1 italic text-slate-600 dark:text-slate-300">
                      "{expense.verificationNotes}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Audit Notes Input */}
            <div>
              <label
                htmlFor="verification-notes-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Auditor Review Notes (Optional)
              </label>
              <textarea
                id="verification-notes-input"
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="e.g. Verified amount against HDFC UPI transaction #4892, approved"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Verification Action Buttons */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction('verified')}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {verificationStatus === 'verified'
                      ? (hasNext ? 'Verified (Next →)' : 'Verified (Done)')
                      : (hasNext ? 'Mark Verified & Next →' : 'Mark Verified')}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction('verification_pending')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300 disabled:opacity-50 transition-colors"
                >
                  <Clock className="h-4 w-4" />
                  <span>Needs Review</span>
                </button>
              </div>

              {verificationStatus === 'verified' && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction(expense.receipt ? 'receipt_attached' : 'receipt_missing')}
                  className="w-full py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors text-center"
                >
                  Revert to Unverified
                </button>
              )}

              {/* Next Navigation Shortcut */}
              {hasNext ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center justify-center gap-1 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 mt-1"
                >
                  <span>Verify Next Expense</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <div className="flex items-center justify-center gap-1.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>All {expenses.length} records reviewed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
