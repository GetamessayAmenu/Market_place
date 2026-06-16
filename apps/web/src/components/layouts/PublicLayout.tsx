import React from 'react';

import BottomNav from '../navigation/BottomNav';
import Footer from '../navigation/Footer';
import Header from '../navigation/Header';

interface PublicLayoutProps {
  children: React.ReactNode;
  /** Hide footer (e.g., for embedded/iframe views) */
  hideFooter?: boolean;
  /** Full-bleed main area (no bottom padding for BottomNav offset) */
  fullBleed?: boolean;
}

export default function PublicLayout({ children, hideFooter, fullBleed }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Sticky Header ───────────────────────────────────── */}
      <Header />

      {/* ── Main Content ────────────────────────────────────── */}
      <main
        id="main-content"
        className={
          fullBleed
            ? 'flex-1'
            : 'flex-1 pb-20 md:pb-0' /* bottom padding for mobile BottomNav */
        }
      >
        {children}
      </main>

      {/* ── Footer (hidden on very small screens if BottomNav visible) ── */}
      {!hideFooter && <Footer />}

      {/* ── Mobile Bottom Navigation ────────────────────────── */}
      {!fullBleed && <BottomNav />}
    </div>
  );
}
