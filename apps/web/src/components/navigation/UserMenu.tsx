'use client';

import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '@marketplace/ui';
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator } from '@marketplace/ui';

export function UserMenu() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button className="flex items-center gap-2 rounded-full hover:bg-accent p-1 transition-colors">
          <Avatar initials={initials} size="sm" />
        </button>
      </DropdownTrigger>
      <DropdownContent>
        <div className="px-4 py-2 border-b">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownItem onClick={() => window.location.href = '/dashboard'}>
          Dashboard
        </DropdownItem>
        <DropdownItem onClick={() => window.location.href = '/dashboard/settings'}>
          Settings
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem onClick={() => window.location.href = '/login'}>
          Sign Out
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
