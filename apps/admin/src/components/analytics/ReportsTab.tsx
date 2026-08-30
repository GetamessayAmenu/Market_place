'use client'

import React, { useEffect, useState } from 'react'
import { fetchAnalyticsReport, getAnalyticsReportExportUrl, type ReportResponse } from '../../lib/adminApi'

interface ReportsTabProps {
  rangeState: { range: string; from?: string; to?: string }
}

export default function ReportsTab({ rangeState }: ReportsTabProps) {
  const [reportType, setReportType] = useState<string>('marketplace')
  const [reportData, setReportData] = useState<ReportResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [page, setPage] = useState<number>(1)

  useEffect(() => {
    loadReport()
  }, [reportType, rangeState, page])

  const loadReport = async () => {
    try {
      setLoading(true)
      const res = await fetchAnalyticsReport({
        type: reportType,
        range: rangeState.range,
        from: rangeState.from,
        to: rangeState.to,
        page,
        limit: 15,
      })
      setReportData(res)
    } catch (err) {
      console.error('Failed to load report:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCsv = () => {
    const url = getAnalyticsReportExportUrl({
      type: reportType,
      range: rangeState.range,
      from: rangeState.from,
      to: rangeState.to,
    })
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Report Category:</label>
          <select
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value)
              setPage(1)
            }}
            className="rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-800 focus:border-indigo-500 focus:outline-none"
          >
            <option value="marketplace">Marketplace Overview</option>
            <option value="sellers">Sellers Directory</option>
            <option value="buyers">Buyers Directory</option>
            <option value="listings">Listing Inventory</option>
            <option value="orders">Orders & Transactions</option>
            <option value="rentals">Rentals Report</option>
            <option value="custom_orders">Custom Orders Report</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          <span>Export CSV</span>
        </button>
      </div>

      {/* Report Data Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold capitalize text-gray-900">{reportType.replace(/_/g, ' ')} Report</h3>
          {reportData && <span className="text-xs text-gray-500">{reportData.rows.length} record(s)</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                {reportData?.columns.map((col, idx) => (
                  <th key={idx} className="px-6 py-3">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={reportData?.columns.length || 5} className="px-6 py-12 text-center text-gray-400">
                    Loading report data...
                  </td>
                </tr>
              ) : !reportData || reportData.rows.length === 0 ? (
                <tr>
                  <td colSpan={reportData?.columns.length || 5} className="px-6 py-12 text-center text-gray-400">
                    No data records found for this report and range.
                  </td>
                </tr>
              ) : (
                reportData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-gray-50/50">
                    {reportData.columns.map((col, cIdx) => (
                      <td key={cIdx} className="px-6 py-4 font-mono text-xs text-gray-800">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
