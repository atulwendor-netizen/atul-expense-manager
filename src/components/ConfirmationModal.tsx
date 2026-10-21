import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const { handleBackdropClick } = useModalA11y({ isOpen, onClose: onCancel });
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button on open for accessible & safe keyboard operation
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-desc"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        className="relative w-full max-w-md max-h-[calc(100dvh-32px)] sm:max-h-[calc(100vh-32px)] flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-auto overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close X button */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel and close"
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content area: independently scrollable if content overflows or screen is short */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 overscroll-contain">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                variant === 'danger'
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400'
              }`}
            >
              {variant === 'danger' ? (
                <Trash2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>

            <div className="space-y-1.5 pr-6">
              <h3 id="confirmation-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p id="confirmation-modal-desc" className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Actions footer: shrink-0 pinned at bottom, always visible and reachable */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50/70 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
