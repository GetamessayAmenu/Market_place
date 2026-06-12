"use client"
import { Avatar, Dropdown } from '@marketplace/ui';
import Link from 'next/link';
import React from 'react';

import useAuth from '../../hooks/useAuth';

const loggedInItems = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Saved Listings', value: 'saved' },
  { label: 'Messages', value: 'messages' },
  { label: 'Settings', value: 'settings' },
  { label: 'Sign Out', value: 'logout', destructive: true },
];

const guestItems = [
  { label: 'Sign In', value: 'login' },
  { label: 'Sign Up', value: 'register' },
];

export default function UserMenu() {
  const user = useAuth((s) => s.user);
  const clear = useAuth((s) => s.clear);

  const handleSelect = (value: string) => {
    if (value === 'logout') {
      clear();
      window.location.href = '/';
    }
  };

  const items = user ? loggedInItems : guestItems;

  const routeMap: Record<string, string> = {
    dashboard: '/dashboard',
    saved: '/dashboard/saved',
    messages: '/dashboard/messages',
    settings: '/dashboard/settings',
    login: '/login',
    register: '/register',
  };

  return (
    <Dropdown
      trigger={
        user ? (
          <button className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-ring transition-all" aria-label="User menu">
            <Avatar name={user.name ?? user.email ?? 'U'} size="sm" />
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
      onSelect={(value) => {
        const route = routeMap[value];
        if (route) {
          window.location.href = route;
        }
        handleSelect(value);
      }}
      align="right"
    />
  );
}
