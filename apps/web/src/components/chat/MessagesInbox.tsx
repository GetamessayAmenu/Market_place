"use client"
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import type { ChatConversation } from '../../lib/chatApi';
import ConversationList from '../chat/ConversationList';

// ─── Props ───────────────────────────────────────────────────────────────────

interface MessagesInboxProps {
  conversations: ChatConversation[];
  currentUserId: string;
  selectedId?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MessagesInbox({
  conversations,
  currentUserId,
  selectedId,
}: MessagesInboxProps) {
  const router = useRouter();
  const [typingUserIds] = useState<Set<string>>(new Set());

  const handleSelect = (conv: ChatConversation) => {
    router.push(`/dashboard/messages/${conv.id}`);
  };

  return (
    <ConversationList
      conversations={conversations}
      currentUserId={currentUserId}
      {...(selectedId !== undefined ? { selectedId } : {})}
      onSelect={handleSelect}
      typingUserIds={typingUserIds}
    />
  );
}
