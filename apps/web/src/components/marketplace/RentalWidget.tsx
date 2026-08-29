'use client'

import { useState, useMemo } from 'react'
import { cn } from '@marketplace/ui'

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const InfoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)

const MessageCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

export interface RentalPricingTier {
  DAILY: number
  THREE_DAY_EVENT?: number
  WEEKLY?: number
}

export interface RentalTerms {
  securityDeposit: number
  cleaningPolicy: string
  fabricCareTags: string[]
  minDurationDays: number
  maxDurationDays?: number
  lateFeePolicy: string
}

export interface BlackoutDate {
  startDate: string
  endDate: string
  reason: string
}

export interface RentalWidgetProps {
  listingId: string
  pricing: RentalPricingTier
  terms: RentalTerms
  blackoutDates?: BlackoutDate[]
  sellerContact?: {
    phone?: string
    whatsapp?: string
    showPhone?: boolean
  }
  currency?: string
  className?: string
  onSubmitRequest: (data: RentalRequestData) => void
}

export interface RentalRequestData {
  listingId: string
  startDate: string
  endDate: string
  pricingTier: 'DAILY' | 'THREE_DAY_EVENT' | 'WEEKLY'
  pickupHub?: string | undefined
}

type PricingTier = 'DAILY' | 'THREE_DAY_EVENT' | 'WEEKLY'

