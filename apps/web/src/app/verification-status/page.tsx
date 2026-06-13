import { Badge } from '@marketplace/ui';
import React from 'react';

import { requireUser } from '../../lib/authServer';

export default async function VerificationStatusPage() {
  const user = await requireUser();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verification Status</h1>
        <p className="text-muted-foreground">Manage your account verification status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Email verification */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">Email</h3>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            </div>
            {user.emailVerified ? (
              <Badge variant="success">Verified</Badge>
            ) : (
              <Badge variant="warning">Unverified</Badge>
            )}
          </div>
          {!user.emailVerified && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Check your email inbox for a verification link. If you didn&apos;t receive one, contact support.
              </p>
            </div>
          )}
        </div>

        {/* Phone verification */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">Phone</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {user.phoneVerified ? 'Phone number verified' : 'No phone number on file'}
              </p>
            </div>
            {user.phoneVerified ? (
              <Badge variant="success">Verified</Badge>
            ) : (
              <Badge variant="default">Not set</Badge>
            )}
          </div>
          {!user.phoneVerified && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Add and verify your phone number in your profile settings to increase trust.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Account info */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="mb-4 font-semibold">Account Information</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Display Name</dt>
            <dd className="font-medium">{user.displayName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Role</dt>
            <dd>
              <Badge variant="info">{user.role}</Badge>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Account ID</dt>
            <dd className="font-mono text-xs">{user.id}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
