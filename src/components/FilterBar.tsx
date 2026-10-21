import React from 'react';
import { Trip } from '../types/index';
import {
  Search,
  X,
} from 'lucide-react';

export interface FilterState {
  search: string;
  startDate: string;
  endDate: string;
  category: string;
  paymentMethod: string;
  location: string;
  tripId: string;
  status: string; // 'all' | 'valid' | 'incomplete'
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClearFilters: () => void;
  categories: string[];
  locations: string[];
  paymentMethods: string[];
  trips: Trip[];
  filteredCount: number;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  categories,
  locations,
  paymentMethods,
  trips,
  filteredCount,
  totalCount,
}) => {
  // Count active filters (excluding default values)
  const activeFilterCount = [
    Boolean(filters.search.trim()),
    Boolean(filters.startDate),
    Boolean(filters.endDate),
    filters.category !== 'all',
    filters.paymentMethod !== 'all',
    filters.location !== 'all',
    filters.tripId !== 'all',
    filters.status !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 space-y-3">
      {/* Top row: Search input & summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search descriptions, notes, locations, amounts..."
            aria-label="Search descriptions, notes, locations, amounts"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-9 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange('search', '')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium">
            Showing <strong className="text-slate-900 dark:text-white">{filteredCount}</strong> of {totalCount} expenses
          </span>

          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              aria-label={`Clear ${activeFilterCount} active filters`}
              className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Filter Selectors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Category */}
        <div>
          <label htmlFor="filter-category" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Category
          </label>
          <select
            id="filter-category"
            aria-label="Filter by category"
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="filter-location" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Location
          </label>
          <select
            id="filter-location"
            aria-label="Filter by location"
            value={filters.location}
            onChange={(e) => onFilterChange('location', e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <label htmlFor="filter-payment-method" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Payment Method
          </label>
          <select
            id="filter-payment-method"
            aria-label="Filter by payment method"
            value={filters.paymentMethod}
            onChange={(e) => onFilterChange('paymentMethod', e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Methods</option>
            {paymentMethods.map((pm) => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </select>
        </div>

        {/* Associated Trip */}
        <div>
          <label htmlFor="filter-trip" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Trip
          </label>
          <select
            id="filter-trip"
            aria-label="Filter by trip"
            value={filters.tripId}
            onChange={(e) => onFilterChange('tripId', e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Trips</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="filter-status" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            id="filter-status"
            aria-label="Filter by record status"
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Records</option>
            <option value="valid">Valid Records</option>
            <option value="incomplete">Incomplete Records</option>
          </select>
        </div>

        {/* Date Range Start & End */}
        <div>
          <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Date Range
          </span>
          <div className="flex items-center gap-1">
            <input
              type="date"
              id="filter-start-date"
              aria-label="Filter start date"
              value={filters.startDate}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
              className="w-1/2 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1 text-[11px] font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
              title="Start Date"
            />
            <span className="text-slate-400 text-xs">–</span>
            <input
              type="date"
              id="filter-end-date"
              aria-label="Filter end date"
              value={filters.endDate}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
              className="w-1/2 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1 text-[11px] font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
              title="End Date"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
