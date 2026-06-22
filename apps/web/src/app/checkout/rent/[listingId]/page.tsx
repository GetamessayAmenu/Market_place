"use client"
import { Alert, Badge, Button } from '@marketplace/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import Container from '../../../../components/Container'
import BreadcrumbNav from '../../../../components/marketplace/BreadcrumbNav'
import { useAuth } from '../../../../hooks/useAuth'
import { serverGet } from '../../../../lib/serverApi'

interface ListingData {
  id: string
  title: string
  slug: string
  price: number
  currency: string
  status: string
  rentalPricePerDay: number | null
  rentalDeposit: number | null
  primaryImageUrl?: string | null
  seller: { id: string; displayName: string }
}

interface Props {
  params: { listingId: string }
}

export default function RentCheckoutPage({ params }: Props) {
  const { listingId } = params
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [listing, setListing] = useState<ListingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startDate = searchParams.get('start') ?? ''
  const endDate = searchParams.get('end') ?? ''
  const days = Number(searchParams.get('days') ?? '0')

  // Renter form
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=/checkout/rent/${listingId}`)
      return
    }
    const fetchListing = async () => {
      try {
        const res = await serverGet<ListingData>(`/listings/${listingId}`, { revalidate: 0 })
        setListing(res)
      } catch {
        setError('Failed to load listing')
      } finally {
        setLoading(false)
      }
    }
    void fetchListing()
  }, [listingId, user, router])

  const pricePerDay = listing?.rentalPricePerDay ?? 0
  const deposit = listing?.rentalDeposit ?? 0
  const rentalCost = pricePerDay * days
  const total = rentalCost + deposit
  const currency = listing?.currency ?? 'ETB'

  const handleSubmit = () => {
    if (!fullName || !phone || !address || !city) {
      setError('Please fill in all required fields')
      return
    }
    if (!startDate || !endDate || days < 1) {
      setError('Invalid rental period')
      return
    }
    setIsSubmitting(true)
    setError(null)
    setTimeout(() => {
      router.push(`/dashboard/orders?success=rent-${listingId}`)
    }, 1500)
  }

  if (loading) {
    return (
      <Container>
        <div className="py-16 text-center">
          <div className="animate-pulse bg-muted h-6 w-48 mx-auto rounded mb-4" />
          <div className="animate-pulse bg-muted h-4 w-32 mx-auto rounded" />
        </div>
      </Container>
    )
  }

  if (!listing) {
    return (
      <Container>
        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Listing Not Found</h1>
          <p className="mt-4 text-muted-foreground">The listing does not exist or has been removed.</p>
          <Button variant="outline" className="mt-6" onClick={() => { router.push('/') }}>Go to homepage</Button>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <section className="py-8 max-w-4xl mx-auto">
        <BreadcrumbNav
          items={[
            { label: 'Home', href: '/' },
            { label: listing.title, href: `/listings/${listingId}` },
            { label: 'Rent Checkout' },
          ]}
          className="mb-6"
        />

        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Rent — Checkout</h1>
          <Badge variant="warning">Rental</Badge>
        </div>

        {error ? <Alert variant="error" className="mb-6">{error}</Alert> : null}

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Form */}
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Your Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="rent-full-name" className="block text-sm font-medium text-card-foreground mb-1">Full Name *</label>
                  <input
                    id="rent-full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value) }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="rent-phone" className="block text-sm font-medium text-card-foreground mb-1">Phone Number *</label>
                  <input
                    id="rent-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value) }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                    placeholder="+251 9XX XXX XXX"
                  />
                </div>
                <div>
                  <label htmlFor="rent-address" className="block text-sm font-medium text-card-foreground mb-1">Pickup/Delivery Address *</label>
                  <input
                    id="rent-address"
                    type="text"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value) }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="rent-city" className="block text-sm font-medium text-card-foreground mb-1">City *</label>
                    <input
                      id="rent-city"
                      type="text"
                      value={city}
                      onChange={(e) => { setCity(e.target.value) }}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                      placeholder="Addis Ababa"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="rent-notes" className="block text-sm font-medium text-card-foreground mb-1">Notes (optional)</label>
                  <textarea
                    id="rent-notes"
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value) }}
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                    placeholder="Any special instructions"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rental summary */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-card p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Rental Summary</h2>

              <div className="flex gap-3 mb-4 pb-4 border-b border-border/50">
                {listing.primaryImageUrl ? (
                  <img src={listing.primaryImageUrl} alt={listing.title} className="h-16 w-16 rounded-md object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-md bg-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-card-foreground text-sm truncate">{listing.title}</p>
                  <p className="text-xs text-muted-foreground">From {listing.seller.displayName}</p>
                </div>
              </div>

              {/* Rental period */}
              <div className="rounded-md bg-brand-gold/5 border border-brand-gold/20 p-3 mb-4">
                <p className="text-xs font-medium text-brand-gold mb-1">Rental Period</p>
                <p className="text-sm font-semibold text-card-foreground">
                  {startDate ? new Date(startDate).toLocaleDateString() : '—'} → {endDate ? new Date(endDate).toLocaleDateString() : '—'}
                </p>
                <p className="text-xs text-muted-foreground">{String(days)} day{days !== 1 ? 's' : ''}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{currency} {pricePerDay.toLocaleString()} x {String(days)} days</span>
                  <span className="text-card-foreground">{currency} {rentalCost.toLocaleString()}</span>
                </div>
                {deposit > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Security deposit</span>
                    <span className="text-card-foreground">{currency} {deposit.toLocaleString()}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-between text-base font-bold border-t border-border/50 pt-4 mb-6">
                <span className="text-card-foreground">Total</span>
                <span className="text-brand-gold">{currency} {total.toLocaleString()}</span>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || days < 1}
                className="w-full bg-brand-gold text-brand-gold-foreground hover:bg-brand-gold/90"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Rental'}
              </Button>

              <p className="mt-3 text-xs text-center text-muted-foreground">
                Deposit is refundable upon return of the item in good condition.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Container>
  )
}
