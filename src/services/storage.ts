import { Expense, Reimbursement, Trip } from '../types/index';
import { initialExpenses } from '../data/initialExpenses';
import { initialReimbursements } from '../data/initialReimbursements';
import { initialTrips } from '../data/initialTrips';

const STORAGE_KEYS = {
  EXPENSES: 'atul_expense_manager_expenses_v1',
  REIMBURSEMENTS: 'atul_expense_manager_reimbursements_v1',
  TRIPS: 'atul_expense_manager_trips_v1',
  ACTIVE_TRIP: 'atul_expense_manager_active_trip_v1',
  DARK_MODE: 'atul_expense_manager_dark_mode_v1',
};

class StorageService {
  private memStorage = new Map<string, string>();

  private getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Graceful fallback to memory storage
    }
    return this.memStorage.get(key) || null;
  }

  private setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Graceful fallback to memory storage
    }
    this.memStorage.set(key, value);
  }

  private removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // Graceful fallback to memory storage
    }
    this.memStorage.delete(key);
  }

  // --- EXPENSES ---
  getExpenses(): Expense[] {
    try {
      const data = this.getItem(STORAGE_KEYS.EXPENSES);
      if (!data) {
        this.saveExpenses(initialExpenses);
        return initialExpenses;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load expenses from localStorage:', e);
      return initialExpenses;
    }
  }

  saveExpenses(expenses: Expense[]): void {
    try {
      this.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (e) {
      console.error('Failed to save expenses to localStorage:', e);
    }
  }

  addExpense(expenseData: Omit<Expense, 'id'> & { id?: string }): Expense {
    const expenses = this.getExpenses();
    const newExpense: Expense = {
      ...expenseData,
      id: expenseData.id || `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: expenseData.amount !== null && !isNaN(expenseData.amount) && expenseData.date && expenseData.description
        ? 'valid'
        : 'incomplete'
    };
    const updated = [newExpense, ...expenses];
    this.saveExpenses(updated);
    return newExpense;
  }

  updateExpense(updatedExpense: Expense): void {
    const expenses = this.getExpenses();
    const index = expenses.findIndex((e) => e.id === updatedExpense.id);
    if (index !== -1) {
      const status = updatedExpense.amount !== null && !isNaN(updatedExpense.amount) && updatedExpense.date && updatedExpense.description
        ? 'valid'
        : 'incomplete';
      expenses[index] = {
        ...updatedExpense,
        status,
        updatedAt: new Date().toISOString()
      };
      this.saveExpenses(expenses);
    }
  }

  deleteExpense(id: string): void {
    const expenses = this.getExpenses();
    const filtered = expenses.filter((e) => e.id !== id);
    this.saveExpenses(filtered);
  }

  deleteMultipleExpenses(ids: string[]): void {
    const expenses = this.getExpenses();
    const idSet = new Set(ids);
    const filtered = expenses.filter((e) => !idSet.has(e.id));
    this.saveExpenses(filtered);
  }

  // --- REIMBURSEMENTS ---
  getReimbursements(): Reimbursement[] {
    try {
      const data = this.getItem(STORAGE_KEYS.REIMBURSEMENTS);
      if (!data) {
        this.saveReimbursements(initialReimbursements);
        return initialReimbursements;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load reimbursements from localStorage:', e);
      return initialReimbursements;
    }
  }

  saveReimbursements(reimbursements: Reimbursement[]): void {
    try {
      this.setItem(STORAGE_KEYS.REIMBURSEMENTS, JSON.stringify(reimbursements));
    } catch (e) {
      console.error('Failed to save reimbursements to localStorage:', e);
    }
  }

  addReimbursement(data: Omit<Reimbursement, 'id'> & { id?: string }): Reimbursement {
    const reimbursements = this.getReimbursements();
    const newReimb: Reimbursement = {
      ...data,
      id: data.id || `reimb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newReimb, ...reimbursements];
    this.saveReimbursements(updated);
    return newReimb;
  }

  updateReimbursement(updated: Reimbursement): void {
    const reimbursements = this.getReimbursements();
    const index = reimbursements.findIndex((r) => r.id === updated.id);
    if (index !== -1) {
      reimbursements[index] = { ...updated };
      this.saveReimbursements(reimbursements);
    }
  }

  deleteReimbursement(id: string): void {
    const reimbursements = this.getReimbursements();
    const filtered = reimbursements.filter((r) => r.id !== id);
    this.saveReimbursements(filtered);
  }

  // --- TRIPS ---
  getTrips(): Trip[] {
    try {
      const data = this.getItem(STORAGE_KEYS.TRIPS);
      if (!data) {
        this.saveTrips(initialTrips);
        return initialTrips;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load trips from localStorage:', e);
      return initialTrips;
    }
  }

  saveTrips(trips: Trip[]): void {
    try {
      this.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
    } catch (e) {
      console.error('Failed to save trips to localStorage:', e);
    }
  }

  addTrip(tripData: Omit<Trip, 'id'> & { id?: string }): Trip {
    const trips = this.getTrips();
    const newTrip: Trip = {
      ...tripData,
      id: tripData.id || `trip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };
    const updated = [...trips, newTrip];
    this.saveTrips(updated);
    return newTrip;
  }

  updateTrip(updatedTrip: Trip): void {
    const trips = this.getTrips();
    const index = trips.findIndex((t) => t.id === updatedTrip.id);
    if (index !== -1) {
      trips[index] = { ...updatedTrip };
      this.saveTrips(trips);
    }
  }

  deleteTrip(id: string): void {
    const trips = this.getTrips();
    const filtered = trips.filter((t) => t.id !== id);
    this.saveTrips(filtered);
    if (this.getActiveTripId() === id) {
      this.setActiveTripId('all');
    }
    // Unlink expenses and reimbursements associated with this deleted trip
    const expenses = this.getExpenses();
    let expChanged = false;
    const updatedExpenses = expenses.map((e) => {
      if (e.tripId === id) {
        expChanged = true;
        return { ...e, tripId: null };
      }
      return e;
    });
    if (expChanged) {
      this.saveExpenses(updatedExpenses);
    }

    const reimbursements = this.getReimbursements();
    let reimbChanged = false;
    const updatedReimbursements = reimbursements.map((r) => {
      if (r.tripId === id) {
        reimbChanged = true;
        return { ...r, tripId: null };
      }
      return r;
    });
    if (reimbChanged) {
      this.saveReimbursements(updatedReimbursements);
    }
  }

  // --- ACTIVE TRIP ---
  getActiveTripId(): string {
    try {
      return this.getItem(STORAGE_KEYS.ACTIVE_TRIP) || 'all';
    } catch {
      return 'all';
    }
  }

  setActiveTripId(tripId: string): void {
    try {
      this.setItem(STORAGE_KEYS.ACTIVE_TRIP, tripId);
    } catch (e) {
      console.error('Failed to set active trip in localStorage:', e);
    }
  }

  // --- RESTORE BACKUP ---
  restoreBackup(data: { expenses: Expense[]; reimbursements: Reimbursement[]; trips: Trip[] }): void {
    if (data.expenses) this.saveExpenses(data.expenses);
    if (data.reimbursements) this.saveReimbursements(data.reimbursements);
    if (data.trips) this.saveTrips(data.trips);
  }

  // --- RESET ---
  resetToInitial(): void {
    this.removeItem(STORAGE_KEYS.EXPENSES);
    this.removeItem(STORAGE_KEYS.REIMBURSEMENTS);
    this.removeItem(STORAGE_KEYS.TRIPS);
    this.removeItem(STORAGE_KEYS.ACTIVE_TRIP);
    this.saveExpenses(initialExpenses);
    this.saveReimbursements(initialReimbursements);
    this.saveTrips(initialTrips);
  }
}

export const storage = new StorageService();
