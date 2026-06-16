"use client"
import React, { forwardRef, useState } from 'react';

import { cn } from '../lib/cn';

const sizeMap = {
  xs: { container: 'h-6 w-6', text: 'text-[9px]', badge: 'h-2.5 w-2.5', dot: 'h-2 w-2' },
  sm: { container: 'h-8 w-8', text: 'text-xs', badge: 'h-3 w-3', dot: 'h-2.5 w-2.5' },
  md: { container: 'h-10 w-10', text: 'text-sm', badge: 'h-3.5 w-3.5', dot: 'h-3 w-3' },
  lg: { container: 'h-14 w-14', text: 'text-base', badge: 'h-4 w-4', dot: 'h-3.5 w-3.5' },
  xl: { container: 'h-20 w-20', text: 'text-lg', badge: 'h-5 w-5', dot: 'h-4 w-4' },
};

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Show a gold verified badge */
  verified?: boolean;
  /** Online status indicator dot */
  online?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  }
  return (parts[0]?.slice(0, 2) ?? '').toUpperCase();
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'md', verified, online, ...props }, ref) => {
    const [imgError, setImgError] = useState(false);
    const showImage = src && !imgError;
    const initials = name ? getInitials(name) : '?';
    const sizeClasses = sizeMap[size];

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex flex-shrink-0', className)}
        {...props}
      >
        <div
          className={cn(
            'overflow-hidden rounded-full bg-muted flex items-center justify-center',
            sizeClasses.container
          )}
        >
          {showImage ? (
            <img
              src={src}
              alt={alt ?? name ?? 'Avatar'}
              className="h-full w-full object-cover"
              onError={() => { setImgError(true); }}
            />
          ) : (
            <span className={cn('font-medium text-muted-foreground uppercase', sizeClasses.text)}>
              {initials}
            </span>
          )}
        </div>

        {/* Verified badge — gold checkmark */}
        {verified && (
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-brand-gold text-white ring-2 ring-background',
              sizeClasses.badge
            )}
            aria-label="Verified"
            title="Verified"
          >
            <svg className="h-full w-full p-[1px]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </span>
        )}

        {/* Online status dot */}
        {online !== undefined && !verified && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full ring-2 ring-background',
              sizeClasses.dot,
              online ? 'bg-success' : 'bg-muted-foreground/40'
            )}
            aria-label={online ? 'Online' : 'Offline'}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
