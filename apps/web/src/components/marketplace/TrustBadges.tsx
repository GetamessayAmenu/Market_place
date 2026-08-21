import { cn } from '@marketplace/ui'
import React from 'react'

export interface TrustBadgesProps {
  emailVerified?: boolean
  phoneVerified?: boolean
  identityVerified?: boolean
  topRated?: boolean
  fastResponder?: boolean
  memberSince?: string
  className?: string
}

interface BadgeItemProps {
  label: string
  icon: React.ReactNode
  active: boolean
}

function BadgeItem({ label, icon, active }: BadgeItemProps) {
  if (!active) return null
  return (
    <div className="flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/5 px-3 py-1.5">
      <span className="text-brand-gold">{icon}</span>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

export default function TrustBadges({
  emailVerified,
  phoneVerified,
  identityVerified,
  topRated,
  fastResponder,
  memberSince,
  className,
}: TrustBadgesProps) {
  // Prioritize phone verification as primary trust signal
  const badges: BadgeItemProps[] = [
    // Primary: Phone verification (most important for OLX/Jiji model)
    { label: 'Phone Verified', icon: <CheckIcon />, active: phoneVerified ?? false },
    // Secondary: Email verification (for account recovery)
    { label: 'Email Verified', icon: <CheckIcon />, active: emailVerified ?? false },
    // Optional: Identity verification (not required, just a badge)
    { label: 'Identity Verified', icon: <ShieldIcon />, active: identityVerified ?? false },
    // Reputation signals
    { label: 'Top Rated', icon: <StarIcon />, active: topRated ?? false },
    { label: 'Fast Responder', icon: <BoltIcon />, active: fastResponder ?? false },
    // Account age
    { label: `Member since ${memberSince ?? ''}`, icon: <CalendarIcon />, active: memberSince != null },
  ]

  // Remove payment verification - not needed for classified marketplace model
  // Payment verification is more relevant for e-commerce platforms

  const activeBadges = badges.filter((b) => b.active)
  if (activeBadges.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="list" aria-label="Trust indicators">
      {activeBadges.map((b) => (
        <div key={b.label} role="listitem">
          <BadgeItem {...b} />
        </div>
      ))}
    </div>
  )
}
