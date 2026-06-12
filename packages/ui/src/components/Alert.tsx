import React, { forwardRef } from 'react';
import { cn } from '../lib/cn.js';
import { cva } from '../lib/cva.js';

const alertVariants = cva({
  base: 'relative w-full rounded-lg border p-4',
  variants: {
    variant: {
      info: 'border-info bg-info/10 text-info-foreground [&>svg]:text-info',
      success: 'border-success bg-success/10 text-success-foreground [&>svg]:text-success',
      warning: 'border-warning bg-warning/10 text-warning-foreground [&>svg]:text-warning',
      error: 'border-destructive bg-destructive/10 text-destructive-foreground [&>svg]:text-destructive',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, dismissible, onDismiss, icon, children, ...props }, ref) => {
    const defaultIcons = {
      info: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
      success: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      warning: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      error: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
    };

    return (
      <div ref={ref} className={cn(alertVariants({ ...(variant !== undefined && { variant }) }), className)} role="alert" {...props}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{icon ?? defaultIcons[variant ?? 'info']}</div>
          <div className="flex-1">{children}</div>
          {dismissible && (
            <button
              type="button"
              onClick={onDismiss}
              className="flex-shrink-0 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
