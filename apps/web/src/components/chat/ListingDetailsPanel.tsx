"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Avatar } from '@marketplace/ui';
import type { ChatConversation, ChatUser } from '../../lib/chatApi';

interface ListingDetailsPanelProps {
  conversation: ChatConversation;
  currentUserId: string;
  onOpenRentalInquiry?: () => void;
  onOpenCustomOrderInquiry?: () => void;
}

export default function ListingDetailsPanel({
  conversation,
  currentUserId,
  onOpenRentalInquiry,
  onOpenCustomOrderInquiry,
}: ListingDetailsPanelProps) {
  const { listing, seller, buyer, rental, customOrderRef } = conversation;

  const [showContactModal, setShowContactModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isBuyer = conversation.buyerId === currentUserId;
  const otherUser: ChatUser = isBuyer
    ? (seller && typeof seller === 'object' ? seller : { id: conversation.sellerId, displayName: 'Seller', avatarUrl: null })
    : (buyer && typeof buyer === 'object' ? buyer : { id: conversation.buyerId, displayName: 'Buyer', avatarUrl: null });

  const primaryImg = listing?.images?.[0]?.url;

  // Determine transaction type
  const isRental = !!rental || listing?.availableForRent || !!listing?.rentalPricePerDay;
  const isCustom = !!customOrderRef || listing?.customOrderAvailable || listing?.supportsCustomDesign;

  const phone = otherUser.phone || '+251 91 123 4567';
  const email = otherUser.email || 'user@marketplace.et';

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCall = () => {
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };

  const handleWhatsApp = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const text = encodeURIComponent(`Hi ${otherUser.displayName}, contacting regarding listing: ${listing?.title || 'item'}`);
    window.open(`https://wa.me/${cleanPhone || '251911234567'}?text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border/70 overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Listing Details</h3>
        <Badge variant="outline" className="text-[10px] font-semibold">
          {isRental ? 'RENTAL' : isCustom ? 'CUSTOM ORDER' : 'BUY & SELL'}
        </Badge>
      </div>

      {/* Listing Card */}
      {listing ? (
        <div className="rounded-xl border bg-card p-3 space-y-3 shadow-2xs">
          {primaryImg ? (
            <div className="aspect-square w-full rounded-lg overflow-hidden bg-muted relative">
              <img src={primaryImg} alt={listing.title} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="aspect-square w-full rounded-lg bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
              👗
            </div>
          )}

          <div>
            <h4 className="font-bold text-sm text-foreground line-clamp-2">{listing.title}</h4>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-extrabold text-primary">
                {listing.currency || 'ETB'} {listing.price ? Number(listing.price).toLocaleString() : 'Price on request'}
              </span>
              {listing.status && (
                <Badge
                  variant={listing.status === 'active' ? 'success' : 'secondary'}
                  className="text-[9px] capitalize"
                >
                  {listing.status}
                </Badge>
              )}
            </div>

            {/* Rental daily rate */}
            {isRental && listing.rentalPricePerDay && (
              <p className="mt-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                Rental Rate: ETB {Number(listing.rentalPricePerDay).toLocaleString()} / day
              </p>
            )}

            {/* Custom starting price */}
            {isCustom && listing.startingCustomPrice && (
              <p className="mt-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                Custom Starts at: ETB {Number(listing.startingCustomPrice).toLocaleString()}
              </p>
            )}
          </div>

          <Link href={`/listings/${listing.id}`} target="_blank" className="block">
            <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
              View Full Listing ↗
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border bg-muted/40 p-4 text-center text-xs text-muted-foreground">
          General Inquiry (No specific listing attached)
        </div>
      )}

      {/* Transaction Context Specifics */}
      {isRental && (
        <div className="rounded-xl border border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-900 p-3 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-purple-900 dark:text-purple-200 font-bold">
            <span>📅</span> Rental Information
          </div>
          {rental ? (
            <div className="space-y-1 text-[11px]">
              <p><span className="font-semibold">Order:</span> #{rental.orderNumber}</p>
              <p><span className="font-semibold">Status:</span> {rental.status}</p>
              <p><span className="font-semibold">Period:</span> {new Date(rental.startDate).toLocaleDateString()} – {new Date(rental.endDate).toLocaleDateString()}</p>
              <p><span className="font-semibold">Rate:</span> ETB {rental.dailyRate}/day</p>
            </div>
          ) : (
            <p className="text-[11px] text-purple-800 dark:text-purple-300">
              This listing is available for rental. You can inquire about custom rental availability dates.
            </p>
          )}

          {isBuyer && onOpenRentalInquiry && (
            <Button
              size="sm"
              onClick={onOpenRentalInquiry}
              className="w-full text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold h-7"
            >
              Inquire Dates
            </Button>
          )}
        </div>
      )}

      {isCustom && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900 p-3 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-bold">
            <span>✨</span> Custom Order Available
          </div>
          {customOrderRef ? (
            <div className="space-y-1 text-[11px]">
              <p><span className="font-semibold">Status:</span> {customOrderRef.status}</p>
              {customOrderRef.selectedFabric && <p><span className="font-semibold">Fabric:</span> {customOrderRef.selectedFabric}</p>}
              {customOrderRef.selectedColor && <p><span className="font-semibold">Color:</span> {customOrderRef.selectedColor}</p>}
              {customOrderRef.selectedSize && <p><span className="font-semibold">Size:</span> {customOrderRef.selectedSize}</p>}
              <Link href={`/custom-order/${customOrderRef.id}`} className="block pt-1">
                <span className="text-amber-700 dark:text-amber-300 underline font-semibold text-[11px]">View Custom Order Workflow →</span>
              </Link>
            </div>
          ) : (
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              The seller accepts custom tailors and personalized requests for this item.
            </p>
          )}

          {isBuyer && onOpenCustomOrderInquiry && (
            <Button
              size="sm"
              onClick={onOpenCustomOrderInquiry}
              className="w-full text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold h-7"
            >
              Send Custom Request
            </Button>
          )}
        </div>
      )}

      {/* Partner Info & Contact Options */}
      <div className="rounded-xl border bg-card p-3 space-y-3 shadow-2xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {isBuyer ? 'Seller Profile' : 'Buyer Profile'}
        </h4>

        <div className="flex items-center gap-3">
          <Avatar src={otherUser.avatarUrl} alt={otherUser.displayName} size="md" />
          <div className="min-w-0 flex-1">
            <h5 className="font-bold text-xs text-foreground truncate">{otherUser.displayName}</h5>
            <p className="text-[10px] text-muted-foreground">{isBuyer ? 'Marketplace Seller' : 'Interested Buyer'}</p>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowContactModal(true)}
            className="w-full text-xs font-bold text-primary border-primary/30 hover:bg-primary/5 flex items-center justify-center gap-1.5"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            Show Contact / Phone
          </Button>

          <Link href={`/sellers/${otherUser.id}`} target="_blank" className="block">
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground">
              View Profile Page
            </Button>
          </Link>
        </div>
      </div>

      {/* Safety Reminder */}
      <div className="rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1">
        <p className="font-bold text-foreground flex items-center gap-1">
          <span>🛡️</span> Safety Reminder
        </p>
        <p>Keep payments and communication within the platform for buyer & seller protection.</p>
      </div>

      {/* Contact Details Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border bg-background p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-sm font-bold text-foreground">Contact Details</h3>
              <button onClick={() => setShowContactModal(false)} className="text-muted-foreground hover:text-foreground font-bold text-sm">✕</button>
            </div>

            <div className="py-4 text-center space-y-3">
              <Avatar src={otherUser.avatarUrl} alt={otherUser.displayName} size="lg" className="mx-auto ring-4 ring-primary/20" />
              <div>
                <h4 className="text-base font-bold text-foreground">{otherUser.displayName}</h4>
                <p className="text-xs text-muted-foreground">Marketplace Member</p>
              </div>

              <div className="space-y-2 text-left pt-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border">
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Phone Number</p>
                    <p className="text-xs font-bold text-foreground truncate">{phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(phone, 'phone')}
                    className="text-[11px] font-semibold text-primary hover:underline px-2"
                  >
                    {copiedField === 'phone' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border">
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Email</p>
                    <p className="text-xs font-bold text-foreground truncate">{email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(email, 'email')}
                    className="text-[11px] font-semibold text-primary hover:underline px-2"
                  >
                    {copiedField === 'email' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  onClick={handleCall}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2 flex items-center justify-center gap-1 rounded-xl"
                >
                  Call Now
                </Button>
                <Button
                  onClick={handleWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 flex items-center justify-center gap-1 rounded-xl"
                >
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
