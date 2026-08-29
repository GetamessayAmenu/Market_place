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
  const [activeTab, setActiveTab] = useState<'details' | 'diff' | 'history'>('details')
  const [history, setHistory] = useState<any[] | null>(null)
  const [revisions, setRevisions] = useState<any[] | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showChangesForm, setShowChangesForm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pendingRevision = revisions?.find((r) => r.status === 'PENDING_REVIEW')

  const fetchHistoryAndRevisions = useCallback(async (listingId: string) => {
    setHistoryLoading(true)
    try {
      const [histRes, revRes] = await Promise.all([
        clientGet<any[]>(`/admin/listings/${listingId}/history`).catch(() => []),
        clientGet<any[]>(`/admin/listings/${listingId}/revisions`).catch(() => []),
      ])
      setHistory(Array.isArray(histRes) ? histRes : [])
      setRevisions(Array.isArray(revRes) ? revRes : [])
      if (Array.isArray(revRes) && revRes.some((r) => r.status === 'PENDING_REVIEW')) {
        setActiveTab('diff')
      }
    } catch {
      setHistory([])
      setRevisions([])
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
      void fetchHistoryAndRevisions(listing.id)
    } else {
      setHistory(null)
      setRevisions(null)
    }
  }, [listing, fetchHistoryAndRevisions])

  const handleAction = async (action: 'approve' | 'hide' | 'delete' | 'feature' | 'reject' | 'request_changes' | 'approve_revision' | 'reject_revision') => {
    if (!listing) return
    setActionLoading(true)
    setError(null)
    try {
      if (action === 'approve_revision' && pendingRevision) {
        await clientPost<any>(`/admin/listings/revisions/${pendingRevision.id}/approve`)
      } else if (action === 'reject_revision' && pendingRevision) {
        if (!rejectReason.trim()) {
          setError('Rejection reason is required.')
          setActionLoading(false)
          return
        }
        await clientPost<any>(`/admin/listings/revisions/${pendingRevision.id}/reject`, {
          reason: rejectReason,
        })
        setShowRejectForm(false)
        setRejectReason('')
      } else if (action === 'approve') {
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
      
      void fetchHistoryAndRevisions(listing.id)
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
        {/* LEFT SIDE - Product Details & Diff Review */}
        <div className="flex-1 overflow-y-auto border-r p-6 space-y-6">
          {/* Header & Tabs */}
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{listing.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={listing.status} domain="listing" />
                {listing.isFeatured && (
                  <Badge className="bg-amber-500 text-white font-bold text-[10px] uppercase">Featured</Badge>
                )}
                {pendingRevision && (
                  <Badge className="bg-yellow-500 text-white font-bold text-[10px] uppercase animate-pulse">
                    ⚡ Pending Revision ({pendingRevision.riskLevel})
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={activeTab === 'details' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('details')}
              >
                Details
              </Button>
              {pendingRevision && (
                <Button
                  variant={activeTab === 'diff' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('diff')}
                  className="relative"
                >
                  Diff Viewer
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-yellow-500 text-white text-[10px]">
                    {pendingRevision.changedFields?.length || '!'}
                  </span>
                </Button>
              )}
              <Button
                variant={activeTab === 'history' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('history')}
              >
                History
              </Button>
            </div>
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
          ) : activeTab === 'diff' && pendingRevision ? (
            <div className="space-y-6">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                <h3 className="font-bold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                  <span>⚡ Proposed Changes Requiring Admin Review</span>
                  <Badge variant="outline" className="uppercase text-[10px]">
                    Risk: {pendingRevision.riskLevel}
                  </Badge>
                </h3>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Submitted on {formatDateTime(pendingRevision.createdAt)}. The previous approved version remains public until these changes are approved.
                </p>
              </div>

              {/* Side-by-Side Diff View */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-foreground">
                  Previous Approved Version → New Seller Version
                </h3>
                
                <div className="border rounded-lg overflow-hidden text-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted border-b text-xs uppercase font-semibold text-muted-foreground">
                        <th className="p-3 w-1/4">Field</th>
                        <th className="p-3 w-3/8 bg-red-500/5">Previous Approved Value</th>
                        <th className="p-3 w-3/8 bg-green-500/5">New Seller Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs">
                      {pendingRevision.changedFields?.map((field: string) => {
                        const oldVal = pendingRevision.previousData?.[field] ?? listing[field as keyof AdminListing] ?? 'N/A';
                        const newVal = pendingRevision.changes?.[field] ?? 'N/A';
                        return (
                          <tr key={field} className="hover:bg-muted/10">
                            <td className="p-3 font-semibold text-foreground capitalize">{field}</td>
                            <td className="p-3 bg-red-500/5 text-destructive font-mono">
                              {typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal)}
                            </td>
                            <td className="p-3 bg-green-500/5 text-green-700 dark:text-green-400 font-mono font-bold">
                              {typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Images Diff if Images changed */}
                {pendingRevision.changedFields?.includes('images') || pendingRevision.changedFields?.includes('primaryImage') ? (
                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="font-semibold text-xs text-foreground">Image Comparison</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-lg p-3 bg-red-500/5">
                        <span className="text-xs font-semibold text-destructive block mb-2">Previous Images</span>
                        <div className="flex gap-2 overflow-x-auto">
                          {listing.images?.map((img, i) => (
                            <img key={i} src={img.url} className="h-24 w-24 object-cover rounded border" alt="" />
                          ))}
                        </div>
                      </div>
                      <div className="border rounded-lg p-3 bg-green-500/5">
                        <span className="text-xs font-semibold text-green-600 block mb-2">New Proposed Images</span>
                        <div className="flex gap-2 overflow-x-auto">
                          {(pendingRevision.changes?.images || listing.images)?.map((img: any, i: number) => (
                            <img key={i} src={img.url} className="h-24 w-24 object-cover rounded border" alt="" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base text-foreground">Moderation History & Audit Logs</h3>
                  <p className="text-xs text-muted-foreground">Complete chronological log of seller submissions and admin moderation actions</p>
                </div>
                {history && history.length > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                    {history.length} {history.length === 1 ? 'Action Recorded' : 'Actions Recorded'}
                  </span>
                )}
              </div>

              {historyLoading ? (
                <div className="flex justify-center p-12"><Spinner /></div>
              ) : !history || history.length === 0 ? (
                <div className="border border-dashed rounded-xl p-8 text-center bg-muted/5 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                    📋
                  </div>
                  <p className="text-sm font-medium text-foreground">No moderation history recorded yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Actions taken on this listing (approvals, rejections, change requests, updates) will appear here automatically with full admin attribution.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 max-h-[500px] overflow-y-auto pr-2 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
                  {history.map((log: any, idx: number) => {
                    const actionStr = (log.action || '').toLowerCase()
                    let badgeVariant: 'success' | 'error' | 'warning' | 'info' | 'secondary' = 'secondary'
                    let iconBg = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                    let actionLabel = log.action ? log.action.replace(/^(listing|moderation)\./, '').replace(/_/g, ' ').toUpperCase() : 'ACTION'

                    if (actionStr.includes('approved')) {
                      badgeVariant = 'success'
                      iconBg = 'bg-emerald-500 text-white'
                      actionLabel = actionStr.includes('revision') ? 'REVISION APPROVED' : 'LISTING APPROVED'
                    } else if (actionStr.includes('rejected')) {
                      badgeVariant = 'error'
                      iconBg = 'bg-red-500 text-white'
                      actionLabel = actionStr.includes('revision') ? 'REVISION REJECTED' : 'LISTING REJECTED'
                    } else if (actionStr.includes('changes_requested')) {
                      badgeVariant = 'warning'
                      iconBg = 'bg-amber-500 text-white'
                      actionLabel = 'CHANGES REQUESTED'
                    } else if (actionStr.includes('featured')) {
                      badgeVariant = 'info'
                      iconBg = 'bg-blue-500 text-white'
                      actionLabel = actionStr.includes('unfeatured') ? 'UNFEATURED' : 'FEATURED'
                    } else if (actionStr.includes('submitted') || actionStr.includes('created') || actionStr.includes('updated')) {
                      badgeVariant = 'secondary'
                      iconBg = 'bg-indigo-500 text-white'
                      actionLabel = actionStr.includes('revision') ? 'REVISION SUBMITTED' : actionStr.includes('created') ? 'LISTING CREATED' : 'LISTING UPDATED'
                    }

                    const actorName = log.actor?.displayName || log.actor?.email || 'System'
                    const actorRole = log.actor?.email?.includes('admin') || (listing.seller?.id && log.actorId !== listing.seller.id) ? 'Admin / Moderator' : 'Seller'

                    return (
                      <div key={log.id || idx} className="relative flex items-start gap-4 group">
                        {/* Timeline Circle Icon */}
                        <div className={`absolute -left-6 top-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${iconBg}`}>
                          {actionStr.includes('approved') ? '✓' : actionStr.includes('rejected') ? '✕' : actionStr.includes('changes') ? '!' : actionStr.includes('featured') ? '★' : '•'}
                        </div>

                        {/* Content Card */}
                        <div className="flex-1 border rounded-xl p-4 bg-card hover:border-primary/30 transition-all space-y-2.5 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={badgeVariant} className="text-[11px] font-semibold uppercase tracking-wider">
                                {actionLabel}
                              </Badge>
                              <span className="text-xs font-semibold text-foreground">
                                {actorName}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                                {actorRole}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                              {formatDateTime(log.createdAt)}
                            </span>
                          </div>

                          {/* Reason / Admin Note if provided */}
                          {(log.metadata?.reason || log.metadata?.rejectionReason) && (
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-foreground space-y-1">
                              <span className="font-semibold text-amber-600 dark:text-amber-400 block text-[11px]">
                                Admin Note / Reason:
                              </span>
                              <p className="whitespace-pre-wrap leading-relaxed">{String(log.metadata.reason || log.metadata.rejectionReason)}</p>
                            </div>
                          )}

                          {/* Changed Fields / Metadata details */}
                          {log.metadata?.changedFields && Array.isArray(log.metadata.changedFields) && log.metadata.changedFields.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
                              <span className="text-muted-foreground text-[11px]">Fields Changed:</span>
                              {log.metadata.changedFields.map((field: string) => (
                                <span key={field} className="px-2 py-0.5 rounded bg-muted text-foreground text-[11px] font-mono border">
                                  {field}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Risk Level Badge if revision */}
                          {log.metadata?.riskLevel && (
                            <div className="flex items-center gap-2 text-xs pt-0.5">
                              <span className="text-muted-foreground text-[11px]">Risk Classification:</span>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                log.metadata.riskLevel === 'HIGH'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200'
                                  : log.metadata.riskLevel === 'SIGNIFICANT'
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border border-orange-200'
                                  : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border border-green-200'
                              }`}>
                                {log.metadata.riskLevel} RISK
                              </span>
                            </div>
                          )}

                          {/* Footer with IP Address if available */}
                          {log.ipAddress && (
                            <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/50 flex justify-between">
                              <span>IP Address: {log.ipAddress}</span>
                              {log.userAgent && <span className="truncate max-w-[200px]" title={log.userAgent}>{log.userAgent}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
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
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleAction(pendingRevision ? 'reject_revision' : 'reject')}
                    disabled={actionLoading || !rejectReason.trim()}
                    className="flex-1"
                  >
                    {actionLoading ? 'Processing...' : pendingRevision ? 'Reject Revision' : 'Confirm Reject'}
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
                {pendingRevision && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg space-y-2 mb-4">
                    <span className="text-xs font-bold text-yellow-700 dark:text-yellow-300 block">
                      ⚡ Pending Revision Moderation
                    </span>
                    <Button
                      onClick={() => handleAction('approve_revision')}
                      disabled={actionLoading}
                      size="md"
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      ✓ Approve Revision Changes
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectForm(true)}
                      disabled={actionLoading}
                      size="md"
                      className="w-full"
                    >
                      ✕ Reject Revision Changes
                    </Button>
                  </div>
                )}

                <Button
                  onClick={() => handleAction('approve')}
                  disabled={actionLoading || listing.status === 'active'}
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  ✓ Approve & Publish Listing
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