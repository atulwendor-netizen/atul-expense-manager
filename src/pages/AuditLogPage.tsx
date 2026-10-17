import React, { useState, useMemo } from 'react';
import { AuditLogEntry, UserProfile } from '../types/index';
import {
  Search,
  Filter,
  Clock,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface AuditLogPageProps {
  auditLogs: AuditLogEntry[];
  currentUser: UserProfile;
}

export const AuditLogPage: React.FC<AuditLogPageProps> = ({ auditLogs, currentUser }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (filterType !== 'all' && log.recordType !== filterType) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchAction = log.action.toLowerCase().includes(q);
        const matchUser = log.userName.toLowerCase().includes(q) || log.userEmail.toLowerCase().includes(q);
        const matchVal = (log.newValue || '').toLowerCase().includes(q) || (log.previousValue || '').toLowerCase().includes(q);
        const matchId = log.recordId.toLowerCase().includes(q);
        if (!matchAction && !matchUser && !matchVal && !matchId) {
          return false;
        }
      }
      return true;
    });
  }, [auditLogs, search, filterType]);

  return (
    <div className="space-y-6 animate-dashboard-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            Audit Log & Provenance Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cryptographically sealed, append-only chronological log of all expense mutations, payments, and access events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
            <Lock className="h-3 w-3 text-emerald-600" />
            Audit Observer: {currentUser.name} ({currentUser.role})
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800/80 dark:bg-slate-900 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, user, record ID, or financial value..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Record Types</option>
            <option value="expense">Expenses</option>
            <option value="reimbursement">Reimbursements</option>
            <option value="trip">Trips</option>
            <option value="user">User Access</option>
            <option value="chat">Chat & Coordination</option>
            <option value="system">System / Migration</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Action & Target</th>
                <th className="px-4 py-3.5">Previous Value</th>
                <th className="px-4 py-3.5">New Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>
                            {new Date(log.timestamp).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] dark:bg-blue-950 dark:text-blue-300">
                            {log.userName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {log.userName}
                            </span>
                            <span
                              className={`ml-1.5 rounded px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                                log.userRole === 'owner'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {log.userRole}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {log.action}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {log.recordType}:{log.recordId.substring(0, 10)}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 max-w-xs text-slate-500 dark:text-slate-400 truncate">
                        {log.previousValue ? (
                          <span className="text-rose-600 dark:text-rose-400 font-mono text-[11px]">
                            {log.previousValue}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 max-w-sm">
                        {log.newValue ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">
                            {log.newValue}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
