"use client"

import { cn } from '@marketplace/ui';
import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface ImageGalleryImage {
  url: string;
  alt?: string;
}

export interface ImageGalleryProps {
  images: ImageGalleryImage[];
  className?: string;
  listingTitle?: string;
}

export default function ImageGallery({ images, className, listingTitle }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const activeImage = images[activeIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
      if (e.key === '+' || e.key === '=') setZoomLevel(prev => Math.min(prev + 0.25, 3));
      if (e.key === '-' || e.key === '_') setZoomLevel(prev => Math.max(prev - 0.25, 1));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  const navigateLightbox = useCallback((direction: number) => {
    setLightboxIndex(prev => {
      const newIndex = prev + direction;
      if (newIndex < 0) return images.length - 1;
      if (newIndex >= images.length) return 0;
      return newIndex;
    });
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  }, [images.length]);

  const handleThumbnailClick = (index: number) => {
    setActiveIndex(index);
  };

  const handleMainImageClick = () => {
    setLightboxIndex(activeIndex);
    setIsLightboxOpen(true);
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0]?.clientX;
    if (touchEnd === undefined) return;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeIndex < images.length - 1) {
        setActiveIndex(prev => prev + 1);
      } else if (diff < 0 && activeIndex > 0) {
        setActiveIndex(prev => prev - 1);
      }
    }
    setTouchStart(null);
  };

  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    if (zoomLevel > 1) {
      setIsDragging(true);
      dragStartRef.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
    } else {
      setTouchStart(touch.clientX);
    }
  };

  const handleLightboxTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    if (isDragging && zoomLevel > 1) {
      setPan({
        x: touch.clientX - dragStartRef.current.x,
        y: touch.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleLightboxTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    if (zoomLevel === 1 && touchStart !== null) {
      const touchEnd = e.changedTouches[0]?.clientX;
      if (touchEnd === undefined) return;
      const diff = touchStart - touchEnd;
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) navigateLightbox(1);
        else navigateLightbox(-1);
      }
    }
    setTouchStart(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!isLightboxOpen) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    setZoomLevel(prev => {
      const newZoom = prev + delta;
      if (newZoom < 1) {
        setPan({ x: 0, y: 0 });
        return 1;
      }
      if (newZoom > 3) return 3;
      return newZoom;
    });
  };

  const handleShare = async () => {
    if (navigator.share && listingTitle) {
      try {
        await navigator.share({
          title: listingTitle,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    }
  };

  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeThumb = thumbnailRefs.current[activeIndex];
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeIndex]);

  if (images.length === 0) {
    return (
      <div className={cn('aspect-[4/3] rounded-xl bg-muted flex items-center justify-center border', className)}>
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn('space-y-3 w-full', className)}>
        {/* Main image container */}
        <div 
          ref={containerRef}
          className="relative group w-full"
        >
          {/* Main image */}
          <div 
            className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted/40 border shadow-sm cursor-zoom-in flex items-center justify-center"
            onClick={handleMainImageClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {activeImage && (
              <img
                src={activeImage.url}
                alt={activeImage.alt ?? 'Product image'}
                className="h-full w-full object-contain transition-all duration-200"
              />
            )}

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute top-3 left-3 bg-black/65 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm pointer-events-none">
                {activeIndex + 1} / {images.length}
              </div>
            )}

            {/* Navigation arrows - desktop */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActiveIndex(prev => prev > 0 ? prev - 1 : images.length - 1); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/85 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hidden md:block"
                  aria-label="Previous image"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActiveIndex(prev => prev < images.length - 1 ? prev + 1 : 0); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/85 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hidden md:block"
                  aria-label="Next image"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Action buttons */}
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleShare}
                className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-transform hover:scale-105"
                aria-label="Share"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>

            {/* Swipe indicator for mobile */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm md:hidden pointer-events-none">
                Swipe to navigate
              </div>
            )}
          </div>
        </div>

        {/* Horizontal Thumbnails Strip Below Main Photo */}
        {images.length > 1 && (
          <div className="w-full">
            <div className="flex items-center gap-2.5 overflow-x-auto py-1 px-0.5 scrollbar-thin scrollbar-thumb-muted-foreground/30 scroll-smooth snap-x snap-mandatory">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  ref={(el) => { thumbnailRefs.current[idx] = el; }}
                  type="button"
                  onClick={() => handleThumbnailClick(idx)}
                  className={cn(
                    'relative flex-shrink-0 h-20 w-20 md:h-24 md:w-24 rounded-lg overflow-hidden border-2 transition-all duration-200 snap-start cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    idx === activeIndex
                      ? 'border-primary ring-2 ring-primary/20 scale-[1.02] shadow-sm opacity-100'
                      : 'border-border/60 hover:border-primary/50 opacity-75 hover:opacity-100 hover:scale-[1.01]'
                  )}
                  aria-label={`View product photo ${idx + 1} of ${images.length}`}
                >
                  <img
                    src={img.url}
                    alt={img.alt ?? `Thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onWheel={handleWheel}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => { setIsLightboxOpen(false); setZoomLevel(1); setPan({ x: 0, y: 0 }); }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2"
            aria-label="Close lightbox"
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image counter in lightbox */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 bg-white/20 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
              {lightboxIndex + 1} / {images.length}
            </div>
          )}

          {/* Navigation arrows in lightbox */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => navigateLightbox(-1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-3"
                aria-label="Previous image"
              >
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => navigateLightbox(1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-3"
                aria-label="Next image"
              >
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white/20 rounded-full p-2 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 1))}
              disabled={zoomLevel <= 1}
              className="text-white hover:text-gray-300 disabled:opacity-50 p-2"
              aria-label="Zoom out"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-white text-sm px-3 py-2">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
              disabled={zoomLevel >= 3}
              className="text-white hover:text-gray-300 disabled:opacity-50 p-2"
              aria-label="Zoom in"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => { setZoomLevel(1); setPan({ x: 0, y: 0 }); }}
              className="text-white hover:text-gray-300 p-2"
              aria-label="Reset zoom"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Image in lightbox */}
          <div 
            className="relative max-w-full max-h-full overflow-hidden"
            onTouchStart={handleLightboxTouchStart}
            onTouchMove={handleLightboxTouchMove}
            onTouchEnd={handleLightboxTouchEnd}
            style={{ cursor: zoomLevel > 1 ? 'grab' : 'default' }}
          >
            <img
              src={images[lightboxIndex]?.url ?? ''}
              alt={images[lightboxIndex]?.alt ?? 'Lightbox image'}
              className="max-w-full max-h-full object-contain transition-transform"
              style={{
                transform: `scale(${zoomLevel}) translate(${pan.x / zoomLevel}px, ${pan.y / zoomLevel}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
              draggable={false}
            />
          </div>
        </div>
      )}
    </>
  );
}
