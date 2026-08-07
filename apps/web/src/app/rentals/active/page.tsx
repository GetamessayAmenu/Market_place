'use client'

import { useState, useEffect } from 'react'
import { cn } from '@marketplace/ui'

// Simple SVG icon components
const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
)

const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

export interface ActiveRental {
  id: string
  orderNumber: string
  listing: {
    id: string
    title: string
    images: string[]
    slug: string
  }
  seller: {
    id: string
    displayName: string
    phone?: string
    whatsapp?: string
  }
  startDate: string
  endDate: string
  totalAmount: number
  securityDeposit: number
  pickupHub: string
  status: string
  pricingTierUsed: string
}

export default function ActiveRentalTracker() {
  const [activeRentals, setActiveRentals] = useState<ActiveRental[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRental, setSelectedRental] = useState<ActiveRental | null>(null)

  useEffect(() => {
    loadActiveRentals()
  }, [])

  const loadActiveRentals = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // const response = await fetch('/api/rentals/my?status=ACTIVE')
      // const data = await response.json()
      // setActiveRentals(data.data?.items || [])
      setActiveRentals([])
    } catch (error) {
      console.error('Failed to load active rentals:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) {
      return { text: 'Overdue', isOverdue: true, hours: 0 }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      return { text: `${days} day${days !== 1 ? 's' : ''} remaining`, isOverdue: false, hours: diff / (1000 * 60 * 60) }
    }
    if (hours > 0) {
      return { text: `${hours} hour${hours !== 1 ? 's' : ''} remaining`, isOverdue: false, hours }
    }
    return { text: `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`, isOverdue: false, hours: diff / (1000 * 60 * 60) }
  }

  const requestExtension = async (_rentalId: string) => {
    try {
      // TODO: Implement extension request
      // await fetch(`/api/rentals/${rentalId}/extensions`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ additionalDays: 1, reason: 'Need more time' }),
      // })
      alert('Extension request submitted')
    } catch (error) {
      console.error('Failed to request extension:', error)
    }
  }

  const generateRentalAgreement = (rental: ActiveRental) => {
    const agreementText = `
RENTAL AGREEMENT
================

Order Number: ${rental.orderNumber}
Date: ${new Date().toLocaleDateString()}

RENTAL DETAILS
--------------
Item: ${rental.listing.title}
Rental Period: ${new Date(rental.startDate).toLocaleDateString()} to ${new Date(rental.endDate).toLocaleDateString()}
Pickup Location: ${rental.pickupHub}
Pricing Tier: ${rental.pricingTierUsed}

FINANCIAL TERMS
---------------
Rental Fee: ${rental.totalAmount.toLocaleString()} ETB
Security Deposit: ${rental.securityDeposit.toLocaleString()} ETB
Total Due at Pickup: ${(rental.totalAmount + rental.securityDeposit).toLocaleString()} ETB

PARTIES
-------
Renter: [Your Name]
Seller: ${rental.seller.displayName}

TERMS AND CONDITIONS
---------------------
1. The renter agrees to return the item in the same condition as received.
2. Late returns may incur additional fees.
3. Security deposit will be refunded upon satisfactory inspection of returned item.
4. Any damage beyond normal wear and tear may be deducted from the deposit.

SIGNATURES
----------
Renter: ______________________ Date: _______

Seller: ______________________ Date: _______
    `.trim()

    const blob = new Blob([agreementText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rental-agreement-${rental.orderNumber}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getMapLink = (location: string) => {
    // Simplified map link - in production, use actual coordinates
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location + ', Ethiopia')}`
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading active rentals...</p>
        </div>
      </div>
    )
  }

  if (activeRentals.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <ClockIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold text-card-foreground">No Active Rentals</h2>
          <p className="mt-2 text-muted-foreground">You don't have any active rental orders at the moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-card-foreground">Active Rental Tracker</h1>
          <p className="mt-2 text-muted-foreground">Track your ongoing rentals and manage returns</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Rental List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-card-foreground">Your Rentals</h2>
            {activeRentals.map((rental) => {
              const timeInfo = getTimeRemaining(rental.endDate)
              return (
                <button
                  key={rental.id}
                  onClick={() => setSelectedRental(rental)}
                  className={cn(
                    'w-full rounded-lg border p-4 text-left transition-colors',
                    selectedRental?.id === rental.id
                      ? 'border-brand-gold bg-brand-gold/10'
                      : 'border-border hover:bg-accent'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {rental.listing.images[0] && (
                      <img
                        src={rental.listing.images[0]}
                        alt={rental.listing.title}
                        className="h-16 w-16 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-card-foreground truncate">{rental.listing.title}</h3>
                      <p className="text-sm text-muted-foreground">{rental.orderNumber}</p>
                      <div className={cn(
                        'mt-2 inline-flex items-center gap-1 text-xs font-medium',
                        timeInfo.isOverdue ? 'text-destructive' : 'text-brand-gold'
                      )}>
                        {timeInfo.isOverdue && <AlertCircleIcon className="h-3 w-3" />}
                        {timeInfo.text}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Rental Details */}
          {selectedRental && (
            <div className="lg:col-span-2">
              <div className="rounded-lg border bg-card p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-card-foreground">{selectedRental.listing.title}</h2>
                    <p className="text-muted-foreground">{selectedRental.orderNumber}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    Active
                  </span>
                </div>

                {/* Countdown Timer */}
                <div className="rounded-lg bg-brand-gold/10 p-6">
                  <div className="flex items-center gap-3">
                    <ClockIcon className={cn(
                      'h-8 w-8',
                      getTimeRemaining(selectedRental.endDate).isOverdue ? 'text-destructive' : 'text-brand-gold'
                    )} />
                    <div>
                      <p className="text-sm text-muted-foreground">Time Remaining</p>
                      <p className={cn(
                        'text-2xl font-bold',
                        getTimeRemaining(selectedRental.endDate).isOverdue ? 'text-destructive' : 'text-brand-gold'
                      )}>
                        {getTimeRemaining(selectedRental.endDate).text}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pickup Instructions */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5" />
                    Pickup Instructions
                  </h3>
                  <div className="rounded-lg border bg-accent p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-card-foreground">Pickup Date</p>
                        <p className="text-muted-foreground">{new Date(selectedRental.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPinIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-card-foreground">Location</p>
                        <p className="text-muted-foreground">{selectedRental.pickupHub}</p>
                        <a
                          href={getMapLink(selectedRental.pickupHub)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-brand-gold hover:underline mt-1"
                        >
                          View on map <ArrowRightIcon className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileTextIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-card-foreground">What to Bring</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          <li>Valid ID</li>
                          <li>Security Deposit ({selectedRental.securityDeposit.toLocaleString()} ETB)</li>
                          <li> Signed rental agreement</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seller Contact */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-card-foreground">Contact Seller</h3>
                  <div className="flex gap-2">
                    {selectedRental.seller.whatsapp && (
                      <a
                        href={`https://wa.me/${selectedRental.seller.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-green-600 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
                      >
                        WhatsApp
                      </a>
                    )}
                    {selectedRental.seller.phone && (
                      <a
                        href={`tel:${selectedRental.seller.phone}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-accent px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent/80"
                      >
                        Call
                      </a>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => requestExtension(selectedRental.id)}
                    className="w-full rounded-lg border border-brand-gold bg-brand-gold/10 px-4 py-3 font-semibold text-brand-gold transition-colors hover:bg-brand-gold/20"
                  >
                    Request 1-Day Extension
                  </button>
                  <button
                    onClick={() => generateRentalAgreement(selectedRental)}
                    className="w-full rounded-lg border border-input bg-accent px-4 py-3 font-semibold text-card-foreground transition-colors hover:bg-accent/80"
                  >
                    Download Rental Agreement
                  </button>
                </div>

                {/* Financial Summary */}
                <div className="rounded-lg border bg-accent p-4 space-y-2">
                  <h3 className="font-semibold text-card-foreground">Payment Summary</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rental Fee</span>
                    <span className="font-medium text-card-foreground">
                      {selectedRental.totalAmount.toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Security Deposit</span>
                    <span className="font-medium text-card-foreground">
                      {selectedRental.securityDeposit.toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border/50 font-semibold">
                    <span className="text-card-foreground">Total Paid</span>
                    <span className="text-brand-gold">
                      {(selectedRental.totalAmount + selectedRental.securityDeposit).toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
