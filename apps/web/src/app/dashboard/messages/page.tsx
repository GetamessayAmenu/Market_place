import React from 'react';

import MessagesInbox from '../../../components/chat/MessagesInbox';
import { requireUser } from '../../../lib/authServer';
import type { ConversationsResponse } from '../../../lib/chatApi';
import { serverGet } from '../../../lib/serverApi';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  searchParams: { conversation?: string };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export const metadata = { title: 'Messages' };

export default async function MessagesPage({ searchParams }: Props) {
  const user = await requireUser();
  if (!user) return null;

  let conversations: ConversationsResponse['data'] = [];
  try {
    const res = await serverGet<ConversationsResponse>('/conversations', { params: { limit: 50 } });
    conversations = res.data;
  } catch {
    // Show empty state on error
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="shrink-0 border-b px-4 py-3">
        <h1 className="font-display text-xl font-bold tracking-tight">Messages</h1>
        <p className="text-xs text-muted-foreground">Your conversations with buyers and sellers</p>
      </div>

      {/* Content — desktop: side-by-side, mobile: list only */}
      <div className="flex min-h-0 flex-1">
        {/* Conversation list */}
        <div className="w-full border-r fashion-md:w-[340px] fashion-md:shrink-0">
          <MessagesInbox
            conversations={conversations}
            currentUserId={user.id}
            {...(searchParams.conversation !== undefined ? { selectedId: searchParams.conversation } : {})}
          />
        </div>

        {/* Right panel — desktop only */}
        <div className="hidden flex-1 items-center justify-center fashion-md:flex">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">Select a conversation</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose a conversation from the list to view messages
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
