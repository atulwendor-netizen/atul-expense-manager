import React, { useState, useEffect } from 'react';
import { Expense, Trip } from '../types/index';
import { X, Upload, FileText, Trash2 } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Expense, 'id'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
  expenseToEdit?: Expense | Partial<Expense> | null;
  trips: Trip[];
}

const CATEGORIES = [
  'Transit',
  'Food & Beverage',
  'Lodging',
  'Miscellaneous',
  'Porter',
  'Uncategorized',
];

const PAYMENT_METHODS = [
  'Digital / UPI',
  'Cash',
  'Card',
  'Not Specified',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  expenseToEdit,
  trips,
}) => {
  const { handleBackdropClick } = useModalA11y({ isOpen, onClose });
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Transit');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('Digital / UPI');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [tripId, setTripId] = useState<string>('');
  const [receipt, setReceipt] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expenseToEdit) {
      setDate(expenseToEdit.date || new Date().toISOString().split('T')[0]);
      setDescription(expenseToEdit.description || '');
      setCategory(expenseToEdit.category || 'Transit');
      setAmount(expenseToEdit.amount !== null && expenseToEdit.amount !== undefined ? String(expenseToEdit.amount) : '');
      setPaymentMethod(expenseToEdit.paymentMethod || 'Digital / UPI');
      setLocation(expenseToEdit.location || 'Mumbai');
      setNotes(expenseToEdit.notes || '');
      setTripId(expenseToEdit.tripId || (trips[0]?.id || ''));
      setReceipt(expenseToEdit.receipt || null);
      setReceiptName(expenseToEdit.receiptName || null);
    } else {
      // Default new expense
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setDescription('');
      setCategory('Transit');
      setAmount('');
      setPaymentMethod('Digital / UPI');
      setLocation('Mumbai');
      setNotes('');
      setTripId(trips[0]?.id || '');
      setReceipt(null);
      setReceiptName(null);
    }
    setErrors({});
  }, [expenseToEdit, isOpen, trips]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, receipt: 'File size must be under 5MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceipt(reader.result as string);
      setReceiptName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!date.trim()) newErrors.date = 'Date is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!category.trim()) newErrors.category = 'Category is required';

    const parsedAmount = parseFloat(amount);
    if (amount.trim() === '' || isNaN(parsedAmount)) {
      newErrors.amount = 'Valid numeric amount is required';
    } else if (parsedAmount < 0) {
      newErrors.amount = 'Amount must be greater than or equal to 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      onSave({
        id: expenseToEdit?.id,
        date: date.trim(),
        description: description.trim(),
        category: category.trim(),
        amount: parsedAmount,
        paymentMethod,
        location: location.trim(),
        notes: notes.trim(),
        tripId: tripId || null,
        receipt,
        receiptName,
        status: 'valid',
      });
      onClose();
    } catch {
      // Failed save: keep modal open with inputs intact, toast shows actionable error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 id="expense-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
              {expenseToEdit?.id ? 'Edit Expense Record' : 'Log New Expense'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {expenseToEdit?.rawOriginal?.rowNumber
                ? `Original Spreadsheet Row #${expenseToEdit.rawOriginal.rowNumber}`
                : 'Enter expense details with dynamic validation'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Row: Date & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expense-input-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="expense-input-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs font-medium text-slate-900 dark:text-white dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.date}</p>
              )}
            </div>

            <div>
              <label htmlFor="expense-input-amount" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                id="expense-input-amount"
                type="number"
                step="any"
                min="0"
                value={amount}
                placeholder="e.g. 400"
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs font-medium text-slate-900 dark:text-white dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.amount && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.amount}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="expense-input-desc" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <input
              id="expense-input-desc"
              type="text"
              value={description}
              placeholder="e.g. Dorm Stay, Cab from Andheri to Station"
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-xs font-medium text-slate-900 dark:text-white dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-[11px] text-rose-500">{errors.description}</p>
            )}
          </div>

          {/* Row: Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expense-input-category" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="expense-input-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="expense-input-payment" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                id="expense-input-payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Location & Associated Trip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expense-input-location" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location
              </label>
              <input
                id="expense-input-location"
                type="text"
                value={location}
                placeholder="e.g. Mumbai, Pune, Gurgaon"
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="expense-input-trip" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Trip Link
              </label>
              <select
                id="expense-input-trip"
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Trip Assigned</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="expense-input-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              id="expense-input-notes"
              rows={2}
              value={notes}
              placeholder="e.g. Ticket details, vendor notes, train reference"
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Receipt attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Receipt Attachment (JPG, PNG, PDF)
            </label>
            {receipt ? (
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 truncate pr-2">
                  <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="truncate font-medium">{receiptName || 'Receipt file attached'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReceipt(null);
                    setReceiptName(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-4 hover:border-blue-500 dark:border-slate-700 dark:hover:border-blue-400 cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/40">
                <Upload className="h-5 w-5 text-slate-400 mb-1" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Click to upload receipt
                </span>
                <span className="text-[10px] text-slate-400">
                  PNG, JPG or PDF up to 5MB
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {expenseToEdit?.id && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this expense record?')) {
                    try {
                      onDelete(expenseToEdit.id!);
                      onClose();
                    } catch {
                      // Handled by toast in onDelete; keep record visible if deletion fails
                    }
                  }
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Record
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
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
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : expenseToEdit ? 'Save Changes' : 'Add Expense'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
