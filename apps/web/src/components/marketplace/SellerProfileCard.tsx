import { Avatar, Badge, Tag, cn } from '@marketplace/ui'
import Link from 'next/link'
import React from 'react'

import FollowButton from './FollowButton'
import type { SellerType } from './SellerCover'
import ShareButton from './ShareButton'

export interface SellerProfileData {
  id: string
  displayName: string
  avatarUrl?: string | null
  bio?: string | null
  location?: string | null
  sellerType?: SellerType | null
  specialties?: string[]
  emailVerifiedAt?: string | null
  phoneVerifiedAt?: string | null
  createdAt: string
  followerCount?: number
  _count?: { 
    listings?: number
    followers?: number
    storeFollowers?: number 
  }
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

export default function SellerProfileCard({ seller, isFollowing, className }: SellerProfileCardProps) {
  const isVerified = seller.emailVerifiedAt != null || seller.phoneVerifiedAt != null
  const typeKey = seller.sellerType ?? 'designer'
  const typeLabel = sellerTypeLabels[typeKey] ?? 'Seller'
  const accentClass = sellerTypeAccent[typeKey] ?? 'border-border'
  const memberSince = new Date(seller.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  const followerCount = seller._count?.followers ?? seller.followerCount ?? 0

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
                <span className="flex-shrink-0 text-brand-gold" title="Verified seller">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              <Badge variant="secondary" className="text-xs">{typeLabel}</Badge>
            </div>

            {/* Location + member since */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {seller.location && (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {seller.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Joined {memberSince}
              </span>
            </div>

            {/* Specialties */}
            {seller.specialties && seller.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
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
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <FollowButton
                storeId={seller.id}
                initialIsFollowing={isFollowing ?? false}
                initialFollowerCount={followerCount}
              />
              <Link href={`/dashboard/messages?seller=${seller.id}`}>
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 h-9',
                    'text-sm font-medium transition-colors hover:bg-accent/10 hover:text-accent-foreground'
                  )}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message
                </button>
              </Link>
              <ShareButton title={seller.displayName} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
