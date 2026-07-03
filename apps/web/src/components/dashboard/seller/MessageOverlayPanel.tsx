'use client';

import { cn } from '@marketplace/ui';
import React, { useEffect, useRef, useState } from 'react';

import type { MessageConversation } from '../../../lib/dashboardApi';
import type { Lang } from '../../../lib/i18n';
import { t } from '../../../lib/i18n';

interface MessageOverlayPanelProps {
  conversationId: string | null;
  conversation: MessageConversation | null | undefined;
  isLoading: boolean;
  lang: Lang;
  onSend: (message: string) => void;
  onClose: () => void;
}

export default function MessageOverlayPanel({
  conversationId,
  conversation,
  isLoading,
  lang,
  onSend,
  onClose,
}: MessageOverlayPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Scroll to bottom when conversation loads or messages update
  useEffect(() => {
    if (conversationId && conversation) {
      setIsOpen(true);
      setMessageText('');
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationId, conversation]);

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

  // Scroll to bottom when conversation loads or messages update
  useEffect(() => {
    if (conversationId && conversation) {
      setIsOpen(true);
      setMessageText('');
    }
  }, [conversationId, conversation]);

  if (!isOpen && !conversationId) return null;

  const title = conversation?.customerName ?? 'Customer';
  const subtitle = conversation?.listingTitle ?? 'Conversation';

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
              {title.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
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

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {t('loading', lang)}
            </div>
          ) : !conversation ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="font-medium text-foreground">No conversation selected</p>
              <p>{t('empty_no_messages_desc', lang)}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex max-w-[85%] flex-col gap-1 rounded-3xl px-4 py-3 text-sm',
                    message.sender === 'seller'
                      ? 'ml-auto rounded-br-none bg-primary text-primary-foreground'
                      : 'rounded-bl-none bg-accent text-foreground',
                  )}
                >
                  <p>{message.text}</p>
                  <span className="self-end text-[10px] text-muted-foreground">
                    {new Date(message.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t p-4 pb-safe-bottom">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!messageText.trim() || !conversationId) return;
              onSend(messageText.trim());
              setMessageText('');
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
              placeholder={t('messages_quick_reply', lang)}
              className="block w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              rows={1}
            />
            <button
              type="submit"
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
              <svg className="h-5 w-5 -rotate-90 translate-y-[2px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
