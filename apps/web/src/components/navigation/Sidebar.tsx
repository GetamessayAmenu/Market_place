"use client"
import { cn } from '@marketplace/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  section?: string;
}

interface SidebarProps {
  items?: SidebarItem[];
  className?: string;
}

const defaultItems: SidebarItem[] = [
  { label: 'Overview', href: '/dashboard', section: 'Dashboard' },
  { label: 'Saved Items', href: '/dashboard/saved', section: 'Dashboard' },
  { label: 'Messages', href: '/dashboard/messages', section: 'Dashboard' },
  { label: 'Notifications', href: '/dashboard/notifications', section: 'Dashboard' },
  { label: 'My Shop', href: '/dashboard/seller', section: 'Seller' },
  { label: 'My Listings', href: '/dashboard/seller/listings', section: 'Seller' },
  { label: 'Create Listing', href: '/dashboard/seller/create', section: 'Seller' },
  { label: 'Orders', href: '/dashboard/seller/orders', section: 'Seller' },
  { label: 'Profile', href: '/dashboard/profile', section: 'Account' },
  { label: 'Account Settings', href: '/dashboard/settings/account', section: 'Account' },
  { label: 'Security', href: '/dashboard/settings/security', section: 'Account' },
  { label: 'Notification Preferences', href: '/dashboard/settings/notifications', section: 'Account' },
];

export default function Sidebar({ items = defaultItems, className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Group items by section
  const sections = items.reduce<Record<string, SidebarItem[]>>((acc, item) => {
    const section = item.section ?? 'Other';
    (acc[section] ??= []).push(item);
    return acc;
  }, {});

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r bg-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <span className="font-display text-sm font-semibold tracking-tight">Dashboard</span>
        )}
        <button
          type="button"
          onClick={() => { setCollapsed(!collapsed); }}
          className="rounded-md p-1.5 hover:bg-muted transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Dashboard navigation">
        {Object.entries(sections).map(([sectionName, sectionItems]) => (
          <div key={sectionName} className="mb-4">
            {!collapsed && (
              <p className="px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                {sectionName}
              </p>
            )}
            <div className="space-y-0.5">
              {sectionItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon && (
                      <span className={cn('flex-shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')}>
                        {item.icon}
                      </span>
                    )}
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
