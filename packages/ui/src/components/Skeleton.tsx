import React from 'react';

import { cn } from '../lib/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  circle?: boolean;
  width?: string | number;
  height?: string | number;
}

function Skeleton({ className, circle, width, height, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted',
        circle ? 'rounded-full' : 'rounded-md',
        className
      )}
      style={{
        width: typeof width === 'number' ? String(width) + 'px' : width,
        height: typeof height === 'number' ? String(height) + 'px' : height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
