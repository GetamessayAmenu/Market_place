"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import ListingDetailsPanel from './ListingDetailsPanel';
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


  const paramConv = searchParams.get('conversation') || searchParams.get('conversationId') || initialSelectedId;
  const paramStarter = searchParams.get('starter') || '';

  const [selectedId, setSelectedId] = useState<string | undefined>(
    paramConv || conversations[0]?.id
  );
  const [starterText, setStarterText] = useState(paramStarter);

  // Responsive state
  const [mobileShowDetail, setMobileShowDetail] = useState(!!paramConv);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const selectedConv = conversations.find((c) => c.id === selectedId) || (selectedId ? { id: selectedId } as any : null);

  useEffect(() => {
    if (paramConv) {
      setSelectedId(paramConv);
      setMobileShowDetail(true);
    }
    if (paramStarter) {
      setStarterText(paramStarter);
    }
  }, [paramConv, paramStarter]);

  const handleSelect = (conv: ChatConversation) => {
    setSelectedId(conv.id);
    setMobileShowDetail(true);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* LEFT PANEL: Conversation List */}
      <div
        className={`w-full lg:w-[320px] lg:shrink-0 border-r border-border/70 ${
          mobileShowDetail ? 'hidden lg:block' : 'block'
        }`}
      >
        <ConversationList
          conversations={conversations}
          currentUserId={currentUserId}
          {...(selectedId ? { selectedId } : {})}
          onSelect={handleSelect}
        />
      </div>

      {/* CENTER PANEL: Main Conversation Workspace */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-full ${
          mobileShowDetail ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {/* Mobile Header Back Button */}
        <div className="flex items-center gap-2 border-b p-2.5 lg:hidden bg-card shrink-0">
          <button
            type="button"
            onClick={() => setMobileShowDetail(false)}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline p-1"
          >
            ← Back to conversations
          </button>
        </div>

        {selectedConv && selectedConv.id ? (
          <div className="flex-1 flex min-w-0 h-full overflow-hidden">
            {/* Thread Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
              <MessageThread
                key={selectedConv.id}
                conversation={selectedConv}
                currentUserId={currentUserId}
                initialStarterText={starterText}
                onToggleRightPanel={() => setShowRightPanel((v) => !v)}
                showRightPanelToggle={true}
              />
            </div>

            {/* RIGHT PANEL: Compact Listing Details (Collapsible on Desktop) */}
            {showRightPanel && (
              <div className="hidden xl:block w-[300px] shrink-0 h-full">
                <ListingDetailsPanel
                  conversation={selectedConv}
                  currentUserId={currentUserId}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-center p-8">
            <div>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-foreground">Select a conversation</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Choose a conversation from the list to start messaging buyers or sellers.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
