"use client"
import { cn } from '@marketplace/ui';
import React, { useState } from 'react';

export interface ImageGalleryImage {
  url: string;
  alt?: string;
}

export interface ImageGalleryProps {
  images: ImageGalleryImage[];
  className?: string;
}

export default function ImageGallery({ images, className }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  if (images.length === 0) {
    return (
      <div className={cn('aspect-[4/3] rounded-lg bg-muted flex items-center justify-center', className)}>
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        {activeImage && (
          <img
            src={activeImage.url}
            alt={activeImage.alt ?? 'Listing image'}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.url}
              type="button"
              onClick={() => { setActiveIndex(idx); }}
              className={cn(
                'flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 transition-colors',
                idx === activeIndex ? 'border-primary' : 'border-transparent hover:border-border'
              )}
              aria-label={'View image ' + String(idx + 1)}
            >
              <img
                src={img.url}
                alt={img.alt ?? 'Thumbnail ' + String(idx + 1)}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
