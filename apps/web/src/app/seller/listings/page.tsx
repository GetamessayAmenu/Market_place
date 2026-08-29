'use client'

import { Badge } from '@marketplace/ui'
import { Button } from '@marketplace/ui'
import { Card, CardContent } from '@marketplace/ui'
import Link from 'next/link'
import React, { useState } from 'react'
import useAuth from '../../../hooks/useAuth'
import { useMyListings } from '../../../hooks/useSeller'

// ─── Types ─────────────────────────────────────────────────────────────────

type BusinessModel = 'ready-made' | 'rental' | 'custom'

interface Listing {
  id: string
  title: string
  price: number
  currency: string
  imageUrl: string | undefined
  status: string
  rejectedReason?: string | null
  businessModels: BusinessModel[]
  views: number
  inquiries: number
  createdAt: string
  customAvailable?: boolean
  rentalAvailable?: boolean
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconEdit = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
)

const IconMore = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM17.25 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
)

const IconEye = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.573 16.49 16.638 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

// ─── Status Badge ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: 'Published / Approved', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    pending_review: { label: 'Pending Review', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    pending: { label: 'Pending Review', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-200' },
    paused: { label: 'Paused', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    sold: { label: 'Sold', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    rented: { label: 'Rented', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  }

  const item = config[status] || { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' }

  return (
    <Badge className={item.className} variant="outline">
      {item.label}
    </Badge>
  )
}

// ─── Business Model Badges ───────────────────────────────────────────────────

function BusinessModelBadges({ models }: { models?: BusinessModel[] }) {
  const config = {
    'ready-made': { label: 'Ready-Made', className: 'bg-brand-wine/10 text-brand-wine border-brand-wine/20' },
    'rental': { label: 'Rental', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    'custom': { label: 'Custom Available', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  }

  if (!Array.isArray(models) || models.length === 0) return null

  return (
    <div className="flex gap-1.5 flex-wrap">
      {models.map((model) => {
        const item = config[model]
        if (!item) return null
        const { label, className } = item
        return (
          <Badge key={model} className={className} variant="outline">
            {label}
          </Badge>
        )
      })}
    </div>
  )
}

// ─── Listing Card ───────────────────────────────────────────────────────────

function ListingCard({ listing }: { listing: Listing }) {
  const [showActions, setShowActions] = useState(false)

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <Link href={`/products/${listing.id}`} className="h-24 w-24 rounded-lg bg-muted overflow-hidden flex-shrink-0 block">
            {listing.imageUrl ? (
              <img 
                src={listing.imageUrl} 
                alt={listing.title}
                className="h-full w-full object-cover hover:scale-105 transition-transform"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                No Image
              </div>
            )}
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/products/${listing.id}`} className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                {listing.title}
              </Link>
              <StatusBadge status={listing.status} />
            </div>

            <p className="text-lg font-bold text-brand-wine mt-1">
              {listing.currency} {listing.price.toLocaleString()}
            </p>

            <BusinessModelBadges models={listing.businessModels} />

            {listing.status === 'rejected' && listing.rejectedReason && (
              <div className="mt-2.5 p-2.5 rounded-md border border-red-200 bg-red-50 text-red-800 dark:bg-red-950/20 dark:border-red-900/30 text-xs">
                <p className="font-semibold text-red-900 dark:text-red-300">Rejection Reason:</p>
                <p className="mt-0.5 text-muted-foreground">{listing.rejectedReason}</p>
                <Link href={`/seller/catalog/${listing.id}/edit`} className="inline-block mt-1.5 font-medium text-red-700 dark:text-red-300 underline hover:no-underline">
                  Edit & Resubmit Listing →
                </Link>
              </div>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <Link href={`/products/${listing.id}`} className="font-medium text-primary hover:underline flex items-center gap-1">
                <IconEye /> View Listing
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="More actions"
            >
              <IconMore />
            </button>

            {showActions && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-lg shadow-lg z-10">
                <div className="p-1">
                  <Link
                    href={`/products/${listing.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md"
                    onClick={() => setShowActions(false)}
                  >
                    <IconEye />
                    View Listing
                  </Link>

                  <Link
                    href={`/seller/catalog/${listing.id}/edit`}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md"
                    onClick={() => setShowActions(false)}
                  >
                    <IconEdit />
                    Edit Listing
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Tab Filter ───────────────────────────────────────────────────────────

interface TabFilterProps {
  activeTab: string
  onTabChange: (tab: string) => void
  counts: Record<string, number>
}

function TabFilter({ activeTab, onTabChange, counts }: TabFilterProps) {
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Published / Approved' },
    { id: 'pending_review', label: 'Pending Review' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'sold', label: 'Sold/Rented' },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const count = counts[tab.id] || 0

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }
            `}
          >
            {tab.label}
            {count > 0 && (
              <span className={`ml-2 ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                ({count})
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function ListingsManagementPage() {
  const user = useAuth((s: any) => s.user)
  const [activeTab, setActiveTab] = useState('all')

  const { data: listingsRes, isLoading } = useMyListings(user?.id ?? '')

  const rawItems: any[] = Array.isArray(listingsRes)
    ? listingsRes
    : Array.isArray(listingsRes?.data)
    ? listingsRes.data
    : Array.isArray((listingsRes as any)?.data?.data)
    ? (listingsRes as any).data.data
    : Array.isArray((listingsRes as any)?.items)
    ? (listingsRes as any).items
    : []

  const listings: Listing[] = rawItems.map((l: any) => {
    const businessModels: BusinessModel[] = []
    if (l.availableForPurchase) businessModels.push('ready-made')
    if (l.availableForRent) businessModels.push('rental')
    if (l.customOrderAvailable) businessModels.push('custom')
    if (businessModels.length === 0) businessModels.push('ready-made')

    return {
      id: l.id,
      title: l.title,
      price: typeof l.price === 'string' ? parseFloat(l.price) : Number(l.price || 0),
      currency: l.currency || 'ETB',
      imageUrl: l.primaryImageUrl || l.images?.[0]?.url,
      status: l.status || 'pending_review',
      rejectedReason: l.rejectedReason,
      businessModels,
      views: 0,
      inquiries: 0,
      createdAt: l.createdAt,
      customAvailable: l.customOrderAvailable,
      rentalAvailable: l.availableForRent,
    }
  })

  const tabCounts: Record<string, number> = {
    all: listings.length,
    active: listings.filter(l => l.status === 'active').length,
    pending_review: listings.filter(l => l.status === 'pending_review' || l.status === 'pending').length,
    rejected: listings.filter(l => l.status === 'rejected').length,
    sold: listings.filter(l => l.status === 'sold' || l.status === 'rented').length,
  }

  const filteredListings = activeTab === 'all' 
    ? listings 
    : activeTab === 'pending_review'
      ? listings.filter(l => l.status === 'pending_review' || l.status === 'pending')
      : activeTab === 'sold'
        ? listings.filter(l => l.status === 'sold' || l.status === 'rented')
        : listings.filter(l => l.status === activeTab)

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Please log in to manage your listings.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Listings Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product listings, inventory, and availability.
          </p>
        </div>
        <Link href="/seller/catalog/new">
          <Button>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New Listing
          </Button>
        </Link>
      </div>

      {/* Tab Filter */}
      <TabFilter 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        counts={tabCounts}
      />

      {/* Listings Grid */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Loading listings...
            </CardContent>
          </Card>
        ) : filteredListings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No listings found in this category.</p>
              <Link href="/seller/catalog/new" className="inline-block mt-4 text-primary hover:underline">
                Create your first listing
              </Link>
            </CardContent>
          </Card>
        ) : (
          filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        )}
      </div>
    </div>
  )
}
