'use client'

import React from 'react'

export interface DateRangeState {
  range: 'today' | '7d' | '30d' | '90d' | 'custom'
  from?: string
  to?: string
  compare: boolean
}

interface AnalyticsDateRangePickerProps {
  value: DateRangeState
  onChange: (newValue: DateRangeState) => void
  disabled?: boolean
}

export default function AnalyticsDateRangePicker({ value, onChange, disabled }: AnalyticsDateRangePickerProps) {
  const handleRangeChange = (r: 'today' | '7d' | '30d' | '90d' | 'custom') => {
    onChange({ ...value, range: r })
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Date Filter:</span>
        {(['today', '7d', '30d', '90d', 'custom'] as const).map((r) => {
          const labels: Record<string, string> = {
            today: 'Today',
            '7d': '7 Days',
            '30d': '30 Days',
            '90d': '90 Days',
            custom: 'Custom Range',
          }
          const isActive = value.range === r

          return (
            <button
              key={r}
              type="button"
              disabled={disabled}
              onClick={() => handleRangeChange(r)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              {labels[r]}
            </button>
          )
        })}
      </div>

      {value.range === 'custom' && (
        <div className="flex items-center gap-2">
          <div>
            <label className="sr-only">From</label>
            <input
              type="date"
              value={value.from ? value.from.split('T')[0] : ''}
              onChange={(e) => onChange({ ...value, from: e.target.value })}
              className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <span className="text-xs text-gray-400">to</span>
          <div>
            <label className="sr-only">To</label>
            <input
              type="date"
              value={value.to ? value.to.split('T')[0] : ''}
              onChange={(e) => onChange({ ...value, to: e.target.value })}
              className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={value.compare}
            onChange={(e) => onChange({ ...value, compare: e.target.checked })}
            className="peer sr-only"
          />
          <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
          <span className="ml-2 text-xs font-medium text-gray-700">Compare Previous Period</span>
        </label>
      </div>
    </div>
  )
}
