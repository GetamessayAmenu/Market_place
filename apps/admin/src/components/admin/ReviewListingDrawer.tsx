'use client'
import {
  Button,
  Modal,
  Spinner,
  Alert,
  Badge,
} from '@marketplace/ui'
import React, { useState, useCallback, useEffect } from 'react'

import { clientGet, clientPost, clientPatch, clientDelete } from '../../lib/clientApi'
import { StatusBadge, formatCurrency, formatDate, formatDateTime } from './StatusBadge'

interface AdminListing {
  id: string
  title: string
  slug: string
  description: string
  price: number
  currency: string
  condition: string
  status: string
  city?: string | null
  state?: string | null
  country?: string | null
  isFeatured: boolean
  availableForPurchase: boolean
  availableForRent: boolean
  customOrderAvailable: boolean
  rentalPricePerDay?: number | null
  rentalDeposit?: number | null
  rentalPricingTier?: string | null
  rentalThreeDayRate?: number | null
  rentalWeeklyRate?: number | null
  cleaningPolicy?: string | null
  fabricCareTags?: string[]
  minRentalDurationDays?: number
  maxRentalDurationDays?: number | null
  supportsReadyMade?: boolean
  supportsCustomDesign?: boolean
  startingCustomPrice?: number | null
  estimatedProductionDays?: number | null
  customizationOptions?: any
  rejectedReason?: string | null
  primaryImageUrl?: string | null
  images?: { url: string; isPrimary: boolean; cloudinaryPublicId?: string; id?: string }[]
  seller?: {
    id: string
    displayName?: string
    email?: string
    phone?: string | null
    location?: string | null
    emailVerifiedAt?: string | null
    phoneVerifiedAt?: string | null
  } | null
  category?: { id: string; name: string; slug: string } | null
  _count?: { favorites: number }
  createdAt: string
}

interface ReviewListingDrawerProps {
  listing: AdminListing | null
  onClose: () => void
  onActionComplete?: () => void
}

