'use client'

import React from 'react'
import type { KpiMetric } from '../../lib/adminApi'

interface KpiCardProps {
  title: string
  metric: KpiMetric
  isCurrency?: boolean
  currencySymbol?: string
  icon?: React.ReactNode
  subtitle?: string
}

export default function KpiCard({
  title,
  metric,
  isCurrency = false,
  currencySymbol = 'ETB ',
  icon,
  subtitle,
}: KpiCardProps) {
  const formatVal = (val: number) => {
    if (isCurrency) {
      return `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return val.toLocaleString()
  }

  const isPositive = metric.pctChange > 0
  const isNegative = metric.pctChange < 0

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</span>
        {icon && <div className="rounded-xl bg-gray-50 p-2 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-gray-900">
          {formatVal(metric.current)}
        </div>

        <div
          className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isPositive
              ? 'bg-emerald-50 text-emerald-700'
              : isNegative
              ? 'bg-rose-50 text-rose-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isPositive && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
          )}
          {isNegative && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
            </svg>
          )}
          <span>{isPositive ? '+' : ''}{metric.pctChange}%</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>Prev: {formatVal(metric.previous)}</span>
        <span className="font-medium">
          {metric.absoluteChange >= 0 ? '+' : ''}{formatVal(metric.absoluteChange)}
        </span>
      </div>

      {subtitle && <p className="mt-1 text-[11px] text-gray-400">{subtitle}</p>}
    </div>
  )
}
