"use client"
import Link from 'next/link';
import React from 'react';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const navLinks = [
  { href: '/search', label: 'Browse' },
  { href: '/categories', label: 'Categories' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/saved', label: 'Saved' },
  { href: '/dashboard/messages', label: 'Messages' },
  { href: '/dashboard/notifications', label: 'Notifications' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export default function MobileNav({ open, onClose }: MobileNavProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} aria-hidden="true" />
      <nav
        className="fixed left-0 top-0 z-50 h-full w-72 bg-background shadow-xl md:hidden animate-slide-in-left overflow-y-auto"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <Link href="/" className="font-bold text-lg" onClick={onClose}>
            Marketplace
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 hover:bg-accent"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              onClick={onClose}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
