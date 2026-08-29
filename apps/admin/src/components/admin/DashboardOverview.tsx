"use client"
import React, { useState, useEffect, useCallback } from 'react'

import { useSocket } from '../../hooks/useSocket'
import DashboardHeader from './DashboardHeader'
import PrimaryKpiCard from './PrimaryKpiCard'
import NeedsAttentionPanel from './NeedsAttentionPanel'
import MarketplaceActivityChart from './MarketplaceActivityChart'
import OperationalSummaries from './OperationalSummaries'
import ModerationHealthPanel from './ModerationHealthPanel'
import SystemHealthWidget from './SystemHealthWidget'
import RecentAuditActivityPanel from './RecentAuditActivityPanel'
import QuickActionsGrid from './QuickActionsGrid'

import {
  fetchAdminDashboardOverview,
  fetchAdminDashboardActivity,
  fetchAdminDashboardSystemHealth,
  fetchAdminDashboardRecentActivity,
  AdminDashboardOverviewData,
  ActivityPoint,
  SystemHealthStatus,
  AuditLog,
} from '../../lib/adminApi'

interface DashboardOverviewProps {
  initialOverview?: AdminDashboardOverviewData | undefined
  initialActivity?: ActivityPoint[] | undefined
  initialHealth?: SystemHealthStatus | undefined
  initialLogs?: AuditLog[] | undefined
}

export default function DashboardOverview({
  initialOverview,
  initialActivity,
  initialHealth,
  initialLogs,
}: DashboardOverviewProps) {
  const [range, setRange] = useState<string>('30d')
  const [customFrom, setCustomFrom] = useState<string | undefined>()
  const [customTo, setCustomTo] = useState<string | undefined>()

  const [overview, setOverview] = useState<AdminDashboardOverviewData | undefined>(initialOverview)
  const [activity, setActivity] = useState<ActivityPoint[]>(initialActivity || [])
  const [health, setHealth] = useState<SystemHealthStatus | undefined>(initialHealth)
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs || [])

  const [isLoading, setIsLoading] = useState<boolean>(!initialOverview)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true)

  const socket = useSocket()

  // Primary data fetcher
  const loadDashboardData = useCallback(
    async (selectedRange: string, from?: string, to?: string, showRefreshingSpinner = true) => {
      if (showRefreshingSpinner) setIsRefreshing(true)
      try {
        const queryParams: { range?: string | undefined; from?: string | undefined; to?: string | undefined } = {
          range: selectedRange,
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        }

        const [ovData, actData, sysHealthData, logsData] = await Promise.all([
          fetchAdminDashboardOverview(queryParams),
          fetchAdminDashboardActivity(queryParams),
          fetchAdminDashboardSystemHealth(),
          fetchAdminDashboardRecentActivity(10),
        ])

        setOverview(ovData)
        setActivity(actData)
        setHealth(sysHealthData)
        setLogs(logsData)
      } catch (err) {
        console.error('Failed to fetch admin dashboard overview data:', err)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    []
  )

  // Handle Range Selection
  const handleRangeChange = (newRange: string, fromDate?: string, toDate?: string) => {
    setRange(newRange)
    setCustomFrom(fromDate)
    setCustomTo(toDate)
    loadDashboardData(newRange, fromDate, toDate, true)
  }

  // Handle Manual Refresh
  const handleRefresh = () => {
    loadDashboardData(range, customFrom, customTo, true)
  }

  // Initial Fetch on Mount
  useEffect(() => {
    loadDashboardData(range, customFrom, customTo, !initialOverview)
  }, [loadDashboardData])

  // 30-Second Auto Refresh Timer
  useEffect(() => {
    if (!autoRefreshEnabled) return

    const interval = setInterval(() => {
      loadDashboardData(range, customFrom, customTo, false)
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefreshEnabled, range, customFrom, customTo, loadDashboardData])

  // Socket.IO Real-time Events Listener
  useEffect(() => {
    if (!socket) return

    const handleRealtimeEvent = () => {
      console.log('Realtime event received on admin dashboard, refreshing counts...')
      loadDashboardData(range, customFrom, customTo, false)
    }

    socket.on('admin:new_report', handleRealtimeEvent)
    socket.on('order:status_updated', handleRealtimeEvent)
    socket.on('notifications:new', handleRealtimeEvent)
    socket.on('listing:moderated', handleRealtimeEvent)

    return () => {
      socket.off('admin:new_report', handleRealtimeEvent)
      socket.off('order:status_updated', handleRealtimeEvent)
      socket.off('notifications:new', handleRealtimeEvent)
      socket.off('listing:moderated', handleRealtimeEvent)
    }
  }, [socket, range, customFrom, customTo, loadDashboardData])

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <DashboardHeader
        range={range}
        onRangeChange={handleRangeChange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={overview?.lastUpdated || new Date().toISOString()}
        unreadNotificationsCount={overview?.notificationsSummary?.unreadAdminCount}
        autoRefreshEnabled={autoRefreshEnabled}
        onToggleAutoRefresh={setAutoRefreshEnabled}
      />

      {/* Primary KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <PrimaryKpiCard
          title="Total Users"
          metric={overview?.kpis?.totalUsers}
          icon="users"
          href="/admin/users-verification"
          isLoading={isLoading}
        />
        <PrimaryKpiCard
          title="Active Sellers"
          metric={overview?.kpis?.activeSellers}
          icon="sellers"
          href="/admin/users-verification?role=seller"
          isLoading={isLoading}
        />
        <PrimaryKpiCard
          title="Active Listings"
          metric={overview?.kpis?.activeListings}
          icon="listings"
          href="/listings?status=active"
          isLoading={isLoading}
        />
        <PrimaryKpiCard
          title="Direct Orders"
          metric={overview?.kpis?.orders}
          icon="orders"
          href="/listings?tab=orders"
          isLoading={isLoading}
        />
        <PrimaryKpiCard
          title="Rentals"
          metric={overview?.kpis?.rentals}
          icon="rentals"
          href="/listings?tab=rentals"
          isLoading={isLoading}
        />
        <PrimaryKpiCard
          title="Custom Orders"
          metric={overview?.kpis?.customOrders}
          icon="customOrders"
          href="/listings?tab=custom_orders"
          isLoading={isLoading}
        />
      </div>

      {/* Needs Attention Panel (Prominent) */}
      <NeedsAttentionPanel
        items={overview?.needsAttention}
        isLoading={isLoading}
      />

      {/* Interactive Activity & Growth Chart */}
      <MarketplaceActivityChart
        data={activity}
        isLoading={isLoading}
        rangeLabel={overview?.range || '30 Days'}
      />

      {/* Operational Summaries (Listings, Users/Sellers, Transactions) */}
      <OperationalSummaries
        listings={overview?.listings}
        userSeller={overview?.userSeller}
        orders={overview?.orders}
        rentals={overview?.rentals}
        customOrders={overview?.customOrders}
        isLoading={isLoading}
      />

      {/* 3-Column Section: Moderation Health, System Health, Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ModerationHealthPanel
          health={overview?.moderationHealth}
          isLoading={isLoading}
        />
        <SystemHealthWidget
          health={health || overview?.systemHealth}
          isLoading={isLoading}
        />
        <RecentAuditActivityPanel
          logs={logs}
          isLoading={isLoading}
        />
      </div>

      {/* Quick Admin Actions */}
      <QuickActionsGrid />
    </div>
  )
}
