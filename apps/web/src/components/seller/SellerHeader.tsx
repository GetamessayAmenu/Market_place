"use client"
import { Button } from '@marketplace/ui';
import Link from 'next/link';
import React from 'react';
import useAuth from '../../hooks/useAuth';
import NotificationBell from '../navigation/NotificationBell';

export default function SellerHeader() {
  const user = useAuth((s) => s.user);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-wine text-white">
              <span className="font-display text-sm font-bold">H</span>
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">Habesha Market</span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications Bell */}
            <NotificationBell />

            {/* Help Center */}
            <Link href="/help">
              <Button variant="ghost" size="sm">
                Help
              </Button>
            </Link>

            {/* Profile */}
            {user && (
              <Link href="/dashboard/profile">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {user.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
