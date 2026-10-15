import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types/index';
import {
  X,
  Shield,
  Eye,
  KeyRound,
  AlertCircle,
  LogIn,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSwitchUser: (role: UserRole) => void;
  onLoginWithCredentials: (email: string) => { success: boolean; user?: UserProfile; error?: string };
  onNotify: (type: 'success' | 'warning' | 'info' | 'error', text: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchUser,
  onLoginWithCredentials,
  onNotify,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCredentialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!emailInput.trim()) {
      setErrorMessage('Please enter your account email.');
      return;
    }

    const res = onLoginWithCredentials(emailInput.trim());
    if (res.success && res.user) {
      onNotify('success', `Logged in as ${res.user.name} (${res.user.role.toUpperCase()})`);
      onClose();
    } else {
      setErrorMessage(res.error || 'Authentication failed. Please check email.');
    }
  };

  const handleQuickSwitch = (role: UserRole) => {
    setErrorMessage(null);
    onSwitchUser(role);
    onNotify(
      'info',
      role === 'owner'
        ? 'Switched to Basant (Account Owner) with full CRUD permissions'
        : 'Switched to Manager / Auditor in Read-Only Audit Mode'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Account & Role Authentication
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Switch roles or sign in with credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Active Session Card */}
          <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Active Session
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  currentUser.role === 'owner'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {currentUser.role === 'owner' ? '👑 Owner' : '🔍 Manager (Audit)'}
              </span>
            </div>
          </div>

          {/* Quick 1-Click Role Switcher */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              ⚡ Instant 1-Click Role Switch (for Testing & Evaluation)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickSwitch('owner')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
                  currentUser.role === 'owner'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300 mb-1.5">
                  <Shield className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold">Owner (Basant)</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Full CRUD & Admin
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch('manager')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
                  currentUser.role === 'manager'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-900 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200 ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300 mb-1.5">
                  <Eye className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold">Manager / Auditor</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Read Only Audit Mode
                </span>
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider absolute">
              Or Sign In with Email
            </span>
          </div>

          {/* Credential Login Form */}
          <form onSubmit={handleCredentialLogin} className="space-y-3">
            {errorMessage && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Account Email
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. manager@email.com or basant@atul-expenses.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors mt-2"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In to Account</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
