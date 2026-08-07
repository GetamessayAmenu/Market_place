'use client'

import { useState, useMemo } from 'react'
import { cn } from '@marketplace/ui'

// Simple SVG icon components
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const Trash2Icon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M19 6v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6m4-6v6m4-6v6" />
  </svg>
)

const InfoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const WrenchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572-1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export interface BlackoutDate {
  id: string
  startDate: string
  endDate: string
  reason: string
}

export interface BlackoutCalendarProps {
  listingId: string
  existingBlackoutDates?: BlackoutDate[]
  onSave: (blackoutDate: Omit<BlackoutDate, 'id'>) => void
  onDelete: (id: string) => void
  className?: string
}

export default function BlackoutCalendar({
  listingId,
  existingBlackoutDates = [],
  onSave,
  onDelete,
  className,
}: BlackoutCalendarProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBlackout, setNewBlackout] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  })

  const currentMonth = new Date()
  const [viewMonth, setViewMonth] = useState(currentMonth.getMonth())
  const [viewYear, setViewYear] = useState(currentMonth.getFullYear())

  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate()
  }, [viewYear, viewMonth])

  const firstDayOfMonth = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).getDay()
  }, [viewYear, viewMonth])

  const isDateBlackout = (date: Date): boolean => {
    return existingBlackoutDates.some((blackout) => {
      const start = new Date(blackout.startDate)
      const end = new Date(blackout.endDate)
      return date >= start && date <= end
    })
  }

  const isDateInNewBlackout = (date: Date): boolean => {
    if (!newBlackout.startDate || !newBlackout.endDate) return false
    const start = new Date(newBlackout.startDate)
    const end = new Date(newBlackout.endDate)
    return date >= start && date <= end
  }

  const getBlackoutForDate = (date: Date): BlackoutDate | null => {
    return existingBlackoutDates.find((blackout) => {
      const start = new Date(blackout.startDate)
      const end = new Date(blackout.endDate)
      return date >= start && date <= end
    }) || null
  }

  const handleSave = () => {
    if (!newBlackout.startDate || !newBlackout.endDate) {
      alert('Please select both start and end dates')
      return
    }

    const start = new Date(newBlackout.startDate)
    const end = new Date(newBlackout.endDate)

    if (start > end) {
      alert('End date must be after start date')
      return
    }

    onSave({
      startDate: newBlackout.startDate,
      endDate: newBlackout.endDate,
      reason: newBlackout.reason,
    })

    setNewBlackout({ startDate: '', endDate: '', reason: '' })
    setShowAddForm(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this blackout date?')) {
      onDelete(id)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (viewMonth === 0) {
        setViewMonth(11)
        setViewYear(viewYear - 1)
      } else {
        setViewMonth(viewMonth - 1)
      }
    } else {
      if (viewMonth === 11) {
        setViewMonth(0)
        setViewYear(viewYear + 1)
      } else {
        setViewMonth(viewMonth + 1)
      }
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getReasonIcon = (reason: string) => {
    const lowerReason = reason.toLowerCase()
    if (lowerReason.includes('clean') || lowerReason.includes('wash')) {
      return <WrenchIcon className="h-3 w-3" />
    }
    if (lowerReason.includes('mainten') || lowerReason.includes('repair')) {
      return <WrenchIcon className="h-3 w-3" />
    }
    if (lowerReason.includes('personal') || lowerReason.includes('event')) {
      return <ClockIcon className="h-3 w-3" />
    }
    return <InfoIcon className="h-3 w-3" />
  }

  return (
    <div className={cn('rounded-lg border bg-card shadow-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 p-6">
        <div>
          <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-brand-gold" />
            Availability Calendar
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage dates when this item is unavailable for rental
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-gold/90"
        >
          {showAddForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4" />
              Add Blackout Date
            </>
          )}
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Add Blackout Form */}
        {showAddForm && (
          <div className="rounded-lg border border-brand-gold/20 bg-brand-gold/5 p-4 space-y-4">
            <h3 className="font-semibold text-card-foreground">Add New Blackout Period</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="mb-1 block text-sm text-muted-foreground">
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={newBlackout.startDate}
                  onChange={(e) => setNewBlackout({ ...newBlackout, startDate: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="mb-1 block text-sm text-muted-foreground">
                  End Date
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={newBlackout.endDate}
                  min={newBlackout.startDate}
                  onChange={(e) => setNewBlackout({ ...newBlackout, endDate: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                />
              </div>
            </div>
            <div>
              <label htmlFor="reason" className="mb-1 block text-sm text-muted-foreground">
                Reason (optional)
              </label>
              <input
                id="reason"
                type="text"
                value={newBlackout.reason}
                onChange={(e) => setNewBlackout({ ...newBlackout, reason: e.target.value })}
                placeholder="e.g., Annual cleaning, personal event, maintenance"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 rounded-lg bg-brand-gold px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-gold/90"
              >
                Add Blackout Period
              </button>
              <button
                onClick={() => {
                  setNewBlackout({ startDate: '', endDate: '', reason: '' })
                  setShowAddForm(false)
                }}
                className="flex-1 rounded-lg border border-input bg-accent px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent/80"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth('prev')}
            className="rounded-lg p-2 hover:bg-accent transition-colors"
          >
            <CalendarIcon className="h-5 w-5 text-muted-foreground rotate-180" />
          </button>
          <h3 className="text-lg font-semibold text-card-foreground">
            {monthNames[viewMonth]} {viewYear}
          </h3>
          <button
            onClick={() => navigateMonth('next')}
            className="rounded-lg p-2 hover:bg-accent transition-colors"
          >
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {dayNames.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before first of month */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="p-2" />
          ))}

          {/* Calendar Days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1
            const date = new Date(viewYear, viewMonth, day)
            const isBlackout = isDateBlackout(date)
            const isInNewBlackout = isDateInNewBlackout(date)
            const blackoutInfo = getBlackoutForDate(date)
            const isToday = date.toDateString() === new Date().toDateString()
            const isPast = date < new Date().setHours(0, 0, 0, 0)

            return (
              <div
                key={day}
                className={cn(
                  'aspect-square rounded-lg p-1 text-center text-sm transition-colors',
                  isToday && 'ring-2 ring-brand-gold',
                  isPast && 'opacity-50',
                  isBlackout && 'bg-red-100 text-red-900 border border-red-200',
                  isInNewBlackout && 'bg-brand-gold/20 border border-brand-gold/50',
                  !isBlackout && !isInNewBlackout && 'hover:bg-accent'
                )}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className={cn(
                    'font-medium',
                    isBlackout || isInNewBlackout ? 'text-card-foreground' : 'text-muted-foreground'
                  )}>
                    {day}
                  </span>
                  {(isBlackout || isInNewBlackout) && (
                    <div className="mt-1">
                      {isBlackout && blackoutInfo ? (
                        <div className="flex items-center justify-center" title={blackoutInfo.reason}>
                          {getReasonIcon(blackoutInfo.reason)}
                        </div>
                      ) : (
                        <div className="h-3 w-3 rounded-full bg-brand-gold" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Existing Blackout Dates List */}
        {existingBlackoutDates.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-card-foreground">Current Blackout Periods</h3>
            <div className="space-y-2">
              {existingBlackoutDates.map((blackout) => (
                <div
                  key={blackout.id}
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-red-100 p-2">
                      <CalendarIcon className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">
                        {new Date(blackout.startDate).toLocaleDateString()} - {new Date(blackout.endDate).toLocaleDateString()}
                      </p>
                      {blackout.reason && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          {getReasonIcon(blackout.reason)}
                          {blackout.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(blackout.id)}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-100 transition-colors"
                    title="Delete blackout period"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-red-100 border border-red-200" />
            <span className="text-muted-foreground">Blackout/Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-brand-gold/20 border border-brand-gold/50" />
            <span className="text-muted-foreground">New Blackout (unsaved)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded ring-2 ring-brand-gold" />
            <span className="text-muted-foreground">Today</span>
          </div>
        </div>
      </div>
    </div>
  )
}
