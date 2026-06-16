import { Spinner, cn } from '@marketplace/ui';
import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type LoadingVariant = 'page' | 'section' | 'button' | 'skeleton';

export interface LoadingStateProps {
  variant?: LoadingVariant;
  message?: string;
  className?: string;
}

// ─── Loading Messages ─────────────────────────────────────────────────────────

const defaultMessages: Record<LoadingVariant, string> = {
  page: 'Loading beautiful fashions...',
  section: 'Loading...',
  button: 'Processing...',
  skeleton: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

function LoadingState({
  variant = 'section',
  message,
  className,
}: LoadingStateProps) {
  const displayMessage = message ?? defaultMessages[variant];

  // Page-level loading: full viewport centered spinner
  if (variant === 'page') {
    return (
      <div
        className={cn('flex min-h-[60vh] flex-col items-center justify-center gap-4', className)}
        role="status"
        aria-busy="true"
        aria-label="Loading page content"
      >
        <Spinner size="lg" className="text-brand-gold" />
        {displayMessage && (
          <p className="text-sm text-muted-foreground animate-pulse">{displayMessage}</p>
        )}
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  // Section-level loading: inline spinner
  if (variant === 'section') {
    return (
      <div
        className={cn('flex items-center justify-center gap-3 py-8', className)}
        role="status"
        aria-busy="true"
      >
        <Spinner size="sm" className="text-brand-gold" />
        {displayMessage && (
          <p className="text-sm text-muted-foreground">{displayMessage}</p>
        )}
      </div>
    );
  }

  // Button loading: just the spinner for inline button use
  if (variant === 'button') {
    return (
      <span className="inline-flex items-center gap-2" role="status" aria-busy="true">
        <Spinner size="sm" />
        {displayMessage && <span>{displayMessage}</span>}
      </span>
    );
  }

  // Skeleton placeholder wrapper
  return (
    <div
      className={cn('animate-pulse', className)}
      aria-busy="true"
      aria-hidden="true"
    >
      {/* Consumer renders skeleton content inside */}
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

function ErrorState({
  title = 'Something went wrong',
  message = 'We couldn\'t load this content. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)} role="alert">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// ─── Timeout State ────────────────────────────────────────────────────────────

export interface TimeoutStateProps {
  onRetry?: () => void;
  className?: string;
}

function TimeoutState({ onRetry, className }: TimeoutStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)} role="alert">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/10 text-warning">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-foreground">Taking longer than expected</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">The server seems to be busy. Please try again in a moment.</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export { LoadingState, ErrorState, TimeoutState };
