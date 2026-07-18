"use client"
import Link from 'next/link'
import React, { useState } from 'react'

import { Dropdown, Input } from '@marketplace/ui'

interface AdminHeaderProps {
  onMobileMenuToggle: () => void
}

const notifications = [
  { label: 'New verification request', value: 'verification' },
  { label: '3 reports pending review', value: 'reports' },
  { label: 'Weekly health summary ready', value: 'summary' },
  { label: 'View all notifications', value: 'view-all' },
]

const profileActions = [
  { label: 'My profile', value: 'profile' },
  { label: 'Account settings', value: 'settings' },
  { label: 'Sign out', value: 'signout', destructive: true },
]

export default function AdminHeader({ onMobileMenuToggle }: AdminHeaderProps) {
  const [search, setSearch] = useState('')

  const handleNotificationSelect = (value: string) => {
    if (value === 'view-all') {
      window.location.href = '/notifications'
    }
  }

  const handleProfileSelect = (value: string) => {
    if (value === 'signout') {
      window.location.href = '/'
    }
  }

  return (
    <header className="sticky top-0 z-sticky border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <button
          type="button"
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-input bg-background text-foreground transition hover:border-border hover:bg-muted"
          onClick={onMobileMenuToggle}
          aria-label="Open navigation drawer"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <Link href="/" className="hidden items-center gap-2 md:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
            </svg>
          </div>
          <div className="space-y-0.5 text-left">
            <p className="text-sm font-semibold text-foreground">Marketplace Admin</p>
            <p className="text-xs text-muted-foreground">Enterprise dashboard</p>
          </div>
        </Link>

        <div className="flex-1">
          <Input
            placeholder="Search marketplace, listings, users..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-2xl"
            size="md"
          />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center rounded-2xl border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-border hover:bg-muted"
          >
            View site
          </Link>

          <Dropdown
            trigger={
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-input bg-background text-foreground transition hover:border-border hover:bg-muted"
                aria-label="View notifications"
              >
                <span className="sr-only">Notifications</span>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 1 1-6 0h6Z" />
                </svg>
              </button>
            }
            items={notifications}
            onSelect={handleNotificationSelect}
            align="right"
          />

          <Dropdown
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-border hover:bg-muted"
                aria-label="Open profile menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-sm font-semibold">A</span>
                </span>
                <span className="hidden sm:inline">Admin</span>
              </button>
            }
            items={profileActions}
            onSelect={handleProfileSelect}
            align="right"
          />
        </div>
      </div>
    </header>
  )
}
