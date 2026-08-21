'use client';

import React, { useState } from 'react';
import { Alert, Button, Card, CardContent } from '@marketplace/ui';
import Link from 'next/link';
import useAuth from '../../../hooks/useAuth';
import { apiGet } from '../../../lib/api';
import { usePendingActions } from '../../../hooks/seller/usePendingActions';
import { useEngagementMetrics } from '../../../hooks/seller/useEngagementMetrics';

// ─── Types ─────────────────────────────────────────────────────────────────

interface PendingAction {
  id: string;
  type: 'new_inquiry' | 'rental_request' | 'handover' | 'return' | 'unread_message';
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  relatedId?: string;
  createdAt: string;
}

interface EngagementMetric {
  label: string;
  value: number;
  change: number;
  icon?: React.ReactNode;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconAlert = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const IconPlus = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const IconCalendar = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const IconShare = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
  </svg>
);

const IconUsers = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

// ─── Components ─────────────────────────────────────────────────────────────

function ActionTriageCard({ action }: { action: PendingAction }) {
  const urgencyColors = {
    high: 'border-destructive bg-destructive/5',
    medium: 'border-orange-500 bg-orange-500/5',
    low: 'border-blue-500 bg-blue-500/5',
  };

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${urgencyColors[action.urgency]}`}>
      <div className="mt-0.5">
        <IconAlert />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{action.title}</p>
        <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
      </div>
      <Button size="sm" variant="outline">
        View
      </Button>
    </div>
  );
}

function QuickActionCard({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link href={href} className="block">
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <span className="text-sm font-medium">{label}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EngagementMetricCard({ metric }: { metric: EngagementMetric }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            {metric.icon}
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold">{metric.value}</p>
            <p className="text-xs text-muted-foreground">{metric.label}</p>
          </div>
          <div className={`text-xs font-medium ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metric.change >= 0 ? '+' : ''}{metric.change}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HolidayAlertBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Alert variant="info" onDismiss={() => setDismissed(true)}>
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded bg-orange-100 text-orange-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">🎉 Enkutatash (Ethiopian New Year) Coming Soon!</p>
          <p className="text-xs text-muted-foreground mt-1">
            Update your blackout calendar and stock for the holiday season. High demand expected in 2-3 weeks.
          </p>
        </div>
        <Link href="/seller/catalog">
          <Button size="sm">Update Calendar</Button>
        </Link>
      </div>
    </Alert>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function SellerDashboardPage() {
  const user = useAuth((s) => s.user);
  const sellerId = user?.id || '';
  const [followerCount, setFollowerCount] = useState(0);

  // API calls
  const { data: pendingActions = [] } = usePendingActions(sellerId);
  const { data: engagementMetrics = [] } = useEngagementMetrics(sellerId);

  // Fetch followers count
  React.useEffect(() => {
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
      <div className="py-8 text-center text-muted-foreground">
        Please log in to view your seller dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Welcome back, {user.displayName || 'Seller'}</h1>
        <p className="text-muted-foreground">Here's what's happening with your store today.</p>
      </div>

      {/* Holiday Alert Banner */}
      <HolidayAlertBanner />

      {/* Action Triage Bar */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Action Required</h2>
        <div className="space-y-3">
          {pendingActions.map((action) => (
            <ActionTriageCard key={action.id} action={action} />
          ))}
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <QuickActionCard
            icon={<IconPlus />}
            label="Add New Listing"
            href="/seller/catalog/new"
          />
          <QuickActionCard
            icon={<IconCalendar />}
            label="Update Blackout Calendar"
            href="/seller/catalog#calendar"
          />
          <QuickActionCard
            icon={<IconShare />}
            label="Share Storefront Link"
            href="/seller/store#share"
          />
          <QuickActionCard
            icon={<IconUsers />}
            label="View Followers"
            href="/seller/followers"
          />
        </div>
      </div>

      {/* Engagement Health Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Engagement Health</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {engagementMetrics.map((metric, index) => (
            <EngagementMetricCard key={index} metric={metric} />
          ))}
          <EngagementMetricCard
            metric={{
              label: 'Followers',
              value: followerCount,
              change: 0,
              icon: <IconUsers />,
            }}
          />
        </div>
      </div>
    </div>
  );
}
