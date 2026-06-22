"use client"
import { Button, cn, Textarea } from '@marketplace/ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import type { ListingRef, RentalQuoteData } from '../../lib/richMessage';
import {
  serializeListingRefMessage,
  serializeRentalQuoteMessage,
  serializeTextMessage,
} from '../../lib/richMessage';

import RentalQuoteBuilder from './RentalQuoteBuilder';

// ─── Props ───────────────────────────────────────────────────────────────────

interface MessageComposerProps {
  onSend: (body: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  /** Listing context for reference messages */
  listing?: ListingRef;
  /** Whether the current user is the seller (enables rental quote builder) */
  isSeller?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MessageComposer({
  onSend,
  onTyping,
  disabled,
  listing,
  isSeller,
}: MessageComposerProps) {
  const [text, setText] = useState('');
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const emitTyping = useCallback(
    (typing: boolean) => {
      if (isTypingRef.current === typing) return;
      isTypingRef.current = typing;
      onTyping(typing);
    },
    [onTyping],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setText(val);

      if (val.trim()) {
        emitTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          emitTyping(false);
        }, 2000);
      } else {
        emitTyping(false);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      }
    },
    [emitTyping],
  );

  // Cleanup typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      emitTyping(false);
    };
  }, [emitTyping]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && !showQuoteBuilder) return;

    let body: string;
    if (showQuoteBuilder) return; // handled by RentalQuoteBuilder callback

    if (listing && trimmed) {
      // Optionally attach listing reference on first message
      body = trimmed;
    } else {
      body = serializeTextMessage(trimmed);
    }

    onSend(body);
    setText('');
    emitTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, [text, showQuoteBuilder, listing, onSend, emitTyping]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleQuoteSend = useCallback(
    (quoteData: RentalQuoteData, note?: string) => {
      const body = serializeRentalQuoteMessage(quoteData, note);
      onSend(body);
      setShowQuoteBuilder(false);
    },
    [onSend],
  );

  const handleSendListingRef = useCallback(() => {
    if (!listing) return;
    const body = serializeListingRefMessage(listing, 'Check out this listing:');
    onSend(body);
  }, [listing, onSend]);

  return (
    <div className="border-t bg-background">
      {/* Rental Quote Builder */}
      {showQuoteBuilder && (
        <div className="border-b p-3">
          <RentalQuoteBuilder
            onSend={handleQuoteSend}
            onCancel={() => { setShowQuoteBuilder(false); }}
          />
        </div>
      )}

      {/* Toolbar */}
      {(listing ?? isSeller) && (
        <div className="flex gap-1.5 border-b px-3 py-1.5">
          {listing && (
            <button
              type="button"
              onClick={handleSendListingRef}
              className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/80"
              disabled={disabled}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.813a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374" />
              </svg>
              Share listing
            </button>
          )}
          {isSeller && (
            <button
              type="button"
              onClick={() => { setShowQuoteBuilder((v) => !v); }}
              className={cn(
                'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                showQuoteBuilder
                  ? 'bg-brand-gold/15 text-brand-gold'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
              disabled={disabled}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
              </svg>
              Rental quote
            </button>
          )}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 px-3 py-2">
        <div className="flex-1">
          <Textarea
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            autoResize
            maxLength={5000}
            className="min-h-[40px] max-h-[120px] resize-none rounded-xl border-0 bg-muted/50 px-3 py-2 text-sm focus-visible:ring-1"
            disabled={disabled}
          />
        </div>
        <Button
          size="sm"
          onClick={handleSend}
          disabled={disabled ?? (!text.trim() && !showQuoteBuilder)}
          className="shrink-0 rounded-xl"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
