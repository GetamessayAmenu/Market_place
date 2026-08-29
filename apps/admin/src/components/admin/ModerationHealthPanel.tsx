"use client"
import React from 'react'
import Link from 'next/link'
import {
  ShieldAlert,
  Flag,
  UserX,
  MessageSquareWarning,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import type { ModerationHealthSummary } from '../../lib/adminApi'

interface ModerationHealthPanelProps {
  health?: ModerationHealthSummary | undefined
  isLoading?: boolean | undefined
}

export default function ModerationHealthPanel({ health, isLoading = false }: ModerationHealthPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm animate-pulse space-y-3">
        <div className="h-5 w-36 rounded-lg bg-muted" />
        <div className="h-32 rounded-2xl bg-muted" />
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Moderation Health</h3>
              <p className="text-xs text-muted-foreground">Platform safety & flags</p>
            </div>
          </div>
          <Link
            href="/admin/moderation-reports"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Review All
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5 mb-4">
          <Link
            href="/admin/moderation-reports?status=pending"
            className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 transition hover:border-rose-500/40"
          >
            <span className="text-xs font-medium text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Open Moderation Reports
            </span>
            <span className="text-sm font-bold text-rose-700 dark:text-rose-400">
              {health?.openReports ?? 0}
            </span>
          </Link>

          <Link
            href="/admin/moderation-reports?tab=flags"
            className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 transition hover:border-amber-500/40"
          >
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <MessageSquareWarning className="h-4 w-4" />
              Pending Chat Flags
            </span>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
              {health?.chatFlagsPending ?? 0}
            </span>
          </Link>

          <Link
            href="/admin/users-verification?status=suspended"
            className="flex items-center justify-between p-3 rounded-2xl bg-background border border-border transition hover:border-primary/40"
          >
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <UserX className="h-4 w-4 text-purple-500" />
              Suspended Accounts
            </span>
            <span className="text-sm font-bold text-foreground">
              {health?.suspendedUsers ?? 0}
            </span>
          </Link>
        </div>
      </div>

      <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck className="h-4 w-4" />
          {health?.recentlyResolvedReports ?? 0} reports resolved recently
        </span>
      </div>
    </div>
  )
}
