import { Avatar, Badge, Tag, cn } from '@marketplace/ui'
import Link from 'next/link'
import React from 'react'

import FollowButton from './FollowButton'
import type { SellerType } from './SellerCover'
import ShareButton from './ShareButton'

export interface SellerProfileData {
  id: string
  displayName: string
  avatarUrl?: string | null | undefined
  bio?: string | null | undefined
  location?: string | null | undefined
  sellerType?: SellerType | null | undefined
  specialties?: string[] | undefined
  emailVerifiedAt?: string | null | undefined
  phoneVerifiedAt?: string | null | undefined
  isVerified?: boolean | undefined
  isVerifiedDesigner?: boolean | undefined
  businessName?: string | null | undefined
  rating?: number | null | undefined
  reviewCount?: number | undefined
  responseTimeHours?: number | null | undefined
  createdAt: string
  followerCount?: number | undefined
  _count?: { 
    listings?: number | undefined
    followers?: number | undefined
    storeFollowers?: number | undefined
  } | undefined
}

export interface SellerProfileCardProps {
  seller: SellerProfileData
  isFollowing?: boolean
  className?: string
}

const sellerTypeLabels: Record<string, string> = {
  designer: 'Designer',
  tailor: 'Tailor',
  boutique: 'Boutique',
  'rental-shop': 'Rental Shop',
  rental_shop: 'Rental Shop',
}

const sellerTypeAccent: Record<string, string> = {
  designer: 'border-brand-wine',
  tailor: 'border-brand-terra',
  boutique: 'border-brand-green',
  'rental-shop': 'border-brand-gold',
  rental_shop: 'border-brand-gold',
}

function formatResponseTime(hours: number): string {
  if (hours < 1) return 'within minutes'
  if (hours === 1) return 'within an hour'
  if (hours <= 2) return 'within 2 hours'
  if (hours < 24) return `within ${String(hours)} hours`
  const days = Math.round(hours / 24)
  return `within ${String(days)} day${days > 1 ? 's' : ''}`
}

export default function SellerProfileCard({ seller, isFollowing, className }: SellerProfileCardProps) {
  const isVerified =
    seller.isVerified ??
    Boolean(seller.emailVerifiedAt != null || seller.phoneVerifiedAt != null || seller.isVerifiedDesigner)
  const typeKey = seller.sellerType ?? 'designer'
  const typeLabel = sellerTypeLabels[typeKey] ?? 'Seller'
  const accentClass = sellerTypeAccent[typeKey] ?? 'border-border'
  const memberSince = new Date(seller.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  const followerCount = seller._count?.storeFollowers ?? seller._count?.followers ?? seller.followerCount ?? 0
  const reviewCount = seller.reviewCount ?? 0
  const hasRating = reviewCount > 0 && seller.rating != null
  const activeListingCount = seller._count?.listings ?? 0

  return (
    <div
      className={cn(
        'relative z-10 -mt-16 sm:-mt-20 md:-mt-24 mx-auto max-w-5xl px-4 sm:px-6',
        className
      )}
    >
      <div className={cn('rounded-xl border-2 bg-card shadow-lg p-6 sm:p-8', accentClass)}>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0 -mt-12 sm:-mt-16">
            <div className="rounded-full border-4 border-card bg-card shadow-md">
              <Avatar
                name={seller.displayName}
                {...(seller.avatarUrl !== undefined && { src: seller.avatarUrl })}
                size="lg"
              />
            </div>
          </div>

          {/* Identity block */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Name row */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-card-foreground">
                {seller.displayName}
              </h1>
              {isVerified && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                  title="Verified Seller"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Verified Seller</span>
                </span>
              )}
              <Badge variant="secondary" className="text-xs">{typeLabel}</Badge>
            </div>

            {/* Rating + Location + Member Since */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              {/* Rating / Reviews */}
              {hasRating ? (
                <a
                  href="#reviews"
                  className="flex items-center gap-1 text-foreground font-medium hover:text-primary transition-colors"
                  aria-label={`${seller.rating?.toFixed(1)} stars out of ${reviewCount} reviews`}
                >
                  <span className="text-amber-500">★</span>
                  <span>{seller.rating?.toFixed(1)}</span>
                  <span className="text-muted-foreground font-normal">
                    ({String(reviewCount)} {reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">No reviews yet</span>
              )}

              {/* Location */}
              {seller.location && (
                <>
                  <span className="text-border" aria-hidden="true">•</span>
                  <span className="flex items-center gap-1">
                    <span>📍</span>
                    <span>{seller.location}</span>
                  </span>
                </>
              )}

              <span className="text-border" aria-hidden="true">•</span>

              {/* Joined */}
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Joined {memberSince}
              </span>

              {activeListingCount > 0 && (
                <>
                  <span className="text-border" aria-hidden="true">•</span>
                  <span className="font-medium text-foreground">
                    {String(activeListingCount)} active {activeListingCount === 1 ? 'listing' : 'listings'}
                  </span>
                </>
              )}
            </div>

            {/* Real response time if tracked */}
            {seller.responseTimeHours != null && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                <svg className="h-4 w-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Typically replies {formatResponseTime(seller.responseTimeHours)}</span>
              </p>
            )}

            {/* Specialties */}
            {seller.specialties && seller.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {seller.specialties.slice(0, 5).map((s) => (
                  <Tag key={s} size="sm" variant="outline">{s}</Tag>
                ))}
              </div>
            )}

            {/* Bio */}
            {seller.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{seller.bio}</p>
            )}

            {/* Actions row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href={`/dashboard/messages?seller=${seller.id}`}>
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 h-9',
                    'text-sm font-medium transition-colors hover:bg-primary/90 shadow-xs'
                  )}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message Seller
                </button>
              </Link>
              <FollowButton
                storeId={seller.id}
                initialIsFollowing={isFollowing ?? false}
                initialFollowerCount={followerCount}
              />
              <ShareButton title={seller.displayName} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
