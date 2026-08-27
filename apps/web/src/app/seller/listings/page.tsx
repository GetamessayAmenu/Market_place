'use client'

import { Badge } from '@marketplace/ui'
import { Button } from '@marketplace/ui'
import { Card, CardContent } from '@marketplace/ui'
import Link from 'next/link'
import React, { useState } from 'react'
import useAuth from '../../../hooks/useAuth'

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

const IconPause = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
  </svg>
)

const IconPlay = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
  </svg>
)

const IconCheck = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconMore = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM17.25 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
)

const IconToggle = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
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

function BusinessModelBadges({ models }: { models: BusinessModel[] }) {
  const config = {
    'ready-made': { label: 'Ready-Made', className: 'bg-brand-wine/10 text-brand-wine border-brand-wine/20' },
    'rental': { label: 'Rental', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    'custom': { label: 'Custom Available', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {models.map((model) => {
        const { label, className } = config[model]
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
          <div className="h-24 w-24 rounded-lg bg-muted overflow-hidden flex-shrink-0">
            {listing.imageUrl ? (
              <img 
                src={listing.imageUrl} 
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                No Image
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-sm line-clamp-2">{listing.title}</h3>
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
              <span>{listing.views.toLocaleString()} views</span>
              <span>{listing.inquiries} inquiries</span>
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
                    href={`/seller/listings/${listing.id}/edit`}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md"
                    onClick={() => setShowActions(false)}
                  >
                    <IconEdit />
                    Edit Listing
                  </Link>
                  
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md text-left"
                    onClick={() => {
                      setShowActions(false)
                      // Handle pause/unpause
                    }}
                  >
                    {listing.status === 'active' ? <IconPause /> : <IconPlay />}
                    {listing.status === 'active' ? 'Pause Listing' : 'Activate Listing'}
                  </button>

                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md text-left"
                    onClick={() => {
                      setShowActions(false)
                      // Handle mark as sold/rented
                    }}
                  >
                    <IconCheck />
                    Mark as {listing.businessModels.includes('rental') ? 'Rented' : 'Sold'}
                  </button>

                  {listing.customAvailable && (
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md text-left"
                      onClick={() => {
                        setShowActions(false)
                        // Handle custom toggle
                      }}
                    >
                      <IconToggle />
                      Toggle Custom Orders
                    </button>
                  )}
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
    { id: 'active', label: 'Active' },
    { id: 'paused', label: 'Paused' },
    { id: 'pending', label: 'Pending Moderation' },
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

  // Mock data - replace with API calls
  const listings: Listing[] = [
    {
      id: '1',
      title: 'Traditional Habesha Kemis - Green with Gold Tilf Embroidery',
      price: 8500,
      currency: 'ETB',
      imageUrl: undefined,
      status: 'active',
      businessModels: ['ready-made', 'rental', 'custom'],
      views: 342,
      inquiries: 12,
      createdAt: '2024-01-15',
      customAvailable: true,
      rentalAvailable: true,
    },
    {
      id: '2',
      title: 'Modern Ethiopian Dress - White with Menen Pattern',
      price: 4200,
      currency: 'ETB',
      imageUrl: undefined,
      status: 'active',
      businessModels: ['ready-made'],
      views: 287,
      inquiries: 8,
      createdAt: '2024-01-10',
    },
    {
      id: '3',
      title: 'Custom Shemma - Royal Blue with Silver Thread',
      price: 6200,
      currency: 'ETB',
      imageUrl: undefined,
      status: 'paused',
      businessModels: ['custom'],
      views: 198,
      inquiries: 5,
      createdAt: '2024-01-05',
      customAvailable: true,
    },
    {
      id: '4',
      title: 'Habesha Gabi - Traditional Black with Red Border',
      price: 3500,
      currency: 'ETB',
      imageUrl: undefined,
      status: 'pending',
      businessModels: ['ready-made', 'rental'],
      views: 45,
      inquiries: 2,
      createdAt: '2024-01-20',
      rentalAvailable: true,
    },
    {
      id: '5',
      title: 'Wedding Habesha Kemis - Ivory with Gold Accents',
      price: 12000,
      currency: 'ETB',
      imageUrl: undefined,
      status: 'sold',
      businessModels: ['ready-made', 'custom'],
      views: 521,
      inquiries: 23,
      createdAt: '2023-12-20',
      customAvailable: true,
    },
  ]

  const tabCounts: Record<string, number> = {
    all: listings.length,
    active: listings.filter(l => l.status === 'active').length,
    paused: listings.filter(l => l.status === 'paused').length,
    pending: listings.filter(l => l.status === 'pending').length,
    sold: listings.filter(l => l.status === 'sold' || l.status === 'rented').length,
  }

  const filteredListings = activeTab === 'all' 
    ? listings 
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
        {filteredListings.length === 0 ? (
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
