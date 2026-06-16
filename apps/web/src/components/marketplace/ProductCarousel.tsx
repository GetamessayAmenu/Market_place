"use client"
import { cn } from '@marketplace/ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface ProductCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  variant?: 'standard' | 'featured';
}

export default function ProductCarousel({
  title,
  subtitle,
  variant = 'standard',
  children,
  className,
  ...props
}: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      observer.disconnect();
    };
  }, [checkScroll, children]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const cardWidth = variant === 'featured' ? 'min-w-[280px] fashion-md:min-w-[320px]' : 'min-w-[200px] fashion-md:min-w-[240px]';

  return (
    <div className={cn('relative', className)} {...props}>
      {/* Header */}
      {(title !== undefined || subtitle !== undefined) && (
        <div className="flex items-end justify-between mb-4 px-4 sm:px-0">
          <div>
            {title && <h2 className="text-display-sm font-display font-semibold">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>

          {/* Desktop arrows */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => { scroll('left'); }}
              className={cn(
                'rounded-full border p-2 transition-all',
                canScrollLeft
                  ? 'border-border text-foreground hover:bg-muted hover:shadow-sm'
                  : 'border-transparent text-muted-foreground/30 cursor-default'
              )}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => { scroll('right'); }}
              className={cn(
                'rounded-full border p-2 transition-all',
                canScrollRight
                  ? 'border-border text-foreground hover:bg-muted hover:shadow-sm'
                  : 'border-transparent text-muted-foreground/30 cursor-default'
              )}
              disabled={!canScrollRight}
              aria-label="Scroll right"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className={cn(
          'flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 px-4 sm:px-0',
          'scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        )}
        role="region"
        aria-roledescription="carousel"
        aria-label={title ?? 'Product carousel'}
      >
        {React.Children.map(children, (child, index) => (
          <div
            className={cn('flex-shrink-0 snap-start', cardWidth)}
            role="group"
            aria-roledescription="slide"
            aria-label={'Slide ' + String(index + 1)}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
