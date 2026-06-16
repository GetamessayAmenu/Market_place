import React, { forwardRef } from 'react';

import { cn } from '../lib/cn';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 text-xs px-2',
  md: 'h-10 text-sm px-3',
  lg: 'h-12 text-base px-4',
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, success, helperText, options, placeholder, size = 'md', id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-') ?? '';

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full rounded-md border border-input bg-background ring-offset-background appearance-none transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            success && !error && 'border-success focus-visible:ring-success',
            sizeClasses[size],
            className
          )}
          aria-invalid={!!error}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1.5 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
