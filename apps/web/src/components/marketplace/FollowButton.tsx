"use client"
import { Button, cn } from '@marketplace/ui'
import React, { useCallback, useState } from 'react'

import { useAuth } from '../../hooks/useAuth'
import { apiPost, apiDelete } from '../../lib/api'

export interface FollowButtonProps {
  sellerId: string
  initialIsFollowing?: boolean
  initialFollowerCount?: number
  className?: string
}

export default function FollowButton({
  sellerId,
  initialIsFollowing = false,
  initialFollowerCount = 0,
  className,
}: FollowButtonProps) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [loading, setLoading] = useState(false)

  const handleToggle = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const nextFollowing = !isFollowing
    // Optimistic update
    setIsFollowing(nextFollowing)
    setFollowerCount((c) => (nextFollowing ? c + 1 : c - 1))

    try {
      if (nextFollowing) {
        await apiPost(`/users/${sellerId}/follow`)
      } else {
        await apiDelete(`/users/${sellerId}/follow`)
      }
    } catch {
      // Rollback on failure
      setIsFollowing(!nextFollowing)
      setFollowerCount((c) => (!nextFollowing ? c + 1 : c - 1))
    } finally {
      setLoading(false)
    }
  }, [user, sellerId, isFollowing])

  if (!user || user.id === sellerId) return null

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Button
        variant={isFollowing ? 'outline' : 'primary'}
        size="sm"
        onClick={() => { void handleToggle() }}
        disabled={loading}
        className={cn(
          'gap-2 transition-all',
          isFollowing && 'border-border text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive'
        )}
      >
        {isFollowing ? (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Following
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Follow
          </>
        )}
      </Button>
      {followerCount > 0 && (
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{String(followerCount)}</span>{' '}
          follower{followerCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}
