"use client"
import { Alert, Avatar, Button, Pagination, Rating, cn } from '@marketplace/ui'
import React, { useCallback, useEffect, useState } from 'react'

import { useAuth } from '../../hooks/useAuth'
import {
  createReview,
  deleteReview,
  getListReviews,
  getListReviewSummary,
  type ReviewData,
  type ReviewSummaryData,
} from '../../lib/marketplaceApi'

export interface ReviewSectionProps {
  listingId: string
  sellerId: string
  className?: string
}

function StarBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-8 text-right text-muted-foreground">{String(stars)}★</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-brand-gold transition-all" style={{ width: `${String(pct)}%` }} />
      </div>
      <span className="w-8 text-muted-foreground">{String(count)}</span>
    </div>
  )
}

function ReviewCard({ review, currentUserId, onDelete }: { review: ReviewData; currentUserId?: string; onDelete: (id: string) => void }) {
  const isOwner = currentUserId === review.reviewerId
  return (
    <div className="border-b border-border/50 py-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <Avatar
          name={review.reviewer?.displayName ?? 'User'}
          {...(review.reviewer?.avatarUrl !== undefined && { src: review.reviewer.avatarUrl })}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">{review.reviewer?.displayName ?? 'Anonymous'}</p>
              <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Rating value={review.rating} size="sm" readOnly />
              {review.verifiedPurchase && (
                <span className="text-xs text-green-600 font-medium">Verified</span>
              )}
            </div>
          </div>
          {review.title && <p className="mt-1 font-semibold text-sm text-foreground">{review.title}</p>}
          {review.body && <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>}
          {isOwner && (
            <button
              type="button"
              onClick={() => { onDelete(review.id) }}
              className="mt-2 text-xs text-destructive hover:text-destructive/80 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ReviewSection({ listingId, sellerId, className }: ReviewSectionProps) {
  const { user } = useAuth()
  const [summary, setSummary] = useState<ReviewSummaryData | null>(null)
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newRating, setNewRating] = useState(5)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [summaryRes, reviewsRes] = await Promise.allSettled([
        getListReviewSummary(listingId),
        getListReviews(listingId, { page, limit: 5 }),
      ])
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value)
      if (reviewsRes.status === 'fulfilled') {
        setReviews(reviewsRes.value.data)
        setTotalPages(reviewsRes.value.meta.totalPages)
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false)
    }
  }, [listingId, page])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleSubmitReview = async () => {
    if (!user) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      await createReview({
        listingId,
        rating: newRating,
        ...(newTitle ? { title: newTitle } : {}),
        ...(newBody ? { body: newBody } : {}),
      })
      setSuccess('Review submitted!')
      setShowForm(false)
      setNewTitle('')
      setNewBody('')
      void loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteReview(id)
      void loadData()
    } catch {
      setError('Failed to delete review')
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary */}
      {summary && summary.totalReviews > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 rounded-lg border bg-card p-6">
          <div className="text-center sm:text-left">
            <p className="text-4xl font-bold text-card-foreground">{summary.averageRating.toFixed(1)}</p>
            <Rating value={summary.averageRating} size="md" readOnly />
            <p className="text-sm text-muted-foreground mt-1">{String(summary.totalReviews)} review{summary.totalReviews !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {summary.distribution.map((d) => (
              <StarBar key={d.stars} stars={d.stars} count={d.count} total={summary.totalReviews} />
            ))}
          </div>
        </div>
      )}

      {/* Write review */}
      {user && user.id !== sellerId && (
        <div>
          {!showForm ? (
            <Button variant="outline" onClick={() => { setShowForm(true) }}>Write a Review</Button>
          ) : (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h4 className="font-semibold text-card-foreground">Write Your Review</h4>
              {error && <Alert variant="error">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Rating</label>
                <Rating value={newRating} onChange={setNewRating} variant="input" size="lg" />
              </div>
              <div>
                <label htmlFor="review-title" className="block text-sm text-muted-foreground mb-1">Title (optional)</label>
                <input
                  id="review-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => { setNewTitle(e.target.value) }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                  placeholder="Summarize your experience"
                />
              </div>
              <div>
                <label htmlFor="review-body" className="block text-sm text-muted-foreground mb-1">Review (optional)</label>
                <textarea
                  id="review-body"
                  value={newBody}
                  onChange={(e) => { setNewBody(e.target.value) }}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                  placeholder="Share details about your purchase"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => { void handleSubmitReview() }} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
                <Button variant="outline" onClick={() => { setShowForm(false) }}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-2 border-b border-border/50 pb-4">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <>
          <div>
            {reviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                {...(user?.id ? { currentUserId: user.id } : {})}
                onDelete={(id) => { void handleDelete(id) }}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
      )}
    </div>
  )
}
