"use client"

import { cn } from '@marketplace/ui'
import Link from 'next/link'
import React, { useState } from 'react'

export type ListingType = 'buy' | 'rent' | 'custom'

export interface ListingCardProps {
  id: string
  title: string
  price: number
  currency?: 'ETB' | 'USD' | 'EUR' | string | undefined
  imageUrl?: string | null | undefined
  listingType?: ListingType | undefined
  activeMode?: 'buy' | 'rent' | 'custom' | undefined
  designerName?: string | undefined
  designerAvatar?: string | null | undefined
  designerId?: string | undefined
  location?: string | null | undefined
  verifiedSeller?: boolean | undefined
  rating?: number | string | null | undefined
  status?: 'new-arrival' | 'featured' | 'sold-out' | undefined
  isFavorited?: boolean | undefined
  onToggleFavorite?: (() => void) | undefined
  originalPrice?: number | undefined
  discount?: number | undefined
  className?: string | undefined
  supportsReadyMade?: boolean | undefined
  supportsCustomDesign?: boolean | undefined
  customOrderAvailable?: boolean | undefined
  startingCustomPrice?: number | null | undefined
  availableForPurchase?: boolean | undefined
  availableForRent?: boolean | undefined
  rentalPricePerDay?: number | null | undefined
}

export default function ListingCard({
  id,
  title,
  price,
  currency = 'ETB',
  imageUrl,
  listingType: _listingType,
  activeMode,
  designerName,
  designerAvatar: _designerAvatar,
  designerId: _designerId,
  location,
  verifiedSeller = false,
  rating,
  status,
  isFavorited: initialFavorited = false,
  onToggleFavorite,
  originalPrice: _originalPrice,
  discount: _discount,
  className,
  supportsReadyMade = true,
  supportsCustomDesign = false,
  customOrderAvailable = false,
  startingCustomPrice,
  availableForRent = false,
  rentalPricePerDay,
}: ListingCardProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const isSold = status === 'sold-out'

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorited(!favorited)
    onToggleFavorite?.()
  }

  const showCustomBadge = supportsCustomDesign || customOrderAvailable

  // Format Price Label per Mode
  const renderPriceText = () => {
    if (activeMode === 'rent' || (availableForRent && rentalPricePerDay)) {
      const displayRent = rentalPricePerDay ? Number(rentalPricePerDay) : price
      return (
        <div className="font-bold text-emerald-700 text-sm sm:text-base flex items-center gap-1">
          <span>{displayRent.toLocaleString()} {currency}</span>
          <span className="text-xs font-normal text-muted-foreground">/ day</span>
        </div>
      )
    }

    if (activeMode === 'custom' || (showCustomBadge && startingCustomPrice)) {
      const displayCustom = startingCustomPrice ? Number(startingCustomPrice) : price
      return (
        <div className="font-bold text-emerald-700 text-sm sm:text-base flex flex-col">
          <span>{displayCustom.toLocaleString()} {currency}</span>
          <span className="text-[11px] font-normal text-emerald-600">Custom Order Starting Price</span>
        </div>
      )
    }

    return (
      <div className="font-bold text-foreground text-sm sm:text-base">
        {price.toLocaleString()} {currency}
      </div>
    )
  }

  return (
    <Link href={'/listings/' + id} className="group block" aria-label={title}>
      <article
        className={cn(
          'relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs',
          'transition-all duration-300 hover:shadow-md hover:-translate-y-1',
          className
        )}
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-muted to-emerald-100/40 text-muted-foreground p-4 text-center">
              <svg className="h-10 w-10 text-emerald-600/40 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium text-muted-foreground">Habesha Fashion</span>
            </div>
          )}

          {/* Sold out overlay */}
          {isSold && (
            <div className="absolute inset-0 bg-foreground/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-xs font-bold text-white uppercase tracking-wider px-3 py-1 bg-black/40 rounded-full">
                Sold Out
              </span>
            </div>
          )}

          {/* Floating Wishlist Heart Button */}
          {!isSold && (
            <button
              type="button"
              className={cn(
                'absolute right-2.5 top-2.5 rounded-full bg-white/90 backdrop-blur-md p-2 shadow-sm',
                'transition-all duration-200 hover:scale-110 hover:bg-white',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600'
              )}
              aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
              onClick={handleFavoriteClick}
            >
              <svg
                className={cn('h-4 w-4 transition-colors', favorited ? 'fill-red-500 text-red-500' : 'text-gray-600')}
                fill={favorited ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Content Details */}
        <div className="p-3.5 space-y-1.5">
          {/* Title */}
          <h3 className="font-semibold text-foreground truncate text-sm sm:text-base group-hover:text-emerald-700 transition-colors">
            {title}
          </h3>

          {/* Price */}
          {renderPriceText()}

          {/* Location & Seller info */}
          {(location || designerName) && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              {location && (
                <p className="flex items-center gap-1 text-muted-foreground/80">
                  <span>📍</span>
                  <span className="truncate">{location}</span>
                </p>
              )}
              {designerName && (
                <p className="font-medium text-foreground/80 truncate">{designerName}</p>
              )}
            </div>
          )}

          {/* Verified Seller & Rating Badges */}
          {(verifiedSeller || rating) && (
            <div className="flex items-center justify-between text-xs pt-0.5">
              {verifiedSeller ? (
                <span className="flex items-center gap-1 font-medium text-emerald-600">
                  <svg className="h-3.5 w-3.5 fill-emerald-600" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Verified Seller</span>
                </span>
              ) : <div />}

              {rating && (
                <span className="flex items-center gap-1 font-semibold text-amber-600 ml-auto">
                  <span>★</span>
                  <span>{rating}</span>
                </span>
              )}
            </div>
          )}

          {/* Capability Badges at bottom */}
          <div className="flex items-center gap-1.5 pt-1">
            {supportsReadyMade && (
              <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-emerald-200/50">
                Buy
              </span>
            )}
            {availableForRent && (
              <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-emerald-200/50">
                Rent
              </span>
            )}
            {showCustomBadge && (
              <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-emerald-200/50">
                Custom
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
