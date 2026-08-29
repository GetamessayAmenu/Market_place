"use client"
import React from 'react'
import {
  Activity,
  Database,
  Cpu,
  Search,
  Layers,
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import type { SystemHealthStatus } from '../../lib/adminApi'

interface SystemHealthWidgetProps {
  health?: SystemHealthStatus | undefined
  isLoading?: boolean | undefined
}

export default function SystemHealthWidget({ health, isLoading = false }: SystemHealthWidgetProps) {
  if (isLoading || !health) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm animate-pulse space-y-3">
        <div className="h-5 w-36 rounded-lg bg-muted" />
        <div className="h-32 rounded-2xl bg-muted" />
      </div>
    )
  }

  const services: Array<{
    name: string
    status: 'operational' | 'degraded' | 'offline'
    icon: React.ReactNode
  }> = [
    { name: 'API Core', status: health.api, icon: <Activity className="h-4 w-4 text-blue-500" /> },
    { name: 'PostgreSQL Database', status: health.database, icon: <Database className="h-4 w-4 text-purple-500" /> },
    { name: 'Redis Cache', status: health.redis, icon: <Cpu className="h-4 w-4 text-rose-500" /> },
    { name: 'Search Service', status: health.search, icon: <Search className="h-4 w-4 text-amber-500" /> },
    { name: 'Background Queues', status: health.backgroundJobs, icon: <Layers className="h-4 w-4 text-emerald-500" /> },
    { name: 'Notification Engine', status: health.notifications, icon: <Bell className="h-4 w-4 text-sky-500" /> },
  ]

  const getStatusBadge = (status: 'operational' | 'degraded' | 'offline') => {
    switch (status) {
      case 'operational':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Operational
          </span>
        )
      case 'degraded':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            Degraded
          </span>
        )
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            <XCircle className="h-3 w-3" />
            Offline
          </span>
        )
    }
  }

  const allOperational = services.every((s) => s.status === 'operational')

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">System Health</h3>
              <p className="text-xs text-muted-foreground">Infrastructure & API services</p>
            </div>
          </div>
          {allOperational ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Issues Detected
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {services.map((svc) => (
            <div
              key={svc.name}
              className="flex flex-col justify-between p-2.5 rounded-2xl bg-background border border-border"
            >
              <div className="flex items-center gap-1.5 mb-1">
                {svc.icon}
                <span className="text-xs font-semibold text-foreground truncate">{svc.name}</span>
              </div>
              <div className="self-start">{getStatusBadge(svc.status)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground font-mono text-right">
        Checked: {new Date(health.timestamp).toLocaleTimeString()}
      </div>
    </div>
  )
}