export default function RentalWidget({
  listingId,
  pricing,
  terms,
  blackoutDates = [],
  sellerContact,
  currency = 'ETB',
  className,
  onSubmitRequest,
}: RentalWidgetProps) {
  const [selectedTier, setSelectedTier] = useState<PricingTier>('DAILY')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pickupHub, setPickupHub] = useState('')

  const getDisabledDates = (): string[] => {
    const disabled: string[] = []
    blackoutDates.forEach((blackout) => {
      const start = new Date(blackout.startDate)
      const end = new Date(blackout.endDate)
      const current = new Date(start)
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0]
        if (dateStr) disabled.push(dateStr)
        current.setDate(current.getDate() + 1)
      }
    })
    return disabled
  }

  const disabledDates = useMemo(() => getDisabledDates(), [blackoutDates])

  const rentalDays = useMemo(() => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }, [startDate, endDate])

  const calculateCost = useMemo(() => {
    if (rentalDays === 0) return 0

    switch (selectedTier) {
      case 'THREE_DAY_EVENT':
        if (pricing.THREE_DAY_EVENT && rentalDays <= 3) {
          return pricing.THREE_DAY_EVENT
        }
        return rentalDays * pricing.DAILY
      case 'WEEKLY':
        if (pricing.WEEKLY && rentalDays <= 7) {
          return pricing.WEEKLY
        }
        return rentalDays * pricing.DAILY
      default:
        return rentalDays * pricing.DAILY
    }
  }, [rentalDays, selectedTier, pricing])

  const isValidRequest = useMemo(() => {
    if (!startDate || !endDate) return false
    if (rentalDays < terms.minDurationDays) return false
    if (terms.maxDurationDays && rentalDays > terms.maxDurationDays) return false
    if (disabledDates.includes(startDate) || disabledDates.includes(endDate)) return false
    return true
  }, [startDate, endDate, rentalDays, terms, disabledDates])

  const handleSubmit = () => {
    if (isValidRequest) {
      const payload: RentalRequestData = {
        listingId,
        startDate,
        endDate,
        pricingTier: selectedTier,
      }
      if (pickupHub) payload.pickupHub = pickupHub
      onSubmitRequest(payload)
    }
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  const subCities = [
    'Shiro Meda',
    'Bole',
    'Kazanchis',
    'Megenagna',
    'Piassa',
    'Mexico',
    'Saris',
    'Kolfe',
  ]

  return (
    <div className={cn('space-y-4', className)}>
      {/* Pricing Tier Selection */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-display text-base font-semibold text-card-foreground mb-3">
          Select Rental Package
        </h3>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => setSelectedTier('DAILY')}
            className={cn(
              'flex items-center justify-between rounded-md border p-3 text-left transition-colors',
              selectedTier === 'DAILY'
                ? 'border-brand-gold bg-brand-gold/10'
                : 'border-border hover:bg-accent'
            )}
          >
            <div>
              <div className="font-medium text-card-foreground">Daily Rate</div>
              <div className="text-xs text-muted-foreground">Perfect for short-term needs</div>
            </div>
            <div className="text-lg font-bold text-brand-gold">
              {pricing.DAILY.toLocaleString()} {currency}
              <span className="text-xs font-normal text-muted-foreground">/day</span>
            </div>
          </button>

          {pricing.THREE_DAY_EVENT && (
            <button
              onClick={() => setSelectedTier('THREE_DAY_EVENT')}
              className={cn(
                'flex items-center justify-between rounded-md border p-3 text-left transition-colors',
                selectedTier === 'THREE_DAY_EVENT'
                  ? 'border-brand-gold bg-brand-gold/10'
                  : 'border-border hover:bg-accent'
              )}
            >
              <div>
                <div className="font-medium text-card-foreground">3-Day Event Package</div>
                <div className="text-xs text-muted-foreground">Wedding, Timket, special occasions</div>
              </div>
              <div className="text-lg font-bold text-brand-gold">
                {pricing.THREE_DAY_EVENT.toLocaleString()} {currency}
                <span className="text-xs font-normal text-muted-foreground">/3 days</span>
              </div>
            </button>
          )}

          {pricing.WEEKLY && (
            <button
              onClick={() => setSelectedTier('WEEKLY')}
              className={cn(
                'flex items-center justify-between rounded-md border p-3 text-left transition-colors',
                selectedTier === 'WEEKLY'
                  ? 'border-brand-gold bg-brand-gold/10'
                  : 'border-border hover:bg-accent'
              )}
            >
              <div>
                <div className="font-medium text-card-foreground">Weekly Package</div>
                <div className="text-xs text-muted-foreground">Best value for extended rentals</div>
              </div>
              <div className="text-lg font-bold text-brand-gold">
                {pricing.WEEKLY.toLocaleString()} {currency}
                <span className="text-xs font-normal text-muted-foreground">/week</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Date Picker */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-display text-base font-semibold text-card-foreground mb-3">
          Select Rental Dates
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="rent-start" className="mb-1 block text-xs text-muted-foreground">
              Start Date
            </label>
            <input
              id="rent-start"
              type="date"
              min={minDate}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="rent-end" className="mb-1 block text-xs text-muted-foreground">
              End Date
            </label>
            <input
              id="rent-end"
              type="date"
              min={startDate || minDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 disabled:opacity-50"
            />
          </div>
        </div>

        {disabledDates.length > 0 && (
          <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
            <InfoIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>Some dates are unavailable due to seller maintenance or prior bookings</span>
          </div>
        )}

        {rentalDays > 0 && (
          <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {rentalDays} day{rentalDays !== 1 ? 's' : ''} rental
              </span>
              <span className="font-medium text-card-foreground">
                {calculateCost.toLocaleString()} {currency}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pickup Hub Selection */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-display text-base font-semibold text-card-foreground mb-3">
          Pickup Location
        </h3>
        <select
          value={pickupHub}
          onChange={(e) => setPickupHub(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
        >
          <option value="">Select pickup hub</option>
          {subCities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* Cost Summary */}
      {rentalDays > 0 && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h3 className="font-display text-base font-semibold text-card-foreground">Cost Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rental Fee ({rentalDays} days)</span>
              <span className="font-medium text-card-foreground">
                {calculateCost.toLocaleString()} {currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Security Deposit</span>
              <span className="font-medium text-card-foreground">
                {terms.securityDeposit.toLocaleString()} {currency}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border/50 text-base font-semibold">
              <span className="text-card-foreground">Total Due at Pickup</span>
              <span className="text-brand-gold">
                {(calculateCost + terms.securityDeposit).toLocaleString()} {currency}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Rental Terms Transparency Card */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="font-display text-base font-semibold text-card-foreground flex items-center gap-2">
          <ShieldIcon className="h-4 w-4 text-brand-gold" />
          Rental Terms & Care Instructions
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <ClockIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-card-foreground">Duration:</span>{' '}
              {terms.minDurationDays}-{terms.maxDurationDays || 'unlimited'} days
            </div>
          </div>

          <div className="flex items-start gap-2">
            <InfoIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-card-foreground">Cleaning Policy:</span>{' '}
              {terms.cleaningPolicy}
            </div>
          </div>

          {terms.fabricCareTags.length > 0 && (
            <div className="flex items-start gap-2">
              <ShieldIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-card-foreground">Fabric Care:</span>{' '}
                <div className="flex flex-wrap gap-1 mt-1">
                  {terms.fabricCareTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-brand-gold/10 px-2 py-0.5 text-xs font-medium text-brand-gold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            <InfoIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-card-foreground">Late Fee Policy:</span>{' '}
              {terms.lateFeePolicy}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleSubmit}
          disabled={!isValidRequest}
          className={cn(
            'w-full rounded-lg bg-brand-gold px-4 py-3 font-semibold text-white transition-colors',
            isValidRequest
              ? 'hover:bg-brand-gold/90'
              : 'cursor-not-allowed opacity-50'
          )}
        >
          Submit Rental Request
        </button>

        <div className="grid grid-cols-2 gap-2">
          {sellerContact?.whatsapp && (
            <a
              href={`https://wa.me/${sellerContact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-green-600 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
            >
              <MessageCircleIcon className="h-4 w-4" />
              Chat on WhatsApp
            </a>
          )}

          {sellerContact?.phone && sellerContact.showPhone && (
            <a
              href={`tel:${sellerContact.phone}`}
              className="flex items-center justify-center gap-2 rounded-lg border border-input bg-accent px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent/80"
            >
              <PhoneIcon className="h-4 w-4" />
              Call Seller
            </a>
          )}
        </div>
      </div>

      {!isValidRequest && startDate && endDate && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {rentalDays < terms.minDurationDays && (
            <p>Minimum rental duration is {terms.minDurationDays} days</p>
          )}
          {terms.maxDurationDays && rentalDays > terms.maxDurationDays && (
            <p>Maximum rental duration is {terms.maxDurationDays} days</p>
          )}
          {(disabledDates.includes(startDate) || disabledDates.includes(endDate)) && (
            <p>Selected dates are unavailable</p>
          )}
        </div>
      )}
    </div>
  )
}
