'use client'
import React, { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { clientGet } from '../../lib/clientApi'
import { AdminListing, PaginatedResponse } from '../../lib/adminApi'
import ReviewListingDrawer from './ReviewListingDrawer'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Spinner, Alert } from '@marketplace/ui'
import { formatCurrency } from './StatusBadge'
import { useSocket } from '../../hooks/useSocket'

interface PendingListingsWidgetProps {
  initialData?: PaginatedResponse<AdminListing>
}

export default function PendingListingsWidget({ initialData }: PendingListingsWidgetProps) {
  const [pendingListings, setPendingListings] = useState<AdminListing[]>([])
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null)
  const socket = useSocket()

  const fetchPendingListings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await clientGet<PaginatedResponse<AdminListing>>(
        '/admin/listings?status=pending_review&limit=5'
      )
      setPendingListings(Array.isArray(res.data) ? res.data : [])
    } catch {
      setError('Failed to load pending listings')
      setPendingListings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialData?.data && Array.isArray(initialData.data)) {
      setPendingListings(initialData.data)
      setLoading(false)
    } else {
      void fetchPendingListings()
    }
  }, [initialData, fetchPendingListings])

  // Real-time Socket.IO updates
  useEffect(() => {
    if (!socket) return

    const handleListingStatusUpdate = (_data: any) => {
      // Refresh pending listings when a listing status changes
      void fetchPendingListings()
    }

    socket.on('listing_status_updated', handleListingStatusUpdate)

    return () => {
      socket.off('listing_status_updated', handleListingStatusUpdate)
    }
  }, [socket, fetchPendingListings])

  const handleReviewComplete = () => {
    setSelectedListing(null)
    void fetchPendingListings()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Pending Listings & Moderation Queue</CardTitle>
            <Badge variant="warning" className="text-xs">
              {pendingListings.length} Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : error ? (
            <Alert variant="error">{error}</Alert>
          ) : pendingListings.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No pending listings awaiting review
            </div>
          ) : (
            <div className="space-y-3">
              {pendingListings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  {listing.primaryImageUrl ? (
                    <img
                      src={listing.primaryImageUrl}
                      alt=""
                      className="h-12 w-12 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                      No img
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{listing.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {listing.seller?.displayName || 'Unknown Seller'}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs font-medium text-foreground">
                        {formatCurrency(listing.price, listing.currency)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setSelectedListing(listing)}
                    className="flex-shrink-0"
                  >
                    Review
                  </Button>
                </div>
              ))}
              {pendingListings.length >= 5 && (
                <div className="pt-2 text-center">
                  <Link href="/listings" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/50">
                    View All Pending Listings
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewListingDrawer
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onActionComplete={handleReviewComplete}
      />
    </>
  )
}