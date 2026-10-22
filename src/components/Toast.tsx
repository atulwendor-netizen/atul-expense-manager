import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      className={`pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border p-3.5 shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200 ${
        toast.type === 'success'
          ? 'border-emerald-200 bg-white/95 text-emerald-900 dark:border-emerald-800 dark:bg-slate-900/95 dark:text-emerald-200'
          : toast.type === 'warning'
          ? 'border-amber-200 bg-white/95 text-amber-900 dark:border-amber-800 dark:bg-slate-900/95 dark:text-amber-200'
          : toast.type === 'error'
          ? 'border-rose-200 bg-white/95 text-rose-900 dark:border-rose-800 dark:bg-slate-900/95 dark:text-rose-200'
          : 'border-blue-200 bg-white/95 text-blue-900 dark:border-blue-800 dark:bg-slate-900/95 dark:text-blue-200'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
        {toast.type === 'warning' && <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />}
        {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
        {toast.type === 'info' && <Info className="h-4 w-4 text-blue-600 shrink-0" />}
        <span className="text-xs font-semibold leading-tight">{toast.text}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
