'use client';
import { cn } from '@marketplace/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { apiGet } from '../../lib/api';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
}

/* ── SVG Icons (20×20) ────────────────────────────────────────────────────── */

const IconDashboard = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const IconCatalog = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
  </svg>
);

const IconMessages = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const IconSettings = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconInsights = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

/* ── Default Items ────────────────────────────────────────────────────────── */

const bottomNavItems: NavItem[] = [
  { label: 'Overview', href: '/seller', icon: <IconDashboard /> },
  { label: 'Listings', href: '/seller/listings', icon: <IconCatalog /> },
  { label: 'Messages', href: '/seller/messages', icon: <IconMessages />, badge: 0 },
  { label: 'Insights', href: '/seller/insights', icon: <IconInsights /> },
  { label: 'Settings', href: '/seller/settings', icon: <IconSettings /> },
];

/* ── Badge ─────────────────────────────────────────────────────────────────── */

function NavBadge({ value }: { value: number | string }) {
  const display = typeof value === 'number' && value > 99 ? '99+' : String(value);
  return (
    <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-white">
      {display}
    </span>
  );
}

/* ── Bottom Navigation ───────────────────────────────────────────────────────── */

interface SellerBottomNavProps {
  unreadMessageCount?: number;
  className?: string;
}

export default function SellerBottomNav({ unreadMessageCount = 0, className }: SellerBottomNavProps) {
  const pathname = usePathname();
  const user = useAuth((s) => s.user);
  const [liveUnread, setLiveUnread] = useState(unreadMessageCount);

  useEffect(() => {
    if (unreadMessageCount > 0) {
      setLiveUnread(unreadMessageCount);
      return;
    }
    if (user?.id) {
      apiGet<{ unreadCount: number }>('/chat/unread-count')
        .then((res) => {
          if (typeof res?.unreadCount === 'number') {
            setLiveUnread(res.unreadCount);
          }
        })
        .catch(() => {
          // non-fatal
        });
    }
  }, [user?.id, unreadMessageCount]);

  const items = bottomNavItems.map(item => ({
    ...item,
    badge: item.href === '/seller/messages' ? liveUnread : item.badge
  }));

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
      aria-label="Seller hub navigation"
    >
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive =
            item.href === '/seller'
              ? pathname === '/seller' || pathname === '/seller/dashboard'
              : item.href === '/seller/listings'
              ? pathname.startsWith('/seller/listings') || pathname.startsWith('/seller/catalog')
              : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 px-3 py-2 min-w-0 flex-1"
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={cn('relative', isActive ? 'text-primary' : 'text-muted-foreground')}>
                {item.icon}
                {item.badge !== undefined && item.badge !== 0 && (
                  <NavBadge value={item.badge} />
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium truncate',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
