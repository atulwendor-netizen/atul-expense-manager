import React, { useState, useEffect } from 'react';
import { Trip } from '../types/index';
import { X, Compass, Calendar, MapPin, FileText } from 'lucide-react';

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Trip, 'id'> & { id?: string }) => void;
  tripToEdit?: Trip | null;
}

export const TripModal: React.FC<TripModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tripToEdit,
}) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locations, setLocations] = useState('');
  const [description, setDescription] = useState('');
  const [isArchived, setIsArchived] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (tripToEdit) {
        setName(tripToEdit.name || '');
        setStartDate(tripToEdit.startDate || '');
        setEndDate(tripToEdit.endDate || '');
        setLocations(tripToEdit.locations?.join(', ') || '');
        setDescription(tripToEdit.description || '');
        setIsArchived(Boolean(tripToEdit.isArchived));
      } else {
        setName('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate(new Date().toISOString().split('T')[0]);
        setLocations('');
        setDescription('');
        setIsArchived(false);
      }
      setErrors({});
    }
  }, [isOpen, tripToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Trip name is required';
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (!endDate) newErrors.endDate = 'End date is required';
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = 'End date cannot be earlier than start date';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const parsedLocations = locations
      .split(',')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    onSave({
      id: tripToEdit?.id,
      name: name.trim(),
      startDate,
      endDate,
      locations: parsedLocations.length > 0 ? parsedLocations : ['Various'],
      description: description.trim() || undefined,
      isArchived,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {tripToEdit ? 'Edit Travel / Trip' : 'Create New Trip'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {tripToEdit ? 'Update details, dates, or travel status' : 'Add a new trip or project assignment'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Trip Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Trip / Travel Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="e.g. Bengaluru Tech Summit 2026"
              className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none dark:bg-slate-800 dark:text-white ${
                errors.name
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-200 focus:border-blue-500 dark:border-slate-700'
              }`}
            />
            {errors.name && <p className="mt-1 text-[11px] text-rose-500">{errors.name}</p>}
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: '' }));
                }}
                className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none dark:bg-slate-800 dark:text-white ${
                  errors.startDate
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-blue-500 dark:border-slate-700'
                }`}
              />
              {errors.startDate && <p className="mt-1 text-[11px] text-rose-500">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: '' }));
                }}
                className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none dark:bg-slate-800 dark:text-white ${
                  errors.endDate
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-blue-500 dark:border-slate-700'
                }`}
              />
              {errors.endDate && <p className="mt-1 text-[11px] text-rose-500">{errors.endDate}</p>}
            </div>
          </div>

          {/* Locations */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              Locations (comma separated)
            </label>
            <input
              type="text"
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              placeholder="e.g. Mumbai, Pune, Lonavala"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Description & Purpose
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Purpose of trip, client visits, notes..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"
            />
          </div>

          {/* Archive Status Toggle */}
          {tripToEdit && (
            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="isArchived"
                checked={isArchived}
                onChange={(e) => setIsArchived(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
              />
              <label htmlFor="isArchived" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Archive this trip (hides from default view without deleting data)
              </label>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              {tripToEdit ? 'Save Changes' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
