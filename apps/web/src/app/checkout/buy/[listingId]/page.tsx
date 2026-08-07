"use client"
import { Alert, Button } from '@marketplace/ui'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import Container from '../../../../components/Container'
import BreadcrumbNav from '../../../../components/marketplace/BreadcrumbNav'
import { useAuth } from '../../../../hooks/useAuth'
import { serverGet } from '../../../../lib/serverApi'
import { apiPost } from '../../../../lib/api'

interface ListingData {
  id: string
  title: string
  slug: string
  price: number
  currency: string
  status: string
  primaryImageUrl?: string | null
  seller: { id: string; displayName: string }
}

interface Props {
  params: { listingId: string }
}

export default function BuyCheckoutPage({ params }: Props) {
  const { listingId } = params
  const router = useRouter()
  const { user } = useAuth()
  const [listing, setListing] = useState<ListingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Shipping form
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=/checkout/buy/${listingId}`)
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

  const handleSubmit = async () => {
    if (!fullName || !phone || !address || !city) {
      setError('Please fill in all required fields')
      return
    }
    setIsSubmitting(true)
    setError(null)
    
    try {
      const orderData = {
        type: 'SALE' as const,
        productId: listingId,
        agreedPrice: listing.price,
        shippingAddress: {
          fullName,
          phone,
          address,
          city,
          notes: notes || undefined,
        },
      }

      const result = await apiPost<{ id: string; orderNumber: string }>('/orders', orderData)
      
      // Redirect to orders page with success
      router.push(`/dashboard/orders?success=${result.orderNumber}`)
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place order. Please try again.'
      setError(errorMessage)
      console.error('Order creation error:', err)
    } finally {
      setIsSubmitting(false)
    }
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

  const shippingCost = 0 // Free shipping for now
  const total = listing.price + shippingCost

  return (
    <Container>
      <section className="py-8 max-w-4xl mx-auto">
        <BreadcrumbNav
          items={[
            { label: 'Home', href: '/' },
            { label: listing.title, href: `/listings/${listingId}` },
            { label: 'Checkout' },
          ]}
          className="mb-6"
        />

        <h1 className="text-2xl font-bold text-foreground mb-6">Buy — Checkout</h1>

        {error ? <Alert variant="error" className="mb-6">{error}</Alert> : null}

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Shipping form */}
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Shipping Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="full-name" className="block text-sm font-medium text-card-foreground mb-1">Full Name *</label>
                  <input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value) }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-card-foreground mb-1">Phone Number *</label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value) }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                    placeholder="+251 9XX XXX XXX"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-card-foreground mb-1">Delivery Address *</label>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value) }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-card-foreground mb-1">City *</label>
                    <input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => { setCity(e.target.value) }}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                      placeholder="Addis Ababa"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-card-foreground mb-1">Delivery Notes (optional)</label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value) }}
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                    placeholder="Any special delivery instructions"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-card p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Order Summary</h2>

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

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Item price</span>
                  <span className="text-card-foreground">{listing.currency} {listing.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
              </div>

              <div className="flex justify-between text-base font-bold border-t border-border/50 pt-4 mb-6">
                <span className="text-card-foreground">Total</span>
                <span className="text-green-600">{listing.currency} {total.toLocaleString()}</span>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? 'Processing...' : 'Place Order'}
              </Button>

              <p className="mt-3 text-xs text-center text-muted-foreground">
                You will be connected with the seller to arrange payment and delivery.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Container>
  )
}
