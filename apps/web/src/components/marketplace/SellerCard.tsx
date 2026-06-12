'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar, Badge, Card, CardContent } from '@marketplace/ui';

interface SellerCardProps {
  id: string;
  name: string;
  rating?: number;
  reviewCount?: number;
  listingCount: number;
  isVerified?: boolean;
  avatarUrl?: string;
}

export function SellerCard({
  id,
  name,
  rating,
  reviewCount,
  listingCount,
  isVerified = false,
  avatarUrl,
}: SellerCardProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link href={`/sellers/${id}`}>
      <Card hover>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar initials={initials} {...(avatarUrl !== undefined && { src: avatarUrl })} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{name}</h3>
                {isVerified && (
                  <Badge variant="success" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
              {rating && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                  <svg className="h-4 w-4 fill-yellow-400 text-yellow-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{rating.toFixed(1)}</span>
                  {reviewCount && <span>({reviewCount} reviews)</span>}
                </div>
              )}
              <p className="text-sm text-muted-foreground">{listingCount} listings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
