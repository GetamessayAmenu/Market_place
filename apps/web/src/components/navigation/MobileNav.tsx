"use client"
import { Avatar, cn, Divider } from '@marketplace/ui';
import Link from 'next/link';
import React from 'react';

import useAuth from '../../hooks/useAuth';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const shopLinks = [
  { href: '/search', label: 'Shop All' },
  { href: '/search?type=buy', label: 'Buy Fashion' },
  { href: '/search?type=rent', label: 'Rent Fashion' },
  { href: '/search?type=custom', label: 'Custom Orders' },
  { href: '/designers', label: 'Designers' },
  { href: '/categories', label: 'Categories' },
];

const accountLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/saved', label: 'Saved Items' },
  { href: '/dashboard/messages', label: 'Messages' },
  { href: '/dashboard/notifications', label: 'Notifications' },
];

const settingsLinks = [
  { href: '/dashboard/profile', label: 'Profile' },
  { href: '/dashboard/settings', label: 'Settings' },
];

function NavLink({ href, label, onClose }: { href: string; label: string; onClose: () => void }) {
  return (
    <Link
      href={href}
      className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      onClick={onClose}
    >
      {label}
    </Link>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-4 pb-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

export default function MobileNav({ open, onClose }: MobileNavProps) {
  const user = useAuth((s) => s.user);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm md:hidden"
        style={{ zIndex: 'var(--z-overlay)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <nav
        className="fixed left-0 top-0 h-full w-72 bg-background shadow-xl md:hidden animate-slide-in-left overflow-y-auto"
        style={{ zIndex: 'var(--z-modal)' }}
        aria-label="Mobile navigation"
      >
        {/* Header with logo and close */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link
            href="/"
            className="text-lg font-display font-bold tracking-tight"
            onClick={onClose}
          >
            Habesha Market
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User profile section */}
        {user && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar
                name={user.displayName}
                size="md"
                {...(user.avatarUrl !== null && { src: user.avatarUrl })}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation sections */}
        <div className="p-3 space-y-1">
          <SectionHeader>Shop</SectionHeader>
          {shopLinks.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} onClose={onClose} />
          ))}

          <Divider className="my-2" />

          {user && (
            <>
              <SectionHeader>Account</SectionHeader>
              {accountLinks.map((link) => (
                <NavLink key={link.href} href={link.href} label={link.label} onClose={onClose} />
              ))}

              <Divider className="my-2" />

              <SectionHeader>Settings</SectionHeader>
              {settingsLinks.map((link) => (
                <NavLink key={link.href} href={link.href} label={link.label} onClose={onClose} />
              ))}
            </>
          )}

          {!user && (
            <>
              <Divider className="my-2" />
              <Link
                href="/login"
                className={cn(
                  'block rounded-md px-3 py-2.5 text-sm font-semibold text-center',
                  'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
                )}
                onClick={onClose}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="block rounded-md px-3 py-2.5 text-sm font-medium text-center text-foreground hover:bg-muted transition-colors"
                onClick={onClose}
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
