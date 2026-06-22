import { cn } from '@marketplace/ui'
import React from 'react'

export interface SellerStatsData {
  listingCount?: number
  reviewCount?: number
  averageRating?: number
  totalSales?: number
  responseRate?: number | null
  responseTimeHours?: number | null
}

export interface SellerStatsProps {
  stats: SellerStatsData
  className?: string
}

interface StatCardProps {
  value: string
  label: string
  icon: React.ReactNode
}

function StatCard({ value, label, icon }: StatCardProps) {
  return (
    <div className="flex flex-col items-center rounded-lg border bg-card p-4 text-center transition-colors hover:bg-accent/5">
      <div className="mb-2 text-muted-foreground">{icon}</div>
      <p className="text-xl sm:text-2xl font-bold text-card-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

function formatResponseTime(hours: number): string {
  if (hours < 1) return '< 1hr'
  if (hours === 1) return '1 hour'
  if (hours < 24) return `${String(hours)} hrs`
  const days = Math.round(hours / 24)
  return `${String(days)} day${days > 1 ? 's' : ''}`
}

export default function SellerStats({ stats, className }: SellerStatsProps) {
  const cards: StatCardProps[] = [
    {
      value: String(stats.listingCount ?? 0),
      label: 'Listings',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      value: String(stats.reviewCount ?? 0),
      label: 'Reviews',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      value: stats.averageRating != null ? stats.averageRating.toFixed(1) : '—',
      label: 'Rating',
      icon: (
        <svg className="h-5 w-5 fill-brand-gold text-brand-gold" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ),
    },
    {
      value: stats.totalSales != null ? String(stats.totalSales) : '—',
      label: 'Items Sold',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      value: stats.responseRate != null ? `${String(stats.responseRate)}%` : '—',
      label: 'Response Rate',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      value: stats.responseTimeHours != null ? formatResponseTime(stats.responseTimeHours) : '—',
      label: 'Response Time',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  return (
    <div className={cn('grid grid-cols-3 sm:grid-cols-6 gap-3', className)}>
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  )
}
