'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@marketplace/ui';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { name: 'My Listings', href: '/dashboard/listings', icon: '📦' },
  { name: 'Saved Items', href: '/dashboard/saved', icon: '❤️' },
  { name: 'Messages', href: '/dashboard/messages', icon: '💬' },
  { name: 'Notifications', href: '/dashboard/notifications', icon: '🔔' },
  { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 h-screen w-64 border-r bg-background transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              Marketplace
            </Link>
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="p-4 border-t">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <span className="text-lg">🏠</span>
              Back to Home
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
