"use client"
import { Avatar, Dropdown } from '@marketplace/ui';
import Link from 'next/link';
import React from 'react';

import useAuth from '../../hooks/useAuth';
import { logout } from '../../lib/authClient';

const loggedInItems = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'My Profile', value: 'profile' },
  { label: 'Saved Listings', value: 'saved' },
  { label: 'Messages', value: 'messages' },
  { label: 'Account Settings', value: 'account' },
  { label: 'Security', value: 'security' },
  { label: 'Notifications', value: 'notifications' },
  { label: 'Sign Out', value: 'logout', destructive: true },
];

const guestItems = [
  { label: 'Sign In', value: 'login' },
  { label: 'Sign Up', value: 'register' },
];

const routeMap: Record<string, string> = {
  dashboard: '/dashboard',
  profile: '/dashboard/profile',
  saved: '/dashboard/saved',
  messages: '/dashboard/messages',
  account: '/dashboard/settings/account',
  security: '/dashboard/settings/security',
  notifications: '/dashboard/settings/notifications',
  login: '/login',
  register: '/register',
};

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

  const items = user ? loggedInItems : guestItems;

  return (
    <Dropdown
      trigger={
        user ? (
          <button className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-ring transition-all" aria-label="User menu">
            <Avatar
              name={user.displayName}
              size="sm"
              {...(user.avatarUrl !== null && { src: user.avatarUrl })}
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
