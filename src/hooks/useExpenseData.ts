import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Expense,
  Reimbursement,
  Trip,
  UserProfile,
  UserRole,
  WorkspaceMember,
  WorkspaceInvitation,
  AuditLogEntry,
  Conversation,
  ChatMessage,
  MessageAttachment,
  AppNotification,
  PaymentProof,
  PaymentProofStatus,
  GoogleDriveConfig,
  DriveFolderFile,
} from '../types/index';
import { backend } from '../services/backendService';
import { initialGoogleDriveConfig } from '../data/initialPaymentProofs';
import { calculateDashboardMetrics } from '../utils/calculations';

export function useExpenseData() {
  // Current user & authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => backend.getCurrentUser());
  const userRole = currentUser.role;
  const isManager = currentUser.role === 'manager';
  const isRevoked = currentUser.status === 'revoked';
  const isAuthenticated = Boolean(
    currentUser &&
    currentUser.email &&
    currentUser.id !== 'usr-guest' &&
    currentUser.status !== 'disabled'
  );

  // Core financial state directly backed by backend
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      return backend.getExpenses();
    } catch {
      return [];
    }
  });

  const [reimbursements, setReimbursements] = useState<Reimbursement[]>(() => {
    try {
      return backend.getReimbursements();
    } catch {
      return [];
    }
  });

  const [trips, setTrips] = useState<Trip[]>(() => {
    try {
      return backend.getTrips();
    } catch {
      return [];
    }
  });

  const [activeTripId, setActiveTripIdState] = useState<string>('all');

  // Navigation tab state
  const [activeTab, setActiveTabState] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location) {
      const validTabs = [
        'dashboard',
        'expenses',
        'trips',
        'reimbursements',
        'calculator',
        'analytics',
        'reports',
        'payment-proofs',
        'chat',
        'audit-log',
        'settings',
      ];
      const pathSegment = window.location.pathname.replace(/^\//, '').split('/')[0].toLowerCase();
      if (validTabs.includes(pathSegment)) {
        return pathSegment;
      }
      const hash = window.location.hash.replace('#', '').trim().toLowerCase();
      if (validTabs.includes(hash)) {
        return hash;
      }
    }
    return 'dashboard';
  });

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined' && window.history && window.location) {
      const targetPath = tab === 'dashboard' ? '/' : `/${tab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  }, []);

  // Listen to browser popstate/hashchange
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleNavigation = () => {
      const validTabs = [
        'dashboard',
        'expenses',
        'trips',
        'reimbursements',
        'calculator',
        'analytics',
        'reports',
        'payment-proofs',
        'chat',
        'audit-log',
        'settings',
      ];
      const pathSegment = window.location.pathname.replace(/^\//, '').split('/')[0].toLowerCase();
      if (validTabs.includes(pathSegment)) {
        setActiveTabState(pathSegment);
        return;
      }
      const hash = window.location.hash.replace('#', '').trim().toLowerCase();
      if (validTabs.includes(hash)) {
        setActiveTabState(hash);
      } else if (!pathSegment || pathSegment === '') {
        setActiveTabState('dashboard');
      }
    };

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('atul_expense_manager_dark_mode');
        if (saved !== null) return saved === 'true';
        return window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
      }
    } catch {
      // ignore
    }
    return false;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        window.localStorage?.setItem('atul_expense_manager_dark_mode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        window.localStorage?.setItem('atul_expense_manager_dark_mode', 'false');
      }
    } catch {
      // ignore
    }
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const setActiveTripId = useCallback((id: string) => {
    setActiveTripIdState(id);
  }, []);

  // Members & Invitations
  const [members, setMembers] = useState<WorkspaceMember[]>(() => {
    try {
      return backend.getWorkspaceMembers();
    } catch {
      return [];
    }
  });

  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>(() => {
    try {
      return backend.getInvitations();
    } catch {
      return [];
    }
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      return backend.getAuditLogs();
    } catch {
      return [];
    }
  });

  // Chat State
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      return backend.getConversations();
    } catch {
      return [];
    }
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    try {
      const convs = backend.getConversations();
      return convs[0]?.id || null;
    } catch {
      return null;
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const convs = backend.getConversations();
      const firstId = convs[0]?.id;
      return firstId ? backend.getMessages(firstId) : [];
    } catch {
      return [];
    }
  });

  // Reload messages when activeConversationId changes
  useEffect(() => {
    if (activeConversationId) {
      try {
        setMessages(backend.getMessages(activeConversationId));
      } catch {
        setMessages([]);
      }
    }
  }, [activeConversationId]);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      return backend.getNotifications();
    } catch {
      return [];
    }
  });

  // Google Drive & Payment Proofs State
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>(() => {
    try {
      return backend.getPaymentProofs();
    } catch {
      return [];
    }
  });

  const [googleDriveConfig, setGoogleDriveConfig] = useState<GoogleDriveConfig>(() => {
    try {
      return backend.getGoogleDriveConfig();
    } catch {
      return initialGoogleDriveConfig;
    }
  });

  const [driveFolderFiles, setDriveFolderFiles] = useState<DriveFolderFile[]>(() => {
    try {
      return backend.getDriveFolderFiles();
    } catch {
      return [];
    }
  });

  const refreshState = useCallback(() => {
    try {
      const user = backend.getCurrentUser();
      setCurrentUser(user);
      if (!backend.isAuthenticated()) {
        setExpenses([]);
        setReimbursements([]);
        setTrips([]);
        setMembers([]);
        setInvitations([]);
        setAuditLogs([]);
        setConversations([]);
        setMessages([]);
        setNotifications([]);
        setPaymentProofs([]);
        setDriveFolderFiles([]);
        return;
      }
      setExpenses(backend.getExpenses());
      setReimbursements(backend.getReimbursements());
      setTrips(backend.getTrips());
      setMembers(backend.getWorkspaceMembers());
      setInvitations(backend.getInvitations());
      setAuditLogs(backend.getAuditLogs());
      const convs = backend.getConversations();
      setConversations(convs);
      if (activeConversationId) {
        setMessages(backend.getMessages(activeConversationId));
      }
      setNotifications(backend.getNotifications());
      setPaymentProofs(backend.getPaymentProofs());
      setGoogleDriveConfig(backend.getGoogleDriveConfig());
      setDriveFolderFiles(backend.getDriveFolderFiles());
    } catch (e) {
      // If user is revoked
      setCurrentUser(backend.getCurrentUser());
    }
  }, [activeConversationId]);

  // Auth actions
  const switchUser = useCallback((role: UserRole) => {
    const updated = backend.switchUser(role);
    setCurrentUser(updated);
    refreshState();
    return updated;
  }, [refreshState]);

  const loginWithCredentials = useCallback(async (email: string, password?: string) => {
    const res = await backend.loginWithCredentials(email, password);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      refreshState();
    }
    return res;
  }, [refreshState]);

  const registerWithCredentials = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await backend.registerWithCredentials(name, email, password);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        refreshState();
      }
      return res;
    },
    [refreshState]
  );

  const resetPassword = useCallback(
    async (
      email: string,
      newPassword?: string,
      token?: string,
      expires?: number,
      oobCode?: string
    ) => {
      return await backend.resetPassword(email, newPassword, token, expires, oobCode);
    },
    []
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    return await backend.requestPasswordReset(email);
  }, []);

  const confirmPasswordReset = useCallback(
    async (params: {
      email: string;
      newPassword: string;
      token?: string;
      expires?: number;
      oobCode?: string;
    }) => {
      return await backend.confirmPasswordReset(params);
    },
    []
  );

  const logout = useCallback(() => {
    backend.logout();
    setCurrentUser(backend.getCurrentUser());
    setExpenses([]);
    setReimbursements([]);
    setTrips([]);
    setMembers([]);
    setInvitations([]);
    setAuditLogs([]);
    setConversations([]);
    setMessages([]);
    setNotifications([]);
    setPaymentProofs([]);
    setDriveFolderFiles([]);
  }, []);

  // User Management
  const inviteManager = useCallback((email: string, role: UserRole) => {
    const inv = backend.inviteManager(email, role);
    refreshState();
    return inv;
  }, [refreshState]);

  const revokeUserAccess = useCallback((userId: string) => {
    backend.revokeUserAccess(userId);
    refreshState();
  }, [refreshState]);

  const reactivateUserAccess = useCallback((userId: string) => {
    backend.reactivateUserAccess(userId);
    refreshState();
  }, [refreshState]);

  const changeUserRole = useCallback((userId: string, newRole: UserRole) => {
    backend.changeUserRole(userId, newRole);
    refreshState();
  }, [refreshState]);

  const deleteUser = useCallback((userId: string) => {
    backend.deleteWorkspaceMember(userId);
    refreshState();
  }, [refreshState]);

  // Cloud Data Migration
  const migrateLocalDataToCloud = useCallback(() => {
    const res = backend.migrateLocalDataToCloud({ expenses, reimbursements, trips });
    refreshState();
    return res;
  }, [expenses, reimbursements, trips, refreshState]);

  // Filtered scopes
  const currentTrip = useMemo(() => {
    if (activeTripId === 'all') return null;
    return trips.find((t) => t.id === activeTripId) || null;
  }, [trips, activeTripId]);

  const tripFilteredExpenses = useMemo(() => {
    if (activeTripId === 'all') return expenses;
    return expenses.filter((e) => e.tripId === activeTripId);
  }, [expenses, activeTripId]);

  const tripFilteredReimbursements = useMemo(() => {
    if (activeTripId === 'all') return reimbursements;
    return reimbursements.filter((r) => r.tripId === activeTripId);
  }, [reimbursements, activeTripId]);

  // Metrics
  const metrics = useMemo(() => {
    let durationDays: number | undefined = undefined;
    if (currentTrip) {
      if (currentTrip.id === 'trip-mumbai-pune-2026') {
        durationDays = 15;
      } else if (currentTrip.startDate && currentTrip.endDate) {
        const start = new Date(currentTrip.startDate).getTime();
        const end = new Date(currentTrip.endDate).getTime();
        if (!isNaN(start) && !isNaN(end)) {
          durationDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
        }
      }
    } else {
      durationDays = undefined;
    }
    return calculateDashboardMetrics(tripFilteredExpenses, tripFilteredReimbursements, durationDays, trips);
  }, [tripFilteredExpenses, tripFilteredReimbursements, currentTrip, trips]);

  // CRUD actions (enforced at backend level)
  const addExpense = useCallback((data: Omit<Expense, 'id'>) => {
    const newExp = backend.addExpense(data);
    setExpenses((prev) => [newExp, ...prev.filter((e) => e.id !== newExp.id)]);
    refreshState();
    return newExp;
  }, [refreshState]);

  const updateExpense = useCallback((updated: Expense) => {
    backend.updateExpense(updated);
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    refreshState();
  }, [refreshState]);

  const deleteExpense = useCallback((id: string) => {
    backend.deleteExpense(id);
    const cleanId = id.trim();
    setExpenses((prev) => prev.filter((e) => (e.id || '').trim() !== cleanId));
    refreshState();
  }, [refreshState]);

  const deleteMultipleExpenses = useCallback((ids: string[]) => {
    backend.deleteMultipleExpenses(ids);
    const idSet = new Set(ids.map((id) => (typeof id === 'string' ? id.trim() : '')).filter(Boolean));
    setExpenses((prev) => prev.filter((e) => !idSet.has((e.id || '').trim())));
    refreshState();
  }, [refreshState]);

  const addReimbursement = useCallback((data: Omit<Reimbursement, 'id'>) => {
    const newReimb = backend.addReimbursement(data);
    setReimbursements((prev) => [newReimb, ...prev.filter((r) => r.id !== newReimb.id)]);
    refreshState();
    return newReimb;
  }, [refreshState]);

  const updateReimbursement = useCallback((updated: Reimbursement) => {
    backend.updateReimbursement(updated);
    setReimbursements((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    refreshState();
  }, [refreshState]);

  const deleteReimbursement = useCallback((id: string) => {
    backend.deleteReimbursement(id);
    const cleanId = id.trim();
    setReimbursements((prev) => prev.filter((r) => (r.id || '').trim() !== cleanId));
    refreshState();
  }, [refreshState]);

  const addTrip = useCallback((tripData: Omit<Trip, 'id'>) => {
    const newTrip = backend.addTrip(tripData);
    setTrips((prev) => [newTrip, ...prev.filter((t) => t.id !== newTrip.id)]);
    refreshState();
    return newTrip;
  }, [refreshState]);

  const updateTrip = useCallback((updatedTrip: Trip) => {
    backend.updateTrip(updatedTrip);
    setTrips((prev) => prev.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)));
    refreshState();
  }, [refreshState]);

  const deleteTrip = useCallback((id: string) => {
    backend.deleteTrip(id);
    const cleanId = id.trim();
    setTrips((prev) => prev.filter((t) => (t.id || '').trim() !== cleanId));
    refreshState();
    if (activeTripId === id) {
      setActiveTripIdState('all');
    }
  }, [activeTripId, refreshState]);

  const restoreBackup = useCallback((data: { expenses: Expense[]; reimbursements: Reimbursement[]; trips: Trip[] }) => {
    backend.restoreBackup(data);
    refreshState();
  }, [refreshState]);

  const resetAllData = useCallback(() => {
    backend.resetAllData();
    refreshState();
    setActiveTripIdState('all');
  }, [refreshState]);

  // Chat Actions
  const sendMessage = useCallback((params: {
    conversationId: string;
    content: string;
    expenseId?: string | null;
    tripId?: string | null;
    reimbursementId?: string | null;
    replyToMessageId?: string | null;
    attachments?: MessageAttachment[];
  }) => {
    const msg = backend.sendMessage(params);
    refreshState();
    return msg;
  }, [refreshState]);

  const createGroupChat = useCallback((title: string, memberIds: string[]) => {
    const conv = backend.createGroupConversation(title, memberIds);
    refreshState();
    setActiveConversationId(conv.id);
    return conv;
  }, [refreshState]);

  const openExpenseDiscussion = useCallback((expense: Expense) => {
    const conv = backend.getOrCreateExpenseDiscussion(expense);
    refreshState();
    setActiveConversationId(conv.id);
    setActiveTab('chat');
  }, [refreshState, setActiveTab]);

  const openTripDiscussion = useCallback((trip: Trip) => {
    const conv = backend.getOrCreateTripDiscussion(trip);
    refreshState();
    setActiveConversationId(conv.id);
    setActiveTab('chat');
  }, [refreshState, setActiveTab]);

  const openReimbursementDiscussion = useCallback((reimbursement: Reimbursement) => {
    const conv = backend.getOrCreateReimbursementDiscussion(reimbursement);
    refreshState();
    setActiveConversationId(conv.id);
    setActiveTab('chat');
  }, [refreshState, setActiveTab]);

  // Notifications
  const markNotificationRead = useCallback((id: string) => {
    backend.markNotificationRead(id);
    refreshState();
  }, [refreshState]);

  const markAllNotificationsRead = useCallback(() => {
    backend.markAllNotificationsRead();
    refreshState();
  }, [refreshState]);

  // Google Drive & Payment Proof Actions
  const addPaymentProof = useCallback((data: Omit<PaymentProof, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProof = backend.addPaymentProof(data);
    refreshState();
    return newProof;
  }, [refreshState]);

  const importDrivePaymentProofs = useCallback((batch: Array<Omit<PaymentProof, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const res = backend.importDrivePaymentProofs(batch);
    refreshState();
    return res;
  }, [refreshState]);

  const reviewPaymentProof = useCallback((proofId: string, status: PaymentProofStatus, reviewNotes?: string) => {
    const updated = backend.reviewPaymentProof(proofId, status, reviewNotes);
    refreshState();
    return updated;
  }, [refreshState]);

  const deletePaymentProof = useCallback((id: string) => {
    backend.deletePaymentProof(id);
    refreshState();
  }, [refreshState]);

  const clearAllPaymentProofs = useCallback(() => {
    backend.clearAllPaymentProofs();
    refreshState();
  }, [refreshState]);

  const deleteDriveFolderFile = useCallback((fileId: string) => {
    backend.deleteDriveFolderFile(fileId);
    refreshState();
  }, [refreshState]);

  const clearDriveFolderFiles = useCallback(() => {
    backend.clearDriveFolderFiles();
    refreshState();
  }, [refreshState]);

  const updateGoogleDriveConfig = useCallback((partial: Partial<GoogleDriveConfig>) => {
    const cfg = backend.updateGoogleDriveConfig(partial);
    refreshState();
    return cfg;
  }, [refreshState]);

  const refreshDriveFolder = useCallback(() => {
    const res = backend.refreshDriveFolder();
    refreshState();
    return res;
  }, [refreshState]);

  // Missing proof expenses (for audit completeness)
  const missingProofExpenses = useMemo(() => {
    const proofExpenseIds = new Set(paymentProofs.map((p) => p.expenseId).filter(Boolean));
    return expenses.filter((e) => e.status === 'valid' && !proofExpenseIds.has(e.id));
  }, [expenses, paymentProofs]);

  return {
    currentUser,
    userRole,
    isManager,
    isRevoked,
    isAuthenticated,
    switchUser,
    loginWithCredentials,
    registerWithCredentials,
    resetPassword,
    requestPasswordReset,
    confirmPasswordReset,
    logout,
    members,
    invitations,
    inviteManager,
    revokeUserAccess,
    reactivateUserAccess,
    changeUserRole,
    deleteUser,
    auditLogs,
    migrateLocalDataToCloud,
    expenses,
    reimbursements,
    trips,
    activeTripId,
    setActiveTripId,
    currentTrip,
    tripFilteredExpenses,
    tripFilteredReimbursements,
    metrics,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    isDarkMode,
    toggleDarkMode,
    addExpense,
    updateExpense,
    deleteExpense,
    deleteMultipleExpenses,
    addReimbursement,
    updateReimbursement,
    deleteReimbursement,
    addTrip,
    updateTrip,
    deleteTrip,
    restoreBackup,
    resetAllData,
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    sendMessage,
    createGroupChat,
    openExpenseDiscussion,
    openTripDiscussion,
    openReimbursementDiscussion,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    paymentProofs,
    googleDriveConfig,
    driveFolderFiles,
    addPaymentProof,
    importDrivePaymentProofs,
    reviewPaymentProof,
    deletePaymentProof,
    clearAllPaymentProofs,
    deleteDriveFolderFile,
    clearDriveFolderFiles,
    updateGoogleDriveConfig,
    refreshDriveFolder,
    missingProofExpenses,
  };
}
