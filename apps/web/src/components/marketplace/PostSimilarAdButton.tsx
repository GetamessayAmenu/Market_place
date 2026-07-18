'use client'

import { Button } from '@marketplace/ui'
import { useRouter } from 'next/navigation'
import React from 'react'

export interface PostSimilarAdButtonProps {
  categorySlug?: string | undefined
  className?: string
}

export default function PostSimilarAdButton({ categorySlug, className }: PostSimilarAdButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    // Navigate to create listing page, optionally pre-fill category
    const url = categorySlug 
      ? `/dashboard/seller/create?category=${categorySlug}`
      : '/dashboard/seller/create'
    router.push(url)
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className={className}
      size="lg"
    >
      <svg
        className="h-5 w-5 mr-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
      Post Ad Like This
    </Button>
  )
}
