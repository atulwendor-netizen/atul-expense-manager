import React, { useState } from 'react';
import {
  UserProfile,
  UserRole,
  WorkspaceMember,
  WorkspaceInvitation,
} from '../types/index';
import {
  Users,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  Ban,
  CheckCircle2,
  Mail,
  Database,
  Cloud,
  Key,
  Lock,
  Copy,
  Check,
  Share2,
  Globe,
} from 'lucide-react';
import { saveSupabaseConfig, clearSupabaseConfig, isSupabaseConfigured } from '../services/supabase';

interface UserManagementSectionProps {
  currentUser: UserProfile;
  members: WorkspaceMember[];
  invitations: WorkspaceInvitation[];
  onInviteManager: (email: string, role: UserRole) => void;
  onRevokeAccess: (userId: string) => void;
  onReactivateUser: (userId: string) => void;
  onChangeUserRole: (userId: string, newRole: UserRole) => void;
  onMigrateToCloud: () => {
    success: boolean;
    expensesImported: number;
    reimbursementsImported: number;
    tripsImported: number;
    skippedDuplicates: number;
    message: string;
  };
  onNotify: (type: 'success' | 'warning' | 'info' | 'error', text: string) => void;
}

export const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  currentUser,
  members,
  invitations,
  onInviteManager,
  onRevokeAccess,
  onReactivateUser,
  onChangeUserRole,
  onMigrateToCloud,
  onNotify,
}) => {
  const isOwner = currentUser.role === 'owner';
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('manager');
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<WorkspaceMember | null>(null);
  const [createdInviteModal, setCreatedInviteModal] = useState<{ email: string; role: UserRole; link: string; mailto: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleReactivate = (userId: string, name: string) => {
    try {
      onReactivateUser(userId);
      onNotify('success', `Access successfully restored for ${name}. Account status is now Active.`);
      if (selectedUserForDetails && (selectedUserForDetails.userId === userId || selectedUserForDetails.id === userId)) {
        setSelectedUserForDetails({ ...selectedUserForDetails, status: 'active' });
      }
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to reactivate user');
    }
  };

  const handleRevoke = (userId: string, name: string) => {
    try {
      onRevokeAccess(userId);
      onNotify('warning', `Access revoked for ${name}. Account session is locked.`);
      if (selectedUserForDetails && (selectedUserForDetails.userId === userId || selectedUserForDetails.id === userId)) {
        setSelectedUserForDetails({ ...selectedUserForDetails, status: 'revoked' });
      }
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to revoke access');
    }
  };

  const handleChangeRole = (userId: string, newRole: UserRole, name: string) => {
    try {
      onChangeUserRole(userId, newRole);
      onNotify('success', `Updated role for ${name} to ${newRole.toUpperCase()}.`);
      if (selectedUserForDetails && (selectedUserForDetails.userId === userId || selectedUserForDetails.id === userId)) {
        setSelectedUserForDetails({ ...selectedUserForDetails, role: newRole });
      }
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to change role');
    }
  };

  // Cloud configuration state
  const [supabaseUrl, setSupabaseUrl] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('atul_expense_manager_supabase_url') || '';
    }
    return '';
  });
  const [supabaseKey, setSupabaseKey] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('atul_expense_manager_supabase_key') || '';
    }
    return '';
  });

  const getInviteLink = (email: string, role: UserRole) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://atul-expense-manager.vercel.app';
    return `${origin}/?role=${role}&email=${encodeURIComponent(email)}`;
  };

  const getMailtoLink = (email: string, role: UserRole) => {
    const link = getInviteLink(email, role);
    const subject = encodeURIComponent('Invitation to Atul Expense Manager as Manager / Auditor');
    const body = encodeURIComponent(
      `Hello,\n\nYou have been invited by Atul to access the Atul Expense Manager workspace as a Manager / Auditor (Read-Only Audit Mode).\n\nClick the link below to open your workspace directly:\n${link}\n\nBest regards,\nAtul`
    );
    return `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleCopyLink = (id: string, link: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setCopiedId(id);
    onNotify('success', 'Invitation link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getMasterPortalLink = () => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://atul-expense-manager.vercel.app';
    return `${origin}/login`;
  };

  const getWhatsAppShareLink = () => {
    const link = getMasterPortalLink();
    const text = encodeURIComponent(
      `Hello! Please access the Atul Expense Manager portal using this Master Link:\n\n${link}\n\nSimply click the link and enter your email address to log in directly. No password is required for Managers / Auditors.`
    );
    return `https://wa.me/?text=${text}`;
  };

  const getInviteMessageText = () => {
    const link = getMasterPortalLink();
    return `Hello,\n\nYou have been authorized to access the Atul Expense Manager workspace.\n\nPlease use this Master Link to log in:\n${link}\n\nInstructions:\n1. Click the link above\n2. Enter your authorized email address\n3. Click 'Sign In to Workspace'\n\nYou will be logged in directly with your assigned permissions (Read-Only Audit Mode).\n\nBest regards,\nAtul`;
  };

  const handleCopyMasterLink = () => {
    const link = getMasterPortalLink();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setCopiedId('master-link');
    onNotify('success', 'Master Link copied to clipboard! Share this single link with all users.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyInviteMessage = () => {
    const message = getInviteMessageText();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(message);
    }
    setCopiedId('master-message');
    onNotify('success', 'Full invitation message copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inviteEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      onNotify('error', 'Please enter a valid email address');
      return;
    }
    try {
      onInviteManager(cleanEmail, inviteRole);
      const link = getInviteLink(cleanEmail, inviteRole);
      const mailto = getMailtoLink(cleanEmail, inviteRole);
      setCreatedInviteModal({
        email: cleanEmail,
        role: inviteRole,
        link,
        mailto,
      });
      setInviteEmail('');
      setIsInviteModalOpen(false);
      onNotify('success', `Invitation created for ${cleanEmail}! You can now share the access link.`);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to send invitation');
    }
  };

  const handleRunMigration = () => {
    try {
      const res = onMigrateToCloud();
      onNotify('success', res.message);
    } catch (err: any) {
      onNotify('error', err.message || 'Migration failed');
    }
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      clearSupabaseConfig();
      onNotify('info', 'Reset to built-in secure cloud backend engine');
      return;
    }
    saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
    onNotify('success', 'Supabase credentials saved and connected successfully');
  };

  // If logged in as Manager: show read-only audit profile
  if (!isOwner) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800/80 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                User Management & Access Control
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current account profile and authorization tier
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
            <Lock className="h-3.5 w-3.5" />
            Read Only — Audit Mode
          </span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Logged In User
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {currentUser.name} ({currentUser.email})
              </p>
            </div>
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Manager / Auditor
            </span>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-700">
            <p>
              • <strong>Financial Records:</strong> Read-only access to all Expenses, Trips, Reimbursements, Analytics, and Reports.
            </p>
            <p>
              • <strong>Coordination:</strong> Fully authorized to participate in Team Chat, post inquiries, and review receipts.
            </p>
            <p>
              • <strong>Governance:</strong> User management and destructive operations are strictly restricted to the Account Owner.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // OWNER VIEW
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800/80 dark:bg-slate-900 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            User Management & Role Permissions (Owner Only)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage authorized workspace users, invite Managers / Auditors, and monitor access status
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 self-start sm:self-auto transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          <span>Invite Manager</span>
        </button>
      </div>

      {/* Universal Master Access Link Card */}
      <div className="rounded-2xl border-2 border-blue-500/20 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white p-5 shadow-xs dark:border-blue-900/60 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shrink-0">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Universal Master Access Link (मास्टर एक्सेस लिंक)
                </h3>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  One Link for All Users
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Send this single master link to all team members, accountants, and auditors. Users simply enter their email ID to log in!
              </p>
            </div>
          </div>
        </div>

        {/* Master Link URL Bar & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              readOnly
              value={getMasterPortalLink()}
              className="w-full rounded-xl border border-blue-200 bg-white px-3.5 py-2.5 text-xs font-mono font-medium text-blue-950 shadow-inner select-all focus:outline-none dark:border-blue-900 dark:bg-slate-800 dark:text-blue-200"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyMasterLink}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-98 transition-all"
            >
              {copiedId === 'master-link' ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Master Link</span>
                </>
              )}
            </button>

            <a
              href={getWhatsAppShareLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>Share on WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleCopyInviteMessage}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
            >
              {copiedId === 'master-message' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <span>Copy Message</span>
              )}
            </button>
          </div>
        </div>

        {/* Hindi & English Helper note */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-blue-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-1.5">
            <span className="text-blue-600 font-bold shrink-0">🇮🇳 हिंदी:</span>
            <span>
              अलग-अलग यूज़र को अलग लिंक भेजने की ज़रूरत नहीं है। यह एक ही लिंक सबको भेजें, वे केवल अपना ईमेल आईडी डालकर तुरंत लॉगिन कर सकते हैं।
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-blue-600 font-bold shrink-0">🇬🇧 English:</span>
            <span>
              No need to generate separate links. Send this master link to everyone. Users enter their email and log in directly as Read-Only Managers / Auditors.
            </span>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Authorized Users ({members.length})
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {members.map((member) => {
                const isMemberOwner = member.role === 'owner';
                const isRevoked = member.status === 'revoked';

                return (
                  <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-xs dark:bg-slate-700 dark:text-slate-200">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {member.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {isMemberOwner ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          <ShieldCheck className="h-3 w-3" />
                          Owner
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <ShieldAlert className="h-3 w-3" />
                          Manager / Auditor
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {isRevoked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          <Ban className="h-2.5 w-2.5" />
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Active
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-500">
                      {new Date(member.joinedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedUserForDetails(member)}
                          className="rounded-lg px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Details
                        </button>

                        {!isMemberOwner && !isRevoked && (
                          <button
                            onClick={() => handleRevoke(member.userId, member.name)}
                            className="rounded-lg px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            Revoke Access
                          </button>
                        )}

                        {!isMemberOwner && isRevoked && (
                          <button
                            onClick={() => handleReactivate(member.userId, member.name)}
                            className="rounded-lg px-2.5 py-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 transition-colors"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Invitations ({invitations.length})
          </h3>
          <div className="space-y-2">
            {invitations.map((inv) => {
              const link = getInviteLink(inv.email, inv.role);
              const mailto = getMailtoLink(inv.email, inv.role);
              const isCopied = copiedId === inv.id;

              return (
                <div
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs gap-3"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-white truncate">{inv.email}</span>
                    <span className="rounded bg-blue-100 text-blue-700 px-1.5 py-0.2 text-[10px] font-bold uppercase dark:bg-blue-950 dark:text-blue-300 shrink-0">
                      {inv.role}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 capitalize shrink-0">
                      • {inv.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(inv.id, link)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                      <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                    </button>

                    <a
                      href={mailto}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Send Email</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cloud Data Migration Card */}
      <div className="rounded-2xl border border-blue-200/70 bg-blue-50/40 p-5 dark:border-blue-900/50 dark:bg-blue-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Cloud Database Synchronization & Migration
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Idempotently migrate verified local expense records to the authenticated cloud backend. Preserves all 78 original rows (77 valid, 1 incomplete) without duplicate entries.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunMigration}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 shrink-0 transition-colors"
          >
            <Cloud className="h-3.5 w-3.5" />
            <span>Migrate Local Data to Cloud</span>
          </button>
        </div>
      </div>

      {/* Direct Supabase Postgres Connection Config */}
      <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-2 mb-2">
          <Key className="h-4 w-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            Supabase Connection & Environment Settings
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
            {isSupabaseConfigured() ? 'Supabase Connected' : 'Engine Ready'}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
          The system uses PostgreSQL schema with Row Level Security (`supabase_schema.sql`). You can configure your project URL and anon public key below or via `.env`.
        </p>

        <form onSubmit={handleSaveSupabase} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Supabase Anon Public API Key
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              * Leave empty to run in local backend simulation mode with identical RBAC rules.
            </span>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>

      {/* Invite Manager Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Invite Manager / Auditor
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter the email address of the auditor. They will receive an invitation link to create/access their own account.
            </p>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Manager Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="manager@auditfirm.com"
                    className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Role Assignment
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="manager">Manager / Auditor (Read Only Audit Mode)</option>
                  <option value="owner">Co-Owner (Full Administrative Access)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Managers can view expenses, export reports, and chat, but cannot alter financial data.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUserForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              User Profile Details
            </h3>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Name:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedUserForDetails.name}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Email:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedUserForDetails.email}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Role:</span>
                {selectedUserForDetails.role === 'owner' ? (
                  <span className="font-semibold text-slate-900 dark:text-white">Primary Owner</span>
                ) : (
                  <select
                    value={selectedUserForDetails.role}
                    onChange={(e) =>
                      handleChangeRole(
                        selectedUserForDetails.userId,
                        e.target.value as UserRole,
                        selectedUserForDetails.name
                      )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="manager">Manager / Auditor</option>
                    <option value="owner">Co-Owner</option>
                  </select>
                )}
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Status:</span>
                <span className="font-semibold capitalize text-slate-900 dark:text-white">
                  {selectedUserForDetails.status}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">User ID:</span>
                <span className="font-mono text-[10px] text-slate-500">
                  {selectedUserForDetails.userId}
                </span>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              {selectedUserForDetails.role !== 'owner' && (
                selectedUserForDetails.status === 'revoked' ? (
                  <button
                    onClick={() => handleReactivate(selectedUserForDetails.userId, selectedUserForDetails.name)}
                    className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                  >
                    Reactivate Access
                  </button>
                ) : (
                  <button
                    onClick={() => handleRevoke(selectedUserForDetails.userId, selectedUserForDetails.name)}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 transition-colors"
                  >
                    Revoke Access
                  </button>
                )
              )}
              <button
                onClick={() => setSelectedUserForDetails(null)}
                className="ml-auto rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invitation Created & Share Modal */}
      {createdInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Invitation Created Successfully!
                </h3>
                <p className="text-xs text-slate-500">
                  Role: {createdInviteModal.role.toUpperCase()} • {createdInviteModal.email}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              The invitation record is registered. You can copy the direct access link below and send it to the user via WhatsApp, Email, or Slack:
            </p>

            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Direct Workspace Access Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdInviteModal.link}
                  className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-200 select-all outline-none font-mono truncate"
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink('modal', createdInviteModal.link)}
                  className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {copiedId === 'modal' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedId === 'modal' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <a
                href={createdInviteModal.mailto}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Open in Email / Gmail</span>
              </a>

              <button
                type="button"
                onClick={() => setCreatedInviteModal(null)}
                className="w-full sm:w-auto rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
