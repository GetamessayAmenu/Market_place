"use client"
import { cn } from '@marketplace/ui';
import Link from 'next/link';
import React, { useState } from 'react';

interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface SidebarProps {
  items?: SidebarItem[];
  className?: string;
}

const defaultItems: SidebarItem[] = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Seller Dashboard', href: '/dashboard/seller' },
  { label: 'My Listings', href: '/dashboard/seller/listings' },
  { label: 'Create Listing', href: '/dashboard/seller/create' },
  { label: 'Saved', href: '/dashboard/saved' },
  { label: 'Messages', href: '/dashboard/messages' },
  { label: 'Notifications', href: '/dashboard/notifications' },
  { label: 'Profile', href: '/dashboard/profile' },
  { label: 'Account Settings', href: '/dashboard/settings/account' },
  { label: 'Security', href: '/dashboard/settings/security' },
  { label: 'Notification Preferences', href: '/dashboard/settings/notifications' },
];

export default function Sidebar({ items = defaultItems, className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r bg-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && <span className="font-semibold text-sm">Dashboard</span>}
        <button
          type="button"
          onClick={() => { setCollapsed(!collapsed); }}
          className="rounded-md p-1 hover:bg-accent"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-1" aria-label="Dashboard navigation">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              'text-foreground/80 hover:bg-accent hover:text-foreground'
            )}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