export default function ReviewListingDrawer({ listing, onClose, onActionComplete }: ReviewListingDrawerProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details')
  const [history, setHistory] = useState<any[] | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showChangesForm, setShowChangesForm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async (listingId: string) => {
    setHistoryLoading(true)
    try {
      const res = await clientGet<any[]>(`/admin/listings/${listingId}/history`)
      setHistory(Array.isArray(res) ? res : [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (listing) {
      setActiveTab('details')
      setShowRejectForm(false)
      setShowChangesForm(false)
      setRejectReason('')
      setDeleteConfirm(false)
      setError(null)
      void fetchHistory(listing.id)
    } else {
      setHistory(null)
    }
  }, [listing, fetchHistory])

  const handleAction = async (action: 'approve' | 'hide' | 'delete' | 'feature' | 'reject' | 'request_changes') => {
    if (!listing) return
    setActionLoading(true)
    setError(null)
    try {
      if (action === 'approve') {
        await clientPost<any>(`/admin/listings/${listing.id}/approve`)
      } else if (action === 'hide') {
        await clientPost<any>(`/admin/listings/${listing.id}/hide`)
      } else if (action === 'delete') {
        await clientDelete(`/admin/listings/${listing.id}`)
        setDeleteConfirm(false)
        onClose()
        onActionComplete?.()
        setActionLoading(false)
        return
      } else if (action === 'feature') {
        await clientPatch<any>(`/admin/listings/${listing.id}/feature`, {
          featured: !listing.isFeatured
        })
      } else if (action === 'reject') {
        if (!rejectReason.trim()) {
          setError('Rejection reason is required.')
          setActionLoading(false)
          return
        }
        await clientPost<any>(`/admin/listings/${listing.id}/reject`, {
          reason: rejectReason
        })
        setShowRejectForm(false)
        setRejectReason('')
      } else if (action === 'request_changes') {
        if (!rejectReason.trim()) {
          setError('Feedback reason is required.')
          setActionLoading(false)
          return
        }
        await clientPost<any>(`/admin/listings/${listing.id}/request-changes`, {
          reason: rejectReason
        })
        setShowChangesForm(false)
        setRejectReason('')
      }
      
      void fetchHistory(listing.id)
      onActionComplete?.()
    } catch {
      setError(`Failed to perform action: ${action}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (!listing) return null

  return (
    <Modal open={listing !== null} onClose={onClose} title="" size="full" className="max-w-6xl">
      <div className="flex flex-col lg:flex-row h-[85vh]">
        {/* LEFT SIDE - Product Details Review */}
        <div className="flex-1 overflow-y-auto border-r p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{listing.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={listing.status} domain="listing" />
                {listing.isFeatured && (
                  <Badge className="bg-amber-500 text-white font-bold text-[10px] uppercase">Featured</Badge>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab(activeTab === 'details' ? 'history' : 'details')}>
              {activeTab === 'details' ? 'View History' : 'View Details'}
            </Button>
          </div>

          {/* Image Carousel */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-foreground">Product Images</h3>
            {listing.images && listing.images.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {listing.images.map((img, idx) => (
                  <img
                    key={img.id || idx}
                    src={img.url}
                    alt={`Product image ${idx + 1}`}
                    className="h-48 w-48 rounded-lg object-cover bg-muted border flex-shrink-0"
                  />
                ))}
              </div>
            ) : listing.primaryImageUrl ? (
              <img src={listing.primaryImageUrl} alt="" className="h-48 w-48 rounded-lg object-cover bg-muted border" />
            ) : (
              <div className="h-48 w-48 rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground border">
                No images
              </div>
            )}
          </div>

          {activeTab === 'details' ? (
            <>
              {/* Description */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-foreground">Description</h3>
                <p className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg border whitespace-pre-wrap">
                  {listing.description || 'No description provided.'}
                </p>
              </div>

              {/* Pricing Terms */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-foreground">Pricing Terms</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border bg-muted/10">
                    <span className="text-xs text-muted-foreground block mb-1">Base Price</span>
                    <span className="text-xl font-bold text-foreground">{formatCurrency(listing.price, listing.currency)}</span>
                  </div>
                  {listing.availableForRent && (
                    <div className="p-4 rounded-lg border bg-muted/10">
                      <span className="text-xs text-muted-foreground block mb-1">Rental Price</span>
                      <span className="text-xl font-bold text-foreground">{formatCurrency(listing.rentalPricePerDay || 0, listing.currency)} / day</span>
                    </div>
                  )}
                  {listing.rentalDeposit && (
                    <div className="p-4 rounded-lg border bg-muted/10">
                      <span className="text-xs text-muted-foreground block mb-1">Rental Deposit</span>
                      <span className="text-xl font-bold text-foreground">{formatCurrency(listing.rentalDeposit, listing.currency)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rental Deposit Rules */}
              {listing.availableForRent && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-foreground">Rental Deposit Rules</h3>
                  <div className="p-4 rounded-lg border bg-muted/10 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Duration:</span>
                      <span className="font-medium">{listing.minRentalDurationDays} day(s)</span>
                    </div>
                    {listing.maxRentalDurationDays && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Duration:</span>
                        <span className="font-medium">{listing.maxRentalDurationDays} day(s)</span>
                      </div>
                    )}
                    {listing.cleaningPolicy && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cleaning Policy:</span>
                        <span className="font-medium capitalize">{listing.cleaningPolicy}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Tailoring Lead Times */}
              {listing.customOrderAvailable && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-foreground">Custom Tailoring Details</h3>
                  <div className="p-4 rounded-lg border bg-muted/10 space-y-2 text-sm">
                    {listing.estimatedProductionDays && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Production Time:</span>
                        <span className="font-medium">{listing.estimatedProductionDays} days</span>
                      </div>
                    )}
                    {listing.startingCustomPrice && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Starting Price:</span>
                        <span className="font-medium">{formatCurrency(listing.startingCustomPrice, listing.currency)}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Badge variant={listing.supportsReadyMade ? 'success' : 'secondary'} className="text-xs">
                        Ready Made: {listing.supportsReadyMade ? 'Yes' : 'No'}
                      </Badge>
                      <Badge variant={listing.supportsCustomDesign ? 'success' : 'secondary'} className="text-xs">
                        Custom Design: {listing.supportsCustomDesign ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Local Taxonomy Tags */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-foreground">Category & Tags</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Category:</span>
                    <Badge variant="outline">{listing.category?.name || 'Uncategorized'}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Condition:</span>
                    <Badge variant="outline" className="capitalize">{listing.condition}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Location:</span>
                    <span className="text-sm font-medium">{listing.city || 'Not specified'}, {listing.country || 'ET'}</span>
                  </div>
                </div>
              </div>

              {/* Seller Verification Badge */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-foreground">Seller Information</h3>
                <div className="p-4 rounded-lg border bg-muted/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{listing.seller?.displayName || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{listing.seller?.email || ''}</p>
                    </div>
                    <div className="flex gap-1">
                      {listing.seller?.emailVerifiedAt && (
                        <Badge variant="success" className="text-[10px]">✓ Email Verified</Badge>
                      )}
                      {listing.seller?.phoneVerifiedAt && (
                        <Badge variant="success" className="text-[10px]">✓ Phone Verified</Badge>
                      )}
                    </div>
                  </div>
                  {listing.seller?.location && (
                    <p className="text-xs text-muted-foreground">📍 {listing.seller.location}</p>
                  )}
                </div>
              </div>

              {/* Rejected Reason Display */}
              {listing.status === 'rejected' && listing.rejectedReason && (
                <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-destructive mb-2">Previous Rejection Reason</h3>
                  <p className="text-sm text-foreground">{listing.rejectedReason}</p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-foreground">Moderation History</h3>
              {historyLoading ? (
                <div className="flex justify-center p-8"><Spinner /></div>
              ) : !history || history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No moderation history recorded.</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {history.map((log: any) => (
                    <div key={log.id} className="border rounded-lg p-4 text-sm bg-muted/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary capitalize">{log.action.replace('listing.', '').replace(/_/g, ' ')}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Moderator: <strong className="text-foreground">{log.actor?.displayName || log.actor?.email || 'System'}</strong>
                      </div>
                      {log.metadata?.reason && (
                        <div className="mt-2 bg-muted/40 p-3 rounded text-xs border border-muted-foreground/10 text-foreground">
                          <span className="font-semibold text-muted-foreground block mb-1">Reason:</span>
                          {String(log.metadata.reason)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDE - Action Form */}
        <div className="w-full lg:w-96 p-6 bg-muted/30 border-l space-y-6">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">Moderation Actions</h3>
            <p className="text-sm text-muted-foreground">Review and take action on this listing</p>
          </div>

          {/* Quick Status Info */}
          <div className="p-4 rounded-lg bg-background border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Status:</span>
              <StatusBadge status={listing.status} domain="listing" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Created:</span>
              <span className="text-sm font-medium">{formatDate(listing.createdAt)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Price:</span>
              <span className="text-sm font-medium">{formatCurrency(listing.price, listing.currency)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {showRejectForm ? (
              <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5 space-y-3">
                <label className="block text-sm font-semibold text-destructive">Rejection Reason (Required)</label>
                <textarea
                  placeholder="Provide a detailed reason explaining why this listing is being rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-destructive"
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setShowRejectForm(false); setRejectReason('') }} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleAction('reject')} disabled={actionLoading || !rejectReason.trim()} className="flex-1">
                    {actionLoading ? 'Processing...' : 'Confirm Reject'}
                  </Button>
                </div>
              </div>
            ) : showChangesForm ? (
              <div className="border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/10 space-y-3">
                <label className="block text-sm font-semibold text-yellow-700 dark:text-yellow-300">Request Changes - Feedback (Required)</label>
                <textarea
                  placeholder="Describe the changes needed before approval (e.g., better photos, more details, pricing adjustments)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setShowChangesForm(false); setRejectReason('') }} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleAction('request_changes')} disabled={actionLoading || !rejectReason.trim()} className="flex-1">
                    {actionLoading ? 'Processing...' : 'Request Changes'}
                  </Button>
                </div>
              </div>
            ) : deleteConfirm ? (
              <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5 space-y-3">
                <p className="text-sm font-semibold text-destructive">Are you sure you want to delete this listing?</p>
                <p className="text-xs text-muted-foreground">This action will archive and soft-delete the listing.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleAction('delete')} disabled={actionLoading} className="flex-1">
                    {actionLoading ? 'Processing...' : 'Delete'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={() => handleAction('approve')}
                  disabled={actionLoading || listing.status === 'active'}
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  ✓ Approve & Publish
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowChangesForm(true)}
                  disabled={actionLoading || listing.status === 'rejected' || listing.status === 'active'}
                  size="lg"
                  className="w-full border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                >
                  ⚠ Request Changes
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectForm(true)}
                  disabled={actionLoading || listing.status === 'rejected'}
                  size="lg"
                  className="w-full"
                >
                  ✕ Reject Listing
                </Button>
                <div className="border-t pt-2 space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => handleAction('hide')}
                    disabled={actionLoading || listing.status === 'archived'}
                    size="sm"
                    className="w-full"
                  >
                    Hide / Archive
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAction('feature')}
                    disabled={actionLoading}
                    size="sm"
                    className="w-full"
                  >
                    {listing.isFeatured ? 'Unfeature' : 'Feature'} Listing
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteConfirm(true)}
                    disabled={actionLoading}
                    size="sm"
                    className="w-full"
                  >
                    Delete Permanently
                  </Button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="error">{error}</Alert>
          )}
        </div>
      </div>
    </Modal>
  )
}