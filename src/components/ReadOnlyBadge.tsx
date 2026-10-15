import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface ReadOnlyBadgeProps {
  className?: string;
  variant?: 'header' | 'inline' | 'banner';
}

export const ReadOnlyBadge: React.FC<ReadOnlyBadgeProps> = ({
  className = '',
  variant = 'header',
}) => {
  if (variant === 'banner') {
    return (
      <div className={`flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 ${className}`}>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Read Only — Audit Mode:</strong> You are browsing as a Manager / Auditor. Financial modification controls are disabled.
          </span>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
          Enforced
        </span>
      </div>
    );
  }

  return (
    <div
      title="Manager / Auditor Role: Read Only Mode Enforced"
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 shadow-xs dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-300 ${className}`}
    >
      <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
      <span>Read Only — Audit Mode</span>
    </div>
  );
};
