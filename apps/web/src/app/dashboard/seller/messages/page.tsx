"use client"
import { Card, CardContent, EmptyState } from '@marketplace/ui';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import ConversationList from '../../../../components/chat/ConversationList';
import { useSocket } from '../../../../hooks/useSocket';
import { apiGet } from '../../../../lib/api';
import type { ChatConversation, ConversationsResponse } from '../../../../lib/chatApi';

// ─── Seller Messages Page ────────────────────────────────────────────────────

export default function SellerMessagesPage() {
  const socketRef = useSocket();
  const router = useRouter();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());

  // Fetch conversations
  useEffect(() => {
    void (async () => {
      try {
        const res = await apiGet<ConversationsResponse>('/conversations');
        setConversations(res.data);
      } catch {
        // Silently fail — show empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Real-time updates
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onNewMessage = (payload: { message: ChatConversation['lastMessage'] & { conversationId: string } }) => {
      const msg = payload.message;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId
            ? { ...c, lastMessage: msg, lastMessageAt: msg.createdAt }
            : c,
        ),
      );
    };

    const onTyping = (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      setTypingUserIds((prev) => {
        const next = new Set(prev);
        if (payload.isTyping) {
          next.add(payload.userId);
        } else {
          next.delete(payload.userId);
        }
        return next;
      });
    };

    socket.on('chat:new_message', onNewMessage);
    socket.on('chat:user_typing', onTyping);
    return () => {
      socket.off('chat:new_message', onNewMessage);
      socket.off('chat:user_typing', onTyping);
    };
  }, [socketRef]);

  const handleSelect = (conv: ChatConversation) => {
    router.push(`/dashboard/messages/${conv.id}`);
  };

  // Extract current user ID from first conversation
  const currentUserId = conversations.length > 0
    ? (conversations[0]?.buyerId ?? '')
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">Conversations with buyers about your listings.</p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              title="No messages yet"
              description="When buyers message you about listings, conversations will appear here."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 fashion-md:grid-cols-3">
          {/* Conversation List */}
          <div className="overflow-hidden rounded-lg border">
            <ConversationList
              conversations={conversations}
              currentUserId={currentUserId}
              onSelect={handleSelect}
              typingUserIds={typingUserIds}
            />
          </div>

          {/* Right panel */}
          <div className="fashion-md:col-span-2">
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-foreground">Select a conversation</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Click on a conversation to view messages, or it will open in the full view.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
