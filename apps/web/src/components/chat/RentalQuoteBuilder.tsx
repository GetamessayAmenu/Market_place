"use client"
import { Button, Input } from '@marketplace/ui';
import React, { useMemo, useState } from 'react';

import type { RentalQuoteData } from '../../lib/richMessage';

// ─── Props ───────────────────────────────────────────────────────────────────

interface RentalQuoteBuilderProps {
  onSend: (quoteData: RentalQuoteData, note?: string) => void;
  onCancel: () => void;
  /** Pre-fill values from listing */
  defaultPricePerDay?: number;
  defaultDeposit?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RentalQuoteBuilder({
  onSend,
  onCancel,
  defaultPricePerDay,
  defaultDeposit,
}: RentalQuoteBuilderProps) {
  const [pricePerDay, setPricePerDay] = useState(String(defaultPricePerDay ?? ''));
  const [deposit, setDeposit] = useState(String(defaultDeposit ?? ''));
  const [durationDays, setDurationDays] = useState('3');
  const [note, setNote] = useState('');

  const total = useMemo(() => {
    const ppd = parseFloat(pricePerDay) || 0;
    const days = parseInt(durationDays, 10) || 0;
    const dep = parseFloat(deposit) || 0;
    return ppd * days + dep;
  }, [pricePerDay, deposit, durationDays]);

  const isValid = useMemo(() => {
    return (parseFloat(pricePerDay) || 0) > 0 && (parseInt(durationDays, 10) || 0) > 0;
  }, [pricePerDay, durationDays]);

  const handleSend = () => {
    if (!isValid) return;
    onSend(
      {
        pricePerDay: parseFloat(pricePerDay),
        deposit: parseFloat(deposit) || 0,
        durationDays: parseInt(durationDays, 10),
        total,
      },
      note.trim() || undefined,
    );
  };

  return (
    <div className="rounded-lg border border-brand-gold/20 bg-brand-gold/5 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Build Rental Quote</h4>
        <button
          type="button"
          onClick={onCancel}
          className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Price / day (ETB)</label>
          <Input
            type="number"
            size="sm"
            value={pricePerDay}
            onChange={(e) => { setPricePerDay(e.target.value); }}
            placeholder="0"
            min={0}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Deposit (ETB)</label>
          <Input
            type="number"
            size="sm"
            value={deposit}
            onChange={(e) => { setDeposit(e.target.value); }}
            placeholder="0"
            min={0}
          />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Duration (days)</label>
          <Input
            type="number"
            size="sm"
            value={durationDays}
            onChange={(e) => { setDurationDays(e.target.value); }}
            placeholder="1"
            min={1}
          />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Note (optional)</label>
          <Input
            size="sm"
            value={note}
            onChange={(e) => { setNote(e.target.value); }}
            placeholder="Add a message to the buyer..."
          />
        </div>
      </div>

      {/* Summary */}
      <div className="mt-3 rounded-md bg-background p-2.5 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>{pricePerDay || '0'} × {durationDays || '0'} days</span>
          <span>ETB {((parseFloat(pricePerDay) || 0) * (parseInt(durationDays, 10) || 0)).toLocaleString()}</span>
        </div>
        {(parseFloat(deposit) || 0) > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>+ Deposit</span>
            <span>ETB {(parseFloat(deposit) || 0).toLocaleString()}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between border-t pt-1 font-semibold text-foreground">
          <span>Total</span>
          <span className="text-brand-gold">ETB {total.toLocaleString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSend} disabled={!isValid}>
          Send Quote
        </Button>
      </div>
    </div>
  );
}
