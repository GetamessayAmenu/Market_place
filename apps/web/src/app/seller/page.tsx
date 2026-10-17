'use client';

import React, { useState, useEffect } from 'react';
import { Badge, Button, Card, CardContent } from '@marketplace/ui';
import Link from 'next/link';
import useAuth from '../../hooks/useAuth';
import { usePendingActions, type PendingAction } from '../../hooks/seller/usePendingActions';
import { useEngagementMetrics } from '../../hooks/seller/useEngagementMetrics';
import { useDashboardKpis } from '../../hooks/seller/useDashboardKpis';
import { usePromotionalBanner } from '../../hooks/seller/usePromotionalBanner';
import { useMyListings } from '../../hooks/useSeller';
import { apiGet } from '../../lib/api';

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconAlert = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const IconCheckCircle = () => (
  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconPlus = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const IconListings = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
  </svg>
);

const IconCalendar = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const IconMessages = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const IconStore = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const IconEye = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconWhatsApp = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const IconPhone = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

const IconUsers = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

// ─── Sub-Components ──────────────────────────────────────────────────────────

function ActionTriageCard({ action }: { action: PendingAction }) {
  const urgencyStyles = {
    high: 'border-red-300 bg-red-50/60 dark:bg-red-950/20 dark:border-red-900/50',
    medium: 'border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900/50',
    low: 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/40',
  };

  const badgeConfig = {
    high: { label: 'High Priority', className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
    medium: { label: 'Attention', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
    low: { label: 'Info', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  };

  const currentBadge = badgeConfig[action.urgency] || badgeConfig.low;
  const targetHref = action.href || '/seller/listings';

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4 transition-all ${urgencyStyles[action.urgency] || urgencyStyles.low}`}>
      <div className="flex items-start gap-3 min-w-0">
        <div className={`mt-0.5 rounded-full p-1.5 ${action.urgency === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
          <IconAlert />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-foreground">{action.title}</p>
            <Badge variant="outline" className={`text-2xs font-medium border-none ${currentBadge.className}`}>
              {currentBadge.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{action.description}</p>
        </div>
      </div>
      <div className="flex-shrink-0 self-end sm:self-center">
        <Link href={targetHref}>
          <Button size="sm" variant={action.urgency === 'high' ? 'primary' : 'outline'}>
            Take Action →
          </Button>
        </Link>
      </div>
    </div>
  );
}

function QuickActionCard({ icon, label, description, href }: { icon: React.ReactNode; label: string; description: string; href: string }) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full hover:border-primary/50 hover:shadow-sm transition-all duration-200">
        <CardContent className="p-4 flex flex-col items-start gap-2.5">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
            {icon}
          </div>
          <div>
            <span className="text-sm font-semibold group-hover:text-primary transition-colors">{label}</span>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function MetricCard({ 
  label, 
  value, 
  icon, 
  change 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  change?: number | undefined;
}) {
  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className="p-1.5 rounded-md bg-muted text-foreground/70">
            {icon}
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-2xl font-bold tracking-tight">{value.toLocaleString()}</p>
          {change !== undefined && (
            <span className={`text-xs font-semibold ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Overview Page ─────────────────────────────────────────────────────

export default function SellerOverviewPage() {
  const user = useAuth((s) => s.user);
  const sellerId = user?.id || '';
  const [followerCount, setFollowerCount] = useState<number>(0);

  // Real backend queries
  const { data: pendingActions = [], isLoading: isLoadingActions } = usePendingActions(sellerId);
  const { data: engagementMetrics = [] } = useEngagementMetrics(sellerId);
  const { data: kpis } = useDashboardKpis(sellerId);
  const { data: promoBanner } = usePromotionalBanner();
  const { data: myListingsRes } = useMyListings(sellerId);

  // Fetch follower count
  useEffect(() => {
    if (sellerId) {
      apiGet<{ _count: { storeFollowers: number } }>(`/users/${sellerId}`)
        .then((data) => {
          setFollowerCount(data._count?.storeFollowers || 0);
        })
        .catch(() => {
          setFollowerCount(0);
        });
    }
  }, [sellerId]);

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Please log in to view your seller dashboard.</p>
        <Link href="/auth/login" className="mt-4 inline-block">
          <Button>Log In</Button>
        </Link>
      </div>
    );
  }

  // Listing data parsing
  const rawListings: any[] = Array.isArray(myListingsRes)
    ? myListingsRes
    : Array.isArray((myListingsRes as any)?.data)
    ? (myListingsRes as any).data
    : Array.isArray((myListingsRes as any)?.items)
    ? (myListingsRes as any).items
    : [];

  const activeListingCount = kpis?.activeListings ?? rawListings.filter((l: any) => l.status === 'active').length;

  return (
    <div className="space-y-7">
      {/* ── 1. Seller Header & Status ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Welcome, {user.displayName || 'Seller'}
            </h1>
            <Badge variant="outline" className="text-2xs bg-emerald-50 text-emerald-700 border-emerald-200">
              Active Seller
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Habesha Market Seller Hub — Overview & Live Activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/seller/catalog/new">
            <Button size="sm" className="gap-1.5 shadow-sm">
              <IconPlus />
              New Listing
            </Button>
          </Link>
          <Link href={`/sellers/${(user as any).storeSlug || user.id}`} target="_blank">
            <Button size="sm" variant="outline">
              Public Storefront ↗
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 2. Dynamic Promotional Banner (Only if active in backend) ───────── */}
      {promoBanner && (
        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-foreground">{promoBanner.title}</p>
                  {promoBanner.badgeText && (
                    <Badge variant="outline" className="text-2xs bg-primary/10 text-primary border-primary/20">
                      {promoBanner.badgeText}
                    </Badge>
                  )}
                </div>
                {promoBanner.description && (
                  <p className="text-xs text-muted-foreground mt-1">{promoBanner.description}</p>
                )}
              </div>
            </div>
            {promoBanner.actionUrl && (
              <Link href={promoBanner.actionUrl} className="self-start sm:self-center">
                <Button size="sm" variant="outline">
                  {promoBanner.actionText || 'View Campaign'}
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── 3. Priority: Needs Attention / Action Required ────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">Needs Attention</h2>
            {pendingActions.length > 0 && (
              <Badge className="bg-destructive text-white text-2xs px-1.5 py-0.5">
                {pendingActions.length}
              </Badge>
            )}
          </div>
          {pendingActions.length > 0 && (
            <span className="text-xs text-muted-foreground">High priority tasks requiring your immediate response</span>
          )}
        </div>

        {isLoadingActions ? (
          <div className="p-6 border rounded-lg bg-muted/30 text-center text-sm text-muted-foreground">
            Checking for pending actions...
          </div>
        ) : pendingActions.length > 0 ? (
          <div className="space-y-2.5">
            {pendingActions.map((action) => (
              <ActionTriageCard key={action.id} action={action} />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3.5 rounded-lg border border-emerald-200/60 bg-emerald-50/40 p-4 dark:border-emerald-950/50 dark:bg-emerald-950/10">
            <IconCheckCircle />
            <div>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                You're all caught up!
              </p>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-400/80 mt-0.5">
                No listings require review, all rental dates are confirmed, and no unanswered buyer inquiries remain.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Quick Actions ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold tracking-tight mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <QuickActionCard
            icon={<IconPlus />}
            label="Add Listing"
            description="Sell, rent, or custom-made"
            href="/seller/catalog/new"
          />
          <QuickActionCard
            icon={<IconListings />}
            label="Manage Listings"
            description={`${activeListingCount} published items`}
            href="/seller/listings"
          />
          <QuickActionCard
            icon={<IconCalendar />}
            label="Rental Calendar"
            description="Set blackout & maintenance"
            href="/seller/catalog#calendar"
          />
          <QuickActionCard
            icon={<IconMessages />}
            label="Inquiries & Chat"
            description="Buyer chats & requests"
            href="/seller/messages"
          />
          <QuickActionCard
            icon={<IconStore />}
            label="Store Profile"
            description="KYC, location & branding"
            href="/seller/store"
          />
        </div>
      </div>

      {/* ── 5. Engagement Health & Inquiries (Real contact-first metrics) ────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold tracking-tight">Engagement & Buyer Activity</h2>
          <span className="text-xs text-muted-foreground">Last 30 days</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <MetricCard
            label="Listing Views"
            value={kpis?.listingViews ?? 0}
            icon={<IconEye />}
            change={engagementMetrics.find(m => m.label.toLowerCase().includes('view'))?.change}
          />
          <MetricCard
            label="Chat Starts"
            value={kpis?.chatStarts ?? 0}
            icon={<IconMessages />}
            change={engagementMetrics.find(m => m.label.toLowerCase().includes('chat'))?.change}
          />
          <MetricCard
            label="WhatsApp Clicks"
            value={kpis?.whatsappClicks ?? 0}
            icon={<IconWhatsApp />}
            change={engagementMetrics.find(m => m.label.toLowerCase().includes('whatsapp'))?.change}
          />
          <MetricCard
            label="Phone Reveals"
            value={kpis?.phoneReveals ?? 0}
            icon={<IconPhone />}
            change={engagementMetrics.find(m => m.label.toLowerCase().includes('phone'))?.change}
          />
          <MetricCard
            label="Store Followers"
            value={followerCount}
            icon={<IconUsers />}
          />
        </div>
      </div>

      {/* ── 6. Live Listings Overview & Quick Status ────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold tracking-tight">Recent Listings Status</h2>
          <Link href="/seller/listings" className="text-xs font-medium text-primary hover:underline">
            View all ({rawListings.length}) →
          </Link>
        </div>

        {rawListings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">You don't have any listings yet.</p>
              <Link href="/seller/catalog/new" className="mt-3 inline-block">
                <Button size="sm">Create Your First Listing</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {rawListings.slice(0, 3).map((listing: any) => (
              <Card key={listing.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-3.5 flex gap-3 items-center">
                  <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {listing.primaryImageUrl || listing.images?.[0]?.url ? (
                      <img
                        src={listing.primaryImageUrl || listing.images?.[0]?.url}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-2xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{listing.title}</p>
                    <p className="text-xs font-bold text-primary mt-0.5">
                      ETB {Number(listing.price || 0).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-block h-2 w-2 rounded-full ${
                        listing.status === 'active' ? 'bg-emerald-500' :
                        listing.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                      <span className="text-2xs capitalize text-muted-foreground">
                        {listing.status === 'active' ? 'Live' : listing.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <Link href={`/seller/catalog/${listing.id}/edit`}>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Edit
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
