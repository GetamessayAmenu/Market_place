"use client";
import React, { useState } from 'react';
import { Button } from '@marketplace/ui';

interface CustomOrderInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    size?: string;
    color?: string;
    fabric?: string;
    embroidery?: string;
    personalization?: string;
    notes?: string;
  }) => void;
}

export default function CustomOrderInquiryModal({
  isOpen,
  onClose,
  onSubmit,
}: CustomOrderInquiryModalProps) {
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [fabric, setFabric] = useState('');
  const [embroidery, setEmbroidery] = useState('');
  const [personalization, setPersonalization] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, string> = {};
    if (size) data.size = size;
    if (color) data.color = color;
    if (fabric) data.fabric = fabric;
    if (embroidery) data.embroidery = embroidery;
    if (personalization) data.personalization = personalization;
    if (notes) data.notes = notes;
    onSubmit(data);
    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <span>✨</span> Send Custom Order Specs
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground font-bold text-sm">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Size</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. M / 38"
                className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Color</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Ivory Gold"
                className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Fabric</label>
              <input
                type="text"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                placeholder="e.g. Pure Silk"
                className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Embroidery & Pattern Details</label>
            <input
              type="text"
              value={embroidery}
              onChange={(e) => setEmbroidery(e.target.value)}
              placeholder="e.g. Traditional Habesha Tibeb border design"
              className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Personalization (Optional)</label>
            <input
              type="text"
              value={personalization}
              onChange={(e) => setPersonalization(e.target.value)}
              placeholder="e.g. Initial embroidery, custom hem length"
              className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Notes / Instructions</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific requests or deadline notes..."
              rows={2}
              className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Send Custom Specs
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
