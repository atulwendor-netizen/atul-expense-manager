import React from 'react';
import { Reimbursement } from '../types/index';
import { formatCurrency, formatDate } from '../utils/calculations';
import { DollarSign, CheckCircle2, Clock, ArrowRight, Plus } from 'lucide-react';

interface ReimbursementSummaryCardProps {
  totalExpense: number;
  totalReimbursement: number;
  pendingReimbursement: number;
  reimbursements: Reimbursement[];
  onNavigateToReimbursements?: () => void;
  onAddReimbursement?: () => void;
}

export const ReimbursementSummaryCard: React.FC<ReimbursementSummaryCardProps> = ({
  totalExpense,
  totalReimbursement,
  pendingReimbursement,
  reimbursements,
  onNavigateToReimbursements,
  onAddReimbursement,
}) => {
  const surplus = Math.max(0, totalReimbursement - totalExpense);
  const isOverReimbursed = totalReimbursement > totalExpense;
  const percentage = totalExpense > 0
    ? Math.round((totalReimbursement / totalExpense) * 100)
    : totalReimbursement > 0
    ? 100
    : 0;

  const isFullyReimbursed = !isOverReimbursed && pendingReimbursement <= 0 && totalExpense > 0;
  const isPartiallyReimbursed = !isOverReimbursed && totalReimbursement > 0 && pendingReimbursement > 0;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 flex flex-col justify-between">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Reimbursement Status
            </h3>
          </div>
          {isOverReimbursed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              <CheckCircle2 className="h-3 w-3" />
              Over-reimbursed (+₹{surplus.toLocaleString('en-IN')})
            </span>
          ) : isFullyReimbursed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              Settled
            </span>
          ) : isPartiallyReimbursed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <Clock className="h-3 w-3" />
              Pending ₹{pendingReimbursement.toLocaleString('en-IN')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
              Unsettled
            </span>
          )}
        </div>

        {/* Big numbers */}
        <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Received So Far
            </span>
            <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalReimbursement)}
            </p>
          </div>
          <div className="border-l border-slate-200 pl-4 dark:border-slate-700">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Pending Balance
            </span>
            <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(pendingReimbursement)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Reimbursement Progress
            </span>
            <span className={`font-bold ${isOverReimbursed ? 'text-purple-600 dark:text-purple-400' : 'text-slate-900 dark:text-white'}`}>
              {percentage}%{isOverReimbursed ? ' (Over-reimbursed)' : ''}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isOverReimbursed
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isOverReimbursed
              ? `${formatCurrency(totalReimbursement)} of ${formatCurrency(totalExpense)} expenditure (Includes ${formatCurrency(surplus)} excess advance)`
              : `${formatCurrency(totalReimbursement)} of ${formatCurrency(totalExpense)} total expenditure cleared`}
          </p>
        </div>

        {/* Recent entries */}
        {reimbursements.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Logged Payments ({reimbursements.length})
            </span>
            <div className="mt-2 space-y-1.5">
              {reimbursements.slice(0, 2).map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {r.reference || 'Reimbursement'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatDate(r.date)} {r.notes ? `• ${r.notes}` : ''}
                    </p>
                  </div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                    +{formatCurrency(r.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        {onAddReimbursement && (
          <button
            onClick={onAddReimbursement}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Payment
          </button>
        )}
        {onNavigateToReimbursements && (
          <button
            onClick={onNavigateToReimbursements}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-colors"
          >
            Manage
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
