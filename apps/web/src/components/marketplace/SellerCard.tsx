import { Avatar, Badge, cn, Tag } from '@marketplace/ui';
import Link from 'next/link';
import React from 'react';

export type SellerType = 'designer' | 'tailor' | 'boutique' | 'rental-shop';

export interface SellerCardProps {
  id: string;
  name: string;
  avatarUrl?: string | null;
  sellerType?: SellerType;
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
  location?: string;
  specialties?: string[];
  listingCount?: number;
  className?: string;
}

const sellerTypeLabels: Record<SellerType, string> = {
  designer: 'Designer',
  tailor: 'Tailor',
  boutique: 'Boutique',
  'rental-shop': 'Rental Shop',
};

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={cn('h-3.5 w-3.5', filled ? 'text-brand-gold fill-brand-gold' : 'text-muted-foreground/30')}
      viewBox="0 0 20 20"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default function SellerCard({
  id,
  name,
  avatarUrl,
  sellerType = 'designer',
  verified,
  rating,
  reviewCount,
  location,
  specialties,
  listingCount,
  className,
}: SellerCardProps) {
  return (
    <Link href={'/sellers/' + id} className="group block" aria-label={name + ' - ' + sellerTypeLabels[sellerType]}>
      <div
        className={cn(
          'flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm',
          'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
          className
        )}
      >
        <Avatar
          name={name}
          size="lg"
          {...(avatarUrl !== undefined && { src: avatarUrl })}
        />

        <div className="flex-1 min-w-0 space-y-1">
          {/* Name + verification */}
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-card-foreground truncate">{name}</h3>
            {verified && (
              <span className="flex-shrink-0 text-brand-gold" title="Verified seller">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>

          {/* Seller type + location */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-2xs">{sellerTypeLabels[sellerType]}</Badge>
            {location && <span>{location}</span>}
          </div>

          {/* Rating */}
          {rating !== undefined && (
            <div className="flex items-center gap-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon key={star} filled={star <= Math.round(rating)} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {rating.toFixed(1)}
                {reviewCount !== undefined && <span> ({String(reviewCount)})</span>}
              </span>
            </div>
          )}

          {/* Specialties */}
          {specialties && specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {specialties.slice(0, 3).map((s) => (
                <Tag key={s} size="sm" variant="outline">{s}</Tag>
              ))}
            </div>
          )}

          {/* Listing count */}
          {listingCount !== undefined && (
            <p className="text-xs text-muted-foreground">
              {String(listingCount)} listing{listingCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
