import type { Review } from '@prisma/client';

export interface SerializedReview {
  readonly id: string;
  readonly listingId: string;
  readonly reviewerId: string;
  readonly sellerId: string;
  readonly rating: number;
  readonly title: string | null;
  readonly body: string | null;
  readonly images: readonly string[];
  readonly verifiedPurchase: boolean;
  readonly helpfulCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly reviewer?: {
    readonly id: string;
    readonly displayName: string;
    readonly avatarUrl: string | null;
  };
}

export type ReviewWithRelations = Review & {
  reviewer?: { id: string; displayName: string; avatarUrl: string | null };
};

export function serializeReview(review: ReviewWithRelations): SerializedReview {
  return {
    id: review.id,
    listingId: review.listingId,
    reviewerId: review.reviewerId,
    sellerId: review.sellerId,
    rating: review.rating,
    title: review.title,
    body: review.body,
    images: review.images,
    verifiedPurchase: review.verifiedPurchase,
    helpfulCount: review.helpfulCount,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    ...(review.reviewer
      ? {
          reviewer: {
            id: review.reviewer.id,
            displayName: review.reviewer.displayName,
            avatarUrl: review.reviewer.avatarUrl,
          },
        }
      : {}),
  };
}

export interface ReviewSummary {
  readonly averageRating: number;
  readonly totalReviews: number;
  readonly distribution: readonly { stars: number; count: number }[];
}

export function buildReviewSummary(
  reviews: readonly { rating: number }[],
  counts: readonly { rating: number; _count: number }[],
): ReviewSummary {
  const total = reviews.length;
  const avg = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts.find((c) => c.rating === stars)?._count ?? 0,
  }));

  return {
    averageRating: Math.round(avg * 10) / 10,
    totalReviews: total,
    distribution,
  };
}
