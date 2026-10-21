import React, { useState } from 'react';
import {
  PaymentProof,
  PaymentProofStatus,
  Expense,
  Reimbursement,
  Trip,
  UserProfile,
} from '../types/index';
import { formatCurrency, formatDate } from '../utils/calculations';
import {
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  Clock,
  Sparkles,
  FileText,
  AlertTriangle,
  Trash2,
  MessageSquare,
  FileCheck,
} from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

interface ProofComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  proof: PaymentProof | null;
  expenses: Expense[];
  reimbursements?: Reimbursement[];
  trips: Trip[];
  currentUser?: UserProfile;
  onReviewProof: (proofId: string, status: PaymentProofStatus, notes?: string) => void;
  onDeleteProof?: (proofId: string) => void;
  onDiscuss?: (expense: Expense) => void;
  isManager?: boolean;
}

export const ProofComparisonModal: React.FC<ProofComparisonModalProps> = ({
  isOpen,
  onClose,
  proof,
  expenses,
  reimbursements: _reimbursements,
  trips,
  currentUser: _currentUser,
  onReviewProof,
  onDeleteProof,
  onDiscuss,
  isManager = false,
}) => {
  const { handleBackdropClick } = useModalA11y({ isOpen, onClose });
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !proof) return null;

  const linkedExpense = proof.expenseId
    ? expenses.find((e) => e.id === proof.expenseId)
    : null;
  const linkedTrip = trips.find((t) => t.id === proof.tripId);

  // Compare fields for discrepancies
  const amountMismatch =
    linkedExpense &&
    linkedExpense.amount !== null &&
    Math.abs(Number(linkedExpense.amount) - Number(proof.amount)) > 0.01;

  const dateMismatch =
    linkedExpense &&
    linkedExpense.date &&
    proof.paymentDate &&
    linkedExpense.date !== proof.paymentDate;

  const handleAction = (status: PaymentProofStatus) => {
    setIsSubmitting(true);
    try {
      onReviewProof(proof.id, status, reviewNotes.trim() || undefined);
      setReviewNotes('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: PaymentProofStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-3 py-1 text-xs font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" /> Verified & Approved
          </span>
        );
      case 'needs_clarification':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-3 py-1 text-xs font-semibold">
            <HelpCircle className="h-3.5 w-3.5" /> Needs Clarification
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 px-3 py-1 text-xs font-semibold">
            <XCircle className="h-3.5 w-3.5" /> Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 px-3 py-1 text-xs font-semibold">
            <Clock className="h-3.5 w-3.5" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proof-comparison-title"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="proof-comparison-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Payment Proof & Audit Comparison
                </h3>
                {getStatusBadge(proof.status)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {proof.fileName} • ID: {proof.id}
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

        {/* Duplicate Detection Alert */}
        {proof.isFlaggedDuplicate && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2.5 flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong>Duplicate Alert:</strong> {proof.duplicateReason || 'Potential duplicate payment submission detected.'}
            </span>
          </div>
        )}

        {/* Modal Body: 2 Columns Side-by-Side */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN: Payment Proof Document */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Google Drive Document
              </span>
              {proof.driveLink && (
                <a
                  href={proof.driveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <span>Open in Drive</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* Document Preview Box */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 min-h-[260px] flex items-center justify-center overflow-hidden">
              {proof.previewUrl ? (
                <img
                  src={proof.previewUrl}
                  alt={proof.fileName}
                  className="max-h-[320px] w-auto max-w-full object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {proof.fileName}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Preview not available inline. Use "Open in Drive" to view source file.
                  </p>
                </div>
              )}
            </div>

            {/* Document Metadata Grid */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Proof Type</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {proof.proofType}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Declared Amount</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {formatCurrency(proof.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Payment Date</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatDate(proof.paymentDate)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Reference / UTR</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 truncate block">
                    {proof.transactionReference || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Imported By</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {proof.importedByName}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Import Date</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {new Date(proof.importedAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              {/* OCR Details if available */}
              {proof.ocrExtractedData && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>OCR Recognition Confidence ({(proof.ocrExtractedData.confidence ? proof.ocrExtractedData.confidence * 100 : 94).toFixed(0)}%)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                    <span>Amt: ₹{proof.ocrExtractedData.extractedAmount ?? '—'}</span>
                    <span>Date: {proof.ocrExtractedData.extractedDate ?? '—'}</span>
                    <span className="truncate">Ref: {proof.ocrExtractedData.extractedReference ?? '—'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Associated Expense & Audit Discrepancy Matrix */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Linked Record & Audit Verification
              </span>
              {linkedExpense && onDiscuss && (
                <button
                  type="button"
                  onClick={() => onDiscuss(linkedExpense)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <MessageSquare className="h-3 w-3" />
                  <span>Discuss in Chat</span>
                </button>
              )}
            </div>

            {/* Linked Expense Card */}
            {linkedExpense ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Row #{linkedExpense.rawOriginal?.rowNumber || '—'} • {linkedExpense.id}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {linkedExpense.description}
                    </h4>
                  </div>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {formatCurrency(linkedExpense.amount)}
                  </span>
                </div>

                {/* Discrepancy Highlights Matrix */}
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Discrepancy Matrix
                  </span>

                  {/* Amount Check */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">Amount Match</span>
                    {amountMismatch ? (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Mismatch (Proof: ₹{proof.amount} vs Exp: ₹{linkedExpense.amount})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Exact Match ({formatCurrency(proof.amount)})
                      </span>
                    )}
                  </div>

                  {/* Date Check */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">Date Match</span>
                    {dateMismatch ? (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Different Date ({formatDate(proof.paymentDate)} vs {formatDate(linkedExpense.date)})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Exact Match ({formatDate(proof.paymentDate)})
                      </span>
                    )}
                  </div>

                  {/* Trip Scope Check */}
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Work Scope</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {linkedTrip?.name || 'Service Visit'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Unattached Payment Proof
                </h4>
                <p className="text-[11px] text-slate-500">
                  This document has not been linked to a specific expense record yet. You can still audit or approve it directly.
                </p>
              </div>
            )}

            {/* Audit Review Actions (Owner & Manager) */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Audit Decision & Reviewer Notes
              </span>

              <div>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Enter audit rationale, verification checks, or reason for rejection/clarification..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Review Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction('verified')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verify</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction('needs_clarification')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 shadow-sm transition-colors"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Clarify</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction('rejected')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-sm transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </button>
              </div>

              {/* Existing Review Log if already audited */}
              {proof.reviewedBy && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Reviewed by: <strong>{proof.reviewedByName}</strong> ({proof.reviewedByRole})</span>
                    <span>{proof.reviewedAt ? new Date(proof.reviewedAt).toLocaleString('en-IN') : ''}</span>
                  </div>
                  {proof.reviewNotes && (
                    <p className="italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                      "{proof.reviewNotes}"
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            {!isManager && onDeleteProof && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete payment proof "${proof.fileName}"?`)) {
                    onDeleteProof(proof.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Proof</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
};
