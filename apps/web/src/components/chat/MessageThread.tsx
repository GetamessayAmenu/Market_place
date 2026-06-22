"use client"
import { Avatar, cn } from '@marketplace/ui';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

import { useSocket } from '../../hooks/useSocket';
import type { ChatConversation, ChatMessage } from '../../lib/chatApi';
import {
  fetchConversationMessages,
  formatDateSeparator,
  getOtherUser,
  getUserRole,
  isDifferentDay,
  markConversationRead,
} from '../../lib/chatApi';
import type { ListingRef } from '../../lib/richMessage';

import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';

// ─── Socket event shapes ────────────────────────────────────────────────────

interface NewMessagePayload {
  message: ChatMessage;
}

interface TypingPayload {
  conversationId: string;
  userId: string;
  displayName: string;
  isTyping: boolean;
}

interface ReadPayload {
  conversationId: string;
  readerId: string;
  markedCount: number;
  messageIds?: string[];
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface MessageThreadProps {
  conversation: ChatConversation;
  currentUserId: string;
  initialMessages: ChatMessage[];
  initialPage?: number;
  totalPages?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MessageThread({
  conversation,
  currentUserId,
  initialMessages,
  initialPage = 1,
  totalPages = 1,
}: MessageThreadProps) {
  const socketRef = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialPage < totalPages);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [connected, setConnected] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true);

  const otherUser = useMemo(() => getOtherUser(conversation, currentUserId), [conversation, currentUserId]);
  const role = useMemo(() => getUserRole(conversation, currentUserId), [conversation, currentUserId]);
  const isSeller = role === 'seller';

  // Listing ref for toolbar
  const listingRef = useMemo<ListingRef>(() => ({
    id: conversation.listing.id,
    title: conversation.listing.title,
    slug: conversation.listing.slug,
  }), [conversation.listing]);

  // ─── Socket setup ────────────────────────────────────────────────────────

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onConnect = () => {
      setConnected(true);
      socket.emit('chat:join', { conversationId: conversation.id });
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    // If already connected, join immediately
    if (socket.connected) {
      setConnected(true);
      socket.emit('chat:join', { conversationId: conversation.id });
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socketRef, conversation.id]);

  // ─── Socket event listeners ──────────────────────────────────────────────

  useEffect(() => {
    const socket: Socket | null = socketRef.current;
    if (!socket) return;

    const onNewMessage = (payload: NewMessagePayload) => {
      const msg = payload.message;
      if (msg.conversationId !== conversation.id) return;

      setMessages((prev) => {
        // Deduplicate
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      // Auto-mark as read if not own message
      if (msg.senderId !== currentUserId) {
        socket.emit('chat:read', { conversationId: conversation.id, messageIds: [msg.id] });
      }
    };

    const onTyping = (payload: TypingPayload) => {
      if (payload.conversationId !== conversation.id) return;
      if (payload.userId === currentUserId) return;

      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (payload.isTyping) {
          next.set(payload.userId, payload.displayName);
        } else {
          next.delete(payload.userId);
        }
        return next;
      });
    };

    const onRead = (payload: ReadPayload) => {
      if (payload.conversationId !== conversation.id) return;
      if (payload.readerId === currentUserId) return;

      // Update readAt for messages that were read
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === currentUserId && m.readAt == null
            ? { ...m, readAt: new Date().toISOString() }
            : m,
        ),
      );
    };

    socket.on('chat:new_message', onNewMessage);
    socket.on('chat:user_typing', onTyping);
    socket.on('chat:message_read', onRead);

