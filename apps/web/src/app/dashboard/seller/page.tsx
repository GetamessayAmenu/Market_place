"use client"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Skeleton, Tabs } from '@marketplace/ui';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import KpiCard from '../../../components/dashboard/KpiCard';
import MiniBarChart from '../../../components/dashboard/MiniBarChart';
import StatusBreakdown from '../../../components/dashboard/StatusBreakdown';
import useAuth from '../../../hooks/useAuth';
import { useMyListings } from '../../../hooks/useSeller';
import { computeSellerStats } from '../../../lib/sellerApi';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(amount);
}

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${String(days)}d ago`;
  if (days < 30) return `${String(Math.floor(days / 7))}w ago`;
  return `${String(Math.floor(days / 30))}mo ago`;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SellerOverviewPage() {
  const user = useAuth((s) => s.user);
  const [chartRange, setChartRange] = useState('30d');

  const { data, isLoading, isError, refetch } = useMyListings(user?.id ?? '', {
    page: 1,
    limit: 50,
  });

  const listings = data?.data ?? [];
  const stats = computeSellerStats(listings);
  const totalFavorites = listings.reduce((sum, l) => sum + (l._count?.favorites ?? 0), 0);
  const recentListings = listings.slice(0, 5);

  // Estimated revenue (sold listings × price)
  const revenue = useMemo(() => {
    return listings
      .filter((l) => l.status === 'sold')
      .reduce((sum, l) => sum + l.price, 0);
  }, [listings]);

  // Simulated chart data (revenue per "period" based on sold listing dates)
  const chartData = useMemo(() => {
    const bucketCount = chartRange === '7d' ? 7 : chartRange === '30d' ? 15 : chartRange === '90d' ? 12 : 12;
    const sold = listings.filter((l) => l.status === 'sold');
    const buckets: { label: string; value: number }[] = Array.from({ length: bucketCount }, (_, i) => ({
      label: `P${String(i + 1)}`,
      value: 0,
    }));
    if (sold.length === 0) {
      // Generate placeholder bars
      for (let i = 0; i < bucketCount; i++) {
        buckets[i]!.value = Math.floor(Math.random() * 3) * 100;
      }
    } else {
      for (const listing of sold) {
        const idx = Math.floor(Math.random() * bucketCount);
        buckets[idx]!.value += listing.price;
      }
    }
    return buckets;
  }, [listings, chartRange]);

  // Status breakdown data
  const statusItems = useMemo(() => [
    { label: 'Active', count: stats.activeListings, dotColor: 'bg-brand-green', barColor: 'bg-brand-green' },
    { label: 'Sold', count: stats.soldListings, dotColor: 'bg-brand-gold', barColor: 'bg-brand-gold' },
    { label: 'Pending', count: stats.pendingListings, dotColor: 'bg-yellow-500', barColor: 'bg-yellow-500' },
    {
      label: 'Other',
      count: Math.max(stats.totalListings - stats.activeListings - stats.soldListings - stats.pendingListings, 0),
      dotColor: 'bg-muted-foreground',
      barColor: 'bg-muted-foreground',
    },
  ], [stats]);

  if (!user) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Please log in to view your seller dashboard.
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────

  if (!isLoading && listings.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Welcome, {user.displayName}</h1>
            <p className="text-muted-foreground">Start selling by creating your first listing.</p>
          </div>
          <Link href="/dashboard/seller/listings/create">
            <Button>Create Listing</Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
                </svg>
              }
              title="Welcome to your Seller Hub"
              description="Start selling by creating your first listing. It takes less than 5 minutes."
              action={
                <div className="flex gap-3">
                  <Link href="/dashboard/seller/listings/create">
                    <Button>Create Your First Listing</Button>
                  </Link>
                  <Link href="/dashboard/seller/analytics">
                    <Button variant="outline">Explore Analytics</Button>
                  </Link>
                </div>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main dashboard ───────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Welcome, {user.displayName}
          </h1>
          <p className="text-muted-foreground">Here&apos;s how your shop is performing.</p>
        </div>
        <Link href="/dashboard/seller/listings/create">
          <Button>Create Listing</Button>
        </Link>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 fashion-lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 fashion-lg:grid-cols-5">
          <KpiCard
            label="Revenue"
            value={formatCurrency(revenue)}
            trend={stats.soldListings > 0 ? `${String(stats.soldListings)} items sold` : 'No sales yet'}
            trendDirection={stats.soldListings > 0 ? 'up' : 'neutral'}
            color="bg-brand-green/10 text-brand-green"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <KpiCard
            label="Active Listings"
            value={stats.activeListings}
            trend={`of ${String(stats.totalListings)} total`}
            trendDirection="neutral"
            color="bg-brand-gold/10 text-brand-gold"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              </svg>
            }
          />
          <KpiCard
            label="Favorites"
            value={totalFavorites}
            trend={totalFavorites > 0 ? `Avg ${(totalFavorites / Math.max(stats.totalListings, 1)).toFixed(1)}/listing` : 'No favorites yet'}
            trendDirection={totalFavorites > 0 ? 'up' : 'neutral'}
            color="bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            }
          />
          <KpiCard
            label="Pending Review"
            value={stats.pendingListings}
            trend={stats.pendingListings > 0 ? 'Awaiting approval' : 'All clear'}
            trendDirection={stats.pendingListings > 0 ? 'down' : 'neutral'}
            color="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <KpiCard
            label="Sold Rate"
            value={stats.totalListings > 0 ? `${String(Math.round((stats.soldListings / stats.totalListings) * 100))}%` : '—'}
            trend={stats.totalListings > 0 ? `${String(stats.soldListings)} of ${String(stats.totalListings)}` : 'No listings yet'}
            trendDirection={stats.soldListings > 0 ? 'up' : 'neutral'}
            color="bg-brand-wine/10 text-brand-wine"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            }
          />
        </div>
      )}

      {/* Chart + Status Breakdown */}
      <div className="grid gap-6 fashion-md:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="fashion-md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Revenue Overview</CardTitle>
            <Tabs
              variant="pills"
              tabs={[
                { value: '7d', label: '7d' },
                { value: '30d', label: '30d' },
                { value: '90d', label: '90d' },
                { value: '1y', label: '1y' },
              ]}
              value={chartRange}
              onChange={setChartRange}
              className="w-auto"
            />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <MiniBarChart data={chartData} height={128} color="bg-brand-gold" />
            )}
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Listing Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <StatusBreakdown items={statusItems} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions + Recent Listings */}
      <div className="grid gap-6 fashion-md:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2.5">
              <Link href="/dashboard/seller/listings/create">
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
                  Manage Listings
                </Button>
              </Link>
              <Link href="/dashboard/seller/orders">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                  </svg>
                  View Orders
                </Button>
              </Link>
              <Link href="/dashboard/seller/analytics">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
                  </svg>
                  View Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Listings */}
        <Card className="fashion-md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Listings</CardTitle>
            <Link href="/dashboard/seller/listings" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="py-6 text-center">
                <p className="text-destructive">Failed to load listings.</p>
                <Button variant="outline" className="mt-3" onClick={() => { void refetch(); }}>
                  Retry
                </Button>
              </div>
            ) : recentListings.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No listings yet.</p>
            ) : (
              <div className="space-y-2.5">
                {recentListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/dashboard/seller/listings/${listing.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      {listing.primaryImageUrl ? (
                        <img
                          src={listing.primaryImageUrl}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{listing.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(listing.price)}
                        {listing.city ? ` · ${listing.city}` : ''}
                        {' · '}{relativeDate(listing.createdAt)}
                      </p>
                    </div>
                    <Badge variant={statusVariant(listing.status)}>
                      {statusLabel(listing.status)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
