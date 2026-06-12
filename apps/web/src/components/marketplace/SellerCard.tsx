import { Avatar, Badge } from '@marketplace/ui';
import Link from 'next/link';
import React from 'react';

export interface SellerCardProps {
  id: string;
  name: string;
  avatarUrl?: string | null;
  verified?: boolean;
  listingCount?: number;
}

export default function SellerCard({ id, name, avatarUrl, verified, listingCount }: SellerCardProps) {
  return (
    <Link href={'/sellers/' + id}>
      <div className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
        <Avatar {...(avatarUrl !== undefined && { src: avatarUrl })} name={name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-card-foreground truncate">{name}</h3>
            {verified && <Badge variant="success">Verified</Badge>}
          </div>
          {listingCount !== undefined && (
            <p className="text-sm text-muted-foreground mt-1">
              {String(listingCount)} listing{listingCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
