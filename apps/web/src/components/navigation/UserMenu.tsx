"use client"
import { Avatar, Dropdown } from '@marketplace/ui';
import Link from 'next/link';
import React from 'react';

import useAuth from '../../hooks/useAuth';
import { logout } from '../../lib/authClient';

// ─── Menu items ───────────────────────────────────────────────────────────────

const buyerItems = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'My Profile', value: 'profile' },
  { label: 'My Orders', value: 'orders' },
  { label: 'My Rentals', value: 'rentals' },
  { label: 'Custom Orders', value: 'custom-orders' },
  { label: 'Saved Listings', value: 'saved' },
  { label: 'Messages', value: 'messages' },
  { label: 'Account Settings', value: 'account' },
  { label: 'Notifications', value: 'notifications' },
  { label: 'Sign Out', value: 'logout', destructive: true },
];

const sellerItems = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'My Shop', value: 'seller' },
  { label: 'My Listings', value: 'my-listings' },
  { label: 'Orders', value: 'seller-orders' },
  { label: 'Payouts', value: 'payouts' },
  { label: 'Messages', value: 'messages' },
  { label: 'Account Settings', value: 'account' },
  { label: 'Sign Out', value: 'logout', destructive: true },
];

const guestItems = [
  { label: 'Sign In', value: 'login' },
  { label: 'Sign Up', value: 'register' },
];

const routeMap: Record<string, string> = {
  dashboard: '/dashboard',
  profile: '/dashboard/profile',
  orders: '/dashboard/orders',
  rentals: '/dashboard/rentals',
  'custom-orders': '/dashboard/custom-orders',
  saved: '/dashboard/saved',
  messages: '/dashboard/messages',
  account: '/dashboard/settings/account',
  notifications: '/dashboard/settings/notifications',
  seller: '/dashboard/seller',
  'my-listings': '/dashboard/seller/listings',
  'seller-orders': '/dashboard/seller/orders',
  payouts: '/dashboard/seller/payouts',
  login: '/login',
  register: '/register',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserMenu() {
  const user = useAuth((s) => s.user);
  const clear = useAuth((s) => s.clear);

  const handleSelect = async (value: string) => {
    if (value === 'logout') {
      try {
        await logout();
      } catch {
        // Continue with local cleanup even if API call fails
      }
      clear();
      window.location.href = '/';
      return;
    }
    const route = routeMap[value];
    if (route) {
      window.location.href = route;
    }
  };

  const isSeller = user?.role === 'seller' || user?.role === 'admin';
  const items = user ? (isSeller ? sellerItems : buyerItems) : guestItems;

  return (
    <Dropdown
      trigger={
        user ? (
          <button
            className="flex items-center gap-2 rounded-full transition-all hover:ring-2 hover:ring-brand-gold/40"
            aria-label="User menu"
          >
            <Avatar
              name={user.displayName}
              size="sm"
              {...(user.avatarUrl !== null ? { src: user.avatarUrl } : {})}
            />
          </button>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
        )
      }
      items={items.map((item) => ({
        ...item,
        icon: undefined,
      }))}
      onSelect={(value) => { void handleSelect(value); }}
      align="right"
    />
  );
}
