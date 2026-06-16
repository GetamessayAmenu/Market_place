import { Avatar, Rating, cn } from '@marketplace/ui';
import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReviewData {
  id: string;
  reviewerName: string;
  reviewerAvatar?: string | null;
  rating: number;
  date: string;
  text: string;
  helpfulCount?: number;
  images?: string[];
  verified?: boolean;
}

export interface ReviewProps {
  review: ReviewData;
  onHelpful?: (id: string) => void;
  className?: string;
}

export interface ReviewListProps {
  reviews: ReviewData[];
  onHelpful?: (id: string) => void;
  className?: string;
}

export interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
  distribution: { stars: number; count: number }[];
  className?: string;
}

// ─── Single Review ────────────────────────────────────────────────────────────

function Review({ review, onHelpful, className }: ReviewProps) {
  const formattedDate = new Date(review.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className={cn('border-b border-border/50 py-5 last:border-b-0', className)} aria-label={'Review by ' + review.reviewerName}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar
          name={review.reviewerName}
          {...(review.reviewerAvatar !== null && review.reviewerAvatar !== undefined ? { src: review.reviewerAvatar } : {})}
          size="sm"
          {...(review.verified ? { verified: true } : {})}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{review.reviewerName}</p>
              <Rating value={review.rating} size="sm" variant="display" />
            </div>
            <time dateTime={review.date} className="text-xs text-muted-foreground flex-shrink-0">
              {formattedDate}
            </time>
          </div>

          {/* Review text */}
          <p className="mt-2 text-sm text-foreground/90 leading-relaxed">{review.text}</p>

          {/* Review images */}
          {review.images && review.images.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto" role="list" aria-label="Review photos">
              {review.images.map((img, i) => (
                <div key={img} className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-muted" role="listitem">
                  <img src={img} alt={'Review photo ' + String(i + 1)} className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          )}

          {/* Helpful button */}
          {onHelpful && (
            <button
              type="button"
              onClick={() => { onHelpful(review.id); }}
              className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              Helpful
              {review.helpfulCount !== undefined && review.helpfulCount > 0 && (
                <span className="font-medium">({String(review.helpfulCount)})</span>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Review List ──────────────────────────────────────────────────────────────

function ReviewList({ reviews, onHelpful, className }: ReviewListProps) {
  if (reviews.length === 0) return null;

  return (
    <div className={cn('divide-y divide-border/30', className)} role="list" aria-label="Customer reviews">
      {reviews.map((review) => (
        <Review key={review.id} review={review} {...(onHelpful ? { onHelpful } : {})} />
      ))}
    </div>
  );
}

// ─── Review Summary ───────────────────────────────────────────────────────────

function ReviewSummary({ averageRating, totalReviews, distribution, className }: ReviewSummaryProps) {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="font-display text-3xl font-bold text-foreground">{averageRating.toFixed(1)}</p>
          <Rating value={averageRating} variant="display" size="sm" />
          <p className="mt-1 text-xs text-muted-foreground">
            {String(totalReviews)} review{totalReviews !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Distribution bars */}
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const item = distribution.find((d) => d.stars === star);
            const count = item?.count ?? 0;
            const pct = (count / maxCount) * 100;

            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-3 text-right text-xs text-muted-foreground">{String(star)}</span>
                <svg className="h-3 w-3 text-brand-gold" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand-gold transition-all duration-500"
                    style={{ width: String(pct) + '%' }}
                    aria-hidden="true"
                  />
                </div>
                <span className="w-6 text-right text-xs text-muted-foreground">{String(count)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { Review, ReviewList, ReviewSummary };
