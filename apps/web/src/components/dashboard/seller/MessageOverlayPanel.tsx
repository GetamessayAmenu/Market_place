'use client';

import { cn } from '@marketplace/ui';
import React, { useEffect, useRef, useState } from 'react';



interface MessageOverlayPanelProps {
  conversationId: string | null;
  onClose: () => void;
}

export default function MessageOverlayPanel({
  conversationId,
  onClose,
}: MessageOverlayPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync internal state with prop
  useEffect(() => {
    if (conversationId) {
      setIsOpen(true);
      // Lock body scroll when open on mobile
      document.body.style.overflow = 'hidden';
    } else {
      setIsOpen(false);
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [conversationId]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen && !conversationId) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-modal flex justify-end bg-background/80 backdrop-blur-sm transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Message Conversation"
    >
      <div
        ref={panelRef}
        className={cn(
          'flex h-full w-full flex-col border-l bg-background shadow-2xl transition-transform duration-300 sm:w-[400px]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-full p-1.5 transition-colors hover:bg-accent sm:hidden"
              aria-label="Close panel"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
              C
            </div>
            <div>
              <p className="font-semibold text-foreground">Customer Name</p>
              <p className="text-xs text-muted-foreground">Active now</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="hidden rounded-full p-1.5 transition-colors hover:bg-accent sm:block"
              aria-label="Close panel"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Message Thread (Placeholder) */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-accent px-4 py-2 text-sm text-foreground">
                <p>Hello, is this item still available?</p>
                <span className="mt-1 block text-right text-[10px] text-muted-foreground">10:42 AM</span>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                <p>Yes it is! We have 3 left in stock.</p>
                <span className="mt-1 block text-right text-[10px] text-primary-foreground/70">10:45 AM</span>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-accent px-4 py-2 text-sm text-foreground">
                <p>Great, I will place an order now. Can you ship it to Hawassa?</p>
                <span className="mt-1 block text-right text-[10px] text-muted-foreground">11:02 AM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t p-4 pb-safe-bottom">
          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                placeholder="Type a message..."
                className="block w-full resize-none rounded-xl border border-input bg-background px-4 py-3 pl-4 pr-12 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              <button className="absolute bottom-2 right-2 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
            </div>
            <button className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 active:scale-95">
              <svg className="h-5 w-5 -rotate-90 translate-y-[2px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
