import React, { useState, useEffect } from 'react';
import {
  LogIn,
  UserPlus,
  KeyRound,
  ShieldCheck,
  Lock,
  Wallet,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  Receipt,
  PieChart,
  Mail,
  ExternalLink,
  ArrowLeft,
  UserCheck,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { supabaseIsInviteCallback } from '../services/supabase';

interface PublicAuthPortalProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; user?: any; error?: string; hasPendingInvitation?: boolean }>;
  onRegister: (name: string, email: string, password: string) => Promise<{ success: boolean; user?: any; error?: string }>;
  onResetPassword?: (email: string, newPassword?: string, token?: string, expires?: number, oobCode?: string) => Promise<{ success: boolean; dispatched?: boolean; message?: string; resetUrl?: string; error?: string }>;
  onRequestPasswordReset?: (email: string) => Promise<{ success: boolean; dispatched?: boolean; message?: string; resetUrl?: string; error?: string }>;
  onConfirmPasswordReset?: (params: { email: string; newPassword: string; token?: string; expires?: number; oobCode?: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
  onValidateInvitation?: (token: string, email?: string) => Promise<{ valid: boolean; invitation?: any; error?: string }>;
  onAcceptInvitation?: (params: { token: string; email?: string; password?: string; name?: string }) => Promise<{ success: boolean; user?: any; error?: string; requiresPassword?: boolean }>;
  onNotify: (type: 'success' | 'warning' | 'info' | 'error', text: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

interface ResetSession {
  email: string;
  token?: string;
  expires?: number;
  oobCode?: string;
}

export interface InviteSession {
  token: string;
  email: string;
  role: string;
  workspaceId?: string;
  isValid?: boolean;
  validationError?: string;
  isLoading?: boolean;
}

export const PublicAuthPortal: React.FC<PublicAuthPortalProps> = ({
  onLogin,
  onRegister,
  onResetPassword,
  onRequestPasswordReset,
  onConfirmPasswordReset,
  onValidateInvitation,
  onAcceptInvitation,
  onNotify,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot' | 'reset-confirmed' | 'invite'>('signin');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Verified password reset session from incoming email link
  const [resetSession, setResetSession] = useState<ResetSession | null>(null);
  const [generatedResetUrl, setGeneratedResetUrl] = useState<string | null>(null);

  // Invitation session from incoming invite link
  const [inviteSession, setInviteSession] = useState<InviteSession | null>(null);
  const [inviteMode, setInviteMode] = useState<'new' | 'existing'>('new');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Inspect incoming URL parameters for verified password reset action link or workspace invitation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      const oobCode = params.get('oobCode');
      const token = params.get('token');
      const emailParam = params.get('email');
      const roleParam = params.get('role');
      const expiresParam = params.get('expires');

      // 1. Supabase Auth invitation callback check (#access_token=...&type=invite)
      const sbCallback = supabaseIsInviteCallback();
      if (sbCallback.isInvite) {
        const cbEmail = sbCallback.email ? sbCallback.email.trim().toLowerCase() : (emailParam ? decodeURIComponent(emailParam).trim().toLowerCase() : '');
        const cbToken = sbCallback.token || token || '';
        if (cbEmail) {
          setEmail(cbEmail);
          const namePart = cbEmail.split('@')[0];
          setName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
        }
        setInviteSession({
          token: cbToken,
          email: cbEmail,
          role: roleParam || 'manager',
          isValid: true,
          isLoading: false,
        });
        setActiveTab('invite');
        return;
      }

      if (mode === 'resetPassword') {
        if (oobCode) {
          setResetSession({
            email: emailParam ? decodeURIComponent(emailParam) : '',
            oobCode,
          });
          setActiveTab('reset-confirmed');
        } else if (token && emailParam) {
          setResetSession({
            email: decodeURIComponent(emailParam),
            token,
            expires: expiresParam ? parseInt(expiresParam, 10) : undefined,
          });
          setActiveTab('reset-confirmed');
        }
      } else if (
        mode === 'invite' ||
        (token && mode !== 'resetPassword') ||
        (roleParam === 'manager' && (token || emailParam))
      ) {
        const decodedEmail = emailParam ? decodeURIComponent(emailParam).trim().toLowerCase() : '';
        const rawToken = token ? decodeURIComponent(token).trim() : '';
        const role = roleParam || 'manager';

        if (decodedEmail) {
          setEmail(decodedEmail);
          const namePart = decodedEmail.split('@')[0];
          setName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
        }

        const session: InviteSession = {
          token: rawToken,
          email: decodedEmail,
          role,
          isLoading: Boolean(rawToken && onValidateInvitation),
        };
        setInviteSession(session);
        setActiveTab('invite');

        if (rawToken && onValidateInvitation) {
          onValidateInvitation(rawToken, decodedEmail).then((res) => {
            if (res.valid && res.invitation) {
              setInviteSession({
                token: rawToken,
                email: res.invitation.email || decodedEmail,
                role: res.invitation.role || role,
                workspaceId: res.invitation.workspaceId,
                isValid: true,
                isLoading: false,
              });
              if (res.invitation.email) {
                setEmail(res.invitation.email);
              }
            } else {
              setInviteSession({
                token: rawToken,
                email: decodedEmail,
                role,
                isValid: false,
                validationError: res.error || 'Invalid or expired invitation.',
                isLoading: false,
              });
            }
          });
        }
      }
    } catch {
      // ignore
    }
  }, [onValidateInvitation]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setGeneratedResetUrl(null);
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const token = inviteSession?.token || '';

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Please enter a secure password of at least 6 characters.');
      return;
    }

    if (inviteMode === 'new') {
      if (confirmPassword && password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter your password.');
        return;
      }

      if (!onAcceptInvitation) {
        setIsLoading(true);
        try {
          const res = await onRegister(cleanName || cleanEmail.split('@')[0], cleanEmail, password);
          if (res.success) {
            onNotify('success', 'Account created and workspace invitation accepted!');
          } else {
            setErrorMessage(res.error || 'Failed to complete registration.');
          }
        } catch (err: any) {
          setErrorMessage(err.message || 'Registration failed.');
        } finally {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const res = await onAcceptInvitation({
          token,
          email: cleanEmail,
          password,
          name: cleanName,
        });

        if (res.success && res.user) {
          onNotify('success', `Welcome to the workspace, ${res.user.name || 'User'}! Assigned role: ${res.user.role.toUpperCase()}.`);
          if (typeof window !== 'undefined' && window.history) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        } else {
          setErrorMessage(res.error || 'Failed to accept invitation. Please verify your details or request a new invite.');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'An error occurred while accepting the invitation.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Existing User Acceptance Flow
    setIsLoading(true);
    try {
      // 1. Attempt login with credentials; backend auto-accepts invitation if verified
      const loginRes = await onLogin(cleanEmail, password);
      if (loginRes.success && loginRes.user) {
        onNotify('success', `Welcome back, ${loginRes.user.name || 'User'}! Workspace invitation accepted.`);
        if (typeof window !== 'undefined' && window.history) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        return;
      }

      // 2. Fallback to onAcceptInvitation if provided
      if (onAcceptInvitation) {
        const acceptRes = await onAcceptInvitation({
          token,
          email: cleanEmail,
          password,
          name: cleanName,
        });

        if (acceptRes.success && acceptRes.user) {
          onNotify('success', `Welcome back, ${acceptRes.user.name || 'User'}! Workspace invitation accepted.`);
          if (typeof window !== 'undefined' && window.history) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          return;
        } else {
          setErrorMessage(acceptRes.error || loginRes.error || 'Failed to authenticate and accept invitation.');
          return;
        }
      }

      setErrorMessage(loginRes.error || 'Invalid email or password.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await onLogin(cleanEmail, password);
      if (res.success && res.user) {
        onNotify('success', `Welcome back, ${res.user.name || 'User'}! Personal dashboard loaded.`);
      } else {
        if (res.hasPendingInvitation) {
          setErrorMessage(res.error || 'You have a pending invitation.');
          setInviteSession({
            token: '',
            email: cleanEmail,
            role: 'manager',
            isValid: true,
            isLoading: false,
          });
        } else {
          setErrorMessage(res.error || 'Invalid email or password. Please try again.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await onRegister(cleanName, cleanEmail, password);
      if (res.success && res.user) {
        onNotify('success', `Account created successfully! Welcome to Atul Expense Manager, ${cleanName}.`);
      } else {
        setErrorMessage(res.error || 'Failed to create account. Email may already be in use.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Send Password Reset Link to Email (NO password inputs here!)
  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setGeneratedResetUrl(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      let res;
      if (onRequestPasswordReset) {
        res = await onRequestPasswordReset(cleanEmail);
      } else if (onResetPassword) {
        res = await onResetPassword(cleanEmail);
      } else {
        throw new Error('Password reset handler not available.');
      }

      if (res.success) {
        if (res.dispatched) {
          setSuccessMessage(
            res.message ||
              `A secure password reset link has been dispatched to ${cleanEmail}. Please check your Gmail inbox and spam folder.`
          );
          onNotify('success', `Reset link sent to ${cleanEmail}`);
        } else {
          setSuccessMessage(
            res.message ||
              'A verified password reset link has been generated. To have emails delivered directly to Gmail in production, configure GMAIL_APP_PASSWORD or RESEND_API_KEY in Vercel.'
          );
          if (res.resetUrl) {
            setGeneratedResetUrl(res.resetUrl);
          }
        }
      } else {
        setErrorMessage(res.error || 'Could not find an account with this email address.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch password reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Set New Password (ONLY accessible via verified email link)
  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!resetSession || !resetSession.email) {
      setErrorMessage('Invalid session. Please request a new password reset link.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    setIsLoading(true);
    try {
      let res;
      if (onConfirmPasswordReset) {
        res = await onConfirmPasswordReset({
          email: resetSession.email,
          newPassword: password,
          token: resetSession.token,
          expires: resetSession.expires,
          oobCode: resetSession.oobCode,
        });
      } else if (onResetPassword) {
        res = await onResetPassword(
          resetSession.email,
          password,
          resetSession.token,
          resetSession.expires,
          resetSession.oobCode
        );
      } else {
        throw new Error('Password confirmation handler not available.');
      }

      if (res.success) {
        setSuccessMessage(res.message || 'Password successfully updated! Redirecting to Sign In...');
        onNotify('success', 'Password reset successfully! You can now sign in.');

        // Clean up URL query parameters
        if (typeof window !== 'undefined' && window.history) {
          window.history.replaceState(null, '', window.location.pathname);
        }

        setTimeout(() => {
          setResetSession(null);
          setActiveTab('signin');
          setPassword('');
          setConfirmPassword('');
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Invalid or expired password reset link. Please request a new one.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  const openVerifiedResetLink = (url: string) => {
    try {
      const parsed = new URL(url);
      const token = parsed.searchParams.get('token') || '';
      const emailParam = parsed.searchParams.get('email') || '';
      const expiresParam = parsed.searchParams.get('expires');
      setResetSession({
        email: decodeURIComponent(emailParam),
        token,
        expires: expiresParam ? parseInt(expiresParam, 10) : undefined,
      });
      setActiveTab('reset-confirmed');
      setSuccessMessage(null);
      setErrorMessage(null);
    } catch {
      window.location.href = url;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg shadow-sm shadow-blue-500/20">
              A
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <span>Atul Expense Manager</span>
                <span className="hidden sm:inline-block rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                  Multi-User Cloud
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Secure Personal Accounts & Financial Privacy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Authentication Hero Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Brand & Security Guarantees */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
                <Lock className="h-3 w-3" />
                <span>Strict Per-User Data Isolation</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Private, Multi-User Expense & Transit Audit
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
                Create a personal account to track trips, log business transactions, manage reimbursements, and inspect payment proofs in complete privacy.
              </p>
            </div>

            {/* Privacy Architecture Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Zero Cross-User Access</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Your expenses, trips, and figures are cryptographically tied to your user ID and inaccessible to others.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <Receipt className="h-4 w-4" />
                  <span>Clean Personal Dashboard</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  New users start with a fresh ₹0.00 workspace. No demo data contamination or shared records.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                  <Wallet className="h-4 w-4" />
                  <span>Reimbursement Ledger</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Track advance disbursements, calculate pending claims, and balance personal accounts accurately.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                  <PieChart className="h-4 w-4" />
                  <span>Category Insights</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Real-time interactive analytics across transit, lodging, food & beverages, and porter dispatches.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="rounded-3xl border border-slate-800 bg-slate-800/90 shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
              {/* Tab Selector or Invitation Banner */}
              {activeTab === 'invite' ? (
                <div className="flex items-center justify-between p-1 rounded-2xl bg-blue-950/60 border border-blue-500/30 text-xs font-semibold px-3.5 py-2.5">
                  <div className="flex items-center gap-2 text-blue-400">
                    <UserCheck className="h-4 w-4" />
                    <span>Workspace Invitation</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signin');
                      resetForm();
                    }}
                    className="text-[11px] text-slate-400 hover:text-white underline"
                  >
                    Switch to Sign In
                  </button>
                </div>
              ) : (
                activeTab !== 'reset-confirmed' && (
                  <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('signin');
                        resetForm();
                      }}
                      className={`py-2 rounded-xl transition-all ${
                        activeTab === 'signin'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('signup');
                        resetForm();
                      }}
                      className={`py-2 rounded-xl transition-all ${
                        activeTab === 'signup'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Create Account
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('forgot');
                        resetForm();
                      }}
                      className={`py-2 rounded-xl transition-all ${
                        activeTab === 'forgot'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Recovery
                    </button>
                  </div>
                )
              )}

              {/* Status Notifications */}
              {errorMessage && (
                <div className="flex flex-col gap-2 rounded-2xl bg-rose-500/10 p-3.5 text-xs text-rose-300 border border-rose-500/20 animate-fade-in">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                    <span className="leading-relaxed">{errorMessage}</span>
                  </div>
                  {inviteSession && activeTab === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('invite');
                        setErrorMessage(null);
                      }}
                      className="self-start inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-[11px] font-bold text-white transition-all shadow-xs mt-1"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Accept Workspace Invitation & Create Password</span>
                    </button>
                  )}
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-500/10 p-3.5 text-xs text-emerald-300 border border-emerald-500/20 animate-fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                  <div className="space-y-2">
                    <span className="leading-relaxed block">{successMessage}</span>
                    {generatedResetUrl && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => openVerifiedResetLink(generatedResetUrl)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white transition-all shadow-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Open Verified Reset Link</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form 0: Accept Workspace Invitation (Google Sheets Style) */}
              {activeTab === 'invite' && (
                <div className="space-y-4 animate-fade-in">
                  {inviteSession?.isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                      <p className="text-xs font-semibold text-slate-300">
                        Validating workspace invitation...
                      </p>
                    </div>
                  ) : inviteSession?.isValid === false ? (
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-center space-y-3">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
                        <AlertCircle className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-bold text-white">Unable to Accept Invitation</h3>
                      <p className="text-xs text-rose-300 leading-relaxed">
                        {inviteSession.validationError || 'This invitation link is not valid or has expired.'}
                      </p>
                      <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('signin');
                            resetForm();
                          }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition-colors"
                        >
                          <LogIn className="h-3.5 w-3.5" />
                          <span>Sign In to Existing Account</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Google Sheets Collaboration Card */}
                      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 overflow-hidden shadow-lg">
                        {/* Green Top Sheets Banner */}
                        <div className="bg-[#0f9d58] px-4 py-2.5 flex items-center justify-between text-white">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            <span className="text-xs font-bold tracking-tight">Atul Expense Manager</span>
                          </div>
                          <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            Invitation
                          </span>
                        </div>

                        <div className="p-4 space-y-3">
                          <div>
                            <p className="text-xs text-emerald-400 font-semibold mb-0.5">
                              Collaboration Invitation
                            </p>
                            <h3 className="text-sm font-bold text-white">
                              Atul has invited you to collaborate
                            </h3>
                            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                              You've been authorized to access <strong>Atul Enterprise Expense Account</strong> as{' '}
                              <span className="text-emerald-300 font-bold">
                                {inviteSession?.role === 'owner' ? 'Co-Owner' : 'Manager / Auditor'}
                              </span>.
                            </p>
                          </div>

                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-200 leading-relaxed">
                            <span className="font-semibold block text-emerald-300 mb-0.5">
                              🛡️ Read-Only Audit Mode Permissions:
                            </span>
                            Review expenses, inspect uploaded digital receipts, verify trip budgets, and audit financial calculations. Financial totals and deletion privileges remain securely protected.
                          </div>

                          {/* Mode Toggle: New User vs Existing User */}
                          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                            <button
                              type="button"
                              onClick={() => {
                                setInviteMode('new');
                                setErrorMessage(null);
                              }}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                                inviteMode === 'new'
                                  ? 'bg-[#0f9d58] text-white shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              New Account (Set Password)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setInviteMode('existing');
                                setErrorMessage(null);
                              }}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                                inviteMode === 'existing'
                                  ? 'bg-[#0f9d58] text-white shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Existing Account (Sign In)
                            </button>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleAcceptInvite} className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                            Account Email Address (ईमेल)
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Your authorized email address"
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                          />
                          {inviteSession?.email && email.trim().toLowerCase() !== inviteSession.email.toLowerCase() && (
                            <p className="text-[10px] text-amber-400 mt-1">
                              ⚠️ Note: This invitation was issued for {inviteSession.email}. Please use this email address.
                            </p>
                          )}
                        </div>

                        {inviteMode === 'new' && (
                          <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                              Full Name (नाम)
                            </label>
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Enter your full name"
                              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                            />
                          </div>
                        )}

                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                            {inviteMode === 'new' ? 'Create Account Password (पासवर्ड)' : 'Account Password (पासवर्ड)'}
                          </label>
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={inviteMode === 'new' ? 'Choose a strong password (min. 6 characters)' : 'Enter your password'}
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                          />
                        </div>

                        {inviteMode === 'new' && (
                          <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                              Confirm Password (पासवर्ड दोहराएं)
                            </label>
                            <input
                              type="password"
                              required
                              minLength={6}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Re-enter your password"
                              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                            />
                          </div>
                        )}

                        {/* Google Sheets prominent Open Button */}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0f9d58] hover:bg-[#0b8043] active:scale-98 py-3.5 text-xs font-bold text-white shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>
                            {isLoading
                              ? 'Opening Expense Manager...'
                              : inviteMode === 'new'
                              ? 'Open Expense Manager'
                              : 'Sign In & Open Expense Manager'}
                          </span>
                        </button>

                        <div className="pt-2 text-center text-xs text-slate-400">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('signin');
                              resetForm();
                            }}
                            className="inline-flex items-center gap-1 font-semibold text-slate-400 hover:text-white"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Return to Sign In</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* Form 1: Sign In */}
              {activeTab === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email (e.g. atul.wendor@gmail.com)"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('forgot');
                          resetForm();
                        }}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password (optional for local/demo)"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 py-3 text-xs font-bold text-white shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>{isLoading ? 'Verifying Account...' : 'Sign In to Your Workspace'}</span>
                  </button>

                  <div className="pt-2 text-center text-xs text-slate-400">
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('signup');
                        resetForm();
                      }}
                      className="font-bold text-blue-400 hover:text-blue-300 underline"
                    >
                      Create personal account
                    </button>
                  </div>
                </form>
              )}

              {/* Form 2: Sign Up */}
              {activeTab === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your personal or business email"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Password (min. 6 characters)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Choose a strong password"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 py-3 text-xs font-bold text-white shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>{isLoading ? 'Creating Your Account...' : 'Register Personal Account'}</span>
                  </button>

                  <div className="pt-2 text-center text-xs text-slate-400">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('signin');
                        resetForm();
                      }}
                      className="font-bold text-blue-400 hover:text-blue-300 underline"
                    >
                      Sign In here
                    </button>
                  </div>
                </form>
              )}

              {/* Form 3: Forgot Password (Sends Verified Link to Email - NO direct password inputs!) */}
              {activeTab === 'forgot' && (
                <form onSubmit={handleSendResetLink} className="space-y-4">
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Email Verification Required</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Enter your registered email address. We will send a secure, single-use password reset link to your email inbox. For your account security, passwords can only be changed by opening that verified link.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Account Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter registered email (e.g. atul.wendor@gmail.com)"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 py-3 text-xs font-bold text-white shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50"
                  >
                    <Mail className="h-4 w-4" />
                    <span>{isLoading ? 'Generating Verified Link...' : 'Send Password Reset Link to Email'}</span>
                  </button>

                  <div className="pt-2 text-center text-xs text-slate-400">
                    Remembered your password?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('signin');
                        resetForm();
                      }}
                      className="font-bold text-blue-400 hover:text-blue-300 underline"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* Form 4: Verified Password Reset Form (ONLY shown when opened from Email Link!) */}
              {activeTab === 'reset-confirmed' && resetSession && (
                <form onSubmit={handleConfirmPasswordReset} className="space-y-4 animate-fade-in">
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Lock className="h-4 w-4" />
                      <span>Verified Password Reset Link Active</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      You are authenticated via a secure one-time link. Enter a new password below for account{' '}
                      <span className="font-semibold text-white underline">{resetSession.email}</span>.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      New Password (min. 6 characters)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 py-3 text-xs font-bold text-white shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50"
                  >
                    <KeyRound className="h-4 w-4" />
                    <span>{isLoading ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
                  </button>

                  <div className="pt-2 text-center text-xs text-slate-400">
                    <button
                      type="button"
                      onClick={() => {
                        setResetSession(null);
                        setActiveTab('signin');
                        resetForm();
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-slate-400 hover:text-white"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Cancel and return to Sign In</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Atul Expense Manager. Multi-user personal accounts with strict data isolation.</p>
      </footer>
    </div>
  );
};
