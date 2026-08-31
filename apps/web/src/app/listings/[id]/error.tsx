'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function ListingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Listing page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-6 text-center">
      <div className="rounded-xl border border-destructive/20 bg-card p-8 shadow-sm max-w-md w-full">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Unable to load item</h2>
        <p className="text-sm text-muted-foreground mb-6">
          This listing may be temporarily unavailable or has been removed.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/search"
            className="w-full rounded-lg border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors block text-center"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
