"use client"
import { Avatar, Badge, Card, CardContent, EmptyState, Pagination, Rating, Skeleton } from '@marketplace/ui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import useAuth from '../../../../hooks/useAuth';
import { getSellerReviews, type ReviewData } from '../../../../lib/marketplaceApi';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Rating Distribution ─────────────────────────────────────────────────────

interface DistributionBarProps {
  stars: number;
  count: number;
  total: number;
  onFilter: (stars: number | null) => void;
  active: number | null;
}

function DistributionBar({ stars, count, total, onFilter, active }: DistributionBarProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const isActive = active === stars;
  return (
    <button
      type="button"
      onClick={() => { onFilter(isActive ? null : stars); }}
      className={`flex items-center gap-2 w-full rounded px-1.5 py-0.5 text-sm transition-colors ${isActive ? 'bg-brand-gold/10' : 'hover:bg-muted/50'}`}
      aria-label={`Filter by ${String(stars)} stars`}
    >
      <span className="w-4 text-right text-xs font-medium text-muted-foreground">{String(stars)}</span>
      <svg className="h-3.5 w-3.5 shrink-0 text-brand-gold" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-brand-gold transition-all" style={{ width: `${String(pct)}%` }} />
      </div>
      <span className="w-8 text-right text-xs text-muted-foreground">{String(count)}</span>
    </button>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SellerReviewsPage() {
  const user = useAuth((s) => s.user);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getSellerReviews(user.id, { page, limit: 10 });
      setReviews(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalCount(res.meta.total);
    } catch {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [user, page]);

  useEffect(() => { void fetchReviews(); }, [fetchReviews]);

  // Client-computed stats
  const stats = useMemo(() => {
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    for (const r of reviews) {
      const stars = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
      dist[stars] = (dist[stars] ?? 0) + 1;
      sum += r.rating;
    }
    const avg = reviews.length > 0 ? sum / reviews.length : 0;
    return { average: avg, distribution: dist };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (ratingFilter === null) return reviews;
    return reviews.filter((r) => Math.round(r.rating) === ratingFilter);
  }, [reviews, ratingFilter]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground">What buyers say about your listings.</p>
      </div>

      {/* Summary + Distribution */}
      <div className="grid gap-6 fashion-md:grid-cols-3">
        {/* Average Rating Card */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            {loading ? (
              <Skeleton className="h-20 w-32" />
            ) : reviews.length === 0 ? (
              <div className="text-center">
                <p className="text-4xl font-bold text-muted-foreground">—</p>
                <p className="mt-1 text-sm text-muted-foreground">No reviews yet</p>
              </div>
            ) : (
              <>
                <p className="text-5xl font-bold tracking-tight">{stats.average.toFixed(1)}</p>
                <Rating value={stats.average} size="md" readOnly className="mt-2" />
                <p className="mt-2 text-sm text-muted-foreground">{String(totalCount)} review{totalCount !== 1 ? 's' : ''}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Distribution */}
        <Card className="fashion-md:col-span-2">
          <CardContent className="py-6">
            <h3 className="mb-3 text-sm font-semibold">Rating Breakdown</h3>
            {loading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
              </div>
            ) : (
              <div className="space-y-1.5">
                {([5, 4, 3, 2, 1] as const).map((stars) => (
                  <DistributionBar
                    key={stars}
                    stars={stars}
                    count={stats.distribution[stars] ?? 0}
                    total={reviews.length}
                    onFilter={setRatingFilter}
                    active={ratingFilter}
                  />
                ))}
              </div>
            )}
            {ratingFilter !== null && (
              <button
                type="button"
                onClick={() => { setRatingFilter(null); }}
                className="mt-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear filter
              </button>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
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
                        <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                      </div>
                      <Rating value={review.rating} size="sm" readOnly />
                    </div>
                    {review.title && <p className="font-semibold text-sm text-card-foreground">{review.title}</p>}
                    {review.body && <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      {review.verifiedPurchase && (
                        <Badge variant="success">Verified Purchase</Badge>
                      )}
                      {review.helpfulCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {String(review.helpfulCount)} found helpful
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              }
              title={ratingFilter !== null ? `No ${String(ratingFilter)}-star reviews` : 'No reviews yet'}
              description={ratingFilter !== null ? 'Try clearing the filter.' : 'Reviews will appear once buyers purchase your listings.'}
            />
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
