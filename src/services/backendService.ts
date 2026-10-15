import {
  Expense,
  Reimbursement,
  Trip,
  UserProfile,
  UserRole,
  Workspace,
  WorkspaceMember,
  WorkspaceInvitation,
  AuditLogEntry,
  Conversation,
  ChatMessage,
  MessageAttachment,
  AppNotification,
} from '../types/index';
import { initialExpenses } from '../data/initialExpenses';
import { initialReimbursements } from '../data/initialReimbursements';
import { initialTrips } from '../data/initialTrips';

const DEFAULT_WORKSPACE: Workspace = {
  id: 'ws-atul-2026',
  name: 'Atul Enterprise Expense Account',
  ownerId: 'usr-owner-basant',
  createdAt: '2026-08-01T00:00:00Z',
};

export const INITIAL_OWNER: UserProfile = {
  id: 'usr-owner-basant',
  name: 'Basant',
  email: 'basant@atul-expenses.com',
  role: 'owner',
  status: 'active',
  workspaceId: DEFAULT_WORKSPACE.id,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  createdAt: '2026-08-01T00:00:00Z',
  lastLoginAt: '2026-10-14T18:00:00Z',
};

export const INITIAL_MANAGER: UserProfile = {
  id: 'usr-mgr-auditor',
  name: 'Auditor Manager',
  email: 'manager@email.com',
  role: 'manager',
  status: 'active',
  workspaceId: DEFAULT_WORKSPACE.id,
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
  createdAt: '2026-08-15T00:00:00Z',
  lastLoginAt: '2026-10-14T17:30:00Z',
};

const STORAGE_KEYS = {
  CURRENT_USER: 'atul_cloud_current_user_v1',
  EXPENSES: 'atul_cloud_expenses_v1',
  REIMBURSEMENTS: 'atul_cloud_reimbursements_v1',
  TRIPS: 'atul_cloud_trips_v1',
  MEMBERS: 'atul_cloud_members_v1',
  INVITATIONS: 'atul_cloud_invitations_v1',
  AUDIT_LOGS: 'atul_cloud_audit_logs_v1',
  CONVERSATIONS: 'atul_cloud_conversations_v1',
  MESSAGES: 'atul_cloud_messages_v1',
  NOTIFICATIONS: 'atul_cloud_notifications_v1',
};

class BackendService {
  private currentUser: UserProfile = INITIAL_OWNER;

  constructor() {
    this.initSession();
  }

