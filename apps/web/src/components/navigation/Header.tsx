"use client"
import { cn } from '@marketplace/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import MobileNav from './MobileNav';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';

const navLinks = [
  { href: '/search', label: 'Shop' },
  { href: '/search?type=rent', label: 'Rent' },
  { href: '/search?type=custom', label: 'Custom Order' },
  { href: '/designers', label: 'Designers' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <>
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to content
      </a>

      <header
        className={cn(
          'sticky top-0 w-full transition-all duration-300',
          isHome && !scrolled
            ? 'bg-transparent border-b border-transparent'
            : 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b shadow-xs'
        )}
        style={{ zIndex: 'var(--z-sticky)' }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-display font-bold tracking-tight text-foreground"
          >
            <span className="hidden sm:inline-block">Habesha Market</span>
            <span className="sm:hidden font-display">HM</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'font-medium transition-colors hover:text-foreground',
                  pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href.split('?')[0] ?? link.href))
                    ? 'text-foreground'
                    : 'text-foreground/60'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <NotificationBell />

            <div className="hidden md:block">
              <UserMenu />
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-muted transition-colors"
              onClick={() => { setMobileOpen(!mobileOpen); }}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <MobileNav open={mobileOpen} onClose={() => { setMobileOpen(false); }} />
      </header>
    </>
  );
}
