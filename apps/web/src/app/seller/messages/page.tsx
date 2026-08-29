"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@marketplace/ui';
import { useAuth } from '../../../hooks/useAuth';
import { apiGet, apiPost } from '../../../lib/api';
import MessageThread from '../../../components/chat/MessageThread';
import type { ChatUser, ChatListing } from '../../../lib/chatApi';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface CustomOrder {
  id: string;
  status: string;
  type: string;
  rentalStartDate?: string;
  rentalEndDate?: string;
  measurements?: Record<string, string | number>;
  agreedPrice?: number;
}

interface SerializedConversation {
  id: string;
  listingId: string | null;
  orderId?: string | null;
  rentalId?: string | null;
  customOrderId?: string | null;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  isFlagged: boolean;
  deletedAt: string | null;
  buyer: ChatUser;
  seller: ChatUser;
  listing?: ChatListing | null;
  customOrder?: CustomOrder | null;
  unreadCount?: number;
  lastMessage?: {
    id: string;
    body: string;
    senderId: string;
    createdAt: string;
  } | null;
}

const IconQuote = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

// ─── Components ─────────────────────────────────────────────────────────────

function ConversationCard({ conversation, isActive, onSelect }: { 
  conversation: SerializedConversation; 
  isActive: boolean;
  onSelect: (conversation: SerializedConversation) => void;
}) {
  const customerName = conversation.buyer.displayName;
  const lastMessage = conversation.lastMessage?.body || 'No messages yet';
  const unreadCount = conversation.unreadCount || 0;
  const isUnanswered = false;

  return (
    <div
      onClick={() => onSelect(conversation)}
      className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
        isActive 
          ? 'border-blue-600 bg-blue-50/50 shadow-md' 
          : unreadCount > 0 
            ? 'border-blue-300 bg-blue-50/20 hover:border-blue-400' 
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            conversation.buyer.avatarUrl ? 'ring-2 ring-blue-200' : 'bg-blue-600 text-white'
          }`}>
            {conversation.buyer.avatarUrl ? (
              <img src={conversation.buyer.avatarUrl} alt={customerName} className="w-full h-full rounded-full object-cover" />
            ) : (
              customerName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs text-gray-900 truncate">{customerName}</p>
            {conversation.listing && (
              <p className="text-[10px] text-gray-600 font-semibold truncate">{conversation.listing.title}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          {conversation.lastMessageAt && (
            <span className="text-[10px] text-gray-500 font-semibold">
              {new Date(conversation.lastMessageAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {unreadCount > 0 && (
            <span className="mt-1 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-600 line-clamp-1 mb-2 font-medium">{lastMessage}</p>

      {isUnanswered && (
        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
          <span>⚠️</span> Needs Response (24h+)
        </div>
      )}
    </div>
  );
}

function QuoteModal({ isOpen, onClose, onSubmit }: {
  isOpen: boolean;
  onClose: () => void;
  conversation?: SerializedConversation;
  onSubmit: (quote: { proposedPrice: number; proposedDeposit?: number; notes?: string }) => void;
}) {
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || parseFloat(price) <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        proposedPrice: parseFloat(price),
        ...(deposit ? { proposedDeposit: parseFloat(deposit) } : {}),
        ...(notes ? { notes } : {}),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <IconQuote />
            Send Custom Quote
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-900 mb-1">Proposed Price (ETB) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 5000"
              required
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 text-sm font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-900 mb-1">Security Deposit (ETB) (Optional)</label>
            <input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              placeholder="e.g. 1500"
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 text-sm font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-900 mb-1">Notes / Terms (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Include details about turnaround time, fittings, or inclusions..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 text-sm font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
              {isSubmitting ? 'Sending...' : 'Send Quote'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const user = useAuth((s) => s.user);
  const [selectedConversation, setSelectedConversation] = useState<SerializedConversation | null>(null);
  const [conversations, setConversations] = useState<SerializedConversation[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'unanswered' | 'flagged' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

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
    if (filter === 'unread' && conv.unreadCount === 0) return false;
    if (filter === 'unanswered') {
      const lastMessage = conv.lastMessage;
      if (!lastMessage) return false;
      const isFromBuyer = lastMessage.senderId !== user?.id;
      const lastMessageTime = new Date(lastMessage.createdAt);
      const hoursSinceMessage = (Date.now() - lastMessageTime.getTime()) / (1000 * 60 * 60);
      if (!isFromBuyer || hoursSinceMessage < 24) return false;
    }
    if (filter === 'flagged') {
      if (!conv.isFlagged) return false;
    }
    if (filter === 'archived') {
      const isArchived = conv.deletedAt || conv.customOrder?.status === 'COMPLETED' || conv.customOrder?.status === 'ARCHIVED';
      if (!isArchived) return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesBuyer = conv.buyer.displayName.toLowerCase().includes(query);
      const matchesListing = conv.listing?.title.toLowerCase().includes(query);
      const matchesPhone = conv.buyer.phone?.toLowerCase().includes(query);
      if (!matchesBuyer && !matchesListing && !matchesPhone) return false;
    }
    
    return true;
  });

  const handleQuoteSubmit = async (quote: { proposedPrice: number; proposedDeposit?: number; notes?: string }) => {
    if (!selectedConversation) return;
    
    try {
      await apiPost(`/chat/conversations/${selectedConversation.id}/quote`, quote);
      await loadConversations();
    } catch (error) {
      console.error('Failed to send quote:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-8 text-center bg-gray-50">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-sm text-gray-600">Please log in to view seller messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-100 overflow-hidden font-sans">
      <div className="flex-1 flex max-w-5xl mx-auto w-full bg-white shadow-xl my-2 rounded-xl overflow-hidden border-2 border-gray-200">
        {/* Sidebar */}
        <div className="w-80 border-r-2 border-gray-200 flex flex-col bg-gray-50 flex-shrink-0">
          <div className="p-3 border-b-2 border-gray-200 bg-white">
            <h2 className="text-lg font-extrabold text-gray-900 mb-2">Seller Messages</h2>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search buyer, item..."
              className="w-full px-3 py-1.5 rounded-lg border-2 border-gray-300 text-xs font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 mb-2"
            />

            <div className="flex gap-1 overflow-x-auto pb-1">
              {(['all', 'unread', 'unanswered', 'flagged', 'archived'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold capitalize transition-all whitespace-nowrap ${
                    filter === tab 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {loading ? (
              <div className="p-4 text-center text-xs text-gray-500 font-semibold">Loading messages...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500 font-semibold">No conversations found</div>
            ) : (
              filteredConversations.map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  isActive={selectedConversation?.id === conversation.id}
                  onSelect={setSelectedConversation}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Pane - Active Chat Workspace */}
        <div className="flex-1 flex flex-col bg-white min-w-0 h-full overflow-hidden">
          {selectedConversation ? (
            <MessageThread
              key={selectedConversation.id}
              conversation={selectedConversation as any}
              currentUserId={user.id}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="h-16 w-16 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium mb-1">Select a conversation</p>
                <p className="text-sm text-muted-foreground">Choose a conversation from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quote Modal */}
      {selectedConversation && (
        <QuoteModal
          isOpen={showQuoteModal}
          onClose={() => setShowQuoteModal(false)}
          conversation={selectedConversation}
          onSubmit={handleQuoteSubmit}
        />
      )}
    </div>
  );
}
