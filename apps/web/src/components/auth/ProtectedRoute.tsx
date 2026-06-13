"use client"
import { Spinner } from '@marketplace/ui';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

import useAuth from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Client-side auth guard. Wraps protected content and redirects
 * unauthenticated users to /login. Shows a loading spinner while
 * the auth state is being resolved.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = useAuth((s) => s.user);
  const isLoading = useAuth((s) => s.isLoading);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
