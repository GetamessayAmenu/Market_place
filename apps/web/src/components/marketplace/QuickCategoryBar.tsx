"use client"
import { cn } from '@marketplace/ui'
import { useRouter } from 'next/navigation'
import React from 'react'

interface QuickCategory {
  id: string
  name: string
  slug: string
}

export interface QuickCategoryBarProps {
  categories: QuickCategory[]
  className?: string
}

export default function QuickCategoryBar({ categories, className }: QuickCategoryBarProps) {
  const router = useRouter()

  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-2 scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
      role="navigation"
      aria-label="Quick category links"
    >
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => { router.push(`/categories/${cat.slug}`) }}
          className={cn(
            'flex-shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium',
            'border-border bg-background text-foreground',
            'transition-colors hover:bg-accent hover:border-accent-foreground/20',
            'whitespace-nowrap'
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
