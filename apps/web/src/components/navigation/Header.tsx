'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@marketplace/ui';
import { UserMenu } from './UserMenu';
import { MobileNav } from './MobileNav';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-primary">Marketplace</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/search" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Browse
              </Link>
              <Link href="/categories" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Categories
              </Link>
              <Link href="/sellers" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Sellers
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
            <UserMenu />
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="md:hidden p-2 rounded-md hover:bg-accent"
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 rounded-md hover:bg-accent"
              aria-label="Open mobile navigation"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </header>
  );
}
