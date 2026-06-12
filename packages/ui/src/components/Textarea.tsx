import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn.js';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  autoResize?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, autoResize, showCharacterCount, maxLength, id, value, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [characterCount, setCharacterCount] = useState(0);
    const combinedRef = (ref as React.RefObject<HTMLTextAreaElement>) || textareaRef;

    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    useEffect(() => {
      if (showCharacterCount && value !== undefined) {
        setCharacterCount(String(value).length);
      }
    }, [value, showCharacterCount]);

    useEffect(() => {
      if (autoResize && combinedRef?.current) {
        combinedRef.current.style.height = 'auto';
        combinedRef.current.style.height = `${combinedRef.current.scrollHeight}px`;
      }
    }, [value, autoResize, combinedRef]);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={combinedRef}
          id={textareaId}
          maxLength={maxLength}
          value={value}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'resize-y',
            error && 'border-destructive focus-visible:ring-destructive',
            autoResize && 'resize-none overflow-hidden',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          {...props}
        />
        <div className="flex items-center justify-between mt-1.5">
          {error && (
            <p id={`${textareaId}-error`} className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {helperText && !error && (
            <p id={`${textareaId}-helper`} className="text-sm text-muted-foreground">
              {helperText}
            </p>
          )}
          {showCharacterCount && maxLength && (
            <span className="text-xs text-muted-foreground ml-auto">
              {characterCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
