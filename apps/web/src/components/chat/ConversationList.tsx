"use client";
import React, { useMemo, useState } from 'react';
import { Avatar, Badge, cn, EmptyState, Input, Skeleton } from '@marketplace/ui';
import { type ChatConversation, formatRelativeTime, getOtherUser, getUserRole } from '../../lib/chatApi';

type ConversationFilter = 'all' | 'unread' | 'buying' | 'rentals' | 'custom';

interface ConversationListProps {
  conversations: ChatConversation[];
  currentUserId: string;
  selectedId?: string;
  onSelect: (conv: ChatConversation) => void;
  typingUserIds?: Set<string>;
  loading?: boolean;
}

const FILTER_OPTIONS: { value: ConversationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'buying', label: 'Buying' },
  { value: 'rentals', label: 'Rentals' },
  { value: 'custom', label: 'Custom Orders' },
];

export default function ConversationList({
  conversations,
  currentUserId,
  selectedId,
  onSelect,
  typingUserIds = new Set(),
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
        const listingTitle = c.listing?.title?.toLowerCase() || '';
        const orderNum = c.order?.orderNumber?.toLowerCase() || '';
        const rentalNum = c.rental?.orderNumber?.toLowerCase() || '';
        const lastMsg = c.lastMessage?.body || c.lastMessage?.content || '';

        return (
          other.displayName.toLowerCase().includes(q) ||
          listingTitle.includes(q) ||
          orderNum.includes(q) ||
          rentalNum.includes(q) ||
          lastMsg.toLowerCase().includes(q)
        );
      });
    }

    // Type filter
    if (filter === 'unread') {
      items = items.filter((c) => (c.unreadCount ?? 0) > 0);
    } else if (filter === 'buying') {
      items = items.filter((c) => c.buyerId === currentUserId);
    } else if (filter === 'rentals') {
      items = items.filter((c) => !!c.rentalId || !!c.rental);
    } else if (filter === 'custom') {
      items = items.filter((c) => !!c.customOrderId || !!c.customOrderRef);
    }

    // Sort: unread first, then by lastMessageAt / updatedAt
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
    <div className="flex h-full flex-col bg-background">
      {/* Search */}
      <div className="border-b px-3 py-2">
        <Input
          size="sm"
          placeholder="Search by name, product, or order..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto border-b px-3 py-2 no-scrollbar">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            className={cn(
              'whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors shrink-0',
              filter === opt.value
                ? 'bg-primary text-primary-foreground font-semibold'
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
                <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              title={search ? 'No matching conversations' : 'No conversations yet'}
              description={search ? 'Try a different search query.' : 'Your conversations with buyers and sellers will appear here.'}
            />
          </div>
        ) : (
          filtered.map((conv) => {
            const other = getOtherUser(conv, currentUserId);
            const role = getUserRole(conv, currentUserId);
            const isTyping = typingUserIds.has(other.id);
            const unread = conv.unreadCount ?? 0;
            const isSelected = conv.id === selectedId;
            const contextTitle = conv.listing?.title || (conv.order ? `Order #${conv.order.orderNumber}` : conv.rental ? `Rental #${conv.rental.orderNumber}` : 'General Inquiry');
            const contextImg = conv.listing?.images?.[0]?.url;

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelect(conv)}
                className={cn(
                  'flex w-full items-start gap-3 border-b px-3 py-3 text-left transition-colors relative',
                  isSelected ? 'bg-muted/60 border-l-4 border-l-primary' : 'hover:bg-muted/40'
                )}
              >
                <div className="relative shrink-0">
                  <Avatar src={other?.avatarUrl || null} alt={other?.displayName || 'User'} size="md" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className={cn('truncate text-xs font-semibold', unread > 0 ? 'text-foreground font-bold' : 'text-foreground/90')}>
                      {other?.displayName || 'User'}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatRelativeTime(conv.lastMessageAt || conv.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    {contextImg && (
                      <img src={contextImg} alt="" className="h-4 w-4 rounded object-cover shrink-0" />
                    )}
                    <span className="truncate text-[11px] font-medium text-muted-foreground">
                      {contextTitle}
                    </span>
                    <Badge
                      variant="outline"
                      className="shrink-0 px-1 py-0 text-[9px] border-muted-foreground/30"
                    >
                      {role === 'buyer' ? 'Buyer' : 'Seller'}
                    </Badge>
                  </div>

                  <p className={cn('mt-0.5 truncate text-[11px]', unread > 0 ? 'text-foreground font-semibold' : 'text-muted-foreground')}>
                    {isTyping ? (
                      <span className="italic text-primary font-medium">typing...</span>
                    ) : conv.lastMessage ? (
                      conv.lastMessage.body || conv.lastMessage.content || 'Sent an attachment'
                    ) : (
                      <span className="italic">No messages yet</span>
                    )}
                  </p>
                </div>

                {unread > 0 && (
                  <Badge variant="error" className="ml-1 shrink-0 min-w-[18px] justify-center px-1 py-0 text-[10px] font-bold">
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
