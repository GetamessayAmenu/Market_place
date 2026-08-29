'use client'

import { cn } from '@marketplace/ui'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import useAuth from '../../hooks/useAuth'
import { useSocket } from '../../hooks/useSocket'
import { apiGet, apiPatch } from '../../lib/api'
import { formatRelativeTime } from '../../lib/formatters'

interface NotificationItem {
  id: string
  type: string
  title: string
  body: string | null
  data?: Record<string, any> | null
  createdAt: string
  isRead: boolean
}

function getActionUrl(n: NotificationItem): string {
  if (n.data?.actionUrl) return n.data.actionUrl as string
  if (n.data?.conversationId) return `/dashboard/messages?conversationId=${n.data.conversationId as string}`
  if (n.data?.orderId) return `/dashboard/orders/${n.data.orderId as string}`
  if (n.data?.rentalOrderId) return `/dashboard/rentals/${n.data.rentalOrderId as string}`
  if (n.data?.customOrderId) return `/dashboard/custom-orders/${n.data.customOrderId as string}`
  if (n.data?.listingId) return `/listings/${n.data.listingId as string}`
  return '/dashboard/notifications'
}

export default function NotificationBell() {
  const user = useAuth((s) => s.user)
  const socketRef = useSocket()

  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load initial count and recent notifications when user is present
  useEffect(() => {
    if (!user) return

    void fetchUnreadCount()
    void fetchRecentNotifications()
  }, [user])

  // Listen to Socket.IO real-time notification events
  useEffect(() => {
    if (!user) return
    const socket = socketRef.current
    if (!socket) return

    const handleNewNotification = (eventData: any) => {
      setUnreadCount((count) => count + 1)

      const formatted: NotificationItem = {
        id: eventData.id || `notif-${Date.now()}`,
        type: eventData.type || 'system',
        title: eventData.title || 'New Notification',
        body: eventData.body || null,
        data: eventData.data || null,
        createdAt: eventData.timestamp || new Date().toISOString(),
        isRead: false,
      }

      setRecentNotifications((prev) => [formatted, ...prev.slice(0, 4)])
    }

    socket.on('notifications:new', handleNewNotification)

    return () => {
      socket.off('notifications:new', handleNewNotification)
    }
  }, [socketRef, user])

  const fetchUnreadCount = async () => {
    try {
      const res = await apiGet<any>('/notifications/unread-count')
      if (typeof res === 'number') {
        setUnreadCount(res)
      } else if (res && typeof res.unreadCount === 'number') {
        setUnreadCount(res.unreadCount)
      }
    } catch {
      // Ignore background count errors
    }
  }

  const fetchRecentNotifications = async () => {
    setLoading(true)
    try {
      const res = await apiGet<NotificationItem[] | { items: NotificationItem[] }>('/notifications', {
        page: 1,
        limit: 5,
      })
      const items = Array.isArray(res) ? res : res?.items ?? []
      setRecentNotifications(items)
      const count = items.filter((n) => !n.isRead).length
      setUnreadCount((c) => Math.max(c, count))
    } catch {
      // Ignore background errors
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id: string, actionUrl: string) => {
    try {
      await apiPatch(`/notifications/${id}/read`)
      setUnreadCount((c) => Math.max(0, c - 1))
      setRecentNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
    } catch {
      // Ignore error and navigate anyway
    }
    setOpen(false)
    window.location.href = actionUrl
  }

  const handleMarkAllRead = async () => {
    try {
      await apiPatch('/notifications/read-all')
      setUnreadCount(0)
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch {
      // Ignore
    }
  }

  if (!user) return null

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-foreground/80 transition-all hover:bg-accent hover:text-foreground hover:shadow-xs active:scale-95"
        aria-label={`Notifications — ${unreadCount} unread`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white ring-2 ring-background animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl animate-in fade-in slide-in-from-top-2 sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-semibold text-sm">Notifications</span>
            <div className="flex items-center gap-3 text-xs">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="font-medium text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                View all →
              </Link>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {loading ? (
              <div className="py-6 text-center text-xs text-muted-foreground">Loading notifications...</div>
            ) : recentNotifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              recentNotifications.map((notif) => {
                const actionUrl = getActionUrl(notif)
                return (
                  <div
                    key={notif.id}
                    onClick={() => void handleMarkRead(notif.id, actionUrl)}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60',
                      !notif.isRead && 'bg-primary/5 font-medium'
                    )}
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-semibold text-foreground line-clamp-1">{notif.title}</p>
                        {!notif.isRead && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      {notif.body && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{notif.body}</p>
                      )}
                      <span className="mt-1 block text-[10px] text-muted-foreground/70">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-muted/40 p-2 text-center">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="block rounded-lg py-1.5 text-xs font-medium text-primary hover:bg-accent transition-colors"
            >
              See all notifications in Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
