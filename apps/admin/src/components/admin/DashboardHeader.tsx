"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell,
  RefreshCw,
  Calendar,
  Clock,
} from 'lucide-react'

interface DashboardHeaderProps {
  range: string
  onRangeChange: (range: string, customFrom?: string, customTo?: string) => void
  onRefresh: () => void
  isRefreshing: boolean
  lastUpdated: string
  unreadNotificationsCount?: number | undefined
  autoRefreshEnabled?: boolean | undefined
  onToggleAutoRefresh?: ((enabled: boolean) => void) | undefined
}

export default function DashboardHeader({
  range,
  onRangeChange,
  onRefresh,
  isRefreshing,
  lastUpdated,
  unreadNotificationsCount = 0,
  autoRefreshEnabled = true,
  onToggleAutoRefresh,
}: DashboardHeaderProps) {
  const [showCustomRange, setShowCustomRange] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [formattedTime, setFormattedTime] = useState('')

  useEffect(() => {
    if (lastUpdated) {
      const dt = new Date(lastUpdated)
      setFormattedTime(dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
  }, [lastUpdated])

  const handleRangeClick = (selectedRange: string) => {
    if (selectedRange === 'custom') {
      setShowCustomRange(!showCustomRange)
    } else {
      setShowCustomRange(false)
      onRangeChange(selectedRange)
    }
  }

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (fromDate) {
      onRangeChange('custom', fromDate, toDate || new Date().toISOString().split('T')[0])
      setShowCustomRange(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Marketplace
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Marketplace performance, actionable items, transactions & operational health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Last updated indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-xl border border-border">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Updated {formattedTime || 'just now'}</span>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-input bg-background px-3.5 py-2 text-sm font-medium text-foreground transition hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`h-4 w-4 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Auto Refresh Toggle */}
          {onToggleAutoRefresh && (
            <button
              type="button"
              onClick={() => onToggleAutoRefresh(!autoRefreshEnabled)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                autoRefreshEnabled
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
              title="Toggle 30s auto-refresh"
            >
              <span className={`h-2 w-2 rounded-full ${autoRefreshEnabled ? 'bg-emerald-500 animate-ping' : 'bg-muted-foreground'}`} />
              <span>{autoRefreshEnabled ? 'Auto 30s' : 'Auto off'}</span>
            </button>
          )}

          {/* Date Range Selector */}
          <div className="relative inline-flex rounded-xl border border-border bg-card p-1 shadow-sm">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: 'custom', label: 'Custom' },
            ].map((item) => {
              const isActive = range === item.id || (range.startsWith('Custom') && item.id === 'custom')
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRangeClick(item.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* Notifications Shortcut */}
          <Link
            href="/admin/notifications-broadcasts"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-accent/50 shadow-sm"
            title="Notifications & Broadcasts"
          >
            <Bell className="h-4 w-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Custom Date Range Form Modal/Bar */}
      {showCustomRange && (
        <form onSubmit={handleApplyCustom} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Custom Range:</span>
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            required
            className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            Apply Range
          </button>
          <button
            type="button"
            onClick={() => setShowCustomRange(false)}
            className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  )
}
