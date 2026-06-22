import { cn } from '@marketplace/ui'
import React from 'react'

export type SellerType = 'designer' | 'tailor' | 'boutique' | 'rental-shop'

export interface SellerCoverProps {
  coverImageUrl?: string | null
  sellerType?: SellerType
  className?: string
}

const typeGradients: Record<SellerType, string> = {
  designer: 'from-brand-wine/80 via-brand-terra/60 to-brand-gold/40',
  tailor: 'from-brand-terra/80 via-brand-gold/60 to-brand-green/40',
  boutique: 'from-brand-green/80 via-brand-gold/60 to-brand-terra/40',
  'rental-shop': 'from-brand-gold/80 via-brand-terra/60 to-brand-wine/40',
}

const typeFallbackBg: Record<SellerType, string> = {
  designer: 'bg-brand-wine/10',
  tailor: 'bg-brand-terra/10',
  boutique: 'bg-brand-green/10',
  'rental-shop': 'bg-brand-gold/10',
}

/**
 * Full-bleed cover banner for seller profiles.
 * Shows uploaded cover image when available; otherwise a gradient keyed to seller type.
 */
export default function SellerCover({ coverImageUrl, sellerType = 'designer', className }: SellerCoverProps) {
  const hasCover = coverImageUrl != null && coverImageUrl.length > 0

  return (
    <div
      className={cn(
        'relative w-full h-48 sm:h-56 md:h-64 lg:h-72 overflow-hidden',
        !hasCover && typeFallbackBg[sellerType],
        className
      )}
      role="banner"
    >
      {hasCover ? (
        <img
          src={coverImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
      ) : (
        <div className={cn('absolute inset-0 bg-gradient-to-br', typeGradients[sellerType])} />
      )}

      {/* Bottom gradient fade for profile card overlap */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" aria-hidden="true" />
    </div>
  )
}
