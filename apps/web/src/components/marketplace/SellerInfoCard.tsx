'use client'

import { Avatar, Badge } from '@marketplace/ui'
import Link from 'next/link'
import React from 'react'

import TrustBadges from './TrustBadges'

export interface SellerInfoCardProps {
  seller: {
    id: string
    name: string
    avatarUrl?: string | null
    emailVerifiedAt?: string | null
    phoneVerifiedAt?: string | null
    createdAt?: string
  }
  responseTime?: string
  className?: string
}

function getMemberDuration(createdAt?: string): string {
  if (!createdAt) return 'New member'
  
  const created = new Date(createdAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - created.getTime())
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30))
  
  if (diffMonths < 1) return 'Less than a month'
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} on Marketplace`
  
  const years = Math.floor(diffMonths / 12)
  return `${years} year${years > 1 ? 's' : ''} on Marketplace`
}

export default function SellerInfoCard({ seller, responseTime, className }: SellerInfoCardProps) {
  const memberDuration = getMemberDuration(seller.createdAt)
  const hasVerification = Boolean(seller.emailVerifiedAt || seller.phoneVerifiedAt)

  return (
    <div className={className}>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        {/* Seller Profile */}
        <Link href={`/sellers/${seller.id}`} className="flex items-center gap-4 group">
          <Avatar
            name={seller.name}
            {...(seller.avatarUrl !== undefined ? { src: seller.avatarUrl } : {})}
            size="xl"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-card-foreground group-hover:text-primary transition-colors">
                {seller.name}
              </h3>
              {hasVerification && (
                <svg
                  className="h-5 w-5 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-label="Verified"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{memberDuration}</p>
          </div>
        </Link>

        {/* Response Time */}
        {responseTime && (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <svg
                className="h-4 w-4 text-green-600 dark:text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-foreground">Quick Responder</p>
              <p className="text-muted-foreground">{responseTime}</p>
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <TrustBadges
          emailVerified={Boolean(seller.emailVerifiedAt)}
          phoneVerified={Boolean(seller.phoneVerifiedAt)}
          memberSince={seller.createdAt ? new Date(seller.createdAt).getFullYear().toString() : undefined}
        />

        {/* View Profile Link */}
        <Link
          href={`/sellers/${seller.id}`}
          className="block w-full rounded-lg border-2 border-primary bg-transparent py-2.5 text-center text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          View Seller Profile
        </Link>
      </div>
    </div>
  )
}
