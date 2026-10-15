import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger';
  };
  accentColor?: 'brand' | 'emerald' | 'amber' | 'violet' | 'rose' | 'indigo';
  onClick?: () => void;
}

const colorMap = {
  brand: {
    iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
    border: 'hover:border-blue-300 dark:hover:border-blue-700',
    highlight: 'text-blue-600 dark:text-blue-400',
  },
  emerald: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    border: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    highlight: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    border: 'hover:border-amber-300 dark:hover:border-amber-700',
    highlight: 'text-amber-600 dark:text-amber-400',
  },
  violet: {
    iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
    border: 'hover:border-purple-300 dark:hover:border-purple-700',
    highlight: 'text-purple-600 dark:text-purple-400',
  },
  rose: {
    iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
    border: 'hover:border-rose-300 dark:hover:border-rose-700',
    highlight: 'text-rose-600 dark:text-rose-400',
  },
  indigo: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    border: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    highlight: 'text-indigo-600 dark:text-indigo-400',
  },
};

const badgeStyles = {
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  danger: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
};

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  accentColor = 'brand',
  onClick,
}) => {
  const scheme = colorMap[accentColor];

  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 dark:border-slate-800/80 dark:bg-slate-900',
        scheme.border,
        onClick && 'cursor-pointer hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            {title}
          </p>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </h3>
        </div>
        <div className={clsx('rounded-xl p-3', scheme.iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(subtitle || badge) && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {badge && (
            <span
              className={clsx(
                'ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0',
                badgeStyles[badge.variant]
              )}
            >
              {badge.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
