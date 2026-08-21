'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Card, CardContent, Badge, Input } from '@marketplace/ui';
import useAuth from '../../../hooks/useAuth';
import { apiGet, apiPost, apiPatch } from '../../../lib/api';
import { fetchConversationMessages, formatRelativeTime, formatMessageTime, isDifferentDay, formatDateSeparator } from '../../../lib/chatApi';
import MessageThread from '../../../components/chat/MessageThread';

// ─── Types ─────────────────────────────────────────────────────────────────

type OrderType = 'SALE' | 'RENTAL' | 'CUSTOM_TAILORING';

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
  isFlagged: boolean;
  deletedAt: string | null;
  buyer: {
    id: string;
    displayName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  };
  seller: {
    id: string;
    displayName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  };
  listing: {
    id: string;
    title: string;
    slug: string;
    price: number;
    currency: string;
    images: any[];
  } | null;
  lastMessage: SerializedMessage | null;
  messageCount: number;
  unreadCount: number;
  customOrder?: {
    id: string;
    type: OrderType;
    status: string;
    measurements?: any;
    rentalStartDate?: string;
    rentalEndDate?: string;
    agreedPrice?: number;
  };
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

const IconSearch = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

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
  const timestamp = conversation.lastMessageAt 
    ? formatRelativeTime(conversation.lastMessageAt)
    : formatRelativeTime(conversation.createdAt);
  const unread = conversation.unreadCount > 0;
  
  // Determine order type badge
  const orderType = conversation.customOrder?.type || 'SALE';
  const typeColors = {
    SALE: 'bg-blue-600 text-white shadow-md',
    RENTAL: 'bg-purple-600 text-white shadow-md',
    CUSTOM_TAILORING: 'bg-orange-600 text-white shadow-md',
  };
  const typeLabels = {
    SALE: 'Sale',
    RENTAL: 'Rental',
    CUSTOM_TAILORING: 'Custom',
  };

  return (
    <div
      onClick={() => onSelect(conversation)}
      className={`group p-3 border-b cursor-pointer transition-all duration-200 ${
        isActive 
          ? 'bg-blue-50 border-l-4 border-l-blue-600 shadow-md' 
          : 'border-l-4 border-l-transparent hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="relative flex-shrink-0">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-transform group-hover:scale-105 ${
            conversation.buyer.avatarUrl ? 'ring-2 ring-blue-200' : 'bg-blue-600 text-white'
          }`}>
            {conversation.buyer.avatarUrl ? (
              <img src={conversation.buyer.avatarUrl} alt={customerName} className="w-full h-full rounded-full object-cover" />
            ) : (
              customerName.charAt(0).toUpperCase()
            )}
          </div>
          {unread && (
            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg border-2 border-white">
              {conversation.unreadCount}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-xs truncate text-gray-900">{customerName}</p>
            <span className="text-[10px] text-gray-500 whitespace-nowrap ml-1 font-semibold bg-gray-100 px-1.5 py-0.5 rounded">{timestamp}</span>
          </div>
          <p className="text-[10px] text-gray-600 truncate mb-1.5 line-clamp-2 leading-relaxed">{lastMessage}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-lg font-bold ${typeColors[orderType as keyof typeof typeColors]}`}>
              {typeLabels[orderType as keyof typeof typeLabels]}
            </span>
            {conversation.listing && (
              <span className="text-[10px] text-gray-500 truncate font-semibold bg-gray-100 px-1.5 py-0.5 rounded-lg">
                {conversation.listing.title}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderIntentPanel({ conversation }: { conversation: SerializedConversation }) {
  if (!conversation.customOrder) return null;

  const { customOrder } = conversation;
  
  return (
    <div className="bg-white rounded-lg p-2 mb-2 border-2 border-gray-200 shadow-sm flex-shrink-0">
      <h4 className="text-xs font-bold mb-1.5 flex items-center gap-1.5 text-gray-900">
        <div className="p-1 bg-blue-100 rounded-lg">
          <IconQuote />
        </div>
        Order Intent
      </h4>
      
      {customOrder.type === 'RENTAL' && customOrder.rentalStartDate && customOrder.rentalEndDate && (
        <div className="bg-purple-50 rounded-lg p-2 border-2 border-purple-200 mb-1.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-purple-600" />
            <p className="text-[10px] font-bold text-purple-900 uppercase tracking-wide">Rental Period</p>
          </div>
          <p className="text-xs font-semibold text-gray-900">
            {new Date(customOrder.rentalStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} 
            <span className="mx-1.5 text-purple-600">→</span>
            {new Date(customOrder.rentalEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      )}
      
      {customOrder.type === 'CUSTOM_TAILORING' && customOrder.measurements && (
        <div className="bg-orange-50 rounded-lg p-2 border-2 border-orange-200 mb-1.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-600" />
            <p className="text-[10px] font-bold text-orange-900 uppercase tracking-wide">Custom Measurements</p>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(customOrder.measurements).slice(0, 4).map(([key, value]) => (
              <div key={key} className="bg-white rounded-lg p-1.5 border-2 border-orange-200">
                <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">{key}</p>
                <p className="text-xs font-bold text-gray-900">{String(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {customOrder.agreedPrice && (
        <div className="bg-blue-50 rounded-lg p-2 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">Agreed Price</span>
            <span className="text-xs font-bold text-blue-900">
              {conversation.listing?.currency || 'ETB'} {customOrder.agreedPrice.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickResponseChip({ template, onSelect }: { template: QuickResponse; onSelect: (content: string) => void }) {
  const categoryColors = {
    location: 'bg-blue-600 hover:bg-blue-700',
    measurements: 'bg-orange-600 hover:bg-orange-700',
    deposit: 'bg-purple-600 hover:bg-purple-700',
    general: 'bg-gray-600 hover:bg-gray-700',
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(template.content)}
      className={`flex-shrink-0 px-2 py-1 ${categoryColors[template.category]} text-white rounded-lg text-[10px] font-bold shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200 whitespace-nowrap border border-black/10`}
    >
      {template.title}
    </button>
  );
}

function QuoteModal({ isOpen, onClose, conversation, onSubmit }: { 
  isOpen: boolean; 
  onClose: () => void;
  conversation: SerializedConversation;
  onSubmit: (quote: { proposedPrice: number; proposedDeposit?: number; notes?: string }) => void;
}) {
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      proposedPrice: parseFloat(price),
      proposedDeposit: deposit ? parseFloat(deposit) : undefined,
      notes: notes || undefined,
    });
    onClose();
    setPrice('');
    setDeposit('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-2 border-gray-200">
        <div className="p-6 border-b-2 border-gray-200 bg-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-xl">
              <IconQuote />
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900">Send Custom Quote</h3>
              <p className="text-base text-gray-600">Propose pricing for {conversation.buyer.displayName}</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full" />
              Agreed Price (ETB)
            </label>
            <div className="relative">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-300 px-4 py-4 text-base font-bold focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                placeholder="Enter price"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-base font-semibold">ETB</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-purple-600 rounded-full" />
              Security Deposit (ETB) - Optional
            </label>
            <div className="relative">
              <input
                type="number"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-300 px-4 py-4 text-base font-bold focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all"
                placeholder="Enter deposit amount"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-base font-semibold">ETB</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-orange-600 rounded-full" />
              Notes - Optional
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-300 px-4 py-4 text-base resize-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all"
              rows={4}
              placeholder="Add any additional details..."
            />
          </div>
          <div className="flex gap-4 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 rounded-xl font-bold h-14 text-base border-2 border-gray-300 hover:bg-gray-100 transition-all"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold h-14 text-base shadow-lg hover:shadow-xl transition-all"
            >
              Send Quote
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
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');

  const quickResponses: QuickResponse[] = [
    {
      id: '1',
      title: 'Our shop is at Shiro Meda',
      content: 'My store is located in Shiro Meda, near the main market. I\'m open daily from 9 AM to 6 PM.',
      category: 'location',
    },
    {
      id: '2',
      title: 'Please send measurements',
      content: 'For custom orders, please provide your bust, waist, and shoulder-to-hem measurements. I can also help you take measurements at my store.',
      category: 'measurements',
    },
    {
      id: '3',
      title: 'Deposit required for rentals',
      content: 'For rentals, a security deposit is required and will be refunded upon return of the item in good condition.',
      category: 'deposit',
    },
    {
      id: '4',
      title: 'Available for pickup',
      content: 'The item is available for pickup at my store. Would you like me to set it aside for you?',
      category: 'general',
    },
    {
      id: '5',
      title: 'Delivery available',
      content: 'I can arrange delivery within Addis Ababa for a small fee. Let me know your location.',
      category: 'general',
    },
  ];

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

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

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetchConversationMessages(conversationId);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    // Apply filter
    if (filter === 'unread' && conv.unreadCount === 0) return false;
    if (filter === 'unanswered') {
      // Buyer sent last message and 24+ hours have elapsed
      const lastMessage = conv.lastMessage;
      if (!lastMessage) return false;
      const isFromBuyer = lastMessage.senderId !== user?.id;
      const lastMessageTime = new Date(lastMessage.createdAt);
      const hoursSinceMessage = (Date.now() - lastMessageTime.getTime()) / (1000 * 60 * 60);
      if (!isFromBuyer || hoursSinceMessage < 24) return false;
    }
    if (filter === 'flagged') {
      // Check if conversation is flagged (using isFlagged field from schema)
      if (!conv.isFlagged) return false;
    }
    if (filter === 'archived') {
      // Check if conversation is archived (deletedAt is set or customOrder status is COMPLETED)
      const isArchived = conv.deletedAt || conv.customOrder?.status === 'COMPLETED' || conv.customOrder?.status === 'ARCHIVED';
      if (!isArchived) return false;
    }
    
    // Apply search
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
      // Use the new quote endpoint
      await apiPost(`/chat/conversations/${selectedConversation.id}/quote`, quote);
      // Reload messages and conversations
      await loadMessages(selectedConversation.id);
      await loadConversations();
    } catch (error) {
      console.error('Failed to send quote:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !messageInput.trim()) return;

    try {
      await apiPost(`/chat/conversations/${selectedConversation.id}/messages`, {
        body: messageInput,
      });
      setMessageInput('');
      await loadMessages(selectedConversation.id);
      await loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleWhatsApp = () => {
    if (!selectedConversation?.buyer.phone) return;
    const message = encodeURIComponent(
      `Hello! I'm contacting you regarding your inquiry about ${selectedConversation.listing?.title || 'our products'}.`
    );
    window.open(`https://wa.me/${selectedConversation.buyer.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handlePhoneCall = () => {
    if (!selectedConversation?.buyer.phone) return;
    window.location.href = `tel:${selectedConversation.buyer.phone}`;
  };

  const handleMarkCompleted = async () => {
    if (!selectedConversation?.customOrder) return;
    try {
      await apiPatch(`/orders/${selectedConversation.customOrder.id}/status`, { status: 'COMPLETED' });
      // Reload conversations to reflect status change
      loadConversations();
    } catch (error) {
      console.error('Failed to mark as completed:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to view your messages.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b-2 border-gray-200 bg-white px-6 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Messages</h1>
            <p className="text-base text-gray-600 mt-1">Direct communication with buyers</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-blue-100 rounded-xl border-2 border-blue-200">
              <span className="text-sm font-bold text-blue-900">{conversations.length} conversations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Conversation Sidebar */}
        <div className="w-[350px] flex-shrink-0 border-r-2 border-gray-200 flex flex-col bg-white">
          {/* Search Bar */}
          <div className="p-3 border-b-2 border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, phone, or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border-2 border-gray-300 bg-gray-50 text-xs font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all shadow-sm"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 p-2 border-b-2 border-gray-200 bg-gray-50 overflow-x-auto">
            {(['all', 'unread', 'unanswered', 'flagged', 'archived'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 whitespace-nowrap ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f === 'unanswered' ? 'Unanswered' : f === 'flagged' ? '� Spam / Flagged' : f === 'archived' ? '⭐ Archived' : f}
              </button>
            ))}
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No conversations found
              </div>
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
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {selectedConversation ? (
            <>
              {/* Sticky Product Reference Header */}
              <div className="border-b-2 border-gray-200 bg-gray-50 p-3 shadow-sm flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${
                      selectedConversation.buyer.avatarUrl ? 'ring-2 ring-blue-200' : 'bg-blue-600 text-white'
                    }`}>
                      {selectedConversation.buyer.avatarUrl ? (
                        <img src={selectedConversation.buyer.avatarUrl} alt={selectedConversation.buyer.displayName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        selectedConversation.buyer.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-gray-900">{selectedConversation.buyer.displayName}</p>
                      {selectedConversation.buyer.phone && (
                        <p className="text-[10px] text-gray-600 font-semibold">{selectedConversation.buyer.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleWhatsApp}
                      className="h-8 w-8 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <IconWhatsApp />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handlePhoneCall}
                      className="h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <IconPhone />
                    </Button>
                  </div>
                </div>
                
                {selectedConversation.listing && (
                  <div className="flex items-center gap-2 bg-white rounded-lg p-2 border-2 border-gray-200 shadow-sm">
                    {selectedConversation.listing.images?.[0] && (
                      <img
                        src={selectedConversation.listing.images[0].url}
                        alt={selectedConversation.listing.title}
                        className="w-10 h-10 rounded-lg object-cover shadow-sm"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{selectedConversation.listing.title}</p>
                      <p className="text-xs text-gray-600 font-semibold">
                        {selectedConversation.listing.currency} {selectedConversation.listing.price?.toLocaleString() || 'Price not set'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Intent / Measurement Panel */}
              <OrderIntentPanel conversation={selectedConversation} />

              {/* Real-Time Chat Transcript */}
              <div className="flex-1 overflow-y-auto p-3">
                <MessageThread
                  conversation={selectedConversation as any}
                  currentUserId={user.id}
                  initialMessages={messages}
                />
              </div>

              {/* Message Input */}
              <div className="border-t-2 border-gray-200 bg-white p-2 shadow-sm flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-300 bg-gray-50 text-xs font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                  />
                  <Button
                    type="submit"
                    className="rounded-lg px-4 py-2 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  >
                    Send
                  </Button>
                </form>
              </div>

              {/* Interactive Custom Quote & Action Bar */}
              <div className="border-t-2 border-gray-200 bg-gray-50 p-2 shadow-sm flex-shrink-0">
                {/* Quick Response Chips */}
                <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
                  {quickResponses.map((template) => (
                    <QuickResponseChip
                      key={template.id}
                      template={template}
                      onSelect={() => {
                        // Quick response would be sent via MessageThread
                      }}
                    />
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuoteModal(true)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold text-xs border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                  >
                    <IconQuote />
                    Send Quote
                  </Button>
                  {selectedConversation.customOrder && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkCompleted}
                      className="rounded-lg px-3 py-1.5 font-bold text-xs border-2 border-green-600 text-green-600 hover:bg-green-50 transition-all shadow-sm"
                    >
                      ✓ Mark Completed & Archive
                    </Button>
                  )}
                </div>
              </div>
            </>
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
