"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import type { ChatConversation } from '../../lib/chatApi';

interface ChatWorkspaceProps {
  conversations: ChatConversation[];
  currentUserId: string;
  initialSelectedId?: string;
}

export default function ChatWorkspace({
  conversations,
  currentUserId,
  initialSelectedId,
}: ChatWorkspaceProps) {
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | undefined>(
    initialSelectedId || searchParams.get('conversation') || conversations[0]?.id
  );
  const [mobileShowDetail, setMobileShowDetail] = useState(!!selectedId && !!searchParams.get('conversation'));

  const selectedConv = conversations.find((c) => c.id === selectedId) || (selectedId ? { id: selectedId } as any : null);

  useEffect(() => {
    const qConv = searchParams.get('conversation');
    if (qConv) {
      setSelectedId(qConv);
      setMobileShowDetail(true);
    }
  }, [searchParams]);

  const handleSelect = (conv: ChatConversation) => {
    setSelectedId(conv.id);
    setMobileShowDetail(true);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      {/* Sidebar: Conversation List */}
      <div
        className={`w-full fashion-md:w-[340px] fashion-md:shrink-0 border-r ${
          mobileShowDetail ? 'hidden fashion-md:block' : 'block'
        }`}
      >
        <ConversationList
          conversations={conversations}
          currentUserId={currentUserId}
          {...(selectedId ? { selectedId } : {})}
          onSelect={handleSelect}
        />
      </div>

      {/* Main Workspace: Active Chat Thread (Desktop: right pane, Mobile: full screen when active) */}
      <div
        className={`flex-1 flex-col ${
          mobileShowDetail ? 'flex' : 'hidden fashion-md:flex'
        }`}
      >
        {/* Mobile Header Back Button */}
        <div className="flex items-center gap-2 border-b p-2 fashion-md:hidden bg-muted/40">
          <button
            type="button"
            onClick={() => setMobileShowDetail(false)}
            className="flex items-center gap-1 text-xs font-semibold text-primary p-1"
          >
            ← Back to conversations
          </button>
        </div>

        {selectedConv ? (
          <MessageThread
            key={selectedConv.id}
            conversation={selectedConv}
            currentUserId={currentUserId}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-center p-8">
            <div>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-foreground">Select a conversation</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
