'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@marketplace/ui';

interface CategoryCardProps {
  slug: string;
  name: string;
  listingCount: number;
  icon?: string;
  imageUrl?: string;
}

export function CategoryCard({ slug, name, listingCount, icon, imageUrl }: CategoryCardProps) {
  return (
    <Link href={`/categories/${slug}`}>
      <Card hover>
        <CardContent className="p-6 text-center">
          {icon && <div className="text-4xl mb-3">{icon}</div>}
          {imageUrl && (
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted overflow-hidden">
              <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
            </div>
          )}
          <h3 className="font-semibold text-lg mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground">{listingCount} listings</p>
        </CardContent>
      </Card>
    </Link>
  );
}
