import React, { forwardRef } from 'react';

import { cn } from '../lib/cn';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
}

const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ className, orientation = 'horizontal', label, ...props }, ref) => {
    if (orientation === 'vertical') {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="vertical"
          className={cn('h-full w-px bg-border', className)}
          {...props}
        />
      );
    }

    if (label) {
      return (
        <div
          ref={ref}
          role="separator"
          aria-label={label}
          className={cn('flex items-center gap-3', className)}
          {...props}
        >
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{label}</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="separator"
        className={cn('h-px w-full bg-border', className)}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';

export { Divider };
