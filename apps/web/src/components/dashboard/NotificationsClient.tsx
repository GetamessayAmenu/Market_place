"use client"
import { Alert, Button, Spinner } from '@marketplace/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import useAuth from '../../hooks/useAuth'
import { useSocket } from '../../hooks/useSocket'
import { apiDelete, apiGet, apiPatch } from '../../lib/api'
import { formatRelativeTime } from '../../lib/formatters'
import { getNotificationActionUrl } from '../../lib/notificationRoutes'

export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string | null
  data?: Record<string, any> | null
  readAt: string | null
  createdAt: string
  isRead: boolean
}

interface NotificationsClientProps {
  initialNotifications?: NotificationItem[]
}

const TYPE_ICONS: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
  order_created: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  order_status_changed: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  new_message: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  listing_approved: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  listing_rejected: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-600 dark:text-rose-400',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  rental_request_received: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  custom_order_received: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  system_announcement: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    text: 'text-violet-600 dark:text-violet-400',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
}

export default function NotificationsClient({ initialNotifications = [] }: NotificationsClientProps) {
  const router = useRouter()
  const user = useAuth((s) => s.user)
  const socketRef = useSocket()
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    const handleNewNotification = (n: any) => {
      const formatted: NotificationItem = {
        id: n.id || `notif-${Date.now()}`,
        type: n.type,
        title: n.title,
        body: n.body || null,
        data: n.data || null,
        readAt: null,
        createdAt: n.timestamp || new Date().toISOString(),
        isRead: false,
      }
      setNotifications((prev) => [formatted, ...prev])
    }

    socket.on('notifications:new', handleNewNotification)

    return () => {
      socket.off('notifications:new', handleNewNotification)
    }
  }, [socketRef])

  const fetchNotifications = async (targetPage: number, resetList = false) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiGet<NotificationItem[] | { items: NotificationItem[]; total: number; hasMore: boolean }>(
        '/notifications',
        { page: targetPage, limit: 20, unreadOnly: filterTab === 'unread' ? true : undefined }
      )

      const items = Array.isArray(res) ? res : res?.items ?? []
      setNotifications((prev) => (resetList ? items : [...prev, ...items]))
      setHasMore(items.length === 20)
      setPage(targetPage)
    } catch (err: any) {
      console.error('Failed to load notifications:', err)
      setError('Could not fetch notifications. Please refresh or try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: 'all' | 'unread') => {
    setFilterTab(tab)
    setPage(1)
    void fetchNotifications(1, true)
  }

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      await apiPatch(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      )
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await apiPatch('/notifications/read-all')
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      )
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await apiDelete(`/notifications/${id}`)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  const filteredNotifications = filterTab === 'unread' ? notifications.filter((n) => !n.isRead) : notifications
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6">
      {/* Action Header & Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filterTab === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => handleTabChange('unread')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filterTab === 'unread'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          )}
          <Link
            href="/dashboard/settings/notifications"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Preferences →
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 && !loading && (
          <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <h3 className="text-base font-semibold text-foreground">No notifications found</h3>
            <p className="mt-1 text-sm">
              {filterTab === 'unread'
                ? "You've read all your notifications!"
                : "You don't have any notifications at the moment."}
            </p>
          </div>
        )}

        {filteredNotifications.map((n) => {
          const isSellerContext =
            (typeof window !== 'undefined' && window.location.pathname.startsWith('/seller')) ||
            user?.role === 'seller';
          const actionUrl = getNotificationActionUrl(n, isSellerContext);
          const style = TYPE_ICONS[n.type] || {
            bg: 'bg-muted',
            text: 'text-foreground',
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          }

          return (
            <div
              key={n.id}
              onClick={() => {
                if (!n.isRead) void handleMarkAsRead(n.id)
                if (actionUrl) router.push(actionUrl)
              }}
              className={`group flex cursor-pointer items-start gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm ${
                !n.isRead ? 'border-l-4 border-l-primary bg-primary/3' : 'opacity-90'
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.bg} ${style.text}`}>
                {style.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-sm ${!n.isRead ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                    {n.title}
                  </h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
                {n.body && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                {!n.isRead && (
                  <button
                    onClick={(e) => handleMarkAsRead(n.id, e)}
                    className="rounded p-1 text-xs text-primary hover:bg-primary/10"
                    title="Mark as read"
                  >
                    Mark read
                  </button>
                )}
                <button
                  onClick={(e) => handleDelete(n.id, e)}
                  className="rounded p-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Dismiss notification"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="flex items-center justify-center py-6">
            <Spinner size="md" />
          </div>
        )}

        {hasMore && !loading && filteredNotifications.length > 0 && (
          <div className="text-center pt-4">
            <Button variant="outline" size="sm" onClick={() => fetchNotifications(page + 1)}>
              Load older notifications
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
