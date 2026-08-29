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
    console.error('Global Admin Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-6 text-center font-sans">
        <div className="rounded-xl border bg-white p-8 shadow-sm max-w-md w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Portal Global Error</h2>
          <p className="text-sm text-gray-500 mb-6">
            An unhandled system error occurred. Please reload the application.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Refresh Page
          </button>
        </div>
      </body>
    </html>
  );
}
