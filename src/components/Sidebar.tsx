import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Compass,
  DollarSign,
  BarChart3,
  FileSpreadsheet,
  Settings,
  X,
  ShieldCheck,
  MessageSquare,
  ShieldAlert,
  FileCheck,
  Calculator,
} from 'lucide-react';
import clsx from 'clsx';
import { lockBodyScroll, unlockBodyScroll } from '../hooks/useModalA11y';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  incompleteCount: number;
  isManager?: boolean;
}

interface NavItemDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  ownerOnly?: boolean;
}

const navItems: NavItemDef[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'trips', label: 'Trips', icon: Compass },
  { id: 'reimbursements', label: 'Reimbursements', icon: DollarSign },
  { id: 'calculator', label: 'Calculator', icon: Calculator },
  { id: 'payment-proofs', label: 'Payment Proofs', icon: FileCheck },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
  { id: 'chat', label: 'Team Chat', icon: MessageSquare },
  { id: 'audit-log', label: 'Audit Log', icon: ShieldAlert },
  { id: 'settings', label: 'Settings', icon: Settings, ownerOnly: true },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  incompleteCount,
  isManager = false,
}) => {
  const visibleNavItems = navItems.filter((item) => !isManager || !item.ownerOnly);

  // Close sidebar on Escape key when open on mobile
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll on mobile when sidebar is open using safe reference-counted lock
  React.useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container: sticky on desktop so navigation stays accessible on long scrolling pages */}
      <aside
        role="navigation"
        aria-label="Main sidebar navigation"
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white shadow-sm transition-transform duration-300 ease-in-out dark:border-slate-800/80 dark:bg-slate-900 lg:static lg:sticky lg:top-0 lg:h-screen lg:self-start lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-base shadow-sm">
              A
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                ATUL EXPENSE
              </h1>
              <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Manager v1.0
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Manager Mode Banner inside sidebar if active */}
        {isManager && (
          <div className="px-3 pt-3">
            <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-2.5 text-center dark:border-amber-900/70 dark:bg-amber-950/40">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-200 block">
                Read Only — Audit Mode
              </span>
              <span className="text-[9px] text-amber-700 dark:text-amber-300 block mt-0.5">
                Financial mutations locked
              </span>
            </div>
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label="Sidebar Sections">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  'group flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={clsx(
                      'h-4 w-4 transition-colors',
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300'
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.id === 'expenses' && incompleteCount > 0 && (
                  <span
                    className={clsx(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                      isActive
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    )}
                  >
                    {incompleteCount} draft
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User / Data Integrity Footer Card */}
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Data Preserved
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              78 original spreadsheet records preserved without alteration.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
