"use client"
import React from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Store,
  Tag,
  ShoppingBag,
  Clock,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'
import type { DashboardKpiMetric } from '../../lib/adminApi'

interface PrimaryKpiCardProps {
  title: string
  metric?: DashboardKpiMetric | undefined
  icon: 'users' | 'sellers' | 'listings' | 'orders' | 'rentals' | 'customOrders'
  href: string
  isLoading?: boolean
}

export default function PrimaryKpiCard({
  title,
  metric,
  icon,
  href,
  isLoading = false,
}: PrimaryKpiCardProps) {
  const getIcon = () => {
    switch (icon) {
      case 'users':
        return <Users className="h-6 w-6" />
      case 'sellers':
        return <Store className="h-6 w-6" />
      case 'listings':
        return <Tag className="h-6 w-6" />
      case 'orders':
        return <ShoppingBag className="h-6 w-6" />
      case 'rentals':
        return <Clock className="h-6 w-6" />
      case 'customOrders':
        return <Sparkles className="h-6 w-6" />
      default:
        return <Users className="h-6 w-6" />
    }
  }

  if (isLoading || !metric) {
    return (
      <div className="overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded-lg bg-muted" />
          <div className="h-10 w-10 rounded-2xl bg-muted" />
        </div>
        <div className="mt-4 h-8 w-20 rounded-xl bg-muted" />
        <div className="mt-3 h-4 w-32 rounded-lg bg-muted" />
      </div>
    )
  }

  const { current, pctChange, trend, comparisonLabel } = metric

  const isUp = trend === 'up'
  const isDown = trend === 'down'

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {current.toLocaleString()}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition group-hover:scale-105 ${
            icon === 'users'
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
              : icon === 'sellers'
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
              : icon === 'listings'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              : icon === 'orders'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : icon === 'rentals'
              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }`}
        >
          {getIcon()}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          {pctChange !== null && comparisonLabel !== 'No comparison data' ? (
            <>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isUp
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : isDown
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isUp ? (
                  <TrendingUp className="h-3 w-3" />
                ) : isDown ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {isUp ? '+' : ''}
                {pctChange}%
              </span>
              <span className="text-[11px] text-muted-foreground truncate max-w-[130px]">
                {comparisonLabel}
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No comparison baseline</span>
          )}
        </div>

        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  )
}
