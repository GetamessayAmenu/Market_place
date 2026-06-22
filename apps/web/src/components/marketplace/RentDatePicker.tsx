import { cn } from '@marketplace/ui'
import React, { useMemo } from 'react'

export interface RentDatePickerProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  pricePerDay: number
  currency?: string
  className?: string
}

export default function RentDatePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  pricePerDay,
  currency = 'ETB',
  className,
}: RentDatePickerProps) {
  const days = useMemo(() => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }, [startDate, endDate])

  const totalCost = days * pricePerDay
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-4', className)}>
      <h3 className="font-display text-base font-semibold text-card-foreground">Rental Period</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="rent-start" className="mb-1 block text-xs text-muted-foreground">Start Date</label>
          <input
            id="rent-start"
            type="date"
            min={minDate}
            value={startDate}
            onChange={(e) => { onStartDateChange(e.target.value) }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
          />
        </div>
        <div>
          <label htmlFor="rent-end" className="mb-1 block text-xs text-muted-foreground">End Date</label>
          <input
            id="rent-end"
            type="date"
            min={startDate || minDate}
            value={endDate}
            onChange={(e) => { onEndDateChange(e.target.value) }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
          />
        </div>
      </div>

      {days > 0 && (
        <div className="space-y-2 border-t border-border/50 pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {pricePerDay.toLocaleString()} {currency} x {String(days)} day{days !== 1 ? 's' : ''}
            </span>
            <span className="font-medium text-card-foreground">{totalCost.toLocaleString()} {currency}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t border-border/50 pt-2">
            <span className="text-card-foreground">Total</span>
            <span className="text-brand-gold">{totalCost.toLocaleString()} {currency}</span>
          </div>
        </div>
      )}
    </div>
  )
}
