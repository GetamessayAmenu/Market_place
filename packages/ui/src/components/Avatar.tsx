import React, { forwardRef } from 'react';
import { cn } from '../lib/cn.js';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(({ className, src, alt, initials, size = 'md', ...props }, ref) => {
  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      <div
        ref={ref}
        className={cn('relative flex shrink-0 overflow-hidden rounded-full bg-muted', sizeClass, className)}
        {...props}
      >
        <img src={src} alt={alt ?? 'Avatar'} className="aspect-square h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-foreground',
        sizeClass,
        className
      )}
      {...props}
    >
      {initials}
    </div>
  );
});

Avatar.displayName = 'Avatar';

export { Avatar };
