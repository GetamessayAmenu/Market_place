"use client"
import React from 'react'
import Link from 'next/link'
import {
  FileText,
  User,
  Clock,
  ChevronRight,
} from 'lucide-react'
import type { AuditLog } from '../../lib/adminApi'

interface RecentAuditActivityPanelProps {
  logs?: AuditLog[] | undefined
  isLoading?: boolean | undefined
}

export default function RecentAuditActivityPanel({ logs: rawLogs = [], isLoading = false }: RecentAuditActivityPanelProps) {
  const logs: AuditLog[] = Array.isArray(rawLogs)
    ? rawLogs
    : (rawLogs as any)?.data && Array.isArray((rawLogs as any).data)
    ? (rawLogs as any).data
    : []
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-6 w-40 rounded-lg bg-muted" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  const formatActionName = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Recent Admin Activity</h3>
              <p className="text-xs text-muted-foreground">Audit log audit stream</p>
            </div>
          </div>
          <Link
            href="/admin/audit-logs"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            View Logs
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <Clock className="h-8 w-8 text-muted mb-2" />
            <p className="text-sm font-medium">No recent audit logs available.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-background p-3.5 transition hover:border-primary/30"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {formatActionName(log.action)}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {log.actor?.displayName || log.actor?.email || 'Admin'} • {log.resource}
                      {log.resourceId ? ` (#${log.resourceId.slice(0, 8)})` : ''}
                    </p>
                    {log.description && (
                      <p className="mt-1 text-[11px] text-muted-foreground/80 line-clamp-1 italic">
                        "{log.description}"
                      </p>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground font-mono">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-border/50 text-right">
        <Link
          href="/admin/audit-logs"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          Explore Full Audit Trail
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
