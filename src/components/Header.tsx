import React from 'react';
import { Trip, UserProfile, AppNotification } from '../types/index';
import {
  Search,
  Moon,
  Sun,
  Menu,
  Plus,
  MapPin,
  Shield,
  Eye,
} from 'lucide-react';
import { ReadOnlyBadge } from './ReadOnlyBadge';
import { NotificationDropdown } from './NotificationDropdown';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTripId: string;
  trips: Trip[];
  onSelectTrip: (tripId: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAddExpense: () => void;
  onOpenMobileMenu: () => void;
  currentUser: UserProfile;
  onOpenAuthModal: () => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onNavigateTab: (tab: string, linkId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  activeTripId,
  trips,
  onSelectTrip,
  isDarkMode,
  onToggleDarkMode,
  onOpenAddExpense,
  onOpenMobileMenu,
  currentUser,
  onOpenAuthModal,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigateTab,
}) => {
  const isManager = currentUser.role === 'manager';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90 sm:px-6">
      {/* Left section: mobile hamburger & search input */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search expenses, notes, locations, tags..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/70 dark:text-white dark:placeholder-slate-500 dark:focus:bg-slate-800 transition-all"
          />
        </div>
      </div>

      {/* Right section: Manager Badge, Trip selector, Notifications, Auth, Dark mode, Add Expense */}
      <div className="flex items-center gap-2 sm:gap-2.5 ml-3 shrink-0">
        {/* Prominent Manager Audit Badge if logged in as Manager */}
        {isManager && (
          <div className="hidden sm:block">
            <ReadOnlyBadge variant="header" />
          </div>
        )}

        {/* Active Trip Badge / Quick Switcher */}
        <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-800/60">
          <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <select
            value={activeTripId}
            onChange={(e) => onSelectTrip(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Trips & Stays</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* In-App Notifications Dropdown */}
        <NotificationDropdown
          notifications={notifications}
          onMarkRead={onMarkNotificationRead}
          onMarkAllRead={onMarkAllNotificationsRead}
          onNavigate={onNavigateTab}
        />

        {/* Dark mode toggle button */}
        <button
          onClick={onToggleDarkMode}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
        >
          {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Account / Role Pill (Click to switch user or view profile) */}
        <button
          onClick={onOpenAuthModal}
          title="Account & Role Switcher"
          className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            isManager
              ? 'border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
          }`}
        >
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-lg text-white font-bold text-[10px] ${
              isManager ? 'bg-amber-600' : 'bg-blue-600'
            }`}
          >
            {isManager ? <Eye className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
          </div>
          <div className="hidden sm:block text-left">
            <span className="block leading-tight text-[11px] font-bold">
              {currentUser.name}
            </span>
            <span className="block leading-none text-[9px] text-slate-400 uppercase tracking-wider">
              {currentUser.role}
            </span>
          </div>
        </button>

        {/* Add Expense Button (Strictly hidden for Manager role!) */}
        {!isManager ? (
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </button>
        ) : (
          <div
            title="Expense creation disabled in Read-Only Audit Mode"
            className="hidden sm:flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed select-none"
          >
            <Plus className="h-4 w-4 opacity-50" />
            <span>Add Expense</span>
          </div>
        )}
      </div>
    </header>
  );
};
