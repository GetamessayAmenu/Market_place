import React from 'react';

import type { AuthUser } from '../../hooks/useAuth';
import Header from '../navigation/Header';
import Sidebar from '../navigation/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: AuthUser | null;
  /** Suppress the welcome banner */
  hideWelcome?: boolean;
  /** Suppress the header */
  hideHeader?: boolean;
}

export default function DashboardLayout({ children, user, hideWelcome, hideHeader }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Sticky Header ───────────────────────────────────── */}
      {!hideHeader && <Header />}

      {/* ── Sidebar + Main Content ──────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: hidden on mobile/tablet, visible on lg+ */}
        <Sidebar />

        {/* Main scrollable area */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto pb-20 lg:pb-0"
        >
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {/* Welcome banner */}
            {user && !hideWelcome && (
              <div className="mb-6">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                  Welcome, {user.displayName}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your account, orders, and listings.
                </p>
              </div>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
