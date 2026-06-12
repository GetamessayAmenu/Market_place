import React, { forwardRef } from 'react';
import { cn } from '../lib/cn.js';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  indeterminate?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, indeterminate, id, ...props }, ref) => {
    const checkboxRef = React.useRef<HTMLInputElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLInputElement>) || checkboxRef;

    React.useEffect(() => {
      if (combinedRef?.current) {
        combinedRef.current.indeterminate = indeterminate ?? false;
      }
    }, [indeterminate, combinedRef]);

    const checkboxId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={combinedRef}
            id={checkboxId}
            type="checkbox"
            className={cn(
              'h-4 w-4 rounded border border-input bg-background text-primary ring-offset-background',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'accent-primary',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${checkboxId}-error` : undefined}
            {...props}
          />
        </div>
        {label && (
          <div className="ml-3">
            <label htmlFor={checkboxId} className="text-sm font-medium text-foreground cursor-pointer">
              {label}
            </label>
            {error && (
              <p id={`${checkboxId}-error`} className="mt-1 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