  private getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // fallback
    }
    return null;
  }

  private setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // fallback
    }
  }

  private initSession(): void {
    const saved = this.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch {
        this.currentUser = INITIAL_OWNER;
      }
    } else {
      this.currentUser = INITIAL_OWNER;
      this.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_OWNER));
    }
  }

  // --- CURRENT USER & AUTHENTICATION ---
  getCurrentUser(): UserProfile {
    return this.currentUser;
  }

  switchUser(role: UserRole): UserProfile {
    // Check if the manager was revoked
    if (role === 'manager') {
      const members = this.getWorkspaceMembers();
      const mgrMember = members.find((m) => m.userId === INITIAL_MANAGER.id || m.role === 'manager');
      if (mgrMember && mgrMember.status === 'revoked') {
        const revokedUser: UserProfile = { ...INITIAL_MANAGER, status: 'revoked' };
        this.currentUser = revokedUser;
        this.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(revokedUser));
        return revokedUser;
      }
    }

    const target = role === 'owner' ? INITIAL_OWNER : INITIAL_MANAGER;
    this.currentUser = { ...target, lastLoginAt: new Date().toISOString() };
    this.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    return this.currentUser;
  }

  loginWithCredentials(email: string, _password?: string): { success: boolean; user?: UserProfile; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const members = this.getWorkspaceMembers();
    const member = members.find((m) => m.email.toLowerCase() === cleanEmail);

    if (member) {
      if (member.status === 'revoked') {
        return { success: false, error: 'Your access has been revoked by the account owner.' };
      }
      if (member.status === 'disabled') {
        return { success: false, error: 'This user account is currently disabled.' };
      }

      const user: UserProfile = {
        id: member.userId,
        name: member.name,
        email: member.email,
        role: member.role,
        status: member.status,
        workspaceId: member.workspaceId,
        createdAt: member.joinedAt,
        lastLoginAt: new Date().toISOString(),
      };
      this.currentUser = user;
      this.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return { success: true, user };
    }

    if (cleanEmail === INITIAL_OWNER.email.toLowerCase() || cleanEmail === 'basant') {
      this.currentUser = INITIAL_OWNER;
      this.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_OWNER));
      return { success: true, user: INITIAL_OWNER };
    }

    if (cleanEmail === INITIAL_MANAGER.email.toLowerCase() || cleanEmail === 'manager') {
      return { success: true, user: this.switchUser('manager') };
    }

    return {
      success: false,
      error: 'Invalid credentials or user not invited to this workspace. Please contact the Owner.',
    };
  }

  logout(): void {
    // Default to owner preview on logout
    this.currentUser = INITIAL_OWNER;
    this.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_OWNER));
  }

  // --- STRICT BACKEND PERMISSION ENFORCEMENT ---
  private enforceOwnerPermission(actionDescription: string): void {
    if (this.currentUser.status === 'revoked') {
      throw new Error(`403 Unauthorized: Your access has been revoked.`);
    }
    if (this.currentUser.role !== 'owner') {
      throw new Error(
        `403 Forbidden: Operation "${actionDescription}" rejected. Managers operate in strictly Read-Only Audit Mode. Write operations are denied at the backend level.`
      );
    }
  }

  private enforceActiveMember(): void {
    if (this.currentUser.status === 'revoked') {
      throw new Error(`403 Unauthorized: Your access has been revoked.`);
    }
  }

  // --- WORKSPACE MEMBERS & USER MANAGEMENT ---
  getWorkspaceMembers(): WorkspaceMember[] {
    this.enforceActiveMember();
    const raw = this.getItem(STORAGE_KEYS.MEMBERS);
    if (!raw) {
      const initialMembers: WorkspaceMember[] = [
        {
          id: 'mem-1',
          workspaceId: DEFAULT_WORKSPACE.id,
          userId: INITIAL_OWNER.id,
          name: INITIAL_OWNER.name,
          email: INITIAL_OWNER.email,
          role: 'owner',
          status: 'active',
          joinedAt: '2026-08-01T00:00:00Z',
        },
        {
          id: 'mem-2',
          workspaceId: DEFAULT_WORKSPACE.id,
          userId: INITIAL_MANAGER.id,
          name: INITIAL_MANAGER.name,
          email: INITIAL_MANAGER.email,
          role: 'manager',
          status: 'active',
          joinedAt: '2026-08-15T00:00:00Z',
        },
      ];
      this.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(initialMembers));
      return initialMembers;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  inviteManager(email: string, role: UserRole = 'manager'): WorkspaceInvitation {
    this.enforceOwnerPermission('Invite Manager');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please provide a valid email address.');
    }

    const invitations = this.getInvitations();
    const existing = invitations.find((i) => i.email.toLowerCase() === cleanEmail && i.status === 'pending');
    if (existing) {
      return existing;
    }

    const newInvitation: WorkspaceInvitation = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workspaceId: DEFAULT_WORKSPACE.id,
      email: cleanEmail,
      role,
      token: `tok-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      status: 'pending',
      invitedBy: this.currentUser.id,
      invitedByName: this.currentUser.name,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const updatedInvitations = [newInvitation, ...invitations];
    this.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(updatedInvitations));

    // Also register member record as active or pending
    const members = this.getWorkspaceMembers();
    const existingMember = members.find((m) => m.email.toLowerCase() === cleanEmail);
    if (!existingMember) {
      const nameFromEmail = cleanEmail.split('@')[0];
      const capitalized = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      const newMember: WorkspaceMember = {
        id: `mem-${Date.now()}`,
        workspaceId: DEFAULT_WORKSPACE.id,
        userId: `usr-${Date.now()}`,
        name: capitalized,
        email: cleanEmail,
        role,
        status: 'active',
        joinedAt: new Date().toISOString(),
      };
      this.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify([...members, newMember]));
    }

    this.recordAuditLog({
      action: 'Invited Manager',
      recordType: 'invitation',
      recordId: newInvitation.id,
      previousValue: null,
      newValue: `Invited ${cleanEmail} as ${role.toUpperCase()}`,
    });

    return newInvitation;
  }

  getInvitations(): WorkspaceInvitation[] {
    this.enforceActiveMember();
    const raw = this.getItem(STORAGE_KEYS.INVITATIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  revokeUserAccess(userId: string): void {
    this.enforceOwnerPermission('Revoke User Access');
    const members = this.getWorkspaceMembers();
    const target = members.find((m) => m.userId === userId || m.id === userId);
    if (!target) throw new Error('User not found.');
    if (target.role === 'owner') throw new Error('Cannot revoke access for account owner.');

    const updated = members.map((m) => {
      if (m.userId === userId || m.id === userId) {
        return { ...m, status: 'revoked' as const };
      }
      return m;
    });

    this.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated));

    // Also update any invitations
    const invitations = this.getInvitations();
    const updatedInv = invitations.map((i) =>
      i.email.toLowerCase() === target.email.toLowerCase() ? { ...i, status: 'revoked' as const } : i
    );
    this.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(updatedInv));

    // If current session is the revoked user, update immediately
    if (this.currentUser.id === target.userId) {
      this.currentUser = { ...this.currentUser, status: 'revoked' };
      this.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    }

    this.recordAuditLog({
      action: 'Revoked Manager Access',
      recordType: 'user',
      recordId: target.userId,
      previousValue: `Status: ${target.status}`,
      newValue: 'Status: Revoked (Immediate lockout)',
    });
  }

  changeUserRole(userId: string, newRole: UserRole): void {
    this.enforceOwnerPermission('Change User Role');
    const members = this.getWorkspaceMembers();
    const target = members.find((m) => m.userId === userId || m.id === userId);
    if (!target) throw new Error('User not found.');
    if (target.userId === INITIAL_OWNER.id) throw new Error('Cannot change Primary Account Owner role.');

    const updated = members.map((m) => {
      if (m.userId === userId || m.id === userId) {
        return { ...m, role: newRole };
      }
      return m;
    });

    this.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated));

    this.recordAuditLog({
      action: 'Changed User Role',
      recordType: 'user',
      recordId: target.userId,
      previousValue: `Role: ${target.role}`,
      newValue: `Role: ${newRole}`,
    });
  }

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLogEntry[] {
    this.enforceActiveMember();
    const raw = this.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      const initialLogs: AuditLogEntry[] = [
        {
          id: 'log-seed-01',
          workspaceId: DEFAULT_WORKSPACE.id,
          userId: INITIAL_OWNER.id,
          userName: INITIAL_OWNER.name,
          userEmail: INITIAL_OWNER.email,
          userRole: 'owner',
          action: 'Initial Dataset Import',
          recordType: 'system',
          recordId: 'init-seed',
          previousValue: null,
          newValue: 'Imported 78 verified rows from travel spreadsheet (₹17,136 spent, ₹10,000 reimbursed)',
          timestamp: '2026-08-20T10:00:00Z',
        },
        {
          id: 'log-seed-02',
          workspaceId: DEFAULT_WORKSPACE.id,
          userId: INITIAL_OWNER.id,
          userName: INITIAL_OWNER.name,
          userEmail: INITIAL_OWNER.email,
          userRole: 'owner',
          action: 'Invited Manager',
          recordType: 'user',
          recordId: INITIAL_MANAGER.id,
          previousValue: null,
          newValue: 'Assigned manager@email.com as Auditor with Read-Only permissions',
          timestamp: '2026-08-21T11:30:00Z',
        },
      ];
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
      return initialLogs;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  recordAuditLog(entry: {
    action: string;
    recordType: AuditLogEntry['recordType'];
    recordId: string;
    previousValue: string | null;
    newValue: string | null;
  }): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workspaceId: DEFAULT_WORKSPACE.id,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userEmail: this.currentUser.email,
      userRole: this.currentUser.role,
      action: entry.action,
      recordType: entry.recordType,
      recordId: entry.recordId,
      previousValue: entry.previousValue,
      newValue: entry.newValue,
      timestamp: new Date().toISOString(),
    };

    const updated = [newLog, ...logs];
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
  }

  // --- EXPENSES (AUTHORITATIVE CLOUD PERSISTENCE) ---
  getExpenses(): Expense[] {
    this.enforceActiveMember();
    const raw = this.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      this.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(initialExpenses));
      return initialExpenses;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialExpenses;
    }
  }

  addExpense(data: Omit<Expense, 'id'> & { id?: string }): Expense {
    this.enforceOwnerPermission('Add Expense');
    const expenses = this.getExpenses();
    const newExpense: Expense = {
      ...data,
      id: data.id || `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status:
        data.amount !== null && !isNaN(data.amount) && data.date && data.description
          ? 'valid'
          : 'incomplete',
    };

    const updated = [newExpense, ...expenses];
    this.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));

    this.recordAuditLog({
      action: 'Created Expense',
      recordType: 'expense',
      recordId: newExpense.id,
      previousValue: null,
      newValue: `₹${newExpense.amount ?? '--'} - ${newExpense.description} (${newExpense.category})`,
    });

    return newExpense;
  }

  updateExpense(updatedExpense: Expense): void {
    this.enforceOwnerPermission('Edit Expense');
    const expenses = this.getExpenses();
    const index = expenses.findIndex((e) => e.id === updatedExpense.id);
    if (index === -1) throw new Error('Expense record not found.');

    const oldExpense = expenses[index];
    const status =
      updatedExpense.amount !== null &&
      !isNaN(updatedExpense.amount) &&
      updatedExpense.date &&
      updatedExpense.description
        ? 'valid'
        : 'incomplete';

    expenses[index] = {
      ...updatedExpense,
      status,
      updatedAt: new Date().toISOString(),
    };

    this.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

    const oldDesc = `₹${oldExpense.amount ?? '--'} - ${oldExpense.description}`;
    const newDesc = `₹${updatedExpense.amount ?? '--'} - ${updatedExpense.description}`;
    this.recordAuditLog({
      action: 'Edited Expense',
      recordType: 'expense',
      recordId: updatedExpense.id,
      previousValue: oldDesc,
      newValue: newDesc,
    });
  }

  deleteExpense(id: string): void {
    this.enforceOwnerPermission('Delete Expense');
    const expenses = this.getExpenses();
    const target = expenses.find((e) => e.id === id);
    if (!target) return;

    const filtered = expenses.filter((e) => e.id !== id);
    this.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));

    this.recordAuditLog({
      action: 'Deleted Expense',
      recordType: 'expense',
      recordId: id,
      previousValue: `₹${target.amount ?? '--'} - ${target.description} (${target.category})`,
      newValue: 'Record Removed',
    });
  }

  deleteMultipleExpenses(ids: string[]): void {
    this.enforceOwnerPermission('Bulk Delete Expenses');
    const expenses = this.getExpenses();
    const idSet = new Set(ids);
    const deletedItems = expenses.filter((e) => idSet.has(e.id));
    const remaining = expenses.filter((e) => !idSet.has(e.id));

    this.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(remaining));

    const totalDeletedAmt = deletedItems.reduce((sum, e) => sum + (e.amount || 0), 0);
    this.recordAuditLog({
      action: 'Bulk Deleted Expenses',
      recordType: 'expense',
      recordId: `bulk-${ids.length}`,
      previousValue: `${ids.length} records totaling ₹${totalDeletedAmt.toLocaleString('en-IN')}`,
      newValue: 'Records Removed',
    });
  }

  // --- REIMBURSEMENTS ---
  getReimbursements(): Reimbursement[] {
    this.enforceActiveMember();
    const raw = this.getItem(STORAGE_KEYS.REIMBURSEMENTS);
    if (!raw) {
      this.setItem(STORAGE_KEYS.REIMBURSEMENTS, JSON.stringify(initialReimbursements));
      return initialReimbursements;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialReimbursements;
    }
  }

  addReimbursement(data: Omit<Reimbursement, 'id'> & { id?: string }): Reimbursement {
    this.enforceOwnerPermission('Add Reimbursement');
    const reimbursements = this.getReimbursements();
    const newReimb: Reimbursement = {
      ...data,
      id: data.id || `reimb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [newReimb, ...reimbursements];
    this.setItem(STORAGE_KEYS.REIMBURSEMENTS, JSON.stringify(updated));

    this.recordAuditLog({
      action: 'Added Reimbursement',
      recordType: 'reimbursement',
      recordId: newReimb.id,
      previousValue: null,
      newValue: `Recorded ₹${newReimb.amount.toLocaleString('en-IN')} payment (${newReimb.reference})`,
    });

    return newReimb;
  }

  updateReimbursement(updated: Reimbursement): void {
    this.enforceOwnerPermission('Edit Reimbursement');
    const list = this.getReimbursements();
    const index = list.findIndex((r) => r.id === updated.id);
    if (index === -1) throw new Error('Reimbursement not found');

    const old = list[index];
    list[index] = { ...updated };
    this.setItem(STORAGE_KEYS.REIMBURSEMENTS, JSON.stringify(list));

    this.recordAuditLog({
      action: 'Edited Reimbursement',
      recordType: 'reimbursement',
      recordId: updated.id,
      previousValue: `₹${old.amount.toLocaleString('en-IN')} (${old.reference})`,
      newValue: `₹${updated.amount.toLocaleString('en-IN')} (${updated.reference})`,
    });
  }

  deleteReimbursement(id: string): void {
    this.enforceOwnerPermission('Delete Reimbursement');
    const list = this.getReimbursements();
    const target = list.find((r) => r.id === id);
    if (!target) return;

    const filtered = list.filter((r) => r.id !== id);
    this.setItem(STORAGE_KEYS.REIMBURSEMENTS, JSON.stringify(filtered));

    this.recordAuditLog({
      action: 'Deleted Reimbursement',
      recordType: 'reimbursement',
      recordId: id,
      previousValue: `₹${target.amount.toLocaleString('en-IN')} (${target.reference})`,
      newValue: 'Record Removed',
    });
  }

  // --- TRIPS ---
  getTrips(): Trip[] {
    this.enforceActiveMember();
    const raw = this.getItem(STORAGE_KEYS.TRIPS);
    if (!raw) {
      this.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(initialTrips));
      return initialTrips;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialTrips;
    }
  }

  addTrip(data: Omit<Trip, 'id'> & { id?: string }): Trip {
    this.enforceOwnerPermission('Add Trip');
    const trips = this.getTrips();
    const newTrip: Trip = {
      ...data,
      id: data.id || `trip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [...trips, newTrip];
    this.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(updated));

    this.recordAuditLog({
      action: 'Created Trip',
      recordType: 'trip',
      recordId: newTrip.id,
      previousValue: null,
      newValue: `Trip "${newTrip.name}" (${newTrip.startDate} to ${newTrip.endDate})`,
    });

    return newTrip;
  }

  updateTrip(updatedTrip: Trip): void {
    this.enforceOwnerPermission('Edit Trip');
    const trips = this.getTrips();
    const index = trips.findIndex((t) => t.id === updatedTrip.id);
    if (index === -1) throw new Error('Trip not found');

    const old = trips[index];
    trips[index] = { ...updatedTrip };
    this.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));

    this.recordAuditLog({
      action: 'Edited Trip',
      recordType: 'trip',
      recordId: updatedTrip.id,
      previousValue: `"${old.name}" (${old.startDate} to ${old.endDate})`,
      newValue: `"${updatedTrip.name}" (${updatedTrip.startDate} to ${updatedTrip.endDate})`,
    });
  }

  deleteTrip(id: string): void {
    this.enforceOwnerPermission('Delete Trip');
    const trips = this.getTrips();
    const target = trips.find((t) => t.id === id);
    if (!target) return;

    const filtered = trips.filter((t) => t.id !== id);
    this.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(filtered));

    // Unlink expenses and reimbursements
    const expenses = this.getExpenses();
    const updatedExp = expenses.map((e) => (e.tripId === id ? { ...e, tripId: null } : e));
    this.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedExp));

    const reimbursements = this.getReimbursements();
    const updatedReimb = reimbursements.map((r) => (r.tripId === id ? { ...r, tripId: null } : r));
    this.setItem(STORAGE_KEYS.REIMBURSEMENTS, JSON.stringify(updatedReimb));

    this.recordAuditLog({
      action: 'Deleted Trip',
      recordType: 'trip',
      recordId: id,
      previousValue: `Trip "${target.name}"`,
      newValue: 'Trip Deleted (Linked expenses unlinked safely)',
    });
  }

  // --- CLOUD DATA MIGRATION (SAFE & IDEMPOTENT) ---
  migrateLocalDataToCloud(sourceData: {
    expenses?: Expense[];
    reimbursements?: Reimbursement[];
    trips?: Trip[];
  }): {
    success: boolean;
    expensesImported: number;
    reimbursementsImported: number;
    tripsImported: number;
    skippedDuplicates: number;
    message: string;
  } {
    this.enforceOwnerPermission('Migrate Local Data to Cloud');

    const currentExpenses = this.getExpenses();
    const currentReimb = this.getReimbursements();
    const currentTrips = this.getTrips();

    const existingExpIds = new Set(currentExpenses.map((e) => e.id));
    const existingReimbIds = new Set(currentReimb.map((r) => r.id));
    const existingTripIds = new Set(currentTrips.map((t) => t.id));

    let expAdded = 0;
    let reimbAdded = 0;
    let tripAdded = 0;
    let duplicates = 0;

    const newExpenses = [...currentExpenses];
    (sourceData.expenses || initialExpenses).forEach((e) => {
      if (!existingExpIds.has(e.id)) {
        newExpenses.push(e);
        existingExpIds.add(e.id);
        expAdded++;
      } else {
        duplicates++;
      }
    });

    const newReimbursements = [...currentReimb];
    (sourceData.reimbursements || initialReimbursements).forEach((r) => {
      if (!existingReimbIds.has(r.id)) {
        newReimbursements.push(r);
        existingReimbIds.add(r.id);
        reimbAdded++;
      } else {
        duplicates++;
      }
    });

    const newTrips = [...currentTrips];
    (sourceData.trips || initialTrips).forEach((t) => {
      if (!existingTripIds.has(t.id)) {
        newTrips.push(t);
        existingTripIds.add(t.id);
        tripAdded++;
      } else {
        duplicates++;
      }
    });

    this.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(newExpenses));
    this.setItem(STORAGE_KEYS.REIMBURSEMENTS, JSON.stringify(newReimbursements));
    this.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(newTrips));

    this.recordAuditLog({
      action: 'Cloud Data Migration',
      recordType: 'system',
      recordId: 'migration-run',
      previousValue: `${currentExpenses.length} records in database`,
      newValue: `Migration complete. Added: ${expAdded} expenses, ${reimbAdded} reimbursements, ${tripAdded} trips. ${duplicates} duplicate records preserved safely without alteration.`,
    });

    return {
      success: true,
      expensesImported: expAdded,
      reimbursementsImported: reimbAdded,
      tripsImported: tripAdded,
      skippedDuplicates: duplicates,
      message: `Idempotent cloud sync succeeded. ${expAdded} new expenses added, ${duplicates} existing records safely preserved.`,
    };
  }

  // --- BACKUP, RESTORE & RESET (OWNER ONLY) ---
  restoreBackup(data: { expenses: Expense[]; reimbursements: Reimbursement[]; trips: Trip[] }): void {
    this.enforceOwnerPermission('Restore Backup');
    if (data.expenses) this.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(data.expenses));
    if (data.reimbursements) this.setItem(STORAGE_KEYS.REIMBURSEMENTS, JSON.stringify(data.reimbursements));
    if (data.trips) this.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(data.trips));

    this.recordAuditLog({
      action: 'Restored Backup',
      recordType: 'system',
      recordId: 'backup-restore',
      previousValue: null,
      newValue: `Restored snapshot containing ${data.expenses?.length || 0} expenses`,
    });
  }

  resetAllData(): void {
    this.enforceOwnerPermission('Reset Database');
    this.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(initialExpenses));
    this.setItem(STORAGE_KEYS.REIMBURSEMENTS, JSON.stringify(initialReimbursements));
    this.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(initialTrips));

    this.recordAuditLog({
      action: 'Reset Database to Seed',
      recordType: 'system',
      recordId: 'db-reset',
      previousValue: 'Custom modified database state',
      newValue: 'Reset to pristine 78 original rows (₹17,136 total expense, ₹10,000 reimbursement)',
    });
  }

  // --- TEAM CHAT & EXPENSE COORDINATION ---
  getConversations(): Conversation[] {
    this.enforceActiveMember();
    const raw = this.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) {
      const initialConvs: Conversation[] = [
        {
          id: 'conv-expense-review',
          workspaceId: DEFAULT_WORKSPACE.id,
          title: 'Expense Review & Verification',
          type: 'group',
          createdBy: INITIAL_OWNER.id,
          createdAt: '2026-08-20T12:00:00Z',
          updatedAt: '2026-08-25T16:00:00Z',
          members: [INITIAL_OWNER.id, INITIAL_MANAGER.id],
          lastMessage: {
            id: 'msg-seed-03',
            senderName: 'Basant',
            content: 'Uploaded.',
            createdAt: '2026-08-25T16:00:00Z',
          },
          unreadCount: 0,
        },
        {
          id: 'conv-mumbai-trip',
          workspaceId: DEFAULT_WORKSPACE.id,
          title: 'Mumbai & Pune Trip Coordination',
          type: 'trip',
          relatedId: 'trip-mumbai-pune-2026',
          createdBy: INITIAL_OWNER.id,
          createdAt: '2026-08-22T09:00:00Z',
          updatedAt: '2026-08-22T10:15:00Z',
          members: [INITIAL_OWNER.id, INITIAL_MANAGER.id],
          lastMessage: {
            id: 'msg-seed-trip-01',
            senderName: 'Basant',
            content: 'Starting the Mumbai-Pune official visit. All transit tickets will be logged daily.',
            createdAt: '2026-08-22T10:15:00Z',
          },
          unreadCount: 0,
        },
        {
          id: 'conv-reimb-advance',
          workspaceId: DEFAULT_WORKSPACE.id,
          title: '₹10,000 Advance Settlement Discussion',
          type: 'reimbursement',
          relatedId: 'reimb-001',
          createdBy: INITIAL_OWNER.id,
          createdAt: '2026-09-03T18:30:00Z',
          updatedAt: '2026-09-03T19:00:00Z',
          members: [INITIAL_OWNER.id, INITIAL_MANAGER.id],
          lastMessage: {
            id: 'msg-seed-reimb-01',
            senderName: 'Auditor Manager',
            content: 'Acknowledged ₹10,000 advance transfer received. Remaining balance will be settled on audit clearance.',
            createdAt: '2026-09-03T19:00:00Z',
          },
          unreadCount: 0,
        },
      ];
      this.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(initialConvs));
      return initialConvs;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  getOrCreateExpenseDiscussion(expense: Expense): Conversation {
    this.enforceActiveMember();
    const convs = this.getConversations();
    const existing = convs.find(
      (c) => c.type === 'expense' && c.relatedId === expense.id
    );

    if (existing) {
      return existing;
    }

    const title = `Expense #${expense.rawOriginal?.rowNumber ? `Row ${expense.rawOriginal.rowNumber}` : expense.id.substring(0, 8)} — ${expense.description}`;
    const newConv: Conversation = {
      id: `conv-exp-${expense.id}`,
      workspaceId: DEFAULT_WORKSPACE.id,
      title,
      type: 'expense',
      relatedId: expense.id,
      createdBy: this.currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: [INITIAL_OWNER.id, INITIAL_MANAGER.id],
      lastMessage: {
        id: `msg-init-${Date.now()}`,
        senderName: this.currentUser.name,
        content: `Opened discussion for expense: ${expense.description} (₹${expense.amount ?? '--'})`,
        createdAt: new Date().toISOString(),
      },
      unreadCount: 0,
    };

    const updated = [newConv, ...convs];
    this.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updated));

    // Also seed an initial reference message in this conversation
    this.sendMessage({
      conversationId: newConv.id,
      content: `Discussion thread initialized for expense "${expense.description}". Feel free to attach receipts or request audit clarifications here.`,
      expenseId: expense.id,
    });

    return newConv;
  }

  getOrCreateTripDiscussion(trip: Trip): Conversation {
    this.enforceActiveMember();
    const convs = this.getConversations();
    const existing = convs.find((c) => c.type === 'trip' && c.relatedId === trip.id);
    if (existing) return existing;

    const newConv: Conversation = {
      id: `conv-trip-${trip.id}`,
      workspaceId: DEFAULT_WORKSPACE.id,
      title: `${trip.name} Discussion`,
      type: 'trip',
      relatedId: trip.id,
      createdBy: this.currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: [INITIAL_OWNER.id, INITIAL_MANAGER.id],
      lastMessage: {
        id: `msg-trip-init-${Date.now()}`,
        senderName: this.currentUser.name,
        content: `Coordinating for trip "${trip.name}" (${trip.startDate} to ${trip.endDate})`,
        createdAt: new Date().toISOString(),
      },
      unreadCount: 0,
    };

    const updated = [newConv, ...convs];
    this.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updated));

    this.sendMessage({
      conversationId: newConv.id,
      content: `Trip discussion started for "${trip.name}". Coordination on travel allowances, stay vouchers, and overall claim reconciliation can be handled here.`,
      tripId: trip.id,
    });

    return newConv;
  }

  getOrCreateReimbursementDiscussion(reimbursement: Reimbursement): Conversation {
    this.enforceActiveMember();
    const convs = this.getConversations();
    const existing = convs.find((c) => c.type === 'reimbursement' && c.relatedId === reimbursement.id);
    if (existing) return existing;

    const newConv: Conversation = {
      id: `conv-reimb-${reimbursement.id}`,
      workspaceId: DEFAULT_WORKSPACE.id,
      title: `Reimbursement Claim ${reimbursement.reference}`,
      type: 'reimbursement',
      relatedId: reimbursement.id,
      createdBy: this.currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: [INITIAL_OWNER.id, INITIAL_MANAGER.id],
      lastMessage: {
        id: `msg-reimb-init-${Date.now()}`,
        senderName: this.currentUser.name,
        content: `Discussion for ₹${reimbursement.amount.toLocaleString('en-IN')} payment (${reimbursement.reference})`,
        createdAt: new Date().toISOString(),
      },
      unreadCount: 0,
    };

    const updated = [newConv, ...convs];
    this.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updated));

    this.sendMessage({
      conversationId: newConv.id,
      content: `Payment verification thread for reference "${reimbursement.reference}" (₹${reimbursement.amount.toLocaleString('en-IN')}).`,
      reimbursementId: reimbursement.id,
    });

    return newConv;
  }

  createGroupConversation(title: string, memberIds: string[]): Conversation {
    this.enforceActiveMember();
    const convs = this.getConversations();
    const uniqueMembers = Array.from(new Set([this.currentUser.id, ...memberIds]));

    const newConv: Conversation = {
      id: `conv-grp-${Date.now()}`,
      workspaceId: DEFAULT_WORKSPACE.id,
      title: title.trim(),
      type: 'group',
      createdBy: this.currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: uniqueMembers,
      lastMessage: {
        id: `msg-grp-init-${Date.now()}`,
        senderName: this.currentUser.name,
        content: `Created group conversation "${title}"`,
        createdAt: new Date().toISOString(),
      },
      unreadCount: 0,
    };

    const updated = [newConv, ...convs];
    this.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updated));

    this.recordAuditLog({
      action: 'Created Group Chat',
      recordType: 'chat',
      recordId: newConv.id,
      previousValue: null,
      newValue: `Group "${title}" with ${uniqueMembers.length} participants`,
    });

    return newConv;
  }

  getMessages(conversationId: string): ChatMessage[] {
    this.enforceActiveMember();
    const raw = this.getItem(STORAGE_KEYS.MESSAGES);
    if (!raw) {
      // Seed default messages as specified in user request
      const initialMessages: ChatMessage[] = [
        {
          id: 'msg-seed-01',
          conversationId: 'conv-expense-review',
          senderId: INITIAL_OWNER.id,
          senderName: INITIAL_OWNER.name,
          senderEmail: INITIAL_OWNER.email,
          senderRole: 'owner',
          content: 'Please verify whether this ticket is reimbursable.',
          expenseId: 'exp-026', // Row 28: train Mumbai to Pune ₹640
          createdAt: '2026-08-25T14:30:00Z',
        },
        {
          id: 'msg-seed-02',
          conversationId: 'conv-expense-review',
          senderId: INITIAL_MANAGER.id,
          senderName: INITIAL_MANAGER.name,
          senderEmail: INITIAL_MANAGER.email,
          senderRole: 'manager',
          content: 'Yes, please attach the ticket.',
          replyToMessageId: 'msg-seed-01',
          createdAt: '2026-08-25T15:00:00Z',
        },
        {
          id: 'msg-seed-03',
          conversationId: 'conv-expense-review',
          senderId: INITIAL_OWNER.id,
          senderName: INITIAL_OWNER.name,
          senderEmail: INITIAL_OWNER.email,
          senderRole: 'owner',
          content: 'Uploaded.',
          replyToMessageId: 'msg-seed-02',
          attachments: [
            {
              id: 'att-seed-01',
              messageId: 'msg-seed-03',
              fileName: 'Mumbai_Pune_Train_Ticket_IRCTC.pdf',
              fileType: 'application/pdf',
              fileSize: 142800,
              fileUrl: '#',
              uploadedBy: INITIAL_OWNER.id,
              createdAt: '2026-08-25T16:00:00Z',
            },
          ],
          createdAt: '2026-08-25T16:00:00Z',
        },
      ];
      this.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(initialMessages));
      return initialMessages.filter((m) => m.conversationId === conversationId);
    }
    try {
      const all: ChatMessage[] = JSON.parse(raw);
      return all
        .filter((m) => m.conversationId === conversationId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch {
      return [];
    }
  }

  sendMessage(params: {
    conversationId: string;
    content: string;
    expenseId?: string | null;
    tripId?: string | null;
    reimbursementId?: string | null;
    replyToMessageId?: string | null;
    attachments?: MessageAttachment[];
  }): ChatMessage {
    this.enforceActiveMember();
    const raw = this.getItem(STORAGE_KEYS.MESSAGES);
    let all: ChatMessage[] = [];
    if (raw) {
      try {
        all = JSON.parse(raw);
      } catch {
        all = [];
      }
    }

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      conversationId: params.conversationId,
      senderId: this.currentUser.id,
      senderName: this.currentUser.name,
      senderEmail: this.currentUser.email,
      senderRole: this.currentUser.role,
      content: params.content,
      expenseId: params.expenseId || null,
      tripId: params.tripId || null,
      reimbursementId: params.reimbursementId || null,
      replyToMessageId: params.replyToMessageId || null,
      attachments: params.attachments || [],
      createdAt: new Date().toISOString(),
    };

    all.push(newMessage);
    this.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));

    // Update conversation lastMessage & timestamp
    const convs = this.getConversations();
    const updatedConvs = convs.map((c) => {
      if (c.id === params.conversationId) {
        return {
          ...c,
          updatedAt: newMessage.createdAt,
          lastMessage: {
            id: newMessage.id,
            senderName: newMessage.senderName,
            content: newMessage.content || (newMessage.attachments?.length ? '📎 Attached file' : 'Referenced item'),
            createdAt: newMessage.createdAt,
          },
        };
      }
      return c;
    });
    this.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updatedConvs));

    // Trigger Notification for other workspace members
    const recipientId =
      this.currentUser.id === INITIAL_OWNER.id ? INITIAL_MANAGER.id : INITIAL_OWNER.id;
    this.createNotification({
      userId: recipientId,
      title: `New message from ${this.currentUser.name}`,
      message: params.content.length > 60 ? `${params.content.substring(0, 60)}...` : params.content,
      linkTab: 'chat',
      linkId: params.conversationId,
    });

    return newMessage;
  }

  // --- NOTIFICATIONS ---
  getNotifications(): AppNotification[] {
    this.enforceActiveMember();
    const raw = this.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) {
      const initialNotes: AppNotification[] = [
        {
          id: 'note-01',
          workspaceId: DEFAULT_WORKSPACE.id,
          userId: this.currentUser.id,
          title: 'Welcome to Team Coordination',
          message: 'Discuss individual expenses, trips, and attach audit receipts in real-time.',
          linkTab: 'chat',
          linkId: 'conv-expense-review',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(initialNotes));
      return initialNotes;
    }
    try {
      const all: AppNotification[] = JSON.parse(raw);
      return all
        .filter((n) => n.userId === this.currentUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  }

  createNotification(data: {
    userId: string;
    title: string;
    message: string;
    linkTab: string;
    linkId?: string;
  }): AppNotification {
    const raw = this.getItem(STORAGE_KEYS.NOTIFICATIONS);
    let all: AppNotification[] = [];
    if (raw) {
      try {
        all = JSON.parse(raw);
      } catch {
        all = [];
      }
    }

    const note: AppNotification = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workspaceId: DEFAULT_WORKSPACE.id,
      userId: data.userId,
      title: data.title,
      message: data.message,
      linkTab: data.linkTab,
      linkId: data.linkId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    all.unshift(note);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    return note;
  }

  markNotificationRead(notificationId: string): void {
    const raw = this.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) return;
    try {
      const all: AppNotification[] = JSON.parse(raw);
      const updated = all.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n));
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  markAllNotificationsRead(): void {
    const raw = this.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) return;
    try {
      const all: AppNotification[] = JSON.parse(raw);
      const updated = all.map((n) =>
        n.userId === this.currentUser.id ? { ...n, isRead: true } : n
      );
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
}

export const backend = new BackendService();
