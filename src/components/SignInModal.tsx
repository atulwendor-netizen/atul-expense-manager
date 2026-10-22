import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { UserProfile } from '../types/index';
import { useModalA11y } from '../hooks/useModalA11y';
import {
  LogIn,
  AlertCircle,
  Shield,
  X,
} from 'lucide-react';

interface SignInModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginWithCredentials: (email: string, password?: string) => Promise<{ success: boolean; user?: UserProfile; error?: string; hasPendingInvitation?: boolean }> | { success: boolean; user?: UserProfile; error?: string; hasPendingInvitation?: boolean };
  onNotify: (type: 'success' | 'warning' | 'info' | 'error', text: string) => void;
  isMandatory?: boolean;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onLoginWithCredentials,
  onNotify,
  isMandatory = false,
}) => {
  const { handleBackdropClick } = useModalA11y({
    isOpen,
    onClose: isMandatory ? undefined : onClose,
    closeOnEscape: !isMandatory,
  });
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasPendingInvite, setHasPendingInvite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setHasPendingInvite(false);

    const cleanEmail = emailInput.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onLoginWithCredentials(cleanEmail, passwordInput);
      if (res.success && res.user) {
        onNotify(
          'success',
          `Welcome back, ${res.user.name}! Access granted as ${res.user.role.toUpperCase()}.`
        );
        setEmailInput('');
        setPasswordInput('');
        if (typeof window !== 'undefined') {
          if (window.location.pathname === '/login' || window.location.search) {
            window.history.replaceState({}, document.title, '/');
          }
        }
        if (onClose) {
          onClose();
        }
      } else {
        if (res.hasPendingInvitation) {
          setHasPendingInvite(true);
        }
        setErrorMessage(
          res.error ||
            'Authentication failed. Please verify your email or contact the workspace Owner.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-modal-title"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-md max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        {/* Header - Pinned */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-sm">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="signin-modal-title" className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Workspace Access Portal
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Atul Expense Manager • Universal Access Link
              </p>
            </div>
          </div>

          {!isMandatory && onClose && (
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Body - Independently Scrollable */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain focus:outline-none">
          {errorMessage && (
            <div className="flex flex-col gap-2 rounded-2xl bg-rose-50 p-3.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
              {hasPendingInvite && (
                <button
                  type="button"
                  onClick={() => {
                    if (onClose) onClose();
                    if (typeof window !== 'undefined') {
                      window.location.href = `/?mode=invite&email=${encodeURIComponent(emailInput.trim())}`;
                    }
                  }}
                  className="self-start inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-[11px] font-bold text-white transition-all shadow-xs mt-1"
                >
                  <span>Accept Workspace Invitation & Set Password</span>
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Account Email Address (ईमेल आईडी)
              </label>
              <input
                type="email"
                required
                autoFocus
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your email address"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <span className="text-[10px] text-slate-400">
                  Optional for Managers & Auditors
                </span>
              </div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter your password (optional)"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-98 transition-all disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            </button>
          </form>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 text-center text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-blue-600" />
              Role-Based Permission Enforcement
            </p>
            <p className="text-[10px] leading-relaxed">
              Your role (Owner or Manager / Auditor) is verified upon login. Managers automatically enter into Read-Only Audit Mode.
            </p>
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
