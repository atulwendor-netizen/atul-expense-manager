import React, { useState } from 'react';
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
} from 'lucide-react';

interface PublicAuthPortalProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; user?: any; error?: string }>;
  onRegister: (name: string, email: string, password: string) => Promise<{ success: boolean; user?: any; error?: string }>;
  onResetPassword: (email: string, newPassword?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onNotify: (type: 'success' | 'warning' | 'info' | 'error', text: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const PublicAuthPortal: React.FC<PublicAuthPortalProps> = ({
  onLogin,
  onRegister,
  onResetPassword,
  onNotify,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
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
        setErrorMessage(res.error || 'Invalid email or password. Please try again.');
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Please enter a new password of at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await onResetPassword(cleanEmail, password);
      if (res.success) {
        setSuccessMessage(res.message || 'Password successfully updated! Redirecting to Sign In...');
        onNotify('success', 'Password reset successfully! You can now sign in.');
        setTimeout(() => {
          setActiveTab('signin');
          setPassword('');
          setConfirmPassword('');
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Could not update password for this account.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
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
              {/* Tab Selector */}
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

              {/* Status Notifications */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-rose-500/10 p-3.5 text-xs text-rose-300 border border-rose-500/20 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-500/10 p-3.5 text-xs text-emerald-300 border border-emerald-500/20 animate-fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span className="leading-relaxed">{successMessage}</span>
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
                      placeholder="Enter your email (e.g. name@domain.com)"
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
                        onClick={() => setActiveTab('forgot')}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
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

              {/* Form 3: Forgot Password / Direct Password Reset */}
              {activeTab === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="text-xs text-slate-400 leading-relaxed">
                    Enter your account email and choose a new password to update your login credentials immediately.
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
                      placeholder="Enter your registered email (e.g. atul.wendor@gmail.com)"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password (min. 6 characters)"
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
                    <span>{isLoading ? 'Updating Password...' : 'Reset & Update Password'}</span>
                  </button>

                  <div className="pt-2 text-center text-xs text-slate-400">
                    Remembered your credentials?{' '}
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
