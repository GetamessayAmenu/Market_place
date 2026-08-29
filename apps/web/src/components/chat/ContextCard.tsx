"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Badge, Button } from '@marketplace/ui';
import type { ChatConversation, ChatUser } from '../../lib/chatApi';

interface ContextCardProps {
  conversation: ChatConversation;
}

export default function ContextCard({ conversation }: ContextCardProps) {
  const { listing, order, rental, customOrderRef, seller } = conversation;
  const [showSellerContact, setShowSellerContact] = useState(false);

  const sellerUser: ChatUser = seller && typeof seller === 'object' ? seller : {
    id: conversation.sellerId || 'seller',
    displayName: 'Seller',
    avatarUrl: null,
    phone: '+251 91 123 4567',
    email: 'seller@habesha.com',
  };

  // 1. Sale Order Context
  if (order) {
    return (
      <div className="flex items-center justify-between border-b bg-blue-50/60 px-4 py-2.5 dark:bg-blue-950/30">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
            ORD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-foreground">Order #{order.orderNumber}</span>
              <Badge variant="outline" className="text-[10px] bg-white dark:bg-gray-900 border-blue-200">
                {order.status}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Agreed Price: <span className="font-medium text-foreground">{order.agreedPrice} ETB</span>
            </p>
          </div>
        </div>
        <Link href={`/dashboard/orders/${order.id}`}>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
            View Order
          </Button>
        </Link>
      </div>
    );
  }

  // 2. Rental Order Context
  if (rental) {
    return (
      <div className="flex items-center justify-between border-b bg-purple-50/60 px-4 py-2.5 dark:bg-purple-950/30">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600 text-white font-bold text-xs">
            RNT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-foreground">Rental #{rental.orderNumber}</span>
              <Badge variant="outline" className="text-[10px] bg-white dark:bg-gray-900 border-purple-200">
                {rental.status}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {new Date(rental.startDate).toLocaleDateString()} → {new Date(rental.endDate).toLocaleDateString()} ({rental.dailyRate} ETB/day)
            </p>
          </div>
        </div>
        <Link href={`/rentals/${rental.id}`}>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 border-purple-300 text-purple-700 dark:text-purple-300">
            View Rental
          </Button>
        </Link>
      </div>
    );
  }

  // 3. Custom Order Context
  if (customOrderRef) {
    return (
      <div className="flex items-center justify-between border-b bg-amber-50/60 px-4 py-2.5 dark:bg-amber-950/30">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white font-bold text-xs">
            CST
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-foreground">Custom Request</span>
              <Badge variant="outline" className="text-[10px] bg-white dark:bg-gray-900 border-amber-200">
                {customOrderRef.status}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {customOrderRef.selectedFabric ? `Fabric: ${customOrderRef.selectedFabric} • ` : ''}
              {customOrderRef.selectedColor ? `Color: ${customOrderRef.selectedColor} • ` : ''}
              {customOrderRef.selectedSize ? `Size: ${customOrderRef.selectedSize}` : ''}
            </p>
          </div>
        </div>
        <Link href={`/custom-order/${customOrderRef.id}`}>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 border-amber-300 text-amber-700 dark:text-amber-300">
            View Custom Order
          </Button>
        </Link>
      </div>
    );
  }

  // 4. Listing Context (or Unavailable Listing state)
  if (listing) {
    const isAvailable = listing.status === 'active';
    const primaryImg = listing.images?.[0]?.url;

    return (
      <>
        <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {primaryImg ? (
              <img
                src={primaryImg}
                alt={listing.title}
                className="h-10 w-10 rounded-md object-cover border shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('.img-fallback')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'img-fallback h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 border border-primary/20';
                    fallback.innerText = '👗';
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 border border-primary/20">
                👗
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate font-medium text-xs text-foreground">{listing.title}</h4>
                {!isAvailable && (
                  <Badge variant="error" className="text-[10px] py-0 px-1">
                    This listing is no longer available
                  </Badge>
                )}
              </div>
              <p className="text-[11px] font-semibold text-primary">
                {listing.currency || 'ETB'} {listing.price ? listing.price.toLocaleString() : 'Price on request'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSellerContact(true)}
              className="h-7 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/5 flex items-center gap-1 px-2.5 rounded-lg shadow-2xs"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              Show Contact
            </Button>

            {isAvailable && (
              <Link href={`/listings/${listing.id}`} target="_blank">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
                  View Listing
                </Button>
              </Link>
            )}
          </div>
        </div>

        <SellerContactModal
          isOpen={showSellerContact}
          onClose={() => setShowSellerContact(false)}
          user={sellerUser}
          listingTitle={listing.title}
        />
      </>
    );
  }

  return null;
}

function SellerContactModal({
  isOpen,
  onClose,
  user,
  listingTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: ChatUser;
  listingTitle: string;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const phone = user.phone || '+251 91 123 4567';
  const email = user.email || 'seller@habesha.com';

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCall = () => {
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };

  const handleWhatsApp = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Hello ${user.displayName}! I am interested in your item "${listingTitle}".`);
    window.open(`https://wa.me/${cleanPhone || '251911234567'}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Seller Contact Info
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground font-bold text-sm">✕</button>
        </div>

        <div className="py-4 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-extrabold text-xl ring-4 ring-primary/20">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full rounded-full object-cover" />
            ) : (
              user.displayName?.charAt(0)?.toUpperCase() || 'S'
            )}
          </div>
          <h4 className="text-base font-bold text-foreground">{user.displayName}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Seller for "{listingTitle}"</p>

          <div className="mt-4 space-y-2.5 text-left">
            {/* Phone Card */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Phone Number</p>
                  <p className="text-xs font-bold text-foreground truncate">{phone}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(phone, 'phone')}
                className="text-[11px] font-semibold text-primary hover:underline px-2 py-1"
              >
                {copiedField === 'phone' ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            {/* Email Card */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email Address</p>
                  <p className="text-xs font-bold text-foreground truncate">{email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(email, 'email')}
                className="text-[11px] font-semibold text-primary hover:underline px-2 py-1"
              >
                {copiedField === 'email' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={handleCall}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2 flex items-center justify-center gap-1.5 rounded-xl shadow-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              Call Seller
            </Button>
            <Button
              type="button"
              onClick={handleWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 flex items-center justify-center gap-1.5 rounded-xl shadow-sm"
            >
              WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
