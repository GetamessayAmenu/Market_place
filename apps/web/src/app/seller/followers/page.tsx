'use client'

import React, { useState } from 'react'
import { Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@marketplace/ui'
import Link from 'next/link'
import useAuth from '../../../hooks/useAuth'
import { apiGet } from '../../../lib/api'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Follower {
  id: string
  follower: {
    id: string
    displayName: string
    avatarUrl?: string | null
    email?: string
    phone?: string | null
    createdAt: string
  }
  followedAt: string
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconUsers = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.75 0 11-6.75 0 3.375 3.75 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
)

// ─── Components ─────────────────────────────────────────────────────────────

function FollowerRow({ follower }: { follower: Follower }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          {follower.follower.avatarUrl ? (
            <img
              src={follower.follower.avatarUrl}
              alt={follower.follower.displayName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-medium">
                {follower.follower.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-sm">{follower.follower.displayName}</p>
            {follower.follower.email && (
              <p className="text-xs text-muted-foreground">{follower.follower.email}</p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(follower.followedAt)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {follower.follower.phone || '-'}
      </TableCell>
      <TableCell className="text-right">
        <Link href={`/seller/messages?userId=${follower.follower.id}`}>
          <Button size="sm" variant="outline">
            Message
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function FollowersPage() {
  const user = useAuth((s: any) => s.user)
  const [followers, setFollowers] = useState<Follower[]>([])
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    if (!user) return

    const fetchFollowers = async () => {
      try {
        const data = await apiGet<Follower[]>('/seller/followers')
        setFollowers(data)
      } catch (error) {
        console.error('Failed to fetch followers:', error)
      } finally {
        setLoading(false)
      }
    }

    void fetchFollowers()
  }, [user])

  if (!user) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Please log in to view your followers.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Followers & Community</h1>
        <p className="text-muted-foreground">
          Manage your store followers and engage with your community.
        </p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <IconUsers />
            </div>
            <div>
              <p className="text-2xl font-bold">{followers.length}</p>
              <p className="text-sm text-muted-foreground">Total Followers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Followers Table */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading followers...
            </div>
          ) : followers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No followers yet. Share your store to grow your community!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Follower</TableHead>
                  <TableHead>Followed Since</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followers.map((follower) => (
                  <FollowerRow key={follower.id} follower={follower} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
