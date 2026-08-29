'use client'

import { Button, Card, CardContent } from '@marketplace/ui'
import Link from 'next/link'
import React, { useState } from 'react'
import useAuth from '../../hooks/useAuth'

// ─── Types ─────────────────────────────────────────────────────────────────

interface DashboardMetrics {
  activeListings: number
  newInquiries: number
  unreadMessages: number
  storeViews: number
}

interface PendingAlert {
  id: string
  type: 'approval' | 'conflict' | 'escalation'
  title: string
  description: string
  urgency: 'high' | 'medium' | 'low'
  relatedId?: string
}

interface TopListing {
  id: string
  title: string
  price: number
  views: number
  imageUrl?: string
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconListings = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
  </svg>
)

const IconInquiries = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const IconMessages = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
)

const IconViews = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const IconPlus = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const IconClock = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconAlert = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
)

const IconShare = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
  </svg>
)

const IconUsers = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
)

// ─── Components ─────────────────────────────────────────────────────────────

function MetricCard({ 
  label, 
  value, 
  icon, 
  trend, 
  href 
}: { 
  label: string
  value: number
  icon: React.ReactNode
  trend?: number
  href?: string
}) {
  const content = (
    <Card className="hover:border-primary/30 transition-colors cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
            {trend !== undefined && (
              <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? '+' : ''}{trend}% from last week
              </p>
            )}
          </div>
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}

function QuickActionCard({ 
  icon, 
  label, 
  href 
}: { 
  icon: React.ReactNode
  label: string
  href: string
}) {
  return (
    <Link href={href} className="block">
      <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="p-3 rounded-xl bg-brand-wine/10 text-brand-wine">
              {icon}
            </div>
            <span className="text-sm font-medium">{label}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function AlertBanner({ alert, onDismiss }: { alert: PendingAlert; onDismiss: () => void }) {
  const urgencyColors = {
    high: 'border-destructive bg-destructive/5',
    medium: 'border-orange-500 bg-orange-500/5',
    low: 'border-blue-500 bg-blue-500/5',
  }

  const urgencyIcons = {
    high: <IconAlert />,
    medium: <IconClock />,
    low: <IconAlert />,
  }

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${urgencyColors[alert.urgency]}`}>
      <div className="mt-0.5 text-muted-foreground">
        {urgencyIcons[alert.urgency]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{alert.title}</p>
        <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
      </div>
      <Button size="sm" variant="outline" onClick={onDismiss}>
        Dismiss
      </Button>
    </div>
  )
}

function TopListingCard({ listing }: { listing: TopListing }) {
  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {listing.imageUrl && (
            <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
              <img 
                src={listing.imageUrl} 
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{listing.title}</p>
            <p className="text-lg font-bold text-brand-wine mt-1">
              ETB {listing.price.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {listing.views.toLocaleString()} views
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function SellerOverviewPage() {
  const user = useAuth((s: any) => s.user)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  // Mock data - replace with API calls
  const metrics: DashboardMetrics = {
    activeListings: 24,
    newInquiries: 8,
    unreadMessages: 3,
    storeViews: 1247,
  }

  const alerts: PendingAlert[] = [
    {
      id: '1',
      type: 'approval',
      title: 'Listing Pending Approval',
      description: 'Your listing "Traditional Habesha Kemis - Green" is awaiting admin review.',
      urgency: 'medium',
      relatedId: 'listing-123',
    },
    {
      id: '2',
      type: 'conflict',
      title: 'Rental Date Conflict',
      description: 'Customer requested rental dates that overlap with an existing booking.',
      urgency: 'high',
      relatedId: 'rental-456',
    },
  ]

  const topListings: TopListing[] = [
    {
      id: '1',
      title: 'Traditional Habesha Kemis - Green with Gold Embroidery',
      price: 8500,
      views: 342,
    },
    {
      id: '2',
      title: 'Modern Ethiopian Dress - White with Tilf Pattern',
      price: 4200,
      views: 287,
    },
    {
      id: '3',
      title: 'Custom Shemma - Royal Blue',
      price: 6200,
      views: 198,
    },
  ]

  const activeAlerts = alerts.filter(a => !dismissedAlerts.has(a.id))

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Please log in to view your seller dashboard.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Welcome back, {user.displayName || 'Seller'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your store today.
        </p>
      </div>

      {/* Important Alerts Banner */}
      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Action Required</h2>
          {activeAlerts.map((alert) => (
            <AlertBanner
              key={alert.id}
              alert={alert}
              onDismiss={() => {
                setDismissedAlerts(prev => new Set([...prev, alert.id]))
              }}
            />
          ))}
        </div>
      )}

      {/* Summary Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Active Listings"
            value={metrics.activeListings}
            icon={<IconListings />}
            trend={12}
            href="/seller/listings"
          />
          <MetricCard
            label="New Inquiries"
            value={metrics.newInquiries}
            icon={<IconInquiries />}
            trend={8}
            href="/seller/messages"
          />
          <MetricCard
            label="Unread Messages"
            value={metrics.unreadMessages}
            icon={<IconMessages />}
            href="/seller/messages"
          />
          <MetricCard
            label="Store Views"
            value={metrics.storeViews}
            icon={<IconViews />}
            trend={23}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <QuickActionCard
            icon={<IconPlus />}
            label="Add New Listing"
            href="/seller/catalog/new"
          />
          <QuickActionCard
            icon={<IconMessages />}
            label="View Messages"
            href="/seller/messages"
          />
          <QuickActionCard
            icon={<IconClock />}
            label="Update Store Hours"
            href="/seller/store"
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

      {/* Top Performing Listings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Top Performing Listings</h2>
          <Link href="/seller/listings" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topListings.map((listing) => (
            <TopListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </div>
  )
}
