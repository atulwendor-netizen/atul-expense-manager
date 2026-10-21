import React, { useState, useMemo } from 'react';
import { Expense, Reimbursement, Trip } from '../types/index';
import { formatCurrency } from '../utils/calculations';
import {
  Calculator,
  Coins,
  Car,
  Percent,
  Utensils,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Sparkles,
  Users,
  Compass,
  TrendingUp,
  Receipt,
  FileCheck,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';

interface CalculatorPageProps {
  expenses: Expense[];
  reimbursements: Reimbursement[];
  trips: Trip[];
  activeTripId?: string;
  onSelectTrip?: (tripId: string) => void;
  onOpenAddExpenseWithPreload?: (prefill?: Partial<Expense>) => void;
  onOpenAddReimbursementWithPreload?: (prefill?: Partial<Reimbursement>) => void;
  onNotify: (type: 'success' | 'warning' | 'info' | 'error', text: string) => void;
  onNavigateTab?: (tab: string) => void;
  isManager?: boolean;
}

type CalculatorMode = 'settlement' | 'perdiem' | 'mileage' | 'split_tax' | 'scratchpad';

interface SimulatedItem {
  id: string;
  description: string;
  amount: number;
  category: string;
}

interface ScratchpadItem {
  id: string;
  title: string;
  amount: number;
  category: string;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({
  expenses,
  reimbursements,
  trips,
  activeTripId = 'all',
  onSelectTrip,
  onOpenAddExpenseWithPreload,
  onOpenAddReimbursementWithPreload,
  onNotify,
  onNavigateTab,
  isManager = false,
}) => {
  // Mode selection
  const [activeMode, setActiveMode] = useState<CalculatorMode>('settlement');
  const [selectedTripId, setSelectedTripId] = useState<string>(activeTripId);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync external activeTripId if updated
  React.useEffect(() => {
    setSelectedTripId(activeTripId);
  }, [activeTripId]);

  const handleTripChange = (tripId: string) => {
    setSelectedTripId(tripId);
    if (onSelectTrip) onSelectTrip(tripId);
  };

  // Scoped stored data for baseline calculation
  const scopedExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedTripId !== 'all' && e.tripId !== selectedTripId) return false;
      return e.status === 'valid' && typeof e.amount === 'number' && !isNaN(e.amount);
    });
  }, [expenses, selectedTripId]);

  const scopedReimbursements = useMemo(() => {
    return reimbursements.filter((r) => {
      if (selectedTripId !== 'all' && r.tripId !== selectedTripId) return false;
      return true;
    });
  }, [reimbursements, selectedTripId]);

  const actualExpenseTotal = useMemo(() => {
    return scopedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [scopedExpenses]);

  const actualReimbursementTotal = useMemo(() => {
    return scopedReimbursements.reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [scopedReimbursements]);

  const actualPendingClaim = Math.max(0, actualExpenseTotal - actualReimbursementTotal);
  const actualSurplus = Math.max(0, actualReimbursementTotal - actualExpenseTotal);

  // -------------------------------------------------------------
  // MODE 1: SETTLEMENT & WHAT-IF SIMULATOR
  // -------------------------------------------------------------
  const [simulatedExpenses, setSimulatedExpenses] = useState<SimulatedItem[]>([]);
  const [simDesc, setSimDesc] = useState('');
  const [simAmt, setSimAmt] = useState('');
  const [simCategory, setSimCategory] = useState('Transit');
  const [simAdvance, setSimAdvance] = useState('');

  const addSimulatedExpense = () => {
    const parsed = parseFloat(simAmt);
    if (!simAmt || isNaN(parsed) || parsed <= 0) {
      onNotify('warning', 'Please enter a valid positive expense amount.');
      return;
    }
    const newItem: SimulatedItem = {
      id: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: simDesc.trim() || 'Simulated Expense',
      amount: parsed,
      category: simCategory,
    };
    setSimulatedExpenses((prev) => [...prev, newItem]);
    setSimDesc('');
    setSimAmt('');
    onNotify('success', `Added ₹${parsed.toLocaleString('en-IN')} to simulation`);
  };

  const removeSimulatedExpense = (id: string) => {
    setSimulatedExpenses((prev) => prev.filter((i) => i.id !== id));
  };

  const clearSimulation = () => {
    setSimulatedExpenses([]);
    setSimAdvance('');
    onNotify('info', 'Simulation reset to stored records');
  };

  const simExpensesTotal = useMemo(() => {
    return simulatedExpenses.reduce((sum, i) => sum + i.amount, 0);
  }, [simulatedExpenses]);

  const simAdvanceNum = useMemo(() => {
    const val = parseFloat(simAdvance);
    return !isNaN(val) && val > 0 ? val : 0;
  }, [simAdvance]);

  const projectedTotalExpenses = actualExpenseTotal + simExpensesTotal;
  const projectedTotalReimbursement = actualReimbursementTotal + simAdvanceNum;
  const projectedNetClaim = Math.max(0, projectedTotalExpenses - projectedTotalReimbursement);
  const projectedSurplus = Math.max(0, projectedTotalReimbursement - projectedTotalExpenses);

  // -------------------------------------------------------------
  // MODE 2: PER DIEM & DAILY ALLOWANCE CALCULATOR
  // -------------------------------------------------------------
  const [perDiemDays, setPerDiemDays] = useState<number>(15);
  const [perDiemRateTier, setPerDiemRateTier] = useState<string>('tier1');
  const [customRate, setCustomRate] = useState<string>('');

  const effectiveDailyRate = useMemo(() => {
    if (perDiemRateTier === 'tier1') return 1500; // Metro (Mumbai, Delhi, Bengaluru)
    if (perDiemRateTier === 'tier2') return 1000; // Tier 2 (Pune, Gurgaon, Hyderabad)
    if (perDiemRateTier === 'tier3') return 700;  // Other cities
    const parsed = parseFloat(customRate);
    return !isNaN(parsed) && parsed > 0 ? parsed : 1000;
  }, [perDiemRateTier, customRate]);

  const totalPerDiemEntitlement = perDiemDays * effectiveDailyRate;

  // Actual food and transit spend from stored records in the scope
  const actualFoodSpend = useMemo(() => {
    return scopedExpenses
      .filter((e) => e.category === 'Food & Beverage' || e.category === 'Food')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [scopedExpenses]);

  const actualTransitSpend = useMemo(() => {
    return scopedExpenses
      .filter((e) => e.category === 'Transit')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [scopedExpenses]);

  const actualDailyAllowanceSpend = actualFoodSpend + actualTransitSpend;
  const perDiemVariance = totalPerDiemEntitlement - actualDailyAllowanceSpend;

  // -------------------------------------------------------------
  // MODE 3: MILEAGE & TRANSIT CALCULATOR
  // -------------------------------------------------------------
  const [distanceKm, setDistanceKm] = useState<string>('45');
  const [vehicleType, setVehicleType] = useState<'car' | 'bike' | 'taxi' | 'custom'>('car');
  const [customMileageRate, setCustomMileageRate] = useState<string>('');
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(false);
  const [tollsAndParking, setTollsAndParking] = useState<string>('120');

  const effectiveMileageRate = useMemo(() => {
    if (vehicleType === 'car') return 12; // ₹12/km
    if (vehicleType === 'bike') return 5;  // ₹5/km
    if (vehicleType === 'taxi') return 18; // ₹18/km
    const parsed = parseFloat(customMileageRate);
    return !isNaN(parsed) && parsed > 0 ? parsed : 12;
  }, [vehicleType, customMileageRate]);

  const parsedKm = useMemo(() => {
    const v = parseFloat(distanceKm);
    return !isNaN(v) && v > 0 ? v : 0;
  }, [distanceKm]);

  const effectiveTotalKm = isRoundTrip ? parsedKm * 2 : parsedKm;
  const transitFareCalculated = effectiveTotalKm * effectiveMileageRate;
  const tollsNum = useMemo(() => {
    const v = parseFloat(tollsAndParking);
    return !isNaN(v) && v > 0 ? v : 0;
  }, [tollsAndParking]);

  const totalTransitClaim = transitFareCalculated + tollsNum;

  // -------------------------------------------------------------
  // MODE 4: GST & TEAM BILL SPLITTER
  // -------------------------------------------------------------
  const [billAmount, setBillAmount] = useState<string>('2500');
  const [gstType, setGstType] = useState<'exclusive' | 'inclusive'>('inclusive');
  const [gstRate, setGstRate] = useState<number>(18);
  const [splitPersons, setSplitPersons] = useState<number>(3);
  const [tipPercentage, setTipPercentage] = useState<number>(0);

  const billCalculations = useMemo(() => {
    const rawAmt = parseFloat(billAmount);
    const amount = !isNaN(rawAmt) && rawAmt > 0 ? rawAmt : 0;

    let base = 0;
    let tax = 0;
    let total = 0;

    if (gstType === 'inclusive') {
      // Amount contains GST: Base = Amount / (1 + rate/100)
      base = amount / (1 + gstRate / 100);
      tax = amount - base;
      total = amount;
    } else {
      // Amount is pre-tax: Tax = Amount * (rate/100)
      base = amount;
      tax = amount * (gstRate / 100);
      total = base + tax;
    }

    const tipAmount = total * (tipPercentage / 100);
    const grandTotal = total + tipAmount;
    const count = Math.max(1, splitPersons);
    const perPersonShare = grandTotal / count;

    return {
      baseAmount: Math.round(base * 100) / 100,
      cgst: Math.round((tax / 2) * 100) / 100,
      sgst: Math.round((tax / 2) * 100) / 100,
      totalTax: Math.round(tax * 100) / 100,
      totalBill: Math.round(total * 100) / 100,
      tipAmount: Math.round(tipAmount * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      perPersonShare: Math.round(perPersonShare * 100) / 100,
    };
  }, [billAmount, gstType, gstRate, splitPersons, tipPercentage]);

  // -------------------------------------------------------------
  // MODE 5: EXPENSE SCRATCHPAD
  // -------------------------------------------------------------
  const [scratchpadItems, setScratchpadItems] = useState<ScratchpadItem[]>([
    { id: 'sc-1', title: 'Airport Express Metro', amount: 60, category: 'Transit' },
    { id: 'sc-2', title: 'Working Lunch & Coffee', amount: 350, category: 'Food & Beverage' },
    { id: 'sc-3', title: 'Stationery & Courier Printouts', amount: 180, category: 'Miscellaneous' },
  ]);
  const [scratchTitle, setScratchTitle] = useState('');
  const [scratchAmt, setScratchAmt] = useState('');
  const [scratchCat, setScratchCat] = useState('Transit');

  const addScratchpadItem = () => {
    const parsed = parseFloat(scratchAmt);
    if (!scratchAmt || isNaN(parsed) || parsed <= 0) {
      onNotify('warning', 'Please enter a valid positive amount.');
      return;
    }
    const newItem: ScratchpadItem = {
      id: `sc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: scratchTitle.trim() || 'Expense Item',
      amount: parsed,
      category: scratchCat,
    };
    setScratchpadItems((prev) => [...prev, newItem]);
    setScratchTitle('');
    setScratchAmt('');
  };

  const scratchpadTotal = useMemo(() => {
    return scratchpadItems.reduce((sum, item) => sum + item.amount, 0);
  }, [scratchpadItems]);

  const loadScratchpadTemplate = (type: 'metro_day' | 'client_dinner' | 'field_work') => {
    if (type === 'metro_day') {
      setScratchpadItems([
        { id: `sc-${Date.now()}-1`, title: 'Metro Ticket (IFFCO Chowk)', amount: 64, category: 'Transit' },
        { id: `sc-${Date.now()}-2`, title: 'Auto / E-Rickshaw', amount: 30, category: 'Transit' },
        { id: `sc-${Date.now()}-3`, title: 'Tea & Snacks', amount: 80, category: 'Food & Beverage' },
      ]);
    } else if (type === 'client_dinner') {
      setScratchpadItems([
        { id: `sc-${Date.now()}-1`, title: 'Executive Lunch Meeting', amount: 1850, category: 'Food & Beverage' },
        { id: `sc-${Date.now()}-2`, title: 'Client Cab Service', amount: 450, category: 'Transit' },
      ]);
    } else {
      setScratchpadItems([
        { id: `sc-${Date.now()}-1`, title: 'Porter / Local Delivery', amount: 82, category: 'Porter' },
        { id: `sc-${Date.now()}-2`, title: 'Packing Material & Tape', amount: 120, category: 'Miscellaneous' },
        { id: `sc-${Date.now()}-3`, title: 'Return Transit', amount: 110, category: 'Transit' },
      ]);
    }
    onNotify('success', 'Loaded preset template into scratchpad');
  };

  // Helper copy to clipboard
  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    onNotify('info', 'Copied calculation breakdown to clipboard');
  };

  return (
    <div className="space-y-6 animate-dashboard-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Calculator className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Financial Calculator
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Interactive calculation engine for net claim settlement, per diem allowances, travel mileage, and tax splitting
          </p>
        </div>

        {/* Scope Selector */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <Compass className="h-4 w-4 text-slate-400" />
            <select
              aria-label="Filter calculator dataset by trip"
              value={selectedTripId}
              onChange={(e) => handleTripChange(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Trips & General Ledger</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('reimbursements')}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              <Receipt className="h-3.5 w-3.5 text-blue-600" />
              <span>View Ledger</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Real-Time Synchronized Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Logged Expenses */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Gross Expenses</span>
            <Receipt className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(actualExpenseTotal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {scopedExpenses.length} valid recorded transactions
          </p>
        </div>

        {/* Reimbursements Received */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Reimbursed / Advance</span>
            <FileCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatCurrency(actualReimbursementTotal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {scopedReimbursements.length} disbursement records
          </p>
        </div>

        {/* Current Net Balance / Claim Due */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Net Claim Balance</span>
            {actualPendingClaim > 0 ? (
              <Clock className="h-4 w-4 text-amber-500" />
            ) : (
              <Check className="h-4 w-4 text-emerald-500" />
            )}
          </div>
          <div className={`text-xl sm:text-2xl font-bold tracking-tight ${
            actualPendingClaim > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
          }`}>
            {actualPendingClaim > 0 ? formatCurrency(actualPendingClaim) : '₹0.00'}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {actualPendingClaim > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <ArrowUpRight className="h-3 w-3" /> Due to employee
              </span>
            ) : actualSurplus > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                <ArrowDownRight className="h-3 w-3" /> Advance surplus {formatCurrency(actualSurplus)}
              </span>
            ) : (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                100% Fully settled
              </span>
            )}
          </div>
        </div>

        {/* Settlement Progress */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Settlement Rate</span>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {actualExpenseTotal > 0
              ? `${Math.min(100, Math.round((actualReimbursementTotal / actualExpenseTotal) * 100))}%`
              : '0%'}
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${actualExpenseTotal > 0 ? Math.min(100, Math.round((actualReimbursementTotal / actualExpenseTotal) * 100)) : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveMode('settlement')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeMode === 'settlement'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Coins className="h-4 w-4" />
          <span>Claim Settlement & Forecast</span>
        </button>

        <button
          onClick={() => setActiveMode('perdiem')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeMode === 'perdiem'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Utensils className="h-4 w-4" />
          <span>Per Diem & Daily Allowance</span>
        </button>

        <button
          onClick={() => setActiveMode('mileage')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeMode === 'mileage'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Car className="h-4 w-4" />
          <span>Travel Mileage & Transit</span>
        </button>

        <button
          onClick={() => setActiveMode('split_tax')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeMode === 'split_tax'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Percent className="h-4 w-4" />
          <span>GST & Bill Splitter</span>
        </button>

        <button
          onClick={() => setActiveMode('scratchpad')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeMode === 'scratchpad'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Expense Scratchpad</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODE 1: CLAIM SETTLEMENT & WHAT-IF SIMULATOR */}
      {/* ------------------------------------------------------------- */}
      {activeMode === 'settlement' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: What-if Controls & Added Items (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Simulate Upcoming Expenses & Advances
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add estimated expenses or unlogged payments to forecast your final claim settlement
                  </p>
                </div>
                {simulatedExpenses.length > 0 && (
                  <button
                    onClick={clearSimulation}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>

              {/* Add form */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 mb-4">
                <input
                  type="text"
                  placeholder="Expense description (e.g. Return Flight, Client Dinner)"
                  value={simDesc}
                  onChange={(e) => setSimDesc(e.target.value)}
                  className="sm:col-span-5 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Amount (₹)"
                  value={simAmt}
                  onChange={(e) => setSimAmt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSimulatedExpense()}
                  className="sm:col-span-3 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <select
                  value={simCategory}
                  onChange={(e) => setSimCategory(e.target.value)}
                  className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/50 px-2 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="Transit">Transit</option>
                  <option value="Food & Beverage">Food</option>
                  <option value="Lodging">Lodging</option>
                  <option value="Miscellaneous">Misc</option>
                </select>
                <button
                  type="button"
                  onClick={addSimulatedExpense}
                  className="sm:col-span-2 flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Advance input */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Additional Expected Advance / Company Payment:
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={simAdvance}
                    onChange={(e) => setSimAdvance(e.target.value)}
                    className="w-36 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-right font-semibold"
                  />
                </div>
              </div>

              {/* Simulated items table */}
              {simulatedExpenses.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Simulated Items ({simulatedExpenses.length})
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {simulatedExpenses.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 text-[10px] font-semibold">
                            {item.category}
                          </span>
                          <span className="truncate font-medium">{item.description}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(item.amount)}
                          </span>
                          <button
                            onClick={() => removeSimulatedExpense(item.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Projected Settlement Card (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm dark:border-slate-800/80 dark:from-slate-900 dark:to-slate-950">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Forecasted Settlement Ledger
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Actual Logged Expenses:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(actualExpenseTotal)}
                  </span>
                </div>

                {simExpensesTotal > 0 && (
                  <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                    <span>+ Simulated Upcoming Expenses:</span>
                    <span className="font-semibold">+{formatCurrency(simExpensesTotal)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                  <span>Projected Gross Spend:</span>
                  <span className="text-sm">{formatCurrency(projectedTotalExpenses)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1">
                  <span>Actual Reimbursed Amount:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(actualReimbursementTotal)}
                  </span>
                </div>

                {simAdvanceNum > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span>+ Simulated Additional Advance:</span>
                    <span className="font-semibold">+{formatCurrency(simAdvanceNum)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                  <span>Projected Total Recovered:</span>
                  <span className="text-sm">{formatCurrency(projectedTotalReimbursement)}</span>
                </div>

                {/* Final Net Highlight */}
                <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-800/80 dark:border dark:border-slate-700 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Final Net Balance:</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-slate-800 dark:bg-slate-700 text-slate-200">
                      {projectedNetClaim > 0 ? 'Pending Claim' : projectedSurplus > 0 ? 'Advance Surplus' : 'Balanced'}
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold tracking-tight text-white pt-1">
                    {projectedNetClaim > 0
                      ? formatCurrency(projectedNetClaim)
                      : projectedSurplus > 0
                      ? formatCurrency(projectedSurplus)
                      : '₹0.00'}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {projectedNetClaim > 0
                      ? 'Reimbursement required from company to close out claim'
                      : projectedSurplus > 0
                      ? 'Employee holds surplus advance to return to company'
                      : 'All expenditures and advances are completely settled'}
                  </p>
                </div>

                {/* Action buttons */}
                {!isManager && onOpenAddReimbursementWithPreload && projectedNetClaim > 0 && (
                  <button
                    onClick={() => {
                      onOpenAddReimbursementWithPreload({
                        amount: projectedNetClaim,
                        reference: `REIMB-CLAIM-${Date.now().toString().slice(-4)}`,
                        tripId: selectedTripId !== 'all' ? selectedTripId : undefined,
                        notes: `Final settlement claim calculated from ledger (${formatCurrency(projectedNetClaim)})`,
                      });
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
                  >
                    <FileCheck className="h-4 w-4" />
                    <span>File Claim of {formatCurrency(projectedNetClaim)}</span>
                  </button>
                )}

                <button
                  onClick={() =>
                    handleCopyText(
                      `Ledger Settlement Summary\n` +
                      `Gross Expenses: ${formatCurrency(projectedTotalExpenses)}\n` +
                      `Reimbursements/Advance: ${formatCurrency(projectedTotalReimbursement)}\n` +
                      `Net Settlement Due: ${formatCurrency(projectedNetClaim)}`,
                      'settlement'
                    )
                  }
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                >
                  {copiedKey === 'settlement' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedKey === 'settlement' ? 'Copied to Clipboard' : 'Copy Breakdown'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 2: PER DIEM & DAILY ALLOWANCE CALCULATOR */}
      {/* ------------------------------------------------------------- */}
      {activeMode === 'perdiem' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-violet-500" />
                  Per Diem & Travel Day Allowance
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Standard daily corporate stipend covering meals, local transit, and incidentals
                </p>
              </div>

              {/* Trip Duration */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Trip Duration: {perDiemDays} Days</span>
                  <div className="flex items-center gap-1">
                    {[1, 5, 10, 15, 20, 30].map((d) => (
                      <button
                        key={d}
                        onClick={() => setPerDiemDays(d)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors ${
                          perDiemDays === d
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="45"
                  value={perDiemDays}
                  onChange={(e) => setPerDiemDays(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* City Tier */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  City Tier / Location Allowance:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div
                    onClick={() => setPerDiemRateTier('tier1')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      perDiemRateTier === 'tier1'
                        ? 'border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white">Tier 1 Metro</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Mumbai, Delhi, Bangalore</div>
                    <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-2">₹1,500 / day</div>
                  </div>

                  <div
                    onClick={() => setPerDiemRateTier('tier2')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      perDiemRateTier === 'tier2'
                        ? 'border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white">Tier 2 Cities</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Pune, Gurgaon, Hyderabad</div>
                    <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-2">₹1,000 / day</div>
                  </div>

                  <div
                    onClick={() => setPerDiemRateTier('tier3')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      perDiemRateTier === 'tier3'
                        ? 'border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white">Tier 3 / Other</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Regional & Local centers</div>
                    <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-2">₹700 / day</div>
                  </div>
                </div>

                {perDiemRateTier === 'custom' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-500">Custom Rate: ₹</span>
                    <input
                      type="number"
                      placeholder="Custom daily rate"
                      value={customRate}
                      onChange={(e) => setCustomRate(e.target.value)}
                      className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Allowance Component Distribution */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Recommended Stipend Allocation
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">Meals (50%)</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-1">
                      {formatCurrency(effectiveDailyRate * 0.5)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">Local Transit (35%)</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-1">
                      {formatCurrency(effectiveDailyRate * 0.35)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">Incidentals (15%)</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-1">
                      {formatCurrency(effectiveDailyRate * 0.15)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Comparison with Actual Spend */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Per Diem vs Actual Spend Audit
              </h2>

              <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 space-y-1">
                <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                  Total Eligible Per Diem Claim
                </span>
                <div className="text-2xl font-extrabold text-violet-900 dark:text-violet-100">
                  {formatCurrency(totalPerDiemEntitlement)}
                </div>
                <p className="text-[11px] text-violet-600 dark:text-violet-400">
                  {perDiemDays} days × {formatCurrency(effectiveDailyRate)} / day
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Actual Recorded Food Spend:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(actualFoodSpend)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Actual Recorded Transit Spend:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(actualTransitSpend)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>Total Actual Daily Spend:</span>
                  <span>{formatCurrency(actualDailyAllowanceSpend)}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-bold">
                  <span>Budget Variance:</span>
                  <span className={perDiemVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {perDiemVariance >= 0 ? `+${formatCurrency(perDiemVariance)} (Savings)` : `${formatCurrency(perDiemVariance)} (Excess)`}
                  </span>
                </div>
              </div>

              {!isManager && onOpenAddExpenseWithPreload && (
                <button
                  onClick={() => {
                    onOpenAddExpenseWithPreload({
                      amount: totalPerDiemEntitlement,
                      description: `Per Diem Allowance: ${perDiemDays} days @ ${formatCurrency(effectiveDailyRate)}/day`,
                      category: 'Food & Beverage',
                      tripId: selectedTripId !== 'all' ? selectedTripId : undefined,
                      notes: `Per diem stipend calculated for ${perDiemDays} days (${formatCurrency(totalPerDiemEntitlement)})`,
                    });
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Log {formatCurrency(totalPerDiemEntitlement)} as Per Diem Claim</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 3: TRAVEL MILEAGE & TRANSIT CALCULATOR */}
      {/* ------------------------------------------------------------- */}
      {activeMode === 'mileage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Car className="h-4 w-4 text-emerald-500" />
                  Corporate Travel Mileage & Conveyance
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Calculate reimbursement for personal vehicle use, taxi fares, tolls, and parking
                </p>
              </div>

              {/* Vehicle Type Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Vehicle Type & Mileage Rate:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div
                    onClick={() => setVehicleType('car')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      vehicleType === 'car'
                        ? 'border-emerald-600 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white">🚗 Car</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Four wheeler</div>
                    <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">₹12 / km</div>
                  </div>

                  <div
                    onClick={() => setVehicleType('bike')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      vehicleType === 'bike'
                        ? 'border-emerald-600 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white">🏍️ Bike</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Two wheeler</div>
                    <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">₹5 / km</div>
                  </div>

                  <div
                    onClick={() => setVehicleType('taxi')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      vehicleType === 'taxi'
                        ? 'border-emerald-600 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white">🚕 Cab</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Ola / Taxi</div>
                    <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">₹18 / km</div>
                  </div>

                  <div
                    onClick={() => setVehicleType('custom')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      vehicleType === 'custom'
                        ? 'border-emerald-600 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white">⚙️ Custom</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Custom rate</div>
                    <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                      {customMileageRate ? `₹${customMileageRate}/km` : 'Set ₹/km'}
                    </div>
                  </div>
                </div>

                {vehicleType === 'custom' && (
                  <div className="pt-2">
                    <label htmlFor="custom-mileage-rate-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Custom Rate (₹ per kilometer):
                    </label>
                    <input
                      id="custom-mileage-rate-input"
                      type="number"
                      min="1"
                      step="any"
                      value={customMileageRate}
                      onChange={(e) => setCustomMileageRate(e.target.value)}
                      placeholder="e.g. 15"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Distance input */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <label htmlFor="mileage-distance-input">Travel Distance (Kilometers):</label>
                  <div className="flex items-center gap-1">
                    {[10, 25, 50, 100, 250].map((km) => (
                      <button
                        key={km}
                        type="button"
                        onClick={() => setDistanceKm(String(km))}
                        className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 font-semibold"
                      >
                        {km}km
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="mileage-distance-input"
                    type="number"
                    min="0"
                    step="any"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                    placeholder="Enter distance in km"
                  />
                  <span className="text-xs font-semibold text-slate-500">KM</span>
                </div>
              </div>

              {/* Round Trip & Tolls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <input
                    type="checkbox"
                    checked={isRoundTrip}
                    onChange={(e) => setIsRoundTrip(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Round Trip (Return)</div>
                    <div className="text-[11px] text-slate-500">Automatically doubles distance</div>
                  </div>
                </label>

                <div className="space-y-1">
                  <label htmlFor="tolls-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tolls & Parking Charges (₹):
                  </label>
                  <input
                    id="tolls-input"
                    type="number"
                    min="0"
                    value={tollsAndParking}
                    onChange={(e) => setTollsAndParking(e.target.value)}
                    placeholder="Toll / Parking fees"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Mileage Summary Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Transit Claim Breakdown
              </h2>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Total Reimbursable Transit Expense
                </span>
                <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100">
                  {formatCurrency(totalTransitClaim)}
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  {effectiveTotalKm} km @ ₹{effectiveMileageRate}/km + {formatCurrency(tollsNum)} tolls
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Base Distance:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{parsedKm} km</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Journey Type:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {isRoundTrip ? 'Round Trip (2x)' : 'One Way'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Mileage Allowance:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(transitFareCalculated)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Tolls & Parking:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(tollsNum)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>Grand Total Claim:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(totalTransitClaim)}</span>
                </div>
              </div>

              {!isManager && onOpenAddExpenseWithPreload && (
                <button
                  onClick={() => {
                    onOpenAddExpenseWithPreload({
                      amount: totalTransitClaim,
                      description: `Travel Conveyance: ${effectiveTotalKm} km @ ₹${effectiveMileageRate}/km (${vehicleType.toUpperCase()})`,
                      category: 'Transit',
                      tripId: selectedTripId !== 'all' ? selectedTripId : undefined,
                      notes: `Mileage: ${effectiveTotalKm} km | Tolls: ₹${tollsNum} | Vehicle: ${vehicleType}`,
                    });
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Log {formatCurrency(totalTransitClaim)} as Transit Expense</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 4: GST & BILL SPLITTER */}
      {/* ------------------------------------------------------------- */}
      {activeMode === 'split_tax' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Percent className="h-4 w-4 text-blue-500" />
                  Tax (GST) & Team Bill Splitter
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Calculate base cost vs GST breakdown and split shared expenses across team members
                </p>
              </div>

              {/* Amount input & GST Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="tax-bill-amount" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Bill Amount (₹):
                  </label>
                  <input
                    id="tax-bill-amount"
                    type="number"
                    min="0"
                    step="any"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                    placeholder="Enter total bill amount"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pricing Mode:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setGstType('inclusive')}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        gstType === 'inclusive'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      Inclusive (MRP)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGstType('exclusive')}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        gstType === 'exclusive'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      + Exclusive GST
                    </button>
                  </div>
                </div>
              </div>

              {/* GST Slab buttons */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  GST Tax Slab Rate:
                </label>
                <div className="flex items-center gap-2">
                  {[0, 5, 12, 18, 28].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setGstRate(rate)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        gstRate === rate
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Split */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-blue-500" />
                    Split Among: {splitPersons} People
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSplitPersons(p)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                          splitPersons === p
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        {p}p
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={splitPersons}
                  onChange={(e) => setSplitPersons(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Tip / Gratuity */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Tip / Gratuity:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{tipPercentage}%</span>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 5, 10, 15].map((tip) => (
                    <button
                      key={tip}
                      type="button"
                      onClick={() => setTipPercentage(tip)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        tipPercentage === tip
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {tip === 0 ? 'No Tip' : `${tip}%`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Tax Breakdown Summary */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Tax & Split Summary
              </h2>

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-1">
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                  Share Per Person ({splitPersons} {splitPersons === 1 ? 'Person' : 'People'})
                </span>
                <div className="text-2xl font-extrabold text-blue-900 dark:text-blue-100">
                  {formatCurrency(billCalculations.perPersonShare)}
                </div>
                <p className="text-[11px] text-blue-600 dark:text-blue-400">
                  Total Bill {formatCurrency(billCalculations.grandTotal)} / {splitPersons}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Pre-Tax Base Price:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(billCalculations.baseAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>CGST ({gstRate / 2}%):</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(billCalculations.cgst)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>SGST / UTGST ({gstRate / 2}%):</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(billCalculations.sgst)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Total Tax ({gstRate}%):</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(billCalculations.totalTax)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>Total Payable:</span>
                  <span>{formatCurrency(billCalculations.grandTotal)}</span>
                </div>
              </div>

              {!isManager && onOpenAddExpenseWithPreload && (
                <button
                  onClick={() => {
                    onOpenAddExpenseWithPreload({
                      amount: billCalculations.perPersonShare,
                      description: `Shared Team Expense (${splitPersons} people) - Share: ${formatCurrency(billCalculations.perPersonShare)}`,
                      category: 'Food & Beverage',
                      tripId: selectedTripId !== 'all' ? selectedTripId : undefined,
                      notes: `Total bill: ${formatCurrency(billCalculations.grandTotal)} | GST: ${gstRate}% (${formatCurrency(billCalculations.totalTax)})`,
                    });
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Log Share ({formatCurrency(billCalculations.perPersonShare)}) as Expense</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 5: EXPENSE SCRATCHPAD */}
      {/* ------------------------------------------------------------- */}
      {activeMode === 'scratchpad' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-amber-500" />
                    Quick Itemized Expense Scratchpad
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tally multiple bills or quick receipts on the fly before creating official records
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => loadScratchpadTemplate('metro_day')}
                    className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-200"
                  >
                    + Metro Day
                  </button>
                  <button
                    onClick={() => loadScratchpadTemplate('client_dinner')}
                    className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-200"
                  >
                    + Dinner
                  </button>
                </div>
              </div>

              {/* Add Scratchpad Item Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <input
                  type="text"
                  placeholder="Item name (e.g. Coffee, Metro ticket)"
                  value={scratchTitle}
                  onChange={(e) => setScratchTitle(e.target.value)}
                  className="sm:col-span-5 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                />
                <select
                  aria-label="Item category"
                  value={scratchCat}
                  onChange={(e) => setScratchCat(e.target.value)}
                  className="sm:col-span-3 rounded-xl border border-slate-200 bg-slate-50/50 px-2 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="Transit">Transit</option>
                  <option value="Food & Beverage">Food & Bev</option>
                  <option value="Lodging">Lodging</option>
                  <option value="Miscellaneous">Misc</option>
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder="Amount (₹)"
                  value={scratchAmt}
                  onChange={(e) => setScratchAmt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addScratchpadItem()}
                  className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addScratchpadItem}
                  className="sm:col-span-2 flex items-center justify-center gap-1 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Scratchpad items list */}
              <div className="space-y-1.5 pt-2">
                {scratchpadItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                      <button
                        onClick={() => setScratchpadItems((prev) => prev.filter((i) => i.id !== item.id))}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {scratchpadItems.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Scratchpad is empty. Add quick items above to compute a running sum.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Scratchpad Summary */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Scratchpad Running Total
              </h2>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 space-y-1">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  Total Items Sum ({scratchpadItems.length})
                </span>
                <div className="text-2xl font-extrabold text-amber-900 dark:text-amber-100">
                  {formatCurrency(scratchpadTotal)}
                </div>
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Average per item: {scratchpadItems.length > 0 ? formatCurrency(Math.round(scratchpadTotal / scratchpadItems.length)) : '₹0'}
                </p>
              </div>

              {!isManager && onOpenAddExpenseWithPreload && scratchpadTotal > 0 && (
                <button
                  onClick={() => {
                    const desc = scratchpadItems.map((i) => `${i.title} (${formatCurrency(i.amount)})`).join(', ');
                    onOpenAddExpenseWithPreload({
                      amount: scratchpadTotal,
                      description: `Batch Expense: ${scratchpadItems.length} items (${desc.slice(0, 70)}...)`,
                      category: 'Transit',
                      tripId: selectedTripId !== 'all' ? selectedTripId : undefined,
                      notes: desc,
                    });
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Log {formatCurrency(scratchpadTotal)} as Expense</span>
                </button>
              )}

              <button
                onClick={() => setScratchpadItems([])}
                className="w-full py-2 text-xs text-slate-500 hover:text-rose-600 transition-colors"
              >
                Clear Scratchpad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
