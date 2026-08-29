'use client'

import { Badge, Button } from '@marketplace/ui'
import React, { useState } from 'react'

import type { AuditLog } from '../../lib/adminApi'

interface AuditLogDetailDrawerProps {
  log: AuditLog | null
  isOpen: boolean
  onClose: () => void
}

export default function AuditLogDetailDrawer({ log, isOpen, onClose }: AuditLogDetailDrawerProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !log) return null

  const handleCopyId = () => {
    void navigator.clipboard.writeText(log.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const statusVariant = (status?: string): 'success' | 'error' | 'warning' | 'secondary' => {
    const s = (status || 'SUCCESS').toUpperCase()
    if (s === 'SUCCESS') return 'success'
    if (s === 'FAILURE' || s === 'FAILED') return 'error'
    if (s === 'ATTEMPT') return 'warning'
    return 'secondary'
  }

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      })
    } catch {
      return dateStr
    }
  }

  // Related Resource link helper
  const getResourceLink = () => {
    if (!log.resourceId) return null
    const res = log.resource.toLowerCase()
    if (res.includes('listing')) return `/listings?search=${log.resourceId}`
    if (res.includes('user')) return `/admin/users?search=${log.resourceId}`
    if (res.includes('report')) return `/admin/moderation-reports/${log.resourceId}`
    if (res.includes('order')) return `/orders?search=${log.resourceId}`
    return null
  }

  const resourceLink = getResourceLink()

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-card border-l border-border shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">Log #{log.id.slice(0, 8)}</span>
                <Badge variant={statusVariant(log.status)}>
                  {log.status || 'SUCCESS'}
                </Badge>
              </div>
              <h2 className="text-lg font-bold text-foreground mt-1">{log.action}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition"
              aria-label="Close drawer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Description / Reason */}
            {log.description && (
              <div className="p-4 rounded-xl bg-muted/40 border border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                <p className="text-sm font-medium text-foreground">{log.description}</p>
              </div>
            )}

            {/* Overview Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-xl border border-border bg-background">
                <p className="text-xs font-medium text-muted-foreground">Actor</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {log.actor?.displayName || log.actor?.email || 'System'}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">{log.actorId}</p>
                {log.actor?.role?.name && (
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                    {log.actor.role.name}
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl border border-border bg-background">
                <p className="text-xs font-medium text-muted-foreground">Resource</p>
                <p className="font-semibold text-foreground capitalize mt-0.5">{log.resource}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{log.resourceId || 'N/A'}</p>
                {resourceLink && (
                  <a
                    href={resourceLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-1 text-xs text-primary underline hover:text-primary/80"
                  >
                    View Resource →
                  </a>
                )}
              </div>
            </div>

            {/* Timestamp & Technical Context */}
            <div className="rounded-xl border border-border p-4 bg-background space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event Metadata</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Timestamp:</span>
                  <p className="font-medium text-foreground">{formatTimestamp(log.createdAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Actor Type:</span>
                  <p className="font-medium text-foreground">{log.actorType || 'USER'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Client IP:</span>
                  <p className="font-mono text-foreground">{log.ipAddress || 'Unavailable'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">User Agent:</span>
                  <p className="font-mono text-foreground truncate" title={log.userAgent || ''}>
                    {log.userAgent || 'Unavailable'}
                  </p>
                </div>
              </div>
            </div>

            {/* Changes Diff Section */}
            {log.changes && Object.keys(log.changes).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">State Changes (Diff)</p>
                  <span className="text-[10px] text-muted-foreground">{Object.keys(log.changes).length} field(s) modified</span>
                </div>
                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {Object.entries(log.changes).map(([field, diff]) => (
                    <div key={field} className="p-3 bg-muted/20 text-xs">
                      <p className="font-mono font-semibold text-foreground mb-1">{field}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded bg-red-500/10 text-red-700 dark:text-red-300 font-mono">
                          <span className="text-[10px] uppercase font-bold text-red-500 block">Before</span>
                          {JSON.stringify(diff.before ?? 'null')}
                        </div>
                        <div className="p-2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono">
                          <span className="text-[10px] uppercase font-bold text-emerald-500 block">After</span>
                          {JSON.stringify(diff.after ?? 'null')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Metadata JSON */}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raw Context Payload</p>
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
            <Button size="sm" variant="secondary" onClick={handleCopyId}>
              {copied ? 'Copied ID ✓' : 'Copy Log ID'}
            </Button>
            <Button size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
