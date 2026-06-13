import { Avatar, Badge, Button } from '@marketplace/ui';
import Link from 'next/link';
import React from 'react';

import { requireUser } from '../../../lib/authServer';

export default async function ProfilePage() {
  const user = await requireUser();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">View and manage your public profile.</p>
        </div>
        <Link href="/dashboard/profile/edit">
          <Button variant="outline">Edit Profile</Button>
        </Link>
      </div>

      {/* Profile card */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Avatar
            size="lg"
            name={user.displayName}
            {...(user.avatarUrl !== null && { src: user.avatarUrl })}
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              <h2 className="text-xl font-semibold">{user.displayName}</h2>
              <div className="flex gap-1">
                {user.emailVerified && (
                  <Badge variant="success">Email Verified</Badge>
                )}
                {user.phoneVerified && (
                  <Badge variant="success">Phone Verified</Badge>
                )}
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-1">
              <Badge variant="info">{user.role}</Badge>
            </p>
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Account Details</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Display Name</dt>
              <dd className="font-medium">{user.displayName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Account ID</dt>
              <dd className="font-mono text-xs">{user.id}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Verification Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              {user.emailVerified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Unverified</Badge>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Phone</span>
              {user.phoneVerified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="default">Not verified</Badge>
              )}
            </div>
          </div>
          <div className="mt-4">
            <Link href="/verification-status" className="text-sm font-medium text-primary hover:underline">
              View full verification details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
