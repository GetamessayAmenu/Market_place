import React from 'react';

import MessageThread from '../../../../components/chat/MessageThread';
import { requireUser } from '../../../../lib/authServer';
import type { ChatConversation, MessagesResponse } from '../../../../lib/chatApi';
import { serverGet } from '../../../../lib/serverApi';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  params: { id: string };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function generateMetadata({ params }: Props) {
  return { title: `Conversation ${params.id}` };
}

export default async function ConversationPage({ params }: Props) {
  const user = await requireUser();
  if (!user) return null;

  let conversation: ChatConversation | null = null;
  let messages: MessagesResponse['data'] = [];
  let totalPages = 1;

  try {
    const convRes = await serverGet<ChatConversation>(`/conversations/${params.id}`);
    conversation = convRes;
  } catch {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-sm text-muted-foreground">Conversation not found.</p>
      </div>
    );
  }

  try {
    const msgRes = await serverGet<MessagesResponse>(`/conversations/${params.id}/messages`, {
      params: { limit: 50 },
    });
    messages = msgRes.data;
    totalPages = msgRes.meta.totalPages;
  } catch {
    // Show empty thread
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <MessageThread
        conversation={conversation}
        currentUserId={user.id}
        initialMessages={messages}
        totalPages={totalPages}
      />
    </div>
  );
}
