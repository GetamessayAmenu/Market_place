'use client'

import React, { useState } from 'react'
import { Button, Card, CardContent } from '@marketplace/ui'
import Link from 'next/link'
import useAuth from '../../../hooks/useAuth'
import { apiGet } from '../../../lib/api'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Store {
  id: string
  displayName: string
  avatarUrl?: string | null
  location?: string | null
  bio?: string | null
  sellerType?: string | null
  _count: {
    listings: number
    storeFollowers: number
  }
}

interface FollowingItem {
  id: string
  storeId: string
  store: Store
  followedAt: string
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconStore = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)

// ─── Components ─────────────────────────────────────────────────────────────

function StoreCard({ item }: { item: FollowingItem }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {item.store.avatarUrl ? (
            <img
              src={item.store.avatarUrl}
              alt={item.store.displayName}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <span className="text-lg font-medium">
                {item.store.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-sm">{item.store.displayName}</h3>
                {item.store.location && (
                  <p className="text-xs text-muted-foreground">{item.store.location}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(item.followedAt)}
              </span>
            </div>
            {item.store.bio && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {item.store.bio}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{item.store._count.listings} listings</span>
              <span>{item.store._count.storeFollowers} followers</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link href={`/sellers/${item.storeId}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full">
              Browse Listings
            </Button>
          </Link>
          <Link href={`/seller/messages?userId=${item.storeId}`} className="flex-1">
            <Button size="sm" className="w-full">
              Contact
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function FollowingPage() {
  const user = useAuth((s: any) => s.user)
  const [following, setFollowing] = useState<FollowingItem[]>([])
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    if (!user) return

    const fetchFollowing = async () => {
      try {
        const data = await apiGet<FollowingItem[]>('/users/following')
        setFollowing(data)
      } catch (error) {
        console.error('Failed to fetch following:', error)
      } finally {
        setLoading(false)
      }
    }

    void fetchFollowing()
  }, [user])

  if (!user) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Please log in to view your followed stores.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">My Followed Stores</h1>
        <p className="text-muted-foreground">
          Browse your favorite traditional tailors and rental boutiques.
        </p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <IconStore />
            </div>
            <div>
              <p className="text-2xl font-bold">{following.length}</p>
              <p className="text-sm text-muted-foreground">Stores Followed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Following Grid */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading followed stores...
        </div>
      ) : following.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <IconStore />
              </div>
              <h3 className="font-semibold text-lg mb-2">No followed stores yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start following your favorite sellers to see their latest listings here.
              </p>
              <Link href="/listings">
                <Button>Browse Listings</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {following.map((item) => (
            <StoreCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
