"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Badge, Button } from '@marketplace/ui';
import type { ChatConversation, ChatUser } from '../../lib/chatApi';

interface ContextCardProps {
  conversation: ChatConversation;
  currentUserId?: string;
}

export default function ContextCard({ conversation, currentUserId }: ContextCardProps) {
  const { listing, order, rental, customOrderRef, seller, buyer } = conversation;
  const [showContactModal, setShowContactModal] = useState(false);

  const isBuyer = conversation.buyerId === currentUserId;
  const otherUser: ChatUser = isBuyer
    ? (seller && typeof seller === 'object' ? seller : { id: conversation.sellerId, displayName: 'Seller', avatarUrl: null })
    : (buyer && typeof buyer === 'object' ? buyer : { id: conversation.buyerId, displayName: 'Buyer', avatarUrl: null });

  // 1. Order Context
  if (order) {
    return (
      <div className="flex items-center justify-between border-b bg-blue-50/70 dark:bg-blue-950/30 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shrink-0">
            ORD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-foreground">Order #{order.orderNumber}</span>
              <Badge variant="outline" className="text-[10px] bg-background border-blue-200">
                {order.status}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Agreed Price: <span className="font-semibold text-foreground">ETB {Number(order.agreedPrice).toLocaleString()}</span>
            </p>
          </div>
        </div>
        <Link href={`/dashboard/orders/${order.id}`}>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 font-semibold">
            View Order
          </Button>
        </Link>
      </div>
    );
  }

  // 2. Rental Order Context
  if (rental) {
    return (
      <div className="flex items-center justify-between border-b bg-purple-50/70 dark:bg-purple-950/30 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600 text-white font-bold text-xs shrink-0">
            RNT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-foreground">Rental #{rental.orderNumber}</span>
              <Badge variant="outline" className="text-[10px] bg-background border-purple-200">
                {rental.status}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {new Date(rental.startDate).toLocaleDateString()} → {new Date(rental.endDate).toLocaleDateString()} (ETB {rental.dailyRate}/day)
            </p>
          </div>
        </div>
        <Link href={`/rentals/${rental.id}`}>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 border-purple-300 text-purple-700 dark:text-purple-300 font-semibold">
            View Rental
          </Button>
        </Link>
      </div>
    );
  }

  // 3. Custom Order Context
  if (customOrderRef) {
    return (
      <div className="flex items-center justify-between border-b bg-amber-50/70 dark:bg-amber-950/30 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white font-bold text-xs shrink-0">
            CST
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-foreground">Custom Order Request</span>
              <Badge variant="outline" className="text-[10px] bg-background border-amber-200">
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
          <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 border-amber-300 text-amber-700 dark:text-amber-300 font-semibold">
            View Custom Details
          </Button>
        </Link>
      </div>
    );
  }

  // 4. Listing Context Banner
  if (listing) {
    const primaryImg = listing.images?.[0]?.url;
    const isAvailable = listing.status === 'active';
    const isRental = listing.availableForRent || !!listing.rentalPricePerDay;
    const isCustom = listing.customOrderAvailable || listing.supportsCustomDesign;

    return (
      <>
        <div className="flex items-center justify-between border-b px-4 py-2.5 bg-card/60">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {primaryImg ? (
              <img
                src={primaryImg}
                alt={listing.title}
                className="h-10 w-10 rounded-lg object-cover border shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 border border-primary/20">
                👗
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="truncate font-bold text-xs text-foreground">{listing.title}</h4>
                <Badge variant="outline" className="text-[9px] py-0 px-1.5 uppercase font-semibold">
                  {isRental ? 'Rental' : isCustom ? 'Custom' : 'Sale'}
                </Badge>
                {!isAvailable && (
                  <Badge variant="error" className="text-[9px] py-0 px-1">
                    Unavailable
                  </Badge>
                )}
              </div>
              <p className="text-[11px] font-bold text-primary">
                {listing.currency || 'ETB'} {listing.price ? Number(listing.price).toLocaleString() : 'Price on request'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContactModal(true)}
              className="h-7 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/5 flex items-center gap-1 px-2.5 rounded-lg"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

        {/* Contact Info Modal */}
        {showContactModal && (
          <ContactModal
            isOpen={showContactModal}
            onClose={() => setShowContactModal(false)}
            user={otherUser}
            listingTitle={listing.title}
          />
        )}
      </>
    );
  }

  return null;
}

function ContactModal({
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
  const email = user.email || 'user@marketplace.et';

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
          <h3 className="text-sm font-bold text-foreground">Contact Information</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground font-bold text-sm">✕</button>
        </div>

        <div className="py-4 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-extrabold text-xl ring-4 ring-primary/20">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full rounded-full object-cover" />
            ) : (
              user.displayName?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          <h4 className="text-base font-bold text-foreground">{user.displayName}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Contact regarding "{listingTitle}"</p>

          <div className="mt-4 space-y-2.5 text-left">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border/60">
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Phone</p>
                <p className="text-xs font-bold text-foreground truncate">{phone}</p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(phone, 'phone')}
                className="text-[11px] font-semibold text-primary hover:underline px-2 py-1"
              >
                {copiedField === 'phone' ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border/60">
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email</p>
                <p className="text-xs font-bold text-foreground truncate">{email}</p>
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

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={handleCall}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2 rounded-xl"
            >
              Call Phone
            </Button>
            <Button
              type="button"
              onClick={handleWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl"
            >
              WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
