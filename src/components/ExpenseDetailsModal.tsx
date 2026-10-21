import React from 'react';
import { createPortal } from 'react-dom';
import { Expense, Trip } from '../types/index';
import { formatCurrency, formatDate } from '../utils/calculations';
import { useModalA11y } from '../hooks/useModalA11y';
import {
  X,
  Calendar,
  CreditCard,
  MapPin,
  Compass,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  Download,
  Info,
  MessageSquare,
  Lock,
} from 'lucide-react';

interface ExpenseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  trips: Trip[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onDiscuss?: (expense: Expense) => void;
  onOpenVerifyModal?: (expense: Expense) => void;
  isManager?: boolean;
}

export const ExpenseDetailsModal: React.FC<ExpenseDetailsModalProps> = ({
  isOpen,
  onClose,
  expense,
  trips,
  onEdit,
  onDelete,
  onDiscuss,
  onOpenVerifyModal,
  isManager = false,
}) => {
  const { handleBackdropClick } = useModalA11y({ isOpen, onClose });

  if (!isOpen || !expense) return null;

  const trip = trips.find((t) => t.id === expense.tripId);
  const isIncomplete = expense.status === 'incomplete' || expense.amount === null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-details-title"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        {/* Header - Fixed & Accessible */}
        <div className="flex items-start justify-between border-b border-slate-100 p-4 sm:p-5 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              {isIncomplete ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <AlertTriangle className="h-3 w-3" />
                  Incomplete Record
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Valid Record
                </span>
              )}
              {expense.verificationStatus === 'verified' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="h-3 w-3" />
                  Receipt Verified
                </span>
              ) : expense.verificationStatus === 'verification_pending' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                  Verification Pending
                </span>
              ) : null}
              {expense.rawOriginal?.rowNumber && (
                <span className="text-[11px] font-mono text-slate-400">
                  Row #{expense.rawOriginal.rowNumber}
                </span>
              )}
              {isManager && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900">
                  <Lock className="h-2.5 w-2.5" />
                  Audit View
                </span>
              )}
            </div>
            <h3 id="expense-details-title" className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {expense.description || 'Untitled Expense'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Amount Banner - Pinned */}
        <div className="bg-slate-50 dark:bg-slate-800/50 px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Amount Spent
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {isIncomplete ? (
                <span className="text-amber-600 dark:text-amber-400 text-lg font-bold">
                  Missing (Excluded from totals)
                </span>
              ) : (
                formatCurrency(expense.amount)
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Category
            </span>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {expense.category}
            </p>
          </div>
        </div>

        {/* Content Details Grid - Independently Scrollable */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain focus:outline-none">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2.5">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  Date
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {formatDate(expense.date)}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CreditCard className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  Payment Method
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {expense.paymentMethod || 'Not Specified'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  Location
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {expense.location || 'Not Specified'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Compass className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  Associated Trip
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {trip?.name || 'No Trip Assigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {expense.notes && (
            <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Item Notes
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {expense.notes}
              </p>
            </div>
          )}

          {/* Receipt Section */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Receipt Document & Verification
              </span>
              {onOpenVerifyModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenVerifyModal(expense);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                >
                  Side-by-Side Review →
                </button>
              )}
            </div>

            {expense.receipt ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {expense.receiptName || expense.receiptMetadata?.fileName || 'Attached Receipt'}
                    </span>
                    {expense.receiptMetadata?.fileSize ? (
                      <span className="text-[10px] text-slate-400">
                        ({(expense.receiptMetadata.fileSize / 1024).toFixed(0)} KB)
                      </span>
                    ) : null}
                  </div>
                  <a
                    href={expense.receipt}
                    download={expense.receiptName || `receipt-${expense.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 shrink-0"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </a>
                </div>

                {/* Verification metadata block if verified */}
                {expense.verifiedAt && (
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2.5 text-[11px] border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                    <p className="font-semibold">
                      ✓ Verified by {expense.verifiedByName || 'Auditor'} on{' '}
                      {new Date(expense.verifiedAt).toLocaleDateString()}
                    </p>
                    {expense.verificationNotes && (
                      <p className="italic mt-0.5">"{expense.verificationNotes}"</p>
                    )}
                  </div>
                )}

                {/* Image preview if image */}
                {(expense.receipt.startsWith('data:image') || expense.receipt.startsWith('http')) && (
                  <div className="max-h-48 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                    <img
                      src={expense.receipt}
                      alt="Receipt Preview"
                      className="max-h-48 w-auto object-contain"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No receipt attached to this expense.
              </p>
            )}
          </div>

          {/* Raw Spreadsheet Traceability */}
          {expense.rawOriginal && (
            <div className="rounded-xl bg-slate-50/70 p-3 text-[11px] text-slate-500 dark:bg-slate-800/40 dark:text-slate-400 space-y-1">
              <div className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                <Info className="h-3 w-3" />
                <span>Source Spreadsheet Traceability</span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1 text-[10px] font-mono">
                <span>Raw Date: {expense.rawOriginal.rawDate || '—'}</span>
                <span>Raw Amount: {expense.rawOriginal.rawAmount || '—'}</span>
                <span>Raw Category: {expense.rawOriginal.rawCategory || '—'}</span>
                <span>Raw Payment: {expense.rawOriginal.rawPayment || '—'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions - Pinned */}
        <div className="flex items-center justify-between border-t border-slate-100 p-3.5 sm:p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
          <div>
            {!isManager ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(expense.id);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 italic">
                Editing restricted
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Discuss Expense button */}
            {onDiscuss && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDiscuss(expense);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Discuss Expense</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Close
            </button>

            {!isManager && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(expense);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit Expense
              </button>
            )}
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
