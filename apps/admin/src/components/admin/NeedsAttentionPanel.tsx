"use client"
import React from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ShieldAlert,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  MessageSquareWarning,
  Scale,
  Clock,
  Sparkles,
} from 'lucide-react'
import type { NeedsAttentionItem } from '../../lib/adminApi'

interface NeedsAttentionPanelProps {
  items?: NeedsAttentionItem[] | undefined
  isLoading?: boolean | undefined
}

export default function NeedsAttentionPanel({ items: rawItems = [], isLoading = false }: NeedsAttentionPanelProps) {
  const items: NeedsAttentionItem[] = Array.isArray(rawItems)
    ? rawItems
    : (rawItems as any)?.data && Array.isArray((rawItems as any).data)
    ? (rawItems as any).data
    : []
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-6 w-48 rounded-lg bg-muted" />
        <div className="space-y-3">
          <div className="h-16 rounded-2xl bg-muted" />
          <div className="h-16 rounded-2xl bg-muted" />
        </div>
      </div>
    )
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Listings':
        return <FileCheck className="h-5 w-5 text-amber-500" />
      case 'Moderation':
        return <ShieldAlert className="h-5 w-5 text-rose-500" />
      case 'Safety':
        return <MessageSquareWarning className="h-5 w-5 text-rose-500" />
      case 'Disputes':
        return <Scale className="h-5 w-5 text-purple-500" />
      case 'Users':
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />
      case 'Rentals':
        return <Clock className="h-5 w-5 text-sky-500" />
      case 'Custom Orders':
        return <Sparkles className="h-5 w-5 text-indigo-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
    }
  }

  const getSeverityBadge = (severity: 'urgent' | 'warning' | 'info') => {
    switch (severity) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
            Urgent
          </span>
        )
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Warning
          </span>
        )
      case 'info':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Action Needed
          </span>
        )
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm relative overflow-hidden">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Needs Attention</h2>
            <p className="text-xs text-muted-foreground">Actionable items requiring admin resolution</p>
          </div>
        </div>
        {items.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 self-start sm:self-auto">
            {items.length} Pending Section{items.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Everything is up to date</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            No urgent actions, pending reviews, or reported items currently require your attention.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.key}
              className={`flex flex-col justify-between rounded-2xl border p-4 transition hover:shadow-sm ${
                item.severity === 'urgent'
                  ? 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50'
                  : item.severity === 'warning'
                  ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                  : 'border-border bg-background hover:border-primary/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(item.category)}
                    <span className="text-xs font-medium text-muted-foreground">{item.category}</span>
                  </div>
                  {getSeverityBadge(item.severity)}
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-foreground">{item.count}</span>
                  <h3 className="text-sm font-semibold text-foreground truncate">{item.title}</h3>
                </div>

                <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-end">
                <Link
                  href={item.actionUrl}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    item.severity === 'urgent'
                      ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm'
                      : item.severity === 'warning'
                      ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
