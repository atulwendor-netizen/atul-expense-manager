import React, { useState, useMemo } from 'react';
import {
  PaymentProof,
  PaymentProofStatus,
  GoogleDriveConfig,
  DriveFolderFile,
  Expense,
  Reimbursement,
  Trip,
  UserProfile,
} from '../types/index';
import { formatCurrency, formatDate } from '../utils/calculations';
import { SummaryCard } from '../components/SummaryCard';
import { DriveImportModal } from '../components/DriveImportModal';
import { ProofComparisonModal } from '../components/ProofComparisonModal';
import { DriveConfigModal } from '../components/DriveConfigModal';
import {
  FileCheck,
  HardDrive,
  Upload,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  AlertTriangle,
  Eye,
  ExternalLink,
  Filter,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface PaymentProofsPageProps {
  paymentProofs: PaymentProof[];
  googleDriveConfig: GoogleDriveConfig;
  driveFolderFiles: DriveFolderFile[];
  expenses: Expense[];
  reimbursements: Reimbursement[];
  trips: Trip[];
  currentUser: UserProfile;
  onAddProof: (proof: Omit<PaymentProof, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onImportBatch: (proofs: Array<Omit<PaymentProof, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  onReviewProof: (proofId: string, status: PaymentProofStatus, notes?: string) => void;
  onDeleteProof: (proofId: string) => void;
  onUpdateDriveConfig: (partial: Partial<GoogleDriveConfig>) => void;
  onRefreshDriveFolder: () => void;
  onDiscussExpense?: (expense: Expense) => void;
  onNotify: (type: 'success' | 'warning' | 'info' | 'error', text: string) => void;
  isManager?: boolean;
}

export const PaymentProofsPage: React.FC<PaymentProofsPageProps> = ({
  paymentProofs,
  googleDriveConfig,
  driveFolderFiles,
  expenses,
  reimbursements,
  trips,
  currentUser,
  onAddProof: _onAddProof,
  onImportBatch,
  onReviewProof,
  onDeleteProof,
  onUpdateDriveConfig,
  onRefreshDriveFolder,
  onDiscussExpense,
  onNotify,
  isManager = false,
}) => {
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTripId, setSelectedTripId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'missing'>('cards');

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedProofForAudit, setSelectedProofForAudit] = useState<PaymentProof | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtered Proofs
  const filteredProofs = useMemo(() => {
    return paymentProofs.filter((p) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.fileName.toLowerCase().includes(q);
        const matchRef = p.transactionReference?.toLowerCase().includes(q);
        const matchNotes = p.notes?.toLowerCase().includes(q);
        const matchExp = p.expenseDescription?.toLowerCase().includes(q);
        const matchAmt = String(p.amount).includes(q);
        if (!matchName && !matchRef && !matchNotes && !matchExp && !matchAmt) {
          return false;
        }
      }

      // 2. Status
      if (selectedStatus !== 'all' && p.status !== selectedStatus) {
        return false;
      }

      // 3. Trip
      if (selectedTripId !== 'all' && p.tripId !== selectedTripId) {
        return false;
      }

      // 4. Proof Type
      if (selectedType !== 'all' && p.proofType !== selectedType) {
        return false;
      }

      return true;
    });
  }, [paymentProofs, searchQuery, selectedStatus, selectedTripId, selectedType]);

  // Expenses with missing proof
  const missingProofExpenses = useMemo(() => {
    const proofExpenseIds = new Set(paymentProofs.map((p) => p.expenseId).filter(Boolean));
    return expenses.filter((e) => {
      if (e.status !== 'valid' || e.amount === null) return false;
      if (selectedTripId !== 'all' && e.tripId !== selectedTripId) return false;
      return !proofExpenseIds.has(e.id) && !e.receipt;
    });
  }, [expenses, paymentProofs, selectedTripId]);

  // Metrics
  const metrics = useMemo(() => {
    const totalCount = paymentProofs.length;
    const totalAmount = paymentProofs.reduce((acc, p) => acc + (p.amount || 0), 0);
    const verified = paymentProofs.filter((p) => p.status === 'verified');
    const verifiedAmount = verified.reduce((acc, p) => acc + (p.amount || 0), 0);
    const pending = paymentProofs.filter((p) => p.status === 'pending');
    const flagged = paymentProofs.filter(
      (p) => p.isFlaggedDuplicate || p.status === 'needs_clarification' || p.status === 'rejected'
    );

    return {
      totalCount,
      totalAmount,
      verifiedCount: verified.length,
      verifiedAmount,
      verifiedPercent: totalCount > 0 ? Math.round((verified.length / totalCount) * 100) : 0,
      pendingCount: pending.length,
      flaggedCount: flagged.length,
      missingCount: missingProofExpenses.length,
    };
  }, [paymentProofs, missingProofExpenses]);

  const handleRefreshFolder = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      onRefreshDriveFolder();
      setIsRefreshing(false);
      onNotify('success', 'Google Drive folder contents refreshed successfully.');
    }, 700);
  };

  const getStatusBadge = (status: PaymentProofStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-semibold">
            <CheckCircle2 className="h-3 w-3" /> Verified
          </span>
        );
      case 'needs_clarification':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[10px] font-semibold">
            <HelpCircle className="h-3 w-3" /> Clarification
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 px-2 py-0.5 text-[10px] font-semibold">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 px-2 py-0.5 text-[10px] font-semibold">
            <Clock className="h-3 w-3" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-dashboard-fade">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Payment Proofs & Drive Audit
            </h1>
            <span className="rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 text-xs font-bold">
              {paymentProofs.length} records
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dedicated Google Drive folder: <span className="font-semibold text-slate-700 dark:text-slate-300">"{googleDriveConfig.folderName}"</span> • Finance & Manager side-by-side verification
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <HardDrive className="h-4 w-4 text-blue-600" />
            <span>Drive Settings</span>
          </button>

          <button
            type="button"
            onClick={handleRefreshFolder}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Drive'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Import Proofs</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <SummaryCard
          title="Payment Proofs"
          value={metrics.totalCount}
          subtitle={`Covering ${formatCurrency(metrics.totalAmount)}`}
          icon={FileCheck}
          accentColor="brand"
        />
        <SummaryCard
          title="Verified & Approved"
          value={metrics.verifiedCount}
          subtitle={`${metrics.verifiedPercent}% audit completed`}
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <SummaryCard
          title="Pending Audit"
          value={metrics.pendingCount}
          subtitle="Awaiting manager review"
          icon={Clock}
          accentColor="amber"
        />
        <SummaryCard
          title="Discrepancies / Flagged"
          value={metrics.flaggedCount}
          subtitle="Duplicates or mismatches"
          icon={AlertTriangle}
          accentColor="rose"
        />
        <SummaryCard
          title="Missing Proofs"
          value={metrics.missingCount}
          subtitle="Valid expenses lacking proof"
          icon={AlertCircle}
          accentColor="indigo"
        />
      </div>

      {/* Filter and View Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by file name, UTR / ref, amount, notes..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 pl-9 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800/80 dark:text-white"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1.5 self-start lg:self-auto bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Proof Cards ({filteredProofs.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Audit Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('missing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'missing'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Missing Proofs Audit ({missingProofExpenses.length})
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pr-2">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          {/* Status filter tabs */}
          {[
            { id: 'all', label: 'All Status' },
            { id: 'pending', label: 'Pending' },
            { id: 'verified', label: 'Verified' },
            { id: 'needs_clarification', label: 'Clarification' },
            { id: 'rejected', label: 'Rejected' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                selectedStatus === st.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {st.label}
            </button>
          ))}

          {/* Trip Scope Selector */}
          <select
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">All Trips & Scopes</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Proof Type Selector */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">All Proof Types</option>
            <option value="UPI Receipt">UPI Receipt</option>
            <option value="Train / Transit Ticket">Train / Transit Ticket</option>
            <option value="Hotel / Dorm Invoice">Hotel / Dorm Invoice</option>
            <option value="Bank Transfer Statement">Bank Transfer Statement</option>
            <option value="Cash Receipt">Cash Receipt</option>
            <option value="Porter Dispatch Bill">Porter Dispatch Bill</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: Proof Cards Grid */}
      {viewMode === 'cards' && (
        <>
          {filteredProofs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
              <HardDrive className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No Payment Proofs Found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No proofs match your current filters. Import files from Google Drive folder "{googleDriveConfig.folderName}" or reset filters.
              </p>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Upload className="h-4 w-4" />
                <span>Import Proofs Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProofs.map((proof) => {
                const linkedExpense = proof.expenseId
                  ? expenses.find((e) => e.id === proof.expenseId)
                  : null;

                const amountMismatch =
                  linkedExpense &&
                  linkedExpense.amount !== null &&
                  Math.abs(Number(linkedExpense.amount) - Number(proof.amount)) > 0.01;

                return (
                  <div
                    key={proof.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                  >
                    <div>
                      {/* Card Preview Banner */}
                      <div className="relative h-44 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-3 border-b border-slate-100 dark:border-slate-800/80 overflow-hidden">
                        {proof.previewUrl ? (
                          <img
                            src={proof.previewUrl}
                            alt={proof.fileName}
                            className="max-h-full w-auto object-contain transition-transform group-hover:scale-105 duration-200"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <FileCheck className="h-12 w-12 text-blue-500/40 mx-auto mb-1" />
                            <span className="text-xs font-medium text-slate-500">
                              {proof.proofType}
                            </span>
                          </div>
                        )}

                        {/* Status badge in top-left */}
                        <div className="absolute top-3 left-3">{getStatusBadge(proof.status)}</div>

                        {/* Drive pill in top-right */}
                        {proof.driveLink && (
                          <a
                            href={proof.driveLink}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute top-3 right-3 rounded-lg bg-slate-900/70 backdrop-blur-xs p-1.5 text-white hover:bg-slate-900 shadow-sm"
                            title="Open file in Google Drive"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}

                        {/* Duplicate Alert Banner */}
                        {proof.isFlaggedDuplicate && (
                          <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-amber-500/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-white flex items-center gap-1.5 shadow-sm">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span className="truncate">Duplicate Reference Detected</span>
                          </div>
                        )}
                      </div>

                      {/* Card Information */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                              {proof.proofType}
                            </span>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-1">
                              {proof.fileName}
                            </h3>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                              Amount
                            </span>
                            <span className="text-base font-black text-slate-900 dark:text-white">
                              {formatCurrency(proof.amount)}
                            </span>
                          </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <span>Date: </span>
                            <strong className="text-slate-700 dark:text-slate-200">
                              {formatDate(proof.paymentDate)}
                            </strong>
                          </div>
                          <div className="truncate">
                            <span>Ref: </span>
                            <strong className="font-mono text-slate-700 dark:text-slate-200">
                              {proof.transactionReference || '—'}
                            </strong>
                          </div>
                          <div className="col-span-2 truncate">
                            <span>Scope: </span>
                            <strong className="text-blue-600 dark:text-blue-400">
                              {proof.tripName || 'Service Visit'}
                            </strong>
                          </div>
                        </div>

                        {/* Linked Expense Status */}
                        {linkedExpense ? (
                          <div className={`rounded-xl p-2.5 text-xs flex items-center justify-between border ${
                            amountMismatch
                              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                          }`}>
                            <div className="truncate pr-2">
                              <span className="text-[10px] text-slate-400 block font-mono">
                                Linked Expense (Row #{linkedExpense.rawOriginal?.rowNumber || '—'})
                              </span>
                              <span className="font-semibold truncate block">
                                {linkedExpense.description}
                              </span>
                            </div>
                            <span className="font-bold shrink-0">
                              {formatCurrency(linkedExpense.amount)}
                            </span>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-2 text-center text-xs text-slate-400">
                            Unlinked payment proof
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-4 pt-0">
                      <button
                        type="button"
                        onClick={() => setSelectedProofForAudit(proof)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-slate-700 shadow-sm transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Audit & Compare</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW 2: Audit Table */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Proof Document</th>
                  <th className="py-3 px-4">Scope / Trip</th>
                  <th className="py-3 px-4">Linked Expense</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Ref / UTR</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reviewer</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProofs.map((proof) => {
                  const linkedExp = proof.expenseId
                    ? expenses.find((e) => e.id === proof.expenseId)
                    : null;

                  return (
                    <tr
                      key={proof.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedProofForAudit(proof)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-blue-600">
                            <FileCheck className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-white truncate block">
                              {proof.fileName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {proof.proofType}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {proof.tripName || 'Service Visit'}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate">
                        {linkedExp ? (
                          <div>
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                              {linkedExp.description}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Row #{linkedExp.rawOriginal?.rowNumber || '—'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unlinked</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(proof.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(proof.paymentDate)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {proof.transactionReference || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(proof.status)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {proof.reviewedByName ? (
                          <span>
                            {proof.reviewedByName}{' '}
                            <span className="text-[10px] text-slate-400">({proof.reviewedByRole})</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unreviewed</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedProofForAudit(proof)}
                          className="rounded-lg bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                        >
                          Audit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Missing Proofs Audit */}
      {viewMode === 'missing' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-indigo-600" />
                Missing Proofs Audit Checklist ({missingProofExpenses.length} valid expenses)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                These valid expenses currently have no linked payment proof or receipt document in the system.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Upload className="h-4 w-4" />
              <span>Import Drive Receipts</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Row #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Payment Method</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {missingProofExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                      #{expense.rawOriginal?.rowNumber || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {formatDate(expense.date)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {expense.description}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {expense.paymentMethod || 'UPI / Cash'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setIsImportModalOpen(true)}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Link Proof</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      <DriveImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        trips={trips}
        expenses={expenses}
        availableFiles={driveFolderFiles}
        existingProofs={paymentProofs}
        googleDriveConfig={googleDriveConfig}
        onImportBatch={(batch) => {
          onImportBatch(batch);
          onNotify('success', `Imported ${batch.length} payment proofs from Google Drive.`);
        }}
        onRefreshFolder={handleRefreshFolder}
        isManager={isManager}
      />

      <DriveConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={googleDriveConfig}
        onSaveConfig={(updated) => {
          onUpdateDriveConfig(updated);
          onNotify('success', 'Google Drive settings updated.');
        }}
        onRefreshFolder={handleRefreshFolder}
        isManager={isManager}
      />

      <ProofComparisonModal
        isOpen={Boolean(selectedProofForAudit)}
        onClose={() => setSelectedProofForAudit(null)}
        proof={selectedProofForAudit}
        expenses={expenses}
        reimbursements={reimbursements}
        trips={trips}
        currentUser={currentUser}
        onReviewProof={(proofId, status, notes) => {
          onReviewProof(proofId, status, notes);
          onNotify(
            'success',
            `Proof review updated to ${status.toUpperCase()}${notes ? `: ${notes}` : ''}`
          );
        }}
        onDeleteProof={(id) => {
          onDeleteProof(id);
          onNotify('success', 'Payment proof deleted successfully.');
        }}
        onDiscuss={onDiscussExpense}
        isManager={isManager}
      />
    </div>
  );
};
