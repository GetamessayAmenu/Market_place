"use client";
import React from 'react';

interface QuickRepliesBarProps {
  role: 'buyer' | 'seller';
  transactionType?: 'BUY' | 'RENT' | 'CUSTOM' | 'DEFAULT';
  onSelectQuickReply: (text: string) => void;
  onOpenRentalInquiry?: () => void;
  onOpenCustomOrderInquiry?: () => void;
}

const SELLER_QUICK_REPLIES = [
  "Yes, it's available",
  "Price is fixed",
  "Yes, custom orders are available",
  "You can contact me",
];

const BUYER_BUY_QUICK_REPLIES = [
  "Is this available?",
  "Is the price negotiable?",
  "Can I see more photos?",
  "Where are you located?",
];

export default function QuickRepliesBar({
  role,
  transactionType = 'DEFAULT',
  onSelectQuickReply,
  onOpenRentalInquiry,
  onOpenCustomOrderInquiry,
}: QuickRepliesBarProps) {
  const replies = role === 'seller' ? SELLER_QUICK_REPLIES : BUYER_BUY_QUICK_REPLIES;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-1.5 border-t bg-muted/20 no-scrollbar">
      <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0 mr-1 select-none">
        Quick replies:
      </span>

      {/* Action buttons for Rent / Custom if applicable for Buyer */}
      {role === 'buyer' && transactionType === 'RENT' && onOpenRentalInquiry && (
        <button
          type="button"
          onClick={onOpenRentalInquiry}
          className="inline-flex items-center gap-1 shrink-0 rounded-full bg-purple-600/10 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 px-2.5 py-1 text-xs font-semibold hover:bg-purple-600/20 transition-all shadow-2xs"
        >
          <span>📅</span> Inquire Rental Dates
        </button>
      )}

      {role === 'buyer' && transactionType === 'CUSTOM' && onOpenCustomOrderInquiry && (
        <button
          type="button"
          onClick={onOpenCustomOrderInquiry}
          className="inline-flex items-center gap-1 shrink-0 rounded-full bg-amber-600/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-2.5 py-1 text-xs font-semibold hover:bg-amber-600/20 transition-all shadow-2xs"
        >
          <span>✨</span> Request Custom Order
        </button>
      )}

      {replies.map((text, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelectQuickReply(text)}
          className="shrink-0 rounded-full bg-background border border-border/80 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all shadow-2xs active:scale-95"
        >
          {text}
        </button>
      ))}
    </div>
  );
}