    return () => {
      socket.off('chat:new_message', onNewMessage);
      socket.off('chat:user_typing', onTyping);
      socket.off('chat:message_read', onRead);
    };
  }, [socketRef, conversation.id, currentUserId]);

  // ─── Auto-scroll ─────────────────────────────────────────────────────────

  const checkIfAtBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (wasAtBottomRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback(() => {
    wasAtBottomRef.current = checkIfAtBottom();
  }, [checkIfAtBottom]);

  // ─── Mark initial messages as read on mount ──────────────────────────────

  useEffect(() => {
    const unreadIds = initialMessages
      .filter((m) => m.senderId !== currentUserId && m.readAt == null)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      void markConversationRead(conversation.id, unreadIds).catch(() => { /* noop */ });
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit('chat:read', { conversationId: conversation.id, messageIds: unreadIds });
      }
    }
  }, []);

  // ─── Load older messages ─────────────────────────────────────────────────

  const loadOlder = useCallback(async () => {
    if (loadingOlder || !hasMore) return;
    setLoadingOlder(true);

    const container = scrollContainerRef.current;
    const prevHeight = container?.scrollHeight ?? 0;

    try {
      const nextPage = page + 1;
      const res = await fetchConversationMessages(conversation.id, nextPage);
      const olderMsgs = res.data;

      setMessages((prev) => [...olderMsgs, ...prev]);
      setPage(nextPage);
      setHasMore(res.meta.hasNextPage);

      // Maintain scroll position
      requestAnimationFrame(() => {
        if (container) {
          const newHeight = container.scrollHeight;
          container.scrollTop = newHeight - prevHeight;
        }
      });
    } catch {
      // Silently fail
    } finally {
      setLoadingOlder(false);
    }
  }, [conversation.id, page, hasMore, loadingOlder]);

  // ─── Send message ────────────────────────────────────────────────────────

  const handleSend = useCallback(
    (body: string) => {
      const socket = socketRef.current;

      if (socket?.connected) {
        // Send via socket for real-time delivery
        socket.emit('chat:send', { conversationId: conversation.id, body });

        // Optimistic local append
        const optimistic: ChatMessage = {
          id: `temp-${String(Date.now())}`,
          conversationId: conversation.id,
          body,
          senderId: currentUserId,
          readAt: null,
          createdAt: new Date().toISOString(),
          sender: { id: currentUserId, displayName: 'You', avatarUrl: null },
        };
        setMessages((prev) => [...prev, optimistic]);
        wasAtBottomRef.current = true;
        scrollToBottom();
      } else {
        // Fallback: HTTP POST
        void fetch(`/conversations/${conversation.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ body }),
        }).catch(() => { /* noop */ });
      }
    },
    [socketRef, conversation.id, currentUserId, scrollToBottom],
  );

  // ─── Typing ──────────────────────────────────────────────────────────────

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      const socket = socketRef.current;
      if (!socket?.connected) return;
      socket.emit('chat:typing', { conversationId: conversation.id, isTyping });
    },
    [socketRef, conversation.id],
  );

  // ─── Group messages by day ───────────────────────────────────────────────

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';

    for (const msg of messages) {
      if (!currentDate || isDifferentDay(currentDate, msg.createdAt)) {
        currentDate = msg.createdAt;
        groups.push({ date: currentDate, messages: [msg] });
      } else {
        const lastGroup = groups[groups.length - 1];
        if (lastGroup) lastGroup.messages.push(msg);
      }
    }

    return groups;
  }, [messages]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Avatar src={otherUser.avatarUrl} alt={otherUser.displayName} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{otherUser.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {conversation.listing.title}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              connected ? 'bg-success' : 'bg-muted-foreground/40',
            )}
          />
          <span className="text-xs text-muted-foreground">
            {connected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-4"
      >
        {/* Load more button */}
        {hasMore && (
          <div className="mb-4 text-center">
            <button
              type="button"
              onClick={() => { void loadOlder(); }}
              disabled={loadingOlder}
              className="rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 disabled:opacity-50"
            >
              {loadingOlder ? 'Loading...' : 'Load earlier messages'}
            </button>
          </div>
        )}

        {/* Message groups */}
        {groupedMessages.map((group) => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="my-4 flex items-center gap-3 px-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-medium text-muted-foreground">
                {formatDateSeparator(group.date)}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Messages in group */}
            <div className="space-y-1">
              {group.messages.map((msg, idx) => {
                const isOwn = msg.senderId === currentUserId;
                const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                const showAvatar = prevMsg?.senderId !== msg.senderId;

                return (
                  <div key={msg.id} className={cn(!showAvatar && 'mt-0.5')}>
                    <MessageBubble
                      message={msg}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      senderName={isOwn ? 'You' : otherUser.displayName}
                      senderAvatar={isOwn ? null : otherUser.avatarUrl}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 rounded-full bg-muted p-4">
              <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">Start the conversation</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Send a message about &ldquo;{conversation.listing.title}&rdquo;
            </p>
          </div>
        )}

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex gap-0.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
            <span className="text-xs text-muted-foreground">
              {Array.from(typingUsers.values()).join(', ')}{' '}
              {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <MessageComposer
        onSend={handleSend}
        onTyping={handleTyping}
        disabled={!connected}
        listing={listingRef}
        isSeller={isSeller}
      />
    </div>
  );
}
