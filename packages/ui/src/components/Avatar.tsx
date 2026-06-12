"use client"
import React, { forwardRef, useState } from 'react';

import { cn } from '../lib/cn';

const sizeMap = {
  sm: { container: 'h-8 w-8', text: 'text-xs' },
  md: { container: 'h-10 w-10', text: 'text-sm' },
  lg: { container: 'h-14 w-14', text: 'text-base' },
  xl: { container: 'h-20 w-20', text: 'text-lg' },
};

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  }
  return (parts[0]?.slice(0, 2) ?? '').toUpperCase();
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'md', ...props }, ref) => {
    const [imgError, setImgError] = useState(false);
    const showImage = src && !imgError;
    const initials = name ? getInitials(name) : '?';
    const sizeClasses = sizeMap[size];

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0',
          sizeClasses.container,
          className
        )}
        {...props}
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
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
