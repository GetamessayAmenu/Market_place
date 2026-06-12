"use client"
import React, { forwardRef, useState } from 'react';

import { cn } from '../lib/cn';
import { cva } from '../lib/cva';

const alertVariants = cva({
  base: 'relative w-full rounded-lg border p-4',
  variants: {
    variant: {
      info: 'bg-info/10 border-info/30 text-info',
      success: 'bg-success/10 border-success/30 text-success',
      warning: 'bg-warning/10 border-warning/30 text-warning',
      error: 'bg-destructive/10 border-destructive/30 text-destructive',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, title, dismissible, onDismiss, children, ...props }, ref) => {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const handleDismiss = () => {
      setDismissed(true);
      onDismiss?.();
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ ...(variant !== undefined && { variant }), ...(className !== undefined && { className }) }))}
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            {title && <h5 className="font-semibold mb-1">{title}</h5>}
            <div className="text-sm">{children}</div>
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center justify-center rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss alert"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { Alert, alertVariants };
