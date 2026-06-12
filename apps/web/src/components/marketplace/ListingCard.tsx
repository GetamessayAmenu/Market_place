'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, Badge } from '@marketplace/ui';

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  condition: string;
  imageUrl?: string;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
}

export function ListingCard({
  id,
  title,
  price,
  location,
  condition,
  imageUrl,
  isFavorite = false,
  onFavoriteToggle,
}: ListingCardProps) {
  return (
    <Card hover>
      <Link href={`/listings/${id}`}>
        <CardContent className="p-0">
          <div className="relative aspect-square bg-muted">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover rounded-t-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                onFavoriteToggle?.();
              }}
              className="absolute top-2 right-2 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                className={`h-5 w-5 ${isFavorite ? 'fill-destructive text-destructive' : 'text-foreground'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{title}</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-primary">${price.toLocaleString()}</span>
              <Badge variant="outline">{condition}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{location}</p>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
