'use client'
import React from 'react'

import { Badge, type BadgeProps } from '@marketplace/ui'

type StatusVariant = BadgeProps['variant']

const listingStatusMap: Record<string, StatusVariant> = {
  active: 'success',
  approved: 'success',
  pending: 'warning',
  pending_review: 'warning',
  changes_requested: 'warning',
  under_review: 'info',
  rejected: 'error',
  archived: 'secondary',
  suspended: 'error',
  draft: 'outline',
  expired: 'secondary',
}

const reportStatusMap: Record<string, StatusVariant> = {
  pending: 'warning',
  under_review: 'info',
  resolved: 'success',
  dismissed: 'secondary',
}

const userStatusMap: Record<string, StatusVariant> = {
  active: 'success',
  suspended: 'warning',
  banned: 'error',
  inactive: 'secondary',
}

const verificationStatusMap: Record<string, StatusVariant> = {
  pending: 'warning',
  under_review: 'info',
  approved: 'success',
  rejected: 'error',
  changes_requested: 'warning',
}

export type StatusDomain = 'listing' | 'report' | 'user' | 'verification'

function getVariant(status: string, domain: StatusDomain): StatusVariant {
  const s = status.toLowerCase()
  switch (domain) {
    case 'listing': return listingStatusMap[s] ?? 'secondary'
    case 'report': return reportStatusMap[s] ?? 'secondary'
    case 'user': return userStatusMap[s] ?? 'secondary'
    case 'verification': return verificationStatusMap[s] ?? 'secondary'
  }
}

export function StatusBadge({ status, domain, className }: { status: string; domain: StatusDomain; className?: string }) {
  const variant = getVariant(status, domain)
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    <Badge
      {...(variant !== undefined && { variant })}
      {...(className !== undefined && { className })}
    >
      {label}
    </Badge>
  )
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount)
}

export function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr?: string | Date | null): string {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len) + '...'
}
