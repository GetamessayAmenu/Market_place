"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@marketplace/ui';
import { findOrCreateConversation } from '../../lib/chatApi';

interface ContactSellerButtonProps {
  sellerId: string;
  listingId: string;
  isOwner?: boolean;
  className?: string;
  customStarterMessage?: string;
}

export default function ContactSellerButton({
  sellerId,
  listingId,
  isOwner,
  className,
  customStarterMessage,
}: ContactSellerButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // If seller is viewing their own listing, hide "Contact Seller"
  if (isOwner) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      const conv: any = await findOrCreateConversation(sellerId, { listingId });
      const convId = conv?.id || conv?.data?.id;

      if (!convId) {
        throw new Error('Conversation could not be initialized');
      }

      const starterText = customStarterMessage || "Hi, I'm interested in this item. Is it still available?";
      const starterMsg = encodeURIComponent(starterText);
      router.push(`/dashboard/messages?conversation=${convId}&starter=${starterMsg}`);
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message;

      if (status === 401) {
        router.push(`/login?redirect=/listings/${listingId}`);
      } else if (status === 403) {
        if (serverMessage?.toLowerCase().includes('yourself')) {
          alert('You are the seller of this item. You cannot start a conversation with yourself.');
        } else if (serverMessage?.toLowerCase().includes('blocked')) {
          alert('Messaging is unavailable for this user.');
        } else {
          alert(serverMessage || 'You are not authorized to start a conversation for this item.');
        }
      } else {
        alert(serverMessage || err?.message || 'Failed to start conversation. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className || "flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] shadow-sm"}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {loading ? 'Starting Chat...' : 'Contact Seller'}
    </Button>
  );
}
