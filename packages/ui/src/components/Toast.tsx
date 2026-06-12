import React, { forwardRef, useEffect, useState } from 'react';
import { cn } from '../lib/cn.js';
import { cva } from '../lib/cva.js';

const toastVariants = cva({
  base: 'relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all',
  variants: {
    variant: {
      info: 'border-info bg-background text-info-foreground',
      success: 'border-success bg-background text-success-foreground',
      warning: 'border-warning bg-background text-warning-foreground',
      error: 'border-destructive bg-background text-destructive-foreground',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose?: () => void;
}

const Toast = forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, duration = 5000, onClose, children, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          onClose?.();
        }, duration);
        return () => clearTimeout(timer);
      }
      return undefined;
    }, [duration, onClose]);

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        className={cn(toastVariants({ ...(variant !== undefined && { variant }) }), 'animate-in slide-in-from-right', className)}
        {...props}
      >
        <div className="flex-1">{children}</div>
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              onClose();
            }}
            className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 group-hover:opacity-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Toast.displayName = 'Toast';

export { Toast, toastVariants };
