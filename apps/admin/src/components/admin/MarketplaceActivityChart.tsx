"use client"
import React, { useState } from 'react'
import {
  BarChart3,
  Users,
  Tag,
  ShoppingBag,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import type { ActivityPoint } from '../../lib/adminApi'

interface MarketplaceActivityChartProps {
  data?: ActivityPoint[] | undefined
  isLoading?: boolean | undefined
  rangeLabel?: string | undefined
}

type MetricKey = 'all' | 'newUsers' | 'newListings' | 'orders' | 'rentals' | 'customOrders'

export default function MarketplaceActivityChart({
  data: rawData = [],
  isLoading = false,
  rangeLabel = '30 Days',
}: MarketplaceActivityChartProps) {
  const data: ActivityPoint[] = Array.isArray(rawData)
    ? rawData
    : (rawData as any)?.data && Array.isArray((rawData as any).data)
    ? (rawData as any).data
    : []

  const [activeMetric, setActiveMetric] = useState<MetricKey>('all')
  const [hoveredPoint, setHoveredPoint] = useState<ActivityPoint | null>(null)

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-6 w-48 rounded-lg bg-muted" />
        <div className="h-64 rounded-2xl bg-muted" />
      </div>
    )
  }

  // Calculate totals in range for summary tabs
  const totals = data.reduce(
    (acc, item) => ({
      newUsers: acc.newUsers + item.newUsers,
      newListings: acc.newListings + item.newListings,
      orders: acc.orders + item.orders,
      rentals: acc.rentals + item.rentals,
      customOrders: acc.customOrders + item.customOrders,
    }),
    { newUsers: 0, newListings: 0, orders: 0, rentals: 0, customOrders: 0 }
  )

  const metricsConfig: Array<{
    key: MetricKey
    label: string
    color: string
    bgColor: string
    count: number
    icon: React.ReactNode
  }> = [
    {
      key: 'newUsers',
      label: 'New Users',
      color: '#3b82f6', // blue
      bgColor: 'bg-blue-500',
      count: totals.newUsers,
      icon: <Users className="h-3.5 w-3.5" />,
    },
    {
      key: 'newListings',
      label: 'New Listings',
      color: '#f59e0b', // amber
      bgColor: 'bg-amber-500',
      count: totals.newListings,
      icon: <Tag className="h-3.5 w-3.5" />,
    },
    {
      key: 'orders',
      label: 'Orders',
      color: '#10b981', // emerald
      bgColor: 'bg-emerald-500',
      count: totals.orders,
      icon: <ShoppingBag className="h-3.5 w-3.5" />,
    },
    {
      key: 'rentals',
      label: 'Rentals',
      color: '#0284c7', // sky
      bgColor: 'bg-sky-500',
      count: totals.rentals,
      icon: <Clock className="h-3.5 w-3.5" />,
    },
    {
      key: 'customOrders',
      label: 'Custom Orders',
      color: '#f43f5e', // rose
      bgColor: 'bg-rose-500',
      count: totals.customOrders,
      icon: <Sparkles className="h-3.5 w-3.5" />,
    },
  ]

  // Chart SVG calculations
  const maxVal = Math.max(
    ...data.map((d) =>
      activeMetric === 'all'
        ? Math.max(d.newUsers, d.newListings, d.orders, d.rentals, d.customOrders)
        : d[activeMetric]
    ),
    5
  )

  const chartHeight = 220
  const chartWidth = 700

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm relative">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Marketplace Growth & Activity
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Daily breakdown over {rangeLabel} (Server Aggregation)
          </p>
        </div>

        {/* Metric Toggles */}
        <div className="flex flex-wrap gap-1.5 bg-muted/50 p-1 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setActiveMetric('all')}
            className={`rounded-xl px-3 py-1 text-xs font-semibold transition ${
              activeMetric === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Metrics
          </button>
          {metricsConfig.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setActiveMetric(m.key)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition ${
                activeMetric === m.key
                  ? 'bg-card text-foreground shadow-sm border border-border font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${m.bgColor}`} />
              <span>{m.label}</span>
              <span className="text-[10px] text-muted-foreground font-mono">({m.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <TrendingUp className="h-8 w-8 text-muted" />
          <p className="mt-2 text-sm">No activity recorded in this date range.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Tooltip Overlay */}
          {hoveredPoint && (
            <div className="absolute top-0 right-0 rounded-2xl border border-border bg-card/95 backdrop-blur px-3 py-2 text-xs shadow-md z-10 space-y-1 animate-in fade-in">
              <p className="font-bold text-foreground border-b border-border pb-1">
                {new Date(hoveredPoint.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              {metricsConfig
                .filter((m) => activeMetric === 'all' || activeMetric === m.key)
                .map((m) => (
                  <div key={m.key} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className={`h-2 w-2 rounded-full ${m.bgColor}`} />
                      {m.label}:
                    </span>
                    <span className="font-bold font-mono text-foreground">
                      {hoveredPoint[m.key as keyof Omit<ActivityPoint, 'date'>]}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* SVG Bar/Line Representation */}
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-56 overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Y-axis grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = chartHeight - ratio * (chartHeight - 30) - 20
                return (
                  <g key={ratio}>
                    <line
                      x1="0"
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x="0"
                      y={y - 4}
                      fill="currentColor"
                      fillOpacity="0.4"
                      fontSize="9"
                    >
                      {Math.round(maxVal * ratio)}
                    </text>
                  </g>
                )
              })}

              {/* Data points (bars) */}
              {data.map((item, idx) => {
                const step = chartWidth / Math.max(data.length, 1)
                const x = idx * step + step / 4
                const barWidth = Math.max(step / 2 - 2, 4)

                return (
                  <g
                    key={item.date}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredPoint(item)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {metricsConfig
                      .filter((m) => activeMetric === 'all' || activeMetric === m.key)
                      .map((m, mIdx) => {
                        const val = item[m.key as keyof Omit<ActivityPoint, 'date'>]
                        const height = (val / maxVal) * (chartHeight - 30)
                        const y = chartHeight - height - 20

                        // Stacked/side-by-side offset calculation
                        const subBarWidth = activeMetric === 'all' ? barWidth / 5 : barWidth
                        const subX = activeMetric === 'all' ? x + mIdx * subBarWidth : x

                        return (
                          <rect
                            key={m.key}
                            x={subX}
                            y={y}
                            width={Math.max(subBarWidth - 1, 2)}
                            height={Math.max(height, 2)}
                            fill={m.color}
                            rx={2}
                            opacity={hoveredPoint?.date === item.date ? 1 : 0.85}
                            className="transition-all hover:opacity-100"
                          />
                        )
                      })}
                  </g>
                )
              })}
            </svg>
          </div>

          {/* X-axis date labels */}
          <div className="flex justify-between pt-2 border-t border-border/50 text-[10px] text-muted-foreground font-mono">
            {data.length > 0 && data[0] && <span>{data[0].date}</span>}
            {data.length > 2 && data[Math.floor(data.length / 2)] && (
              <span>{data[Math.floor(data.length / 2)]?.date}</span>
            )}
            {data.length > 1 && data[data.length - 1] && (
              <span>{data[data.length - 1]?.date}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
