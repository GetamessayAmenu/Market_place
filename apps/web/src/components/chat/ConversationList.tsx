"use client"
import { Avatar, Badge, cn, EmptyState, Input, Skeleton } from '@marketplace/ui';
import React, { useMemo, useState } from 'react';

import { type ChatConversation, formatRelativeTime, getOtherUser, getUserRole } from '../../lib/chatApi';
import { getMessagePreview } from '../../lib/richMessage';

// ─── Types ───────────────────────────────────────────────────────────────────

type ConversationFilter = 'all' | 'unread' | 'buying' | 'rentals' | 'custom';

interface ConversationListProps {
  conversations: ChatConversation[];
  currentUserId: string;
  selectedId?: string;
  onSelect: (conv: ChatConversation) => void;
  typingUserIds: Set<string>;
  loading?: boolean;
}

const FILTER_OPTIONS: { value: ConversationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'buying', label: 'Buying' },
  { value: 'rentals', label: 'Rentals' },
  { value: 'custom', label: 'Custom Orders' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ConversationList({
  conversations,
  currentUserId,
  selectedId,
  onSelect,
  typingUserIds,
  loading,
}: ConversationListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ConversationFilter>('all');

  const filtered = useMemo(() => {
    let items = conversations;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((c) => {
        const other = getOtherUser(c, currentUserId);
        return (
          other.displayName.toLowerCase().includes(q) ||
          c.listing.title.toLowerCase().includes(q) ||
          (c.lastMessage ? getMessagePreview(c.lastMessage.body, 200).toLowerCase().includes(q) : false)
        );
      });
    }

    // Type filter
    if (filter === 'unread') {
      items = items.filter((c) => (c.unreadCount ?? 0) > 0);
    }

    // Sort: unread first, then by lastMessageAt
    return [...items].sort((a, b) => {
      const aUnread = (a.unreadCount ?? 0) > 0 ? 1 : 0;
      const bUnread = (b.unreadCount ?? 0) > 0 ? 1 : 0;
      if (aUnread !== bUnread) return bUnread - aUnread;
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [conversations, search, filter, currentUserId]);

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="border-b px-3 py-2">
        <Input
          size="sm"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); }}
          className="w-full"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto border-b px-3 py-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { setFilter(opt.value); }}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors',
              filter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-12">
            <EmptyState
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              title={search ? 'No matching conversations' : 'No conversations yet'}
              description={search ? 'Try a different search term.' : 'When you message someone, conversations will appear here.'}
            />
          </div>
        ) : (
          filtered.map((conv) => {
            const other = getOtherUser(conv, currentUserId);
            const role = getUserRole(conv, currentUserId);
            const isTyping = typingUserIds.has(other.id);
            const unread = conv.unreadCount ?? 0;
            const isSelected = conv.id === selectedId;

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => { onSelect(conv); }}
                className={cn(
                  'flex w-full items-start gap-3 border-b px-3 py-3 text-left transition-colors',
                  isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50'
                )}
              >
                <Avatar
                  src={other.avatarUrl}
                  alt={other.displayName}
                  size="md"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('truncate text-sm', unread > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground/80')}>
                      {other.displayName}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="truncate text-xs text-muted-foreground">
                      {conv.listing.title}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'shrink-0 px-1 py-0 text-[10px]',
                        role === 'buyer' ? 'border-brand-green/30 text-brand-green' : 'border-brand-gold/30 text-brand-gold'
                      )}
                    >
                      {role === 'buyer' ? 'Buyer' : 'Seller'}
                    </Badge>
                  </div>

                  <p className={cn('mt-0.5 truncate text-xs', unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                    {isTyping ? (
                      <span className="italic text-primary">typing...</span>
                    ) : conv.lastMessage ? (
                      getMessagePreview(conv.lastMessage.body)
                    ) : (
                      <span className="italic">No messages yet</span>
                    )}
                  </p>
                </div>

                {unread > 0 && (
                  <Badge variant="error" className="ml-1 shrink-0 min-w-[20px] justify-center px-1.5 py-0.5 text-[10px]">
                    {unread > 99 ? '99+' : String(unread)}
                  </Badge>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
