'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, CardContent, Badge } from '@marketplace/ui';
import useAuth from '../../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { messageSchema, type MessageInput } from '../../../lib/validations/seller';
import { apiGet, apiPost } from '../../../lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────

interface SerializedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
}

interface SerializedConversation {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
  seller: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
  listing: {
    id: string;
    title: string;
    slug: string;
    images: any[];
  } | null;
  lastMessage: SerializedMessage | null;
  messageCount: number;
  unreadCount: number;
}

interface QuickResponse {
  id: string;
  title: string;
  content: string;
  category: 'location' | 'measurements' | 'deposit' | 'general';
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconWhatsApp = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const IconPhone = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

const IconSend = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

// ─── Components ─────────────────────────────────────────────────────────────

function ConversationCard({ conversation, onSelect }: { conversation: SerializedConversation; onSelect: (conversation: SerializedConversation) => void }) {
  const customerName = conversation.buyer.displayName;
  const lastMessage = conversation.lastMessage?.body || 'No messages yet';
  const timestamp = conversation.lastMessageAt 
    ? new Date(conversation.lastMessageAt).toLocaleDateString()
    : new Date(conversation.createdAt).toLocaleDateString();
  const unread = conversation.unreadCount > 0;

  return (
    <Card
      className={`hover:border-primary/50 transition-colors cursor-pointer ${unread ? 'border-primary/30 bg-primary/5' : ''}`}
      onClick={() => onSelect(conversation)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
            {customerName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-sm">{customerName}</p>
              <span className="text-xs text-muted-foreground">{timestamp}</span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{lastMessage}</p>
            {conversation.listing && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {conversation.listing.title}
                </Badge>
              </div>
            )}
          </div>
          {unread && (
            <div className="h-2 w-2 rounded-full bg-primary" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickResponseTemplate({ template, onSelect }: { template: QuickResponse; onSelect: (template: QuickResponse) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted transition-colors"
    >
      <p className="font-medium text-sm">{template.title}</p>
      <p className="text-xs text-muted-foreground mt-1 truncate">{template.content}</p>
    </button>
  );
}

function ChatInterface({ conversation, onClose }: { conversation: SerializedConversation; onClose: () => void }) {
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MessageInput>({
    resolver: zodResolver(messageSchema),
  });

  const quickResponses: QuickResponse[] = [
    {
      id: '1',
      title: 'Store Location - Shiro Meda',
      content: 'My store is located in Shiro Meda, near the main market. I\'m open daily from 9 AM to 6 PM.',
      category: 'location',
    },
    {
      id: '2',
      title: 'How to Take Measurements',
      content: 'For custom orders, please provide your bust, waist, and shoulder-to-hem measurements. I can also help you take measurements at my store.',
      category: 'measurements',
    },
    {
      id: '3',
      title: 'Deposit Policy',
      content: 'For rentals, a security deposit is required and will be refunded upon return of the item in good condition.',
      category: 'deposit',
    },
    {
      id: '4',
      title: 'General Greeting',
      content: 'Hello! Thank you for your interest. How can I help you today?',
      category: 'general',
    },
  ];

  const handleSend = async (data: MessageInput) => {
    try {
      await apiPost(`/chat/conversations/${conversation.id}/messages`, { body: data.content });
      reset();
      // Reload messages after sending
      // await loadMessages(conversation.id);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleQuickResponse = (template: QuickResponse) => {
    reset({ content: template.content });
    setShowQuickResponses(false);
  };

  const handleWhatsApp = () => {
    // Open WhatsApp with pre-filled message
    const url = `https://wa.me/?text=${encodeURIComponent(`Re: ${conversation.listing?.title || 'Inquiry'} - ${conversation.lastMessage?.body || ''}`)}`;
    window.open(url, '_blank');
  };

  const handlePhoneCall = () => {
    // Trigger phone call
    window.location.href = 'tel:+251911234567';
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              {conversation.buyer.displayName.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{conversation.buyer.displayName}</p>
              {conversation.listing && (
                <p className="text-xs text-muted-foreground">{conversation.listing.title}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleWhatsApp}>
              <IconWhatsApp />
            </Button>
            <Button variant="ghost" size="sm" onClick={handlePhoneCall}>
              <IconPhone />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
          <div className="flex justify-center">
            <p className="text-sm text-muted-foreground">Real-time chat integration coming soon. Use the API to send messages.</p>
          </div>
        </div>

        {/* Quick Responses */}
        {showQuickResponses && (
          <div className="p-4 border-t bg-muted/30">
            <p className="text-sm font-medium mb-2">Quick Response Templates</p>
            <div className="grid grid-cols-2 gap-2">
              {quickResponses.map((template) => (
                <QuickResponseTemplate
                  key={template.id}
                  template={template}
                  onSelect={handleQuickResponse}
                />
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit(handleSend)} className="space-y-2">
            {conversation.listing && (
              <div className="mb-2 p-2 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">Listing: {conversation.listing.title}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowQuickResponses(!showQuickResponses)}
              >
                Templates
              </Button>
              <input
                placeholder="Type a message..."
                {...register('content')}
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              />
              <Button type="submit">
                <IconSend />
              </Button>
            </div>
            {errors.content && <p className="text-destructive text-xs">{errors.content.message}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const user = useAuth((s) => s.user);
  const [selectedConversation, setSelectedConversation] = useState<SerializedConversation | null>(null);
  const [conversations, setConversations] = useState<SerializedConversation[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'with_listing'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await apiGet<SerializedConversation[]>('/chat/conversations');
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (filter === 'unread') return conv.unreadCount > 0;
    if (filter === 'with_listing') return !!conv.listing;
    return true;
  });

  if (!user) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Please log in to view your messages.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Direct Communication Center</h1>
        <p className="text-muted-foreground">Manage customer conversations linked to orders and listings.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'unread', 'with_listing'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {f === 'all' ? 'All Messages' : f === 'unread' ? 'Unread' : 'With Listings'}
          </button>
        ))}
      </div>

      {/* Conversation Threads */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredConversations.map((conversation) => (
          <ConversationCard key={conversation.id} conversation={conversation} onSelect={setSelectedConversation} />
        ))}
      </div>

      {loading && (
        <div className="text-center py-12 text-muted-foreground">
          Loading conversations...
        </div>
      )}

      {!loading && filteredConversations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No conversations found for this filter.
        </div>
      )}

      {/* Chat Interface */}
      {selectedConversation && (
        <ChatInterface conversation={selectedConversation} onClose={() => setSelectedConversation(null)} />
      )}
    </div>
  );
}
