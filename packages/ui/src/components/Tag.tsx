import React, { forwardRef } from 'react';

import { cn } from '../lib/cn';
import { cva } from '../lib/cva';

const tagVariants = cva({
  base: 'inline-flex items-center gap-1 rounded-full text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  variants: {
    variant: {
      default: 'bg-secondary text-secondary-foreground',
      buy: 'bg-action-buy/10 text-action-buy',
      rent: 'bg-action-rent/10 text-action-rent',
      custom: 'bg-action-custom/10 text-action-custom',
      outline: 'border border-input text-foreground',
    },
    size: {
      sm: 'px-2 py-0.5 text-2xs',
      md: 'px-2.5 py-1 text-xs',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'buy' | 'rent' | 'custom' | 'outline';
  size?: 'sm' | 'md';
  removable?: boolean;
  onRemove?: () => void;
}

const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant, size, removable, onRemove, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(tagVariants({ ...(variant !== undefined && { variant }), ...(size !== undefined && { size }), ...(className !== undefined && { className }) }))}
      {...props}
    >
      {children}
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className={cn(
            'ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full',
            'hover:bg-foreground/10 transition-colors',
            'focus:outline-none focus:ring-1 focus:ring-ring'
          )}
          aria-label="Remove tag"
        >
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
);

Tag.displayName = 'Tag';

export { Tag, tagVariants };
