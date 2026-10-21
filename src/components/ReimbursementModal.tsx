import React, { useState, useEffect } from 'react';
import { Reimbursement, Trip } from '../types/index';
import { X, DollarSign } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

interface ReimbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Reimbursement, 'id'> & { id?: string }) => void;
  trips: Trip[];
  activeTripId: string;
  reimbursementToEdit?: Reimbursement | Partial<Reimbursement> | null;
}

export const ReimbursementModal: React.FC<ReimbursementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  trips,
  activeTripId,
  reimbursementToEdit,
}) => {
  const { handleBackdropClick } = useModalA11y({ isOpen, onClose });
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [tripId, setTripId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (reimbursementToEdit) {
        setDate(reimbursementToEdit.date || new Date().toISOString().split('T')[0]);
        setAmount(
          reimbursementToEdit.amount !== undefined && reimbursementToEdit.amount !== null
            ? String(reimbursementToEdit.amount)
            : ''
        );
        setReference(reimbursementToEdit.reference || `REIMB-${Date.now().toString().slice(-4)}`);
        setNotes(reimbursementToEdit.notes || '');
        setTripId(
          reimbursementToEdit.tripId || (activeTripId !== 'all' ? activeTripId : '')
        );
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setAmount('');
        setReference(`REIMB-${Date.now().toString().slice(-4)}`);
        setNotes('');
        setTripId(activeTripId !== 'all' ? activeTripId : '');
      }
      setErrors({});
    }
  }, [isOpen, activeTripId, trips, reimbursementToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!date) newErrors.date = 'Date is required';
    const parsedAmt = parseFloat(amount);
    if (!amount || isNaN(parsedAmt) || parsedAmt <= 0) {
      newErrors.amount = 'Valid positive amount is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      onSave({
        id: reimbursementToEdit?.id,
        date,
        amount: parsedAmt,
        reference: reference.trim() || 'Direct Transfer',
        notes: notes.trim(),
        tripId: tripId || null,
      });
      onClose();
    } catch {
      // Keep modal open, inputs preserved, error displayed in toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reimbursement-modal-title"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <h3 id="reimbursement-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
                {reimbursementToEdit?.id ? 'Edit Reimbursement Entry' : 'Record Reimbursement Payment'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Instantly recalculates pending balance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain focus:outline-none">
          <div>
            <label htmlFor="reimbursement-input-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Date <span className="text-rose-500">*</span>
            </label>
            <input
              id="reimbursement-input-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.date && <p className="mt-1 text-[11px] text-rose-500">{errors.date}</p>}
          </div>

          <div>
            <label htmlFor="reimbursement-input-amount" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Amount Received (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              id="reimbursement-input-amount"
              type="number"
              step="any"
              min="1"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.amount && <p className="mt-1 text-[11px] text-rose-500">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Reference / Transaction ID
            </label>
            <input
              type="text"
              placeholder="e.g. UTR / NEFT reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Allocate to Trip
            </label>
            <select
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">General Reimbursement</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Cleared by accounts dept"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Saving...' : reimbursementToEdit ? 'Save Changes' : 'Record Reimbursement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
