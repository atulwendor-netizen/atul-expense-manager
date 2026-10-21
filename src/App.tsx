import { useState, useMemo, useCallback, useEffect } from 'react';
import { useExpenseData } from './hooks/useExpenseData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReimbursementsPage } from './pages/ReimbursementsPage';
import { TripsPage } from './pages/TripsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { PaymentProofsPage } from './pages/PaymentProofsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ChatPage } from './pages/ChatPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { ExpenseModal } from './components/ExpenseModal';
import { ExpenseDetailsModal } from './components/ExpenseDetailsModal';
import { ReimbursementModal } from './components/ReimbursementModal';
import { TripModal } from './components/TripModal';
import { AccountProfileModal } from './components/AccountProfileModal';
import { SignInModal } from './components/SignInModal';
import { PublicAuthPortal } from './components/PublicAuthPortal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Expense, Reimbursement, Trip } from './types/index';
import { calculateDashboardMetrics } from './utils/calculations';
import { Ban, LogIn } from 'lucide-react';

export function App() {
  const {
    currentUser,
    isManager,
    isRevoked,
    isAuthenticated,
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
  } = useExpenseData();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | Partial<Expense> | null>(null);
  const [viewingExpenseDetails, setViewingExpenseDetails] = useState<Expense | null>(null);
  const [isReimbursementModalOpen, setIsReimbursementModalOpen] = useState(false);
  const [reimbursementToEdit, setReimbursementToEdit] = useState<Reimbursement | Partial<Reimbursement> | null>(null);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast notification helper
  const addToast = useCallback((type: 'success' | 'warning' | 'info' | 'error', text: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Strict Route Guard: If a Manager attempts to navigate to /settings, immediately redirect to /dashboard and show Access Denied toast
  useEffect(() => {
    if (isManager && activeTab === 'settings') {
      setActiveTab('dashboard');
      addToast('error', 'Access Denied: Settings and administrative configuration are restricted to the Account Owner.');
    }
  }, [isManager, activeTab, setActiveTab, addToast]);

  const handleSelectTab = useCallback((tab: string) => {
    if (isManager && tab === 'settings') {
      addToast('error', 'Access Denied: Settings and administrative configuration are restricted to the Account Owner.');
      return;
    }
    setActiveTab(tab);
    setSearchQuery('');
    // Ensure section navigation scrolls to the top of the selected section cleanly
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [isManager, addToast, setActiveTab, setSearchQuery]);

  const handleSignOut = useCallback(() => {
    logout();
    setIsProfileModalOpen(false);
  }, [logout]);

  // Handle Universal Master Link (/login, /portal, /access, ?portal=..., ?login=...) and direct invitation link parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const inviteEmail = params.get('email');
      const roleParam = params.get('role');

      const isMasterPortalRoute =
        path === '/login' ||
        path === '/portal' ||
        path === '/access' ||
        path === '/signin' ||
        params.get('portal') === 'master' ||
        params.get('portal') === 'access' ||
        params.get('login') === 'true' ||
        params.get('action') === 'login' ||
        params.get('master') === 'true';

      if (inviteEmail || roleParam === 'manager' || isMasterPortalRoute) {
        setIsSignInModalOpen(true);
        if (inviteEmail || roleParam) {
          window.history.replaceState({}, document.title, '/');
        }
      }
    } catch {
      // Fallback
    }
  }, [loginWithCredentials, addToast]);

  // Global search filter for Dashboard
  const searchedExpenses = useMemo(() => {
    if (!searchQuery.trim()) return tripFilteredExpenses;
    const q = searchQuery.toLowerCase();
    return tripFilteredExpenses.filter((e) => {
      const matchDesc = e.description?.toLowerCase().includes(q);
      const matchCat = e.category?.toLowerCase().includes(q);
      const matchLoc = e.location?.toLowerCase().includes(q);
      const matchNotes = e.notes?.toLowerCase().includes(q);
      const matchPay = e.paymentMethod?.toLowerCase().includes(q);
      const matchAmt = e.amount !== null ? String(e.amount).includes(q) : false;
      return matchDesc || matchCat || matchLoc || matchNotes || matchPay || matchAmt;
    });
  }, [tripFilteredExpenses, searchQuery]);

  const handleOpenAddExpense = () => {
    if (isManager) {
      addToast('error', 'Operation denied: Managers operate in Read-Only Audit Mode.');
      return;
    }
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenAddExpenseWithPreload = (prefill?: Partial<Expense>) => {
    if (isManager) {
      addToast('error', 'Operation denied: Managers operate in Read-Only Audit Mode.');
      return;
    }
    setExpenseToEdit(prefill || null);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    if (isManager) {
      addToast('error', 'Operation denied: Modifying expenses is restricted to Account Owner.');
      return;
    }
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (data: Omit<Expense, 'id'> & { id?: string }) => {
    try {
      if (data.id) {
        updateExpense(data as Expense);
        addToast('success', 'Expense record updated successfully');
      } else {
        addExpense(data);
        addToast('success', 'New expense logged successfully');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Operation failed');
      throw err;
    }
  };

  const handleDeleteExpense = (id: string) => {
    try {
      deleteExpense(id);
      addToast('success', 'Expense record deleted successfully');
    } catch (err: any) {
      addToast('error', err.message || 'Delete operation failed');
      throw err;
    }
  };

  const handleBulkDeleteExpenses = (ids: string[]) => {
    try {
      deleteMultipleExpenses(ids);
      addToast('success', `Deleted ${ids.length} expense records successfully`);
    } catch (err: any) {
      addToast('error', err.message || 'Bulk delete failed');
      throw err;
    }
  };

  const handleOpenAddReimbursement = () => {
    if (isManager) {
      addToast('error', 'Operation denied: Managers operate in Read-Only Audit Mode.');
      return;
    }
    setReimbursementToEdit(null);
    setIsReimbursementModalOpen(true);
  };

  const handleOpenAddReimbursementWithPreload = (prefill?: Partial<Reimbursement>) => {
    if (isManager) {
      addToast('error', 'Operation denied: Managers operate in Read-Only Audit Mode.');
      return;
    }
    setReimbursementToEdit(prefill || null);
    setIsReimbursementModalOpen(true);
  };

  const handleEditReimbursement = (reimbursement: Reimbursement) => {
    if (isManager) {
      addToast('error', 'Operation denied: Reimbursement edits restricted to Account Owner.');
      return;
    }
    setReimbursementToEdit(reimbursement);
    setIsReimbursementModalOpen(true);
  };

  const handleSaveReimbursement = (data: Omit<Reimbursement, 'id'> & { id?: string }) => {
    try {
      if (data.id) {
        updateReimbursement(data as Reimbursement);
        addToast('success', `Updated reimbursement of ₹${data.amount.toLocaleString('en-IN')}`);
      } else {
        addReimbursement(data as Omit<Reimbursement, 'id'>);
        addToast('success', `Recorded ₹${data.amount.toLocaleString('en-IN')} reimbursement payment`);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Operation failed');
      throw err;
    }
  };

  const handleDeleteReimbursement = (id: string) => {
    try {
      deleteReimbursement(id);
      addToast('success', 'Reimbursement record removed');
    } catch (err: any) {
      addToast('error', err.message || 'Operation failed');
      throw err;
    }
  };

  const handleOpenAddTrip = () => {
    if (isManager) {
      addToast('error', 'Operation denied: Managers operate in Read-Only Audit Mode.');
      return;
    }
    setTripToEdit(null);
    setIsTripModalOpen(true);
  };

  const handleEditTrip = (trip: Trip) => {
    if (isManager) {
      addToast('error', 'Operation denied: Trip modifications restricted to Account Owner.');
      return;
    }
    setTripToEdit(trip);
    setIsTripModalOpen(true);
  };

  const handleSaveTrip = (data: Omit<Trip, 'id'> & { id?: string }) => {
    try {
      if (data.id) {
        updateTrip(data as Trip);
        addToast('success', `Trip "${data.name}" updated successfully`);
      } else {
        addTrip(data as Omit<Trip, 'id'>);
        addToast('success', `New trip "${data.name}" created`);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Operation failed');
      throw err;
    }
  };

  const handleDeleteTrip = (id: string) => {
    try {
      deleteTrip(id);
      addToast('success', 'Trip deleted');
    } catch (err: any) {
      addToast('error', err.message || 'Operation failed');
      throw err;
    }
  };

  const handleToggleArchiveTrip = (trip: Trip) => {
    try {
      const updated = { ...trip, isArchived: !trip.isArchived };
      updateTrip(updated);
      addToast('info', `Trip "${trip.name}" ${updated.isArchived ? 'archived' : 'unarchived'}`);
    } catch (err: any) {
      addToast('error', err.message || 'Operation failed');
    }
  };

  // Canonical metrics strictly for the active dashboard scope
  const dashboardMetrics = useMemo(() => {
    let explicitDays: number | undefined = undefined;
    if (currentTrip) {
      if (currentTrip.id === 'trip-mumbai-pune-2026') {
        explicitDays = 15;
      } else if (currentTrip.startDate && currentTrip.endDate) {
        const start = new Date(currentTrip.startDate).getTime();
        const end = new Date(currentTrip.endDate).getTime();
        if (!isNaN(start) && !isNaN(end)) {
          explicitDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
        }
      }
    } else {
      explicitDays = 15;
    }
    return calculateDashboardMetrics(searchedExpenses, tripFilteredReimbursements, explicitDays, trips);
  }, [searchedExpenses, tripFilteredReimbursements, currentTrip, trips]);

  // Handle immediate revocation lock
  if (isRevoked) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 bg-slate-900 text-white font-sans">
        <div className="max-w-md w-full rounded-3xl bg-slate-800 p-8 text-center border border-rose-500/30 shadow-2xl space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
            <Ban className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold">Your Access Has Been Revoked</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The Account Owner (Atul) has revoked your permissions to access this workspace. Financial records, reports, and team conversations are no longer available for this account session.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setIsSignInModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In with Another Account</span>
            </button>
          </div>
        </div>

        <SignInModal
          isOpen={isSignInModalOpen}
          onClose={() => setIsSignInModalOpen(false)}
          onLoginWithCredentials={async (email, password) => {
            const res = await loginWithCredentials(email, password);
            if (res.success) {
              setIsSignInModalOpen(false);
            }
            return res;
          }}
          onNotify={addToast}
        />
      </div>
    );
  }

  // Public Access Gate: When not authenticated, strictly render ONLY the PublicAuthPortal.
  // Zero dashboard elements, zero expense records, zero amounts or charts are mounted in the DOM.
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
        <PublicAuthPortal
          onLogin={async (email, password) => {
            const res = await loginWithCredentials(email, password);
            return res;
          }}
          onRegister={async (name, email, password) => {
            const res = await registerWithCredentials(name, email, password);
            return res;
          }}
          onRequestPasswordReset={async (email) => {
            return await requestPasswordReset(email);
          }}
          onConfirmPasswordReset={async (params) => {
            return await confirmPasswordReset(params);
          }}
          onResetPassword={async (email, newPassword, token, expires, oobCode) => {
            return await resetPassword(email, newPassword, token, expires, oobCode);
          }}
          onNotify={addToast}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        {/* Modal maintained for explicit invocation without leaking dashboard data */}
        {isSignInModalOpen && (
          <SignInModal
            isOpen={!isAuthenticated || isSignInModalOpen}
            onClose={() => setIsSignInModalOpen(false)}
            onLoginWithCredentials={async (email, password) => {
              const res = await loginWithCredentials(email, password);
              if (res.success) {
                setIsSignInModalOpen(false);
              }
              return res;
            }}
            onNotify={addToast}
            isMandatory={false}
          />
        )}

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        incompleteCount={dashboardMetrics.incompleteTransactions}
        isManager={isManager}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTripId={activeTripId}
          trips={trips}
          onSelectTrip={setActiveTripId}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onOpenAddExpense={handleOpenAddExpense}
          onOpenMobileMenu={() => setIsSidebarOpen(true)}
          currentUser={currentUser}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          notifications={notifications}
          onMarkNotificationRead={markNotificationRead}
          onMarkAllNotificationsRead={markAllNotificationsRead}
          onNavigateTab={(tab, linkId) => {
            handleSelectTab(tab);
            if (tab === 'chat' && linkId) {
              setActiveConversationId(linkId);
            }
          }}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {searchQuery && activeTab === 'dashboard' && (
            <div className="mb-6 flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-900 dark:bg-blue-950/50 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
              <span>
                Showing results for "<strong>{searchQuery}</strong>" ({searchedExpenses.length} matches)
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="font-bold underline hover:text-blue-700 dark:hover:text-blue-300"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Tab 1: Dashboard */}
          {activeTab === 'dashboard' && (
            <DashboardPage
              expenses={searchedExpenses}
              reimbursements={tripFilteredReimbursements}
              trips={trips}
              metrics={dashboardMetrics}
              currentTrip={currentTrip}
              activeTripId={activeTripId}
              onSelectTrip={setActiveTripId}
              onNavigateTab={handleSelectTab}
              onOpenAddExpense={handleOpenAddExpense}
              onOpenAddReimbursement={handleOpenAddReimbursement}
              onEditExpense={handleEditExpense}
              onViewExpenseDetails={(expense) => setViewingExpenseDetails(expense)}
              isManager={isManager}
            />
          )}

          {/* Tab 2: Expenses Management */}
          {activeTab === 'expenses' && (
            <ExpensesPage
              expenses={tripFilteredExpenses}
              trips={trips}
              onAddExpense={handleOpenAddExpense}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
              onBulkDeleteExpenses={handleBulkDeleteExpenses}
              onDiscussExpense={openExpenseDiscussion}
              onNotify={addToast}
              onNavigateTab={handleSelectTab}
              isManager={isManager}
            />
          )}

          {/* Tab 3: Reimbursements Management */}
          {activeTab === 'reimbursements' && (
            <ReimbursementsPage
              reimbursements={reimbursements}
              expenses={expenses}
              trips={trips}
              activeTripId={activeTripId}
              onSelectTrip={setActiveTripId}
              onAddReimbursement={handleOpenAddReimbursement}
              onEditReimbursement={handleEditReimbursement}
              onDeleteReimbursement={handleDeleteReimbursement}
              onDiscussReimbursement={openReimbursementDiscussion}
              onNotify={addToast}
              onNavigateTab={handleSelectTab}
              isManager={isManager}
            />
          )}

          {/* Tab: Financial & Travel Calculator */}
          {activeTab === 'calculator' && (
            <CalculatorPage
              expenses={expenses}
              reimbursements={reimbursements}
              trips={trips}
              activeTripId={activeTripId}
              onSelectTrip={setActiveTripId}
              onOpenAddExpenseWithPreload={handleOpenAddExpenseWithPreload}
              onOpenAddReimbursementWithPreload={handleOpenAddReimbursementWithPreload}
              onNotify={addToast}
              onNavigateTab={handleSelectTab}
              isManager={isManager}
            />
          )}

          {/* Tab 4: Trips Management */}
          {activeTab === 'trips' && (
            <TripsPage
              trips={trips}
              expenses={expenses}
              reimbursements={reimbursements}
              activeTripId={activeTripId}
              onSelectTrip={setActiveTripId}
              onNavigateTab={handleSelectTab}
              onAddTrip={handleOpenAddTrip}
              onEditTrip={handleEditTrip}
              onDeleteTrip={handleDeleteTrip}
              onToggleArchiveTrip={handleToggleArchiveTrip}
              onDiscussTrip={openTripDiscussion}
              onNotify={addToast}
              isManager={isManager}
            />
          )}

          {/* Tab 5: Analytics & Insights */}
          {activeTab === 'analytics' && (
            <AnalyticsPage
              expenses={expenses}
              reimbursements={reimbursements}
              trips={trips}
              activeTripId={activeTripId}
              onSelectTrip={setActiveTripId}
            />
          )}

          {/* Tab 6: Reports & Export */}
          {activeTab === 'reports' && (
            <ReportsPage
              expenses={expenses}
              reimbursements={reimbursements}
              trips={trips}
              activeTripId={activeTripId}
              onSelectTrip={setActiveTripId}
              onNotify={addToast}
            />
          )}

          {/* Tab: Payment Proofs & Drive Audit */}
          {activeTab === 'payment-proofs' && (
            <PaymentProofsPage
              paymentProofs={paymentProofs}
              googleDriveConfig={googleDriveConfig}
              driveFolderFiles={driveFolderFiles}
              expenses={expenses}
              reimbursements={reimbursements}
              trips={trips}
              currentUser={currentUser}
              onAddProof={addPaymentProof}
              onImportBatch={importDrivePaymentProofs}
              onReviewProof={reviewPaymentProof}
              onDeleteProof={deletePaymentProof}
              onClearAllProofs={clearAllPaymentProofs}
              onDeleteDriveFile={deleteDriveFolderFile}
              onClearDriveFiles={clearDriveFolderFiles}
              onUpdateDriveConfig={updateGoogleDriveConfig}
              onRefreshDriveFolder={refreshDriveFolder}
              onDiscussExpense={openExpenseDiscussion}
              onNotify={addToast}
              isManager={isManager}
            />
          )}

          {/* Tab 7: Team Chat & Coordination */}
          {activeTab === 'chat' && (
            <ChatPage
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={setActiveConversationId}
              messages={messages}
              onSendMessage={sendMessage}
              onCreateGroupChat={createGroupChat}
              currentUser={currentUser}
              expenses={expenses}
              trips={trips}
              reimbursements={reimbursements}
              onViewExpenseDetails={(expense) => setViewingExpenseDetails(expense)}
              onNotify={addToast}
            />
          )}

          {/* Tab 8: Audit Log & Provenance Trail */}
          {activeTab === 'audit-log' && (
            <AuditLogPage auditLogs={auditLogs} currentUser={currentUser} />
          )}

          {/* Tab 9: Settings & Preferences */}
          {activeTab === 'settings' && (
            <SettingsPage
              expenses={expenses}
              reimbursements={reimbursements}
              trips={trips}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
              onResetAllData={resetAllData}
              onRestoreData={restoreBackup}
              onNotify={addToast}
              currentUser={currentUser}
              members={members}
              invitations={invitations}
              onInviteManager={inviteManager}
              onRevokeAccess={revokeUserAccess}
              onReactivateUser={reactivateUserAccess}
              onChangeUserRole={changeUserRole}
              onDeleteUser={deleteUser}
              onMigrateToCloud={migrateLocalDataToCloud}
            />
          )}
        </main>
      </div>

      {/* Expense Modal (Add / Edit for Owner) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        onDelete={handleDeleteExpense}
        expenseToEdit={expenseToEdit}
        trips={trips}
      />

      {/* Expense Details Modal (Viewer for Chat & Tables) */}
      <ExpenseDetailsModal
        isOpen={Boolean(viewingExpenseDetails)}
        onClose={() => setViewingExpenseDetails(null)}
        expense={viewingExpenseDetails}
        trips={trips}
        onEdit={(exp) => {
          setViewingExpenseDetails(null);
          handleEditExpense(exp);
        }}
        onDelete={(id) => {
          setViewingExpenseDetails(null);
          handleDeleteExpense(id);
        }}
        onDiscuss={openExpenseDiscussion}
        isManager={isManager}
      />

      {/* Reimbursement Modal (Add / Edit Payment for Owner) */}
      <ReimbursementModal
        isOpen={isReimbursementModalOpen}
        onClose={() => setIsReimbursementModalOpen(false)}
        onSave={handleSaveReimbursement}
        trips={trips}
        activeTripId={activeTripId}
        reimbursementToEdit={reimbursementToEdit}
      />

      {/* Trip Modal (Create / Edit for Owner) */}
      <TripModal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        onSave={handleSaveTrip}
        tripToEdit={tripToEdit}
      />

      {/* Account Profile & Session Modal (View authenticated profile, permissions breakdown, and sign out) */}
      <AccountProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onNotify={addToast}
      />

      {/* Sign In Modal (Authenticates against backend credentials/invitations) */}
      <SignInModal
        isOpen={!isAuthenticated || isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        onLoginWithCredentials={async (email, password) => {
          const res = await loginWithCredentials(email, password);
          if (res.success) {
            setIsSignInModalOpen(false);
          }
          return res;
        }}
        onNotify={addToast}
        isMandatory={!isAuthenticated}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
