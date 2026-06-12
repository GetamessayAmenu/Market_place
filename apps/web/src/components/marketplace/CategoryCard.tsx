import Link from 'next/link';
import React from 'react';

export interface CategoryCardProps {
  slug: string;
  name: string;
  imageUrl?: string | null;
  listingCount?: number;
}

export default function CategoryCard({ slug, name, imageUrl, listingCount }: CategoryCardProps) {
  return (
    <Link href={'/categories/' + slug}>
      <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
        <div className="aspect-[3/2] bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-semibold text-white">{name}</h3>
          {listingCount !== undefined && (
            <p className="text-sm text-white/80">
              {String(listingCount)} listing{listingCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
