import { Badge } from '@marketplace/ui';
import Link from 'next/link';
import React from 'react';

import { requireUser } from '../../../lib/authServer';

const settingsLinks = [
  {
    title: 'Account',
    description: 'Manage your display name, email, and phone number.',
    href: '/dashboard/settings/account',
  },
  {
    title: 'Security',
    description: 'Change your password and review account security.',
    href: '/dashboard/settings/security',
  },
  {
    title: 'Notifications',
    description: 'Choose what notifications you receive and how.',
    href: '/dashboard/settings/notifications',
  },
];

export default async function SettingsPage() {
  const user = await requireUser();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
          >
            <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">{link.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{link.description}</p>
          </Link>
        ))}
      </div>

      {/* Quick profile summary */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Account Overview</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Display Name</dt>
            <dd className="font-medium">{user.displayName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Role</dt>
            <dd><Badge variant="info">{user.role}</Badge></dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email Verified</dt>
            <dd>
              {user.emailVerified
                ? <Badge variant="success">Yes</Badge>
                : <Badge variant="warning">No</Badge>}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Phone Verified</dt>
            <dd>
              {user.phoneVerified
                ? <Badge variant="success">Yes</Badge>
                : <Badge variant="default">No</Badge>}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
