"use client"
import { Button } from '@marketplace/ui';
import Link from 'next/link';
import React from 'react';
import useAuth from '../../hooks/useAuth';

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
            <button
              type="button"
              className="relative rounded-lg p-2 hover:bg-muted transition-colors"
              aria-label="Notifications"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
            </button>

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
