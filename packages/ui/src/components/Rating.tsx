"use client"
import { useState } from 'react';

import { cn } from '../lib/cn';

type RatingVariant = 'display' | 'input' | 'summary';

export interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  variant?: RatingVariant;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  showCount?: boolean;
  reviewCount?: number;
  disabled?: boolean;
  className?: string;
}

const starSizes = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

function StarIcon({ filled, half, className }: { filled: boolean; half?: boolean; className?: string }) {
  if (half) {
    return (
      <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
        <defs>
          <linearGradient id="halfGrad">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          fill="url(#halfGrad)"
          stroke="currentColor"
          strokeWidth="1"
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function Rating({
  value,
  onChange,
  variant = 'display',
  size = 'md',
  readOnly = false,
  showCount = false,
  reviewCount,
  disabled = false,
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const isInteractive = variant === 'input' && !readOnly && !disabled;

  const displayValue = isInteractive && hoverValue > 0 ? hoverValue : value;
  const roundedValue = Math.round(displayValue * 2) / 2;

  const stars = [1, 2, 3, 4, 5];

  const handleClick = (star: number) => {
    if (isInteractive && onChange) {
      onChange(star);
    }
  };

  const handleMouseEnter = (star: number) => {
    if (isInteractive) setHoverValue(star);
  };

  const handleMouseLeave = () => {
    if (isInteractive) setHoverValue(0);
  };

  // Summary variant: shows rating with count breakdown
  if (variant === 'summary') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center" aria-label={'Rating: ' + String(value) + ' out of 5 stars'}>
          {stars.map((star) => {
            const filled = star <= Math.floor(roundedValue);
            const half = !filled && star === Math.ceil(roundedValue) && roundedValue % 1 !== 0;
            return (
              <StarIcon
                key={star}
                filled={filled}
                half={half}
                className={cn(
                  starSizes[size],
                  filled || half ? 'text-brand-gold' : 'text-muted-foreground/30'
                )}
              />
            );
          })}
        </div>
        <span className="text-sm font-semibold text-foreground">{value.toFixed(1)}</span>
        {reviewCount !== undefined && (
          <span className="text-sm text-muted-foreground">({String(reviewCount)})</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      role={isInteractive ? 'radiogroup' : undefined}
      aria-label={isInteractive ? 'Rate from 1 to 5 stars' : 'Rating: ' + String(value) + ' out of 5 stars'}
    >
      {stars.map((star) => {
        const filled = star <= Math.floor(roundedValue);
        const half = !filled && star === Math.ceil(roundedValue) && roundedValue % 1 !== 0;

        return (
          <button
            key={star}
            type="button"
            disabled={!isInteractive}
            onClick={() => { handleClick(star); }}
            onMouseEnter={() => { handleMouseEnter(star); }}
            onMouseLeave={handleMouseLeave}
            className={cn(
              'transition-transform',
              isInteractive && 'cursor-pointer hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded',
              !isInteractive && 'cursor-default'
            )}
            aria-label={String(star) + ' star' + (star !== 1 ? 's' : '')}
            aria-checked={isInteractive ? star === value : undefined}
            role={isInteractive ? 'radio' : undefined}
          >
            <StarIcon
              filled={filled}
              half={half}
              className={cn(
                starSizes[size],
                filled || half ? 'text-brand-gold' : 'text-muted-foreground/30',
                isInteractive && hoverValue >= star && 'text-brand-gold/70'
              )}
            />
          </button>
        );
      })}

      {showCount && reviewCount !== undefined && (
        <span className="ml-1.5 text-xs text-muted-foreground">
          ({String(reviewCount)})
        </span>
      )}
    </div>
  );
}

export { Rating };
