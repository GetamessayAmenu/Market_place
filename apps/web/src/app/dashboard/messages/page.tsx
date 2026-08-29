import React from 'react';
import ChatWorkspace from '../../../components/chat/ChatWorkspace';
import { requireUser } from '../../../lib/authServer';
import type { ChatConversation } from '../../../lib/chatApi';
import { serverGet } from '../../../lib/serverApi';

interface Props {
  searchParams: { conversation?: string; listing?: string; seller?: string };
}

export const metadata = { title: 'Messages — Marketplace' };

export default async function MessagesPage({ searchParams }: Props) {
  const user = await requireUser();
  if (!user) return null;

  let conversations: ChatConversation[] = [];
  try {
    const res = await serverGet<ChatConversation[]>('/chat/conversations');
    conversations = res || [];
  } catch {
    conversations = [];
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      <ChatWorkspace
        conversations={conversations}
        currentUserId={user.id}
        {...(searchParams.conversation ? { initialSelectedId: searchParams.conversation } : {})}
      />
    </div>
  );
}
