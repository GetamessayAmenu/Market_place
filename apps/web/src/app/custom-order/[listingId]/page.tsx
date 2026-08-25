"use client"
import { Alert, Button } from '@marketplace/ui'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import Container from '../../../components/Container'
import BreadcrumbNav from '../../../components/marketplace/BreadcrumbNav'
import CustomOrderForm from '../../../components/marketplace/CustomOrderForm'
import { serverGet } from '../../../lib/serverApi'

interface ListingData {
  id: string
  title: string
  slug: string
  price: number
  currency: string
  customOrderAvailable: boolean
  seller: { id: string; displayName: string }
}

interface Props {
  params: { listingId: string }
}

export default function CustomOrderPage({ params }: Props) {
  const { listingId } = params
  const router = useRouter()
  const [listing, setListing] = useState<ListingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await serverGet<ListingData>(`/listings/${listingId}`, { revalidate: 60 })
        setListing(res)
      } catch {
        setError('Failed to load listing')
      } finally {
        setLoading(false)
      }
    }
    void fetchListing()
  }, [listingId])

  const handleSuccess = useCallback(() => {
    setSuccess('Your custom order has been submitted! The designer will review your specifications and get back to you.')
  }, [])

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

  if (!listing.customOrderAvailable) {
    return (
      <Container>
        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Custom Orders Not Available</h1>
          <p className="mt-4 text-muted-foreground">This listing does not accept custom orders.</p>
          <Button variant="outline" className="mt-6" onClick={() => { router.push(`/listings/${listingId}`) }}>Back to listing</Button>
        </div>
      </Container>
    )
  }

  if (success) {
    return (
      <Container>
        <section className="py-16 text-center max-w-lg mx-auto">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Order Submitted!</h1>
          <p className="mt-4 text-muted-foreground">{success}</p>
          <div className="mt-8 flex gap-3 justify-center">
            <Button onClick={() => { router.push('/dashboard/custom-orders') }}>View My Orders</Button>
            <Button variant="outline" onClick={() => { router.push(`/listings/${listingId}`) }}>Back to Listing</Button>
          </div>
        </section>
      </Container>
    )
  }

  return (
    <Container>
      <section className="py-8 max-w-2xl mx-auto">
        <BreadcrumbNav
          items={[
            { label: 'Home', href: '/' },
            { label: listing.seller.displayName, href: `/sellers/${listing.seller.id}` },
            { label: listing.title, href: `/listings/${listingId}` },
            { label: 'Custom Order' },
          ]}
          className="mb-6"
        />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Order Custom Made</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            From <span className="font-semibold text-brand-gold">{listing.seller.displayName}</span>
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">{error}</Alert>
        )}

        <CustomOrderForm
          listingId={listingId}
          sellerId={listing.seller.id}
          startingPrice={listing.price}
          estimatedDays={14}
          customizationOptions={{
            requiresMeasurements: true,
            fabricTypes: ['Cotton', 'Silk', 'Linen', 'Polyester'],
            colors: ['Red', 'Blue', 'Green', 'Black', 'White', 'Gold'],
            embroideryTypes: ['Traditional', 'Modern', 'Minimal'],
            customNotesAllowed: true,
          }}
          onClose={() => { router.push(`/listings/${listingId}`) }}
          onSuccess={handleSuccess}
        />
      </section>
    </Container>
  )
}
