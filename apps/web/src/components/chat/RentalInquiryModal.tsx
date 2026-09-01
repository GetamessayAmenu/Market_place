"use client";
import React, { useState } from 'react';
import { Button } from '@marketplace/ui';

interface RentalInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { startDate: string; endDate: string; notes?: string }) => void;
  dailyRate?: number | undefined;
}


export default function RentalInquiryModal({
  isOpen,
  onClose,
  onSubmit,
  dailyRate,
}: RentalInquiryModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    onSubmit({ startDate, endDate, notes });
    onClose();
  };

  const calculatedDays = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)))
    : 0;

  const estimatedTotal = dailyRate && calculatedDays > 0 ? dailyRate * calculatedDays : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <span>📅</span> Inquire Rental Availability
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground font-bold text-sm">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {calculatedDays > 0 && dailyRate !== undefined && (
            <div className="rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 p-3 text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-purple-900 dark:text-purple-200">{calculatedDays} Day(s) Rental</span>
                <p className="text-[10px] text-purple-700 dark:text-purple-300">Rate: ETB {dailyRate}/day</p>
              </div>
              <span className="font-extrabold text-sm text-purple-800 dark:text-purple-200">
                ETB {estimatedTotal.toLocaleString()}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Additional Notes / Questions (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specify pickup preference, event details, fitting request..."
              rows={2}
              className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
              Send Rental Inquiry
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
