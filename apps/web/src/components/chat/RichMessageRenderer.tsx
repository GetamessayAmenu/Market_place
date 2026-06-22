import { Badge, cn } from '@marketplace/ui';
import React from 'react';

import type { RichMessage } from '../../lib/richMessage';

// ─── Props ───────────────────────────────────────────────────────────────────

interface RichMessageRendererProps {
  message: RichMessage;
  isOwn: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RichMessageRenderer({ message, isOwn }: RichMessageRendererProps) {
  const cardCls = cn(
    'rounded-lg border p-3 text-xs',
    isOwn ? 'border-primary-foreground/20' : 'border-border bg-background',
  );

  switch (message.type) {
    case 'listing_ref':
      return (
        <div className="space-y-2">
          {message.body && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
          )}
          <a
            href={`/listings/${message.listingRef?.slug ?? message.listingRef?.id ?? ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(cardCls, 'flex gap-3 transition-colors hover:bg-muted/50')}
          >
            {message.listingRef?.imageUrl && (
              <img
                src={message.listingRef.imageUrl}
                alt={message.listingRef.title}
                className="h-16 w-16 shrink-0 rounded-md object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{message.listingRef?.title ?? 'Listing'}</p>
              {message.listingRef?.price != null && (
                <p className="mt-0.5 font-semibold text-brand-green">
                  ETB {message.listingRef.price.toLocaleString()}
                </p>
              )}
              <p className="mt-0.5 text-muted-foreground">View listing &rarr;</p>
            </div>
          </a>
        </div>
      );

    case 'rental_quote':
      return (
        <div className="space-y-2">
          {message.body && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
          )}
          {message.quoteData && (
            <div className={cardCls}>
              <div className="mb-2 flex items-center gap-1.5">
                <Badge variant="rent">Rental Quote</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price / day</span>
                  <span className="font-medium">ETB {message.quoteData.pricePerDay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{String(message.quoteData.durationDays)} day{message.quoteData.durationDays !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposit</span>
                  <span className="font-medium">ETB {message.quoteData.deposit.toLocaleString()}</span>
                </div>
                <div className="mt-1.5 flex justify-between border-t pt-1.5 font-semibold">
                  <span>Total</span>
                  <span className="text-brand-gold">ETB {message.quoteData.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      );

    case 'custom_order':
      return (
        <div className="space-y-2">
          {message.body && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
          )}
          {message.orderData && (
            <div className={cardCls}>
              <div className="mb-2 flex items-center gap-1.5">
                <Badge variant="custom">Custom Order</Badge>
                {message.orderData.status && (
                  <Badge variant="outline">{message.orderData.status}</Badge>
                )}
              </div>
              <dl className="space-y-1">
                {message.orderData.fabricChoice && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Fabric</dt>
                    <dd className="font-medium">{message.orderData.fabricChoice}</dd>
                  </div>
                )}
                {message.orderData.colorChoice && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Color</dt>
                    <dd className="font-medium">{message.orderData.colorChoice}</dd>
                  </div>
                )}
                {message.orderData.measurements && Object.keys(message.orderData.measurements).length > 0 && (
                  <div>
                    <dt className="text-muted-foreground">Measurements</dt>
                    {Object.entries(message.orderData.measurements).map(([key, val]) => (
                      <dd key={key} className="flex justify-between">
                        <span className="capitalize">{key}</span>
                        <span className="font-medium">{val}</span>
                      </dd>
                    ))}
                  </div>
                )}
                {message.orderData.designNotes && (
                  <div className="mt-1.5 border-t pt-1.5">
                    <dt className="text-muted-foreground">Notes</dt>
                    <dd className="text-foreground">{message.orderData.designNotes}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      );

    default:
      return (
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.body}
        </p>
      );
  }
}
