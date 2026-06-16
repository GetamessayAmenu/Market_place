import React, { forwardRef } from 'react';

import { cn } from '../lib/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'suffix' | 'size'> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 text-xs px-2.5',
  md: 'h-10 text-sm px-3',
  lg: 'h-12 text-base px-4',
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, success, helperText, prefix, suffix, id, size = 'md', ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-') ?? '';
    const errorId = inputId ? `${inputId}-error` : undefined;
    const helperId = inputId ? `${inputId}-helper` : undefined;
    const describedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 flex items-center text-muted-foreground">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'flex w-full rounded-md border border-input bg-background ring-offset-background',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-colors',
              sizeClasses[size],
              error && 'border-destructive focus-visible:ring-destructive',
              success && !error && 'border-success focus-visible:ring-success',
              prefix && 'pl-10',
              suffix && 'pr-10',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 flex items-center text-muted-foreground">
              {suffix}
            </div>
          )}
        </div>
        {error && errorId && (
          <p id={errorId} className="mt-1.5 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && helperId && (
          <p id={helperId} className="mt-1.5 text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
