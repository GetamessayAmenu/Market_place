'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent, Badge } from '@marketplace/ui';
import useAuth from '../../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { messageSchema, type MessageInput } from '../../../lib/validations/seller';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  customerName: string;
  customerAvatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  relatedOrder?: {
    id: string;
    title: string;
    model: 'sale' | 'rental' | 'custom';
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

// ─── Components ─────────────────────────────────────────────────────────────

function MessageThreadCard({ message, onSelect }: { message: Message; onSelect: (message: Message) => void }) {
  return (
    <Card
      className={`hover:border-primary/50 transition-colors cursor-pointer ${message.unread ? 'border-primary/30 bg-primary/5' : ''}`}
      onClick={() => onSelect(message)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
            {message.customerName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-sm">{message.customerName}</p>
              <span className="text-xs text-muted-foreground">{message.timestamp}</span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{message.lastMessage}</p>
            {message.relatedOrder && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {message.relatedOrder.model}: {message.relatedOrder.title}
                </Badge>
              </div>
            )}
          </div>
          {message.unread && (
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

function ChatInterface({ message, onClose }: { message: Message; onClose: () => void }) {
  const [showQuickResponses, setShowQuickResponses] = useState(false);

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

  const handleSend = (data: MessageInput) => {
    // Send message logic
    console.log('Send:', data.content);
    reset();
  };

  const handleQuickResponse = (template: QuickResponse) => {
    reset({ content: template.content });
    setShowQuickResponses(false);
  };

  const handleWhatsApp = () => {
    // Open WhatsApp with pre-filled message
    const url = `https://wa.me/?text=${encodeURIComponent(`Re: ${message.relatedOrder?.title || 'Inquiry'} - ${message.lastMessage}`)}`;
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
              {message.customerName.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{message.customerName}</p>
              {message.relatedOrder && (
                <p className="text-xs text-muted-foreground">{message.relatedOrder.title}</p>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Sample conversation */}
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3 max-w-[70%]">
              <p className="text-sm">{message.lastMessage}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[70%]">
              <p className="text-sm">Hello! Thank you for reaching out. I'd be happy to help you with that.</p>
            </div>
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs" type="button">
                Send Custom Quote
              </Button>
              <Button variant="outline" size="sm" className="text-xs" type="button">
                Send Rental Counter-Offer
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const user = useAuth((s) => s.user);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'with_order'>('all');

  // Mock data - replace with actual API calls
  const messages: Message[] = [
    {
      id: '1',
      customerName: 'Abebe Kebede',
      lastMessage: 'Is the Habesha Kemis still available for custom order?',
      timestamp: '2h ago',
      unread: true,
      relatedOrder: {
        id: 'order-1',
        title: 'Traditional Habesha Kemis',
        model: 'custom',
      },
    },
    {
      id: '2',
      customerName: 'Tigist Haile',
      lastMessage: 'Can I extend the rental for 2 more days?',
      timestamp: '5h ago',
      unread: true,
      relatedOrder: {
        id: 'order-2',
        title: 'Ethiopian Gabi',
        model: 'rental',
      },
    },
    {
      id: '3',
      customerName: 'Dawit Abebe',
      lastMessage: 'Thank you! I\'ll pick it up tomorrow.',
      timestamp: '1d ago',
      unread: false,
      relatedOrder: {
        id: 'order-3',
        title: 'Modern Dress',
        model: 'sale',
      },
    },
    {
      id: '4',
      customerName: 'Sara Tekle',
      lastMessage: 'Where is your shop located?',
      timestamp: '2d ago',
      unread: false,
    },
  ];

  const filteredMessages = messages.filter((msg) => {
    if (filter === 'unread') return msg.unread;
    if (filter === 'with_order') return !!msg.relatedOrder;
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
        {(['all', 'unread', 'with_order'] as const).map((f) => (
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
            {f === 'all' ? 'All Messages' : f === 'unread' ? 'Unread' : 'With Orders'}
          </button>
        ))}
      </div>

      {/* Message Threads */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMessages.map((message) => (
          <MessageThreadCard key={message.id} message={message} onSelect={setSelectedMessage} />
        ))}
      </div>

      {filteredMessages.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No messages found for this filter.
        </div>
      )}

      {/* Chat Interface */}
      {selectedMessage && (
        <ChatInterface message={selectedMessage} onClose={() => setSelectedMessage(null)} />
      )}
    </div>
  );
}
