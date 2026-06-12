import React, { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

export interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

const FormControl = forwardRef<HTMLDivElement, FormControlProps>(
  ({ className, label, error, helperText, required, id, children, ...props }, ref) => {
    const controlId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {label && (
          <label htmlFor={controlId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        {children}
        {error && (
          <p className="mt-1.5 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormControl.displayName = 'FormControl';

export { FormControl };
