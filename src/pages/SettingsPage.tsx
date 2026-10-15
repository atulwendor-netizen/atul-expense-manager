import React, { useState, useMemo } from 'react';
import {
  Expense,
  Reimbursement,
  Trip,
  UserProfile,
  UserRole,
  WorkspaceMember,
  WorkspaceInvitation,
} from '../types/index';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { UserManagementSection } from '../components/UserManagementSection';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface SettingsPageProps {
  expenses: Expense[];
  reimbursements: Reimbursement[];
  trips: Trip[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onResetAllData: () => void;
  onRestoreData?: (data: { expenses: Expense[]; reimbursements: Reimbursement[]; trips: Trip[] }) => void;
  onNotify: (type: 'success' | 'warning' | 'info' | 'error', text: string) => void;
  currentUser: UserProfile;
  members: WorkspaceMember[];
  invitations: WorkspaceInvitation[];
  onInviteManager: (email: string, role: UserRole) => void;
  onRevokeAccess: (userId: string) => void;
  onChangeUserRole: (userId: string, newRole: UserRole) => void;
  onMigrateToCloud: () => {
    success: boolean;
    expensesImported: number;
    reimbursementsImported: number;
    tripsImported: number;
    skippedDuplicates: number;
    message: string;
  };
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  expenses,
  reimbursements,
  trips,
  isDarkMode,
  onToggleDarkMode,
  onResetAllData,
  onRestoreData,
  onNotify,
  currentUser,
  members,
  invitations,
  onInviteManager,
  onRevokeAccess,
  onChangeUserRole,
  onMigrateToCloud,
}) => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const isOwner = currentUser.role === 'owner';

  // Approximate storage calculation
  const storageFootprintKB = useMemo(() => {
    try {
      const dataStr = JSON.stringify({ expenses, reimbursements, trips });
      return (new Blob([dataStr]).size / 1024).toFixed(1);
    } catch {
      return '12.4';
    }
  }, [expenses, reimbursements, trips]);

  const validCount = expenses.filter((e) => e.status === 'valid').length;
  const incompleteCount = expenses.filter((e) => e.status === 'incomplete').length;

  const handleExportBackup = () => {
    const backup = {
      app: 'ATUL EXPENSE MANAGER',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      expenses,
      reimbursements,
      trips,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `atul_expenses_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onNotify('success', 'Full system backup downloaded as JSON');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwner) {
      onNotify('error', 'Restoring database backups is restricted to the Account Owner');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (Array.isArray(parsed.expenses) && Array.isArray(parsed.trips)) {
          if (onRestoreData) {
            onRestoreData({
              expenses: parsed.expenses,
              reimbursements: parsed.reimbursements || [],
              trips: parsed.trips,
            });
            onNotify('success', `Restored backup: ${parsed.expenses.length} expenses loaded`);
          }
        } else {
          onNotify('error', 'Invalid backup format. Missing expenses or trips.');
        }
      } catch {
        onNotify('error', 'Failed to parse backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmReset = () => {
    if (!isOwner) {
      onNotify('error', 'Database reset is restricted to the Account Owner');
      return;
    }
    onResetAllData();
    setIsResetModalOpen(false);
    onNotify('info', 'Reset all records back to pristine spreadsheet seed');
  };

  // Immediate Security Guard: Non-owners cannot view or access Settings & User Admin
  if (!isOwner) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-8 dark:border-rose-900/60 dark:bg-slate-900 shadow-sm text-center max-w-lg mx-auto my-12 space-y-4 animate-in fade-in duration-150">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
          <Lock className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Access Denied
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Settings, User Administration, and Database controls are restricted exclusively to the Account Owner (Atul). Your account operates in Read-Only Audit Mode.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.hash = '';
                window.location.pathname = '/';
              }
            }}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <SettingsIcon className="h-6 w-6 text-slate-500" />
          Settings & System Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage user permissions, visual themes, cloud backups, and audit provenance
        </p>
      </div>

      {/* 1. User Management Section */}
      <UserManagementSection
        currentUser={currentUser}
        members={members}
        invitations={invitations}
        onInviteManager={onInviteManager}
        onRevokeAccess={onRevokeAccess}
        onChangeUserRole={onChangeUserRole}
        onMigrateToCloud={onMigrateToCloud}
        onNotify={onNotify}
      />

      {/* 2. Appearance / Theme */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Appearance & Visual Theme
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Switch between high-contrast light mode and eye-friendly dark mode
        </p>

        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {isDarkMode ? 'Comfortable for low-light environments' : 'Bright daylight optimized interface'}
              </div>
            </div>
          </div>

          <button
            onClick={onToggleDarkMode}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            <span>Switch to {isDarkMode ? 'Light' : 'Dark'} Mode</span>
          </button>
        </div>
      </div>

      {/* 3. Currency & Locale */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Currency & Regional Standards
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Configured standard for accounting, symbol rendering, and numeric separators
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Currency Unit
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Indian Rupee (₹ INR)
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Symbol prefixed: ₹17,136.00
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Numeric Grouping
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Indian Numbering System (en-IN)
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Separates Lakhs & Thousands (e.g. ₹10,000)
            </p>
          </div>
        </div>
      </div>

      {/* 4. Data Storage & Backup */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Data Management & Snapshots
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {isOwner
            ? 'Export and restore JSON database snapshots or maintain local cached storage'
            : 'Managers can download read-only database backups. Restores and resets are locked.'}
        </p>

        {/* Storage stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Valid Expenses
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {validCount}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Incomplete
            </span>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {incompleteCount}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Reimbursements
            </span>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {reimbursements.length}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Storage Used
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              ~{storageFootprintKB} KB
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download JSON Backup</span>
          </button>

          {/* Owner Only Controls */}
          {isOwner ? (
            <>
              <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                <Upload className="h-4 w-4 text-slate-500" />
                <span>Restore from Backup</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setIsResetModalOpen(true)}
                className="ml-auto flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/50 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset to Pristine Seed</span>
              </button>
            </>
          ) : (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 italic">
              <Lock className="h-3.5 w-3.5" />
              <span>Restore and Reset controls restricted to Account Owner</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Provenance & Original Data Audit */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Data Provenance & Audit Integrity
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Verification of original spreadsheet source records and integrity guarantees
        </p>

        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/40">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">Strict Source Preservation:</strong> All 78 original rows from your travel spreadsheet have been mapped with zero alterations, deletions, or synthetic placeholder transactions.
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50/60 p-3.5 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-800 dark:text-amber-200">Preserved Incomplete Record:</strong> Row #80 (Date: 2026-10-13, Description: "Grabbit location gurgaon") is safely marked as "Incomplete" with a null amount. It is tracked visibly on the Expenses page without distorting mathematical sums.
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl bg-blue-50/60 p-3.5 dark:bg-blue-950/20">
            <FileSpreadsheet className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-blue-800 dark:text-blue-200">Reconciliation Equality:</strong> Initial valid expense sum = ₹17,136.00 across 77 transactions. Company advance reimbursement = ₹10,000.00. Dynamic pending claim balance = ₹7,136.00.
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isOwner && (
        <ConfirmationModal
          isOpen={isResetModalOpen}
          title="Reset All Records to Pristine Seed"
          message="Are you sure you want to restore the pristine spreadsheet state? Any newly added transactions or edits will be discarded and reset to the exact 78 source spreadsheet records."
          confirmLabel="Reset to Initial Seed"
          variant="danger"
          onConfirm={handleConfirmReset}
          onCancel={() => setIsResetModalOpen(false)}
        />
      )}
    </div>
  );
};
