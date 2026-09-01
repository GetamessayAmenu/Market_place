"use client"
import { cn } from '@marketplace/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: number | string;
  section?: string;
}

/* ── SVG Icons (16×16) ────────────────────────────────────────────────────── */

const IconDashboard = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const IconCatalog = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
  </svg>
);

const IconMessages = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const IconStore = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const IconInsights = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

/* ── Default Items ────────────────────────────────────────────────────────── */

const sellerHubItems: SidebarItem[] = [
  { label: 'Overview', href: '/seller', icon: <IconDashboard />, section: 'Seller Hub' },
  { label: 'Listings', href: '/seller/listings', icon: <IconCatalog />, section: 'Seller Hub' },
  { label: 'Messages', href: '/seller/messages', icon: <IconMessages />, badge: 0, section: 'Seller Hub' },
  { label: 'Insights & Analytics', href: '/seller/insights', icon: <IconInsights />, section: 'Seller Hub' },
];

const accountItems: SidebarItem[] = [
  { label: 'My Rentals', href: '/dashboard/rentals', icon: <IconInsights />, section: 'Account' },
  { label: 'Saved Items', href: '/dashboard/saved', icon: <IconStore />, section: 'Account' },
  { label: 'Following', href: '/account/following', icon: <IconStore />, section: 'Account' },
  { label: 'Notifications', href: '/dashboard/notifications', icon: <IconMessages />, section: 'Account' },
  { label: 'Settings', href: '/seller/settings', icon: <IconDashboard />, section: 'Account' },
];

/* ── Badge ─────────────────────────────────────────────────────────────────── */

function SidebarBadge({ value }: { value: number | string }) {
  const display = typeof value === 'number' && value > 99 ? '99+' : String(value);
  return (
    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-2xs font-semibold text-white">
      {display}
    </span>
  );
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */

interface SellerSidebarProps {
  unreadMessageCount?: number;
  className?: string;
}

export default function SellerSidebar({ unreadMessageCount = 0, className }: SellerSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const allItems = [...sellerHubItems, ...accountItems].map(item => {
    const newItem = { ...item };
    if (item.href === '/seller/messages') {
      newItem.badge = unreadMessageCount;
    }
    return newItem;
  });

  const sections = allItems.reduce<Record<string, SidebarItem[]>>((acc, item) => {
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
          <span className="font-display text-sm font-semibold tracking-tight">Seller Hub</span>
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
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Seller hub navigation">
        {Object.entries(sections).map(([sectionName, sectionItems]) => (
          <div key={sectionName} className="mb-4">
            {!collapsed && (
              <p className="px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                {sectionName}
              </p>
            )}
            <div className="space-y-0.5">
              {sectionItems.map((item) => {
                const isActive = item.href === '/seller/orders'
                  ? pathname === '/seller/orders'
                  : pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-primary" />
                    )}
                    {item.icon && (
                      <span className={cn('flex-shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')}>
                        {item.icon}
                      </span>
                    )}
                    {!collapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        {item.badge !== undefined && item.badge !== 0 && (
                          <SidebarBadge value={item.badge} />
                        )}
                      </>
                    )}
                    {collapsed && item.badge !== undefined && item.badge !== 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                        {typeof item.badge === 'number' && item.badge > 9 ? '9+' : String(item.badge)}
                      </span>
                    )}
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
