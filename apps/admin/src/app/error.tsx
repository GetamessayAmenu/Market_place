'use client';
import React, { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin App Error Boundary:', error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="rounded-xl bg-white p-8 shadow-sm border max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-6">
          An unexpected error occurred in the Admin Portal.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
