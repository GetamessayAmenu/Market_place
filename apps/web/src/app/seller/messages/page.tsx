"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { apiGet } from '../../../lib/api';
import ChatWorkspace from '../../../components/chat/ChatWorkspace';
import type { ChatConversation } from '../../../lib/chatApi';

export default function SellerMessagesPage() {
  const user = useAuth((s) => s.user);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await apiGet<ChatConversation[]>('/chat/conversations');
      setConversations(data || []);
    } catch (error) {
      console.error('Failed to load seller conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-8 text-center bg-background">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">Access Restricted</h2>
          <p className="text-xs text-muted-foreground">Please log in to view seller messages.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading conversations...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      <ChatWorkspace
        conversations={conversations}
        currentUserId={user.id}
      />
    </div>
  );
}
