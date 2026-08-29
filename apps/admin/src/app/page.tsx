import React from 'react'

import DashboardOverview from '../components/admin/DashboardOverview'
import {
  fetchAdminDashboardOverview,
  fetchAdminDashboardActivity,
  fetchAdminDashboardSystemHealth,
  fetchAdminDashboardRecentActivity,
  AdminDashboardOverviewData,
  ActivityPoint,
  SystemHealthStatus,
  AuditLog,
} from '../lib/adminApi'

export default async function DashboardPage() {
  let initialOverview: AdminDashboardOverviewData | undefined
  let initialActivity: ActivityPoint[] = []
  let initialHealth: SystemHealthStatus | undefined
  let initialLogs: AuditLog[] = []

  try {
    const [overviewData, activityData, healthData, logsData] = await Promise.all([
      fetchAdminDashboardOverview({ range: '30d' }),
      fetchAdminDashboardActivity({ range: '30d' }),
      fetchAdminDashboardSystemHealth(),
      fetchAdminDashboardRecentActivity(10),
    ])

    initialOverview = overviewData
    initialActivity = activityData
    initialHealth = healthData
    initialLogs = logsData
  } catch (err) {
    console.warn('SSR Dashboard fetch warning (client fallback active):', err)
  }

  return (
    <div className="space-y-6">
      <DashboardOverview
        initialOverview={initialOverview}
        initialActivity={initialActivity}
        initialHealth={initialHealth}
        initialLogs={initialLogs}
      />
    </div>
  )
}
