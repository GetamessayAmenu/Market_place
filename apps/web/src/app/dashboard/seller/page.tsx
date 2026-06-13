"use client"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@marketplace/ui';
import Link from 'next/link';
import React from 'react';

import useAuth from '../../../hooks/useAuth';
import { useMyListings } from '../../../hooks/useSeller';
import { computeSellerStats, type SellerListing } from '../../../lib/sellerApi';

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, color, icon }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'active': return 'success';
    case 'sold': return 'info';
    case 'pending_review': return 'warning';
    case 'rejected': return 'error';
    case 'expired': return 'error';
    case 'archived': return 'default';
    default: return 'default';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Active';
    case 'sold': return 'Sold';
    case 'pending_review': return 'Pending Review';
    case 'rejected': return 'Rejected';
    case 'expired': return 'Expired';
    case 'archived': return 'Hidden';
    case 'draft': return 'Draft';
    default: return status;
  }
}

// ─── Recent Listings ─────────────────────────────────────────────────────────

function RecentListings({ listings }: { listings: SellerListing[] }) {
  if (listings.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No listings yet.</p>
        <Link href="/dashboard/seller/create">
          <Button className="mt-4">Create your first listing</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {listings.map((listing) => (
        <Link
          key={listing.id}
          href={`/dashboard/seller/listings/${listing.id}`}
          className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-accent/50"
        >
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
            {listing.primaryImageUrl ? (
              <img
                src={listing.primaryImageUrl}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{listing.title}</p>
            <p className="text-sm text-muted-foreground">
              ${listing.price.toLocaleString()}{listing.city ? ` · ${listing.city}` : ''}
            </p>
          </div>
          <Badge variant={statusVariant(listing.status)}>
            {statusLabel(listing.status)}
          </Badge>
        </Link>
      ))}
    </div>
  );
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────

export default function SellerDashboardPage() {
  const user = useAuth((s) => s.user);

  const { data, isLoading, isError, refetch } = useMyListings(user?.id ?? '', {
    page: 1,
    limit: 50,
  });

  const listings = data?.data ?? [];
  const stats = computeSellerStats(listings);
  const recentListings = listings.slice(0, 5);
  const totalFavorites = listings.reduce((sum, l) => sum + (l._count?.favorites ?? 0), 0);

  if (!user) {
    return <div className="py-8 text-center text-muted-foreground">Please log in to view your seller dashboard.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seller Dashboard</h1>
          <p className="text-muted-foreground">Manage your listings and track performance.</p>
        </div>
        <Link href="/dashboard/seller/create">
          <Button>Create Listing</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active Listings"
            value={stats.activeListings}
            color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          />
          <StatCard
            label="Sold Listings"
            value={stats.soldListings}
            color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Pending Review"
            value={stats.pendingListings}
            color="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Total Favorites"
            value={totalFavorites}
            color="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Listings</span>
                  <span className="font-semibold">{stats.totalListings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Rate</span>
                  <span className="font-semibold">
                    {stats.totalListings > 0
                      ? String(Math.round((stats.activeListings / stats.totalListings) * 100)) + '%'
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sold Rate</span>
                  <span className="font-semibold">
                    {stats.totalListings > 0
                      ? String(Math.round((stats.soldListings / stats.totalListings) * 100)) + '%'
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Favorites per Listing</span>
                  <span className="font-semibold">
                    {stats.totalListings > 0
                      ? (totalFavorites / stats.totalListings).toFixed(1)
                      : '—'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Link href="/dashboard/seller/create">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Listing
                </Button>
              </Link>
              <Link href="/dashboard/seller/listings">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Manage My Listings
                </Button>
              </Link>
              <Link href="/dashboard/messages">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  View Messages
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Listings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Listings</CardTitle>
          <Link href="/dashboard/seller/listings" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="py-6 text-center">
              <p className="text-destructive">Failed to load listings.</p>
              <Button variant="outline" className="mt-3" onClick={() => { void refetch(); }}>
                Retry
              </Button>
            </div>
          ) : (
            <RecentListings listings={recentListings} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
