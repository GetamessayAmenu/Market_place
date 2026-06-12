"use client"

import { cn } from '@marketplace/ui'
import React, { useState } from 'react'

import { useToggleFavorite } from '../../hooks/useFavorites'

interface FavoriteButtonProps {
  listingId: string
  isFavorited?: boolean
}

export default function FavoriteButton({ listingId, isFavorited: initialFavorited }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited ?? false)
  const toggleFavorite = useToggleFavorite()

  const handleClick = async () => {
    setIsFavorited((prev) => !prev)
    try {
      await toggleFavorite.mutateAsync({ listingId, isFavorited })
    } catch {
      // Revert on error
      setIsFavorited((prev) => !prev)
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleClick()
      }}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
        isFavorited
          ? 'border-destructive bg-destructive/10 text-destructive'
          : 'border-border bg-card text-card-foreground hover:bg-accent'
      )}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFavorited}
    >
      <svg
        className="h-4 w-4"
        fill={isFavorited ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {isFavorited ? 'Saved' : 'Save'}
    </button>
  )
}
