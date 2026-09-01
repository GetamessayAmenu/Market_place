"use client";
import React, { useMemo, useState } from 'react';
import { Avatar, Badge, cn, EmptyState, Input, Skeleton } from '@marketplace/ui';
import { type ChatConversation, formatRelativeTime, getOtherUser, getUserRole } from '../../lib/chatApi';

type ConversationFilter = 'all' | 'unread' | 'archived' | 'blocked';

interface ConversationListProps {
  conversations: ChatConversation[];
  currentUserId: string;
  selectedId?: string;
  onSelect: (conv: ChatConversation) => void;
  onlineUserIds?: Set<string>;
  loading?: boolean;
}

const FILTER_OPTIONS: { value: ConversationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'archived', label: 'Archived' },
  { value: 'blocked', label: 'Blocked' },
];

export default function ConversationList({
  conversations,
  currentUserId,
  selectedId,
  onSelect,
  onlineUserIds = new Set(),
  loading,
}: ConversationListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ConversationFilter>('all');

  const filtered = useMemo(() => {
    let items = conversations;

    // Search filter across partner name, listing title, last message body
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((c) => {
        const other = getOtherUser(c, currentUserId);
        const listingTitle = c.listing?.title?.toLowerCase() || '';
        const lastMsg = c.lastMessage?.body || c.lastMessage?.content || '';

        return (
          other.displayName.toLowerCase().includes(q) ||
          listingTitle.includes(q) ||
          lastMsg.toLowerCase().includes(q)
        );
      });
    }

    // Filter status tabs
    if (filter === 'unread') {
      items = items.filter((c) => (c.unreadCount ?? 0) > 0);
    } else if (filter === 'archived') {
      items = items.filter((c) => (c as any).archivedByBuyer || (c as any).archivedBySeller);
    } else if (filter === 'blocked') {
      items = items.filter((c) => (c as any).isBlocked);
    } else {
      // Exclude archived by default in 'all' filter unless selected
      items = items.filter((c) => !((c as any).archivedByBuyer || (c as any).archivedBySeller));
    }

    // Sort: unread first, then by lastMessageAt / createdAt
    return [...items].sort((a, b) => {
      const aUnread = (a.unreadCount ?? 0) > 0 ? 1 : 0;
      const bUnread = (b.unreadCount ?? 0) > 0 ? 1 : 0;
      if (aUnread !== bUnread) return bUnread - aUnread;

      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [conversations, search, filter, currentUserId]);

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg p-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 bg-card">
        <h2 className="text-lg font-extrabold text-foreground tracking-tight">Messages</h2>

        {/* Search Input */}
        <div className="mt-2.5">
          <Input
            size="sm"
            placeholder="Search conversations, items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-xl"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold transition-all shrink-0',
                filter === opt.value
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Cards List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/60">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <EmptyState
              icon={
                <svg className="h-8 w-8 text-muted-foreground mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              title={
                search
                  ? 'No conversations found'
                  : filter === 'unread'
                  ? 'No unread messages'
                  : filter === 'archived'
                  ? 'No archived conversations'
                  : 'Your conversations will appear here when buyers contact you.'
              }
              description={search ? 'Try adjusting your search terms.' : 'Start exploring marketplace items to send inquiries.'}
            />
          </div>
        ) : (
          filtered.map((conv) => {
            const other = getOtherUser(conv, currentUserId);
            const role = getUserRole(conv, currentUserId);
            const unread = conv.unreadCount ?? 0;
            const isSelected = conv.id === selectedId;
            const isOnline = onlineUserIds.has(other.id);
            const contextTitle = conv.listing?.title || (conv.order ? `Order #${conv.order.orderNumber}` : conv.rental ? `Rental #${conv.rental.orderNumber}` : 'General Inquiry');
            const contextImg = conv.listing?.images?.[0]?.url;
            const hasAttachment = conv.lastMessage?.attachments && conv.lastMessage.attachments.length > 0;

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelect(conv)}
                className={cn(
                  'flex w-full items-start gap-3 px-3.5 py-3 text-left transition-all relative group',
                  isSelected
                    ? 'bg-primary/10 border-l-4 border-l-primary font-medium'
                    : 'hover:bg-muted/40'
                )}
              >
                {/* Avatar with Online Status Dot */}
                <div className="relative shrink-0 mt-0.5">
                  <Avatar src={other.avatarUrl || null} alt={other.displayName || 'User'} size="md" />
                  <span
                    className={cn(
                      'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background',
                      isOnline ? 'bg-green-500' : 'bg-muted-foreground/30'
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className={cn('truncate text-xs font-bold', unread > 0 ? 'text-foreground font-extrabold' : 'text-foreground/90')}>
                      {other.displayName || 'User'}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground font-semibold">
                      {formatRelativeTime(conv.lastMessageAt || conv.createdAt)}
                    </span>
                  </div>

                  {/* Listing Title Preview */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {contextImg && (
                      <img src={contextImg} alt="" className="h-3.5 w-3.5 rounded object-cover shrink-0" />
                    )}
                    <span className="truncate text-[11px] font-semibold text-muted-foreground">
                      {contextTitle}
                    </span>
                    <Badge
                      variant="outline"
                      className="shrink-0 px-1 py-0 text-[9px] border-muted-foreground/30 font-bold"
                    >
                      {role === 'buyer' ? 'Buyer' : 'Seller'}
                    </Badge>
                  </div>

                  {/* Last Message Snippet */}
                  <div className="flex items-center justify-between gap-1 mt-1">
                    <p className={cn('truncate text-[11px] flex-1', unread > 0 ? 'text-foreground font-bold' : 'text-muted-foreground')}>
                      {hasAttachment && <span className="mr-1">📷 Attachment</span>}
                      {conv.lastMessage ? (
                        conv.lastMessage.body || conv.lastMessage.content || 'Sent an attachment'
                      ) : (
                        <span className="italic">No messages yet</span>
                      )}
                    </p>

                    {unread > 0 && (
                      <Badge variant="error" className="ml-1 shrink-0 min-w-[18px] justify-center px-1.5 py-0.5 text-[10px] font-extrabold rounded-full">
                        {unread > 99 ? '99+' : String(unread)}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
