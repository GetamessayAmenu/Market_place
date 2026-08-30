'use client'

import React, { useState } from 'react'
import type { ActivityTimeSeriesPoint } from '../../lib/adminApi'

interface TimeSeriesChartProps {
  data: ActivityTimeSeriesPoint[]
  title?: string
}

export function TimeSeriesAreaChart({ data, title = 'Marketplace Activity & Growth Trend' }: TimeSeriesChartProps) {
  const [activeMetric, setActiveMetric] = useState<keyof Omit<ActivityTimeSeriesPoint, 'date'>>('users')

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-400">No time series data available for the selected period.</p>
      </div>
    )
  }

  const metricsConfig: Record<string, { label: string; color: string; fill: string }> = {
    users: { label: 'Total Users', color: '#6366f1', fill: 'rgba(99, 102, 241, 0.15)' },
    buyers: { label: 'Buyers', color: '#3b82f6', fill: 'rgba(59, 130, 246, 0.15)' },
    sellers: { label: 'Sellers', color: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.15)' },
    listings: { label: 'Listings', color: '#10b981', fill: 'rgba(16, 185, 129, 0.15)' },
    views: { label: 'Listing Views', color: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)' },
    contacts: { label: 'Seller Contacts', color: '#ec4899', fill: 'rgba(236, 72, 153, 0.15)' },
    orders: { label: 'Orders', color: '#06b6d4', fill: 'rgba(6, 182, 212, 0.15)' },
    gmv: { label: 'GMV (ETB)', color: '#14b8a6', fill: 'rgba(20, 184, 166, 0.15)' },
  }

  const values = data.map((d) => Number(d[activeMetric] || 0))
  const maxVal = Math.max(...values, 1)

  const width = 800
  const height = 240
  const padding = 30

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (width - 2 * padding)
    const val = Number(d[activeMetric] || 0)
    const y = height - padding - (val / maxVal) * (height - 2 * padding)
    return { x, y, val, date: d.date }
  })

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
  }, '')

  const areaD = `${pathD} L ${points[points.length - 1]?.x || 0} ${height - padding} L ${points[0]?.x || 0} ${height - padding} Z`

  const activeConfig = metricsConfig[activeMetric] || metricsConfig['users']!

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">Daily interactive breakdown over selected time range</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {Object.entries(metricsConfig).map(([key, cfg]) => {
            const isSel = activeMetric === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveMetric(key as any)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  isSel ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 relative overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = height - padding - ratio * (height - 2 * padding)
            return (
              <g key={idx}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f3f4f6" strokeWidth="1" />
                <text x={padding - 5} y={y + 3} textAnchor="end" className="text-[10px] fill-gray-400 font-mono">
                  {Math.round(ratio * maxVal)}
                </text>
              </g>
            )
          })}

          {/* Area Fill */}
          <path d={areaD} fill={activeConfig.fill} />

          {/* Line Path */}
          <path d={pathD} fill="none" stroke={activeConfig.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Points */}
          {points.map((pt, i) => (
            <g key={i} className="group cursor-pointer">
              <circle cx={pt.x} cy={pt.y} r="4" fill="#ffffff" stroke={activeConfig.color} strokeWidth="2.5" className="transition-transform group-hover:scale-150" />
              <title>{`${pt.date}: ${pt.val} ${activeConfig.label}`}</title>
            </g>
          ))}
        </svg>

        <div className="flex justify-between px-6 pt-2 text-[11px] text-gray-400 font-medium">
          <span>{data[0]?.date}</span>
          <span>{data[Math.floor(data.length / 2)]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  )
}

interface FunnelStep {
  step: string
  count: number
  conversionPct?: number
  dropoffPct?: number
}

interface FunnelChartProps {
  steps: FunnelStep[]
  title?: string
}

export function FunnelChart({ steps, title = 'Conversion Funnel' }: FunnelChartProps) {
  if (!steps || steps.length === 0) return null

  const maxCount = Math.max(...steps.map((s) => s.count), 1)

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500">Stage-by-stage progression & drop-off rates</p>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => {
          const widthPct = Math.max(15, Math.round((step.count / maxCount) * 100))

          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-800">{step.step}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-gray-900">{step.count.toLocaleString()}</span>
                  {step.conversionPct !== undefined && (
                    <span className="rounded bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                      {step.conversionPct}% conv
                    </span>
                  )}
                </div>
              </div>

              <div className="h-4 w-full overflow-hidden rounded-xl bg-gray-100">
                <div
                  className="h-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-500"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
