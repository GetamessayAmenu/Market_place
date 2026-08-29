'use client';
import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Web Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex h-screen w-full flex-col items-center justify-center bg-background p-6 text-center font-sans">
        <div className="rounded-xl border bg-card p-8 shadow-sm max-w-md w-full">
          <h2 className="text-xl font-bold text-foreground mb-2">Application Error</h2>
          <p className="text-sm text-muted-foreground mb-6">
            An unexpected error occurred. Please click below to refresh the page.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}
