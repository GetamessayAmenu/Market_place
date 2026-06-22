"use client"
import { Avatar, Pagination, Rating } from '@marketplace/ui'
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'

import { useAuth } from '../../../hooks/useAuth'
import { getSellerReviews, type ReviewData } from '../../../lib/marketplaceApi'

export default function ReviewsPage() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const res = await getSellerReviews(user.id, { page, limit: 10 })
      setReviews(res.data)
      setTotalPages(res.meta.totalPages)
    } catch {
      setError('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [user, page])

  useEffect(() => {
    void fetchReviews()
  }, [fetchReviews])

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">Reviews left by buyers on your listings.</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border bg-card p-4 space-y-3">
              <div className="h-5 bg-muted rounded w-1/4" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start gap-3">
                  <Avatar
                    name={review.reviewer?.displayName ?? 'User'}
                    {...(review.reviewer?.avatarUrl ? { src: review.reviewer.avatarUrl } : {})}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div>
                        <p className="font-medium text-card-foreground">{review.reviewer?.displayName ?? 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Rating value={review.rating} size="sm" readOnly />
                    </div>
                    {review.title ? (
                      <p className="font-semibold text-sm text-card-foreground">{review.title}</p>
                    ) : null}
                    {review.body ? (
                      <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
                    ) : null}
                    {review.verifiedPurchase ? (
                      <span className="mt-2 inline-block text-xs text-green-600 font-medium">Verified Purchase</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 ? (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          ) : null}
        </>
      ) : (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No reviews yet.</p>
          <Link href="/search" className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary/80">
            Browse listings
          </Link>
        </div>
      )}
    </div>
  )
}
