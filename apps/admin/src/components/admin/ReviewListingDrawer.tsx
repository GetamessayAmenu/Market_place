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
  viewCount?: number
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
  attributes?: Record<string, any> | null
  seller?: {
    id: string
    displayName?: string
    email?: string
    phone?: string | null
    location?: string | null
    status?: string | null
    createdAt?: string | null
    emailVerifiedAt?: string | null
    phoneVerifiedAt?: string | null
    isEmailVerified?: boolean
    isPhoneVerified?: boolean
  } | null
  category?: { id: string; name: string; slug: string } | null
  _count?: { favorites: number }
  createdAt: string
  updatedAt?: string
}

interface ReviewListingDrawerProps {
  listing: AdminListing | null
  onClose: () => void
  onActionComplete?: () => void
}

const CHECKLIST_ITEMS = [
  { id: 'images_match', label: 'Images match the product' },
  { id: 'description_accurate', label: 'Description is accurate' },
  { id: 'category_correct', label: 'Category/subcategory is correct' },
  { id: 'price_valid', label: 'Price information is valid' },
  { id: 'no_prohibited', label: 'No prohibited content' },
  { id: 'no_misleading', label: 'No misleading information' },
  { id: 'follows_policy', label: 'Listing follows marketplace policies' },
  { id: 'info_complete', label: 'Required information is complete' },
]

const REQUEST_CHANGES_REASONS = [
  'Photos',
  'Title',
  'Description',
  'Category',
  'Price',
  'Condition',
  'Location',
  'Custom-order information',
  'Other',
]

const REJECT_REASONS = [
  'Prohibited item',
  'Misleading information',
  'Incorrect category',
  'Inappropriate images',
  'Duplicate listing',
  'Fraud/suspicious activity',
  'Poor quality',
  'Policy violation',
  'Other',
]

export default function ReviewListingDrawer({ listing, onClose, onActionComplete }: ReviewListingDrawerProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'diff' | 'history'>('details')
  const [history, setHistory] = useState<any[] | null>(null)
  const [revisions, setRevisions] = useState<any[] | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Forms and Modals
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showChangesForm, setShowChangesForm] = useState(false)
  const [showBuyerPreview, setShowBuyerPreview] = useState(false)
  const [showSecondaryActions, setShowSecondaryActions] = useState(false)
  
  // Selection state
  const [selectedChangeReasons, setSelectedChangeReasons] = useState<string[]>([])
  const [selectedRejectReason, setSelectedRejectReason] = useState<string>(REJECT_REASONS[0] || 'Other')
  const [rejectReasonNote, setRejectReasonNote] = useState('')
  
  // Gallery preview
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Moderation Checklist state
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})

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
      setShowBuyerPreview(false)
      setShowSecondaryActions(false)
      setSelectedChangeReasons([])
      setSelectedRejectReason(REJECT_REASONS[0] || 'Other')
      setRejectReasonNote('')
      setSelectedImageIndex(0)
      setChecklist({})
      setDeleteConfirm(false)
      setError(null)
      void fetchHistoryAndRevisions(listing.id)
    } else {
      setHistory(null)
      setRevisions(null)
    }
  }, [listing, fetchHistoryAndRevisions])

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleAllChecklist = () => {
    const allChecked = CHECKLIST_ITEMS.every((item) => checklist[item.id])
    const newChecklist: Record<string, boolean> = {}
    CHECKLIST_ITEMS.forEach((item) => {
      newChecklist[item.id] = !allChecked
    })
    setChecklist(newChecklist)
  }

  const toggleChangeReason = (reason: string) => {
    setSelectedChangeReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    )
  }

  // Quality Flags Computation (Rule-based, extensible for future AI)
  const computeQualityFlags = () => {
    if (!listing) return { status: 'NOT_CHECKED', imageCount: 0, warnings: [] }
    const images = listing.images || []
    const imageCount = images.length || (listing.primaryImageUrl ? 1 : 0)
    const warnings: string[] = []

    let imageQualityStatus: 'PASSED' | 'WARNING' | 'FAILED' = 'PASSED'
    if (imageCount === 0) {
      imageQualityStatus = 'FAILED'
      warnings.push('No product images uploaded')
    } else if (imageCount === 1) {
      imageQualityStatus = 'WARNING'
      warnings.push('Only 1 product image provided (2+ recommended)')
    }

    let contentStatus: 'PASSED' | 'WARNING' | 'FAILED' = 'PASSED'
    const titleLen = (listing.title || '').trim().length
    const descLen = (listing.description || '').trim().length

    if (titleLen === 0 || descLen === 0) {
      contentStatus = 'FAILED'
      warnings.push('Title or description is missing')
    } else if (titleLen < 5) {
      contentStatus = 'WARNING'
      warnings.push('Title is very short (under 5 characters)')
    } else if (descLen < 20) {
      contentStatus = 'WARNING'
      warnings.push('Description is short (under 20 characters)')
    }

    let overallStatus: 'PASSED' | 'WARNING' | 'FAILED' | 'NOT_CHECKED' = 'PASSED'
    if (imageQualityStatus === 'FAILED' || contentStatus === 'FAILED') {
      overallStatus = 'FAILED'
    } else if (imageQualityStatus === 'WARNING' || contentStatus === 'WARNING') {
      overallStatus = 'WARNING'
    }

    return {
      status: overallStatus,
      imageCount,
      imageQualityStatus,
      contentStatus,
      warnings,
    }
  }

  const qualityFlags = computeQualityFlags()

  const handleAction = async (action: 'approve' | 'hide' | 'delete' | 'feature' | 'reject' | 'request_changes' | 'approve_revision' | 'reject_revision') => {
    if (!listing) return
    setActionLoading(true)
    setError(null)
    try {
      if (action === 'approve_revision' && pendingRevision) {
        await clientPost<any>(`/admin/listings/revisions/${pendingRevision.id}/approve`)
      } else if (action === 'reject_revision' && pendingRevision) {
        if (!rejectReasonNote.trim()) {
          setError('Rejection reason note is required.')
          setActionLoading(false)
          return
        }
        await clientPost<any>(`/admin/listings/revisions/${pendingRevision.id}/reject`, {
          reason: rejectReasonNote,
        })
        setShowRejectForm(false)
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
        if (!rejectReasonNote.trim() && !selectedRejectReason) {
          setError('Rejection reason and note are required.')
          setActionLoading(false)
          return
        }
        await clientPost<any>(`/admin/listings/${listing.id}/reject`, {
          reason: selectedRejectReason,
          reasons: [selectedRejectReason],
          note: rejectReasonNote,
        })
        setShowRejectForm(false)
      } else if (action === 'request_changes') {
        if (selectedChangeReasons.length === 0 && !rejectReasonNote.trim()) {
          setError('Please select at least one reason and provide a moderator note.')
          setActionLoading(false)
          return
        }
        await clientPost<any>(`/admin/listings/${listing.id}/request-changes`, {
          reasons: selectedChangeReasons,
          note: rejectReasonNote,
          reason: rejectReasonNote || selectedChangeReasons.join(', '),
        })
        setShowChangesForm(false)
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

  const imageList = listing.images && listing.images.length > 0
    ? listing.images
    : listing.primaryImageUrl
    ? [{ url: listing.primaryImageUrl, isPrimary: true }]
    : []

  const currentImage = imageList[selectedImageIndex] || imageList[0]

  return (
    <Modal open={listing !== null} onClose={onClose} title="" size="full" className="max-w-6xl">
      <div className="flex flex-col lg:flex-row h-[85vh]">
        {/* LEFT SIDE - Product Details, Quality Flags, Checklist & Diff Review */}
        <div className="flex-1 overflow-y-auto border-r p-6 space-y-6">
          {/* Header & Navigation Tabs */}
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{listing.title}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
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

          {activeTab === 'details' ? (
            <>
              {/* Product Image Gallery Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-foreground">Product Images ({imageList.length})</h3>
                  <Button size="xs" variant="outline" onClick={() => setShowBuyerPreview(true)}>
                    👁 Preview as Buyer
                  </Button>
                </div>
                {imageList.length > 0 ? (
                  <div className="space-y-3">
                    {/* Main Image Lightbox Preview */}
                    <div className="relative h-64 w-full rounded-lg bg-muted border overflow-hidden flex items-center justify-center">
                      <img
                        src={currentImage?.url}
                        alt={listing.title}
                        className="h-full w-full object-contain"
                      />
                      {currentImage?.isPrimary && (
                        <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">
                          PRIMARY IMAGE
                        </span>
                      )}
                    </div>
                    {/* Thumbnails list */}
                    {imageList.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {imageList.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`h-16 w-16 rounded-md overflow-hidden border-2 flex-shrink-0 transition-all ${
                              selectedImageIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-border opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={img.url} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-40 w-full rounded-lg bg-muted flex flex-col items-center justify-center text-sm text-muted-foreground border border-dashed">
                    <span>📷 No images provided for this listing</span>
                  </div>
                )}
              </div>

              {/* Quality & Content Flags Section */}
              <div className="p-4 rounded-xl border bg-muted/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <span>Quality & Content Warnings</span>
                    <span className="text-[10px] text-muted-foreground font-normal">(Rule-Based & AI Ready)</span>
                  </h3>
                  <Badge
                    variant={qualityFlags.status === 'PASSED' ? 'success' : qualityFlags.status === 'WARNING' ? 'warning' : 'error'}
                    className="text-[10px] font-bold uppercase tracking-wider"
                  >
                    STATUS: {qualityFlags.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded bg-background border">
                    <span className="text-muted-foreground block text-[11px]">Image Count</span>
                    <span className="font-bold text-foreground text-sm">{qualityFlags.imageCount} image(s)</span>
                  </div>
                  <div className="p-2.5 rounded bg-background border">
                    <span className="text-muted-foreground block text-[11px]">Image Quality Check</span>
                    <span className={`font-bold ${qualityFlags.imageQualityStatus === 'PASSED' ? 'text-green-600' : 'text-amber-600'}`}>
                      {qualityFlags.imageQualityStatus}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-background border">
                    <span className="text-muted-foreground block text-[11px]">Content Quality Check</span>
                    <span className={`font-bold ${qualityFlags.contentStatus === 'PASSED' ? 'text-green-600' : 'text-amber-600'}`}>
                      {qualityFlags.contentStatus}
                    </span>
                  </div>
                </div>
                {qualityFlags.warnings.length > 0 && (
                  <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <span className="font-semibold block">Detected Content Flags:</span>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {qualityFlags.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Moderation Checklist */}
              <div className="p-4 rounded-xl border bg-card space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <span>Moderation Checklist</span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      ({CHECKLIST_ITEMS.filter((i) => checklist[i.id]).length} of {CHECKLIST_ITEMS.length} checked)
                    </span>
                  </h3>
                  <Button size="xs" variant="ghost" onClick={toggleAllChecklist}>
                    {CHECKLIST_ITEMS.every((item) => checklist[item.id]) ? 'Uncheck All' : 'Check All'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {CHECKLIST_ITEMS.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                        checklist[item.id]
                          ? 'bg-green-500/10 border-green-500/30 text-green-800 dark:text-green-300'
                          : 'bg-background hover:bg-muted/20 text-muted-foreground'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(checklist[item.id])}
                        onChange={() => toggleChecklistItem(item.id)}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                      />
                      <span className="font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Listing Information Grid */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-foreground">Listing Information</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-lg border bg-muted/10">
                    <span className="text-muted-foreground block mb-0.5">Category</span>
                    <span className="font-semibold text-foreground text-sm">{listing.category?.name || 'Uncategorized'}</span>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/10">
                    <span className="text-muted-foreground block mb-0.5">Condition</span>
                    <span className="font-semibold text-foreground text-sm capitalize">{listing.condition}</span>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/10">
                    <span className="text-muted-foreground block mb-0.5">Location</span>
                    <span className="font-semibold text-foreground text-sm">{listing.city || 'N/A'}, {listing.country || 'ET'}</span>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/10">
                    <span className="text-muted-foreground block mb-0.5">Created Date</span>
                    <span className="font-medium text-foreground">{formatDate(listing.createdAt)}</span>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/10">
                    <span className="text-muted-foreground block mb-0.5">Updated Date</span>
                    <span className="font-medium text-foreground">{formatDate(listing.updatedAt || listing.createdAt)}</span>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/10">
                    <span className="text-muted-foreground block mb-0.5">View Count</span>
                    <span className="font-medium text-foreground">{listing.viewCount || 0} views</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-foreground">Description</h3>
                <p className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg border whitespace-pre-wrap leading-relaxed">
                  {listing.description || 'No description provided.'}
                </p>
              </div>

              {/* Attributes Grid */}
              {listing.attributes && Object.keys(listing.attributes).length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-foreground">Product Attributes & Specifications</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {Object.entries(listing.attributes).map(([key, val]) => (
                      <div key={key} className="p-2.5 rounded border bg-background flex justify-between items-center">
                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="font-medium text-foreground truncate max-w-[120px]" title={String(val)}>
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category/Type Relevant Pricing & Rules */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-foreground">Pricing & Service Terms</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-lg border bg-muted/10">
                    <span className="text-xs text-muted-foreground block mb-1">Selling Price</span>
                    <span className="text-lg font-bold text-foreground">{formatCurrency(listing.price, listing.currency)}</span>
                    <span className="text-[10px] block text-muted-foreground mt-0.5">
                      {listing.availableForPurchase ? '✓ Available for Sale' : 'Not for direct sale'}
                    </span>
                  </div>

                  {listing.availableForRent && (
                    <div className="p-3.5 rounded-lg border bg-emerald-500/10 border-emerald-500/20">
                      <span className="text-xs text-emerald-800 dark:text-emerald-300 block mb-1">Rental Daily Rate</span>
                      <span className="text-lg font-bold text-foreground">{formatCurrency(listing.rentalPricePerDay || 0, listing.currency)} / day</span>
                      {listing.rentalDeposit && (
                        <span className="text-[10px] block text-muted-foreground mt-0.5">
                          Deposit: {formatCurrency(listing.rentalDeposit, listing.currency)}
                        </span>
                      )}
                    </div>
                  )}

                  {listing.customOrderAvailable && (
                    <div className="p-3.5 rounded-lg border bg-purple-500/10 border-purple-500/20">
                      <span className="text-xs text-purple-800 dark:text-purple-300 block mb-1">Custom Order Starting Price</span>
                      <span className="text-lg font-bold text-foreground">{formatCurrency(listing.startingCustomPrice || listing.price, listing.currency)}</span>
                      {listing.estimatedProductionDays && (
                        <span className="text-[10px] block text-muted-foreground mt-0.5">
                          Est. Time: {listing.estimatedProductionDays} days
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Seller Summary Card */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-foreground">Seller Information Summary</h3>
                <div className="p-4 rounded-xl border bg-card space-y-3 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-foreground text-sm">{listing.seller?.displayName || 'Unknown Seller'}</p>
                      <p className="text-xs text-muted-foreground">{listing.seller?.email || 'N/A'}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={listing.seller?.isEmailVerified ? 'success' : 'secondary'} className="text-[10px]">
                        {listing.seller?.isEmailVerified ? '✓ Email Verified' : 'Email Unverified'}
                      </Badge>
                      <Badge variant={listing.seller?.isPhoneVerified ? 'success' : 'secondary'} className="text-[10px]">
                        {listing.seller?.isPhoneVerified ? '✓ Phone Verified' : 'Phone Unverified'}
                      </Badge>
                      {listing.seller?.status && (
                        <Badge variant={listing.seller.status === 'active' ? 'success' : 'warning'} className="text-[10px] capitalize">
                          Account: {listing.seller.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t">
                    <div>
                      <span className="text-muted-foreground">Location: </span>
                      <span className="font-medium">{listing.seller?.location || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Member Since: </span>
                      <span className="font-medium">{formatDate(listing.seller?.createdAt)}</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <a
                      href={`/users?search=${encodeURIComponent(listing.seller?.email || listing.seller?.displayName || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="xs" variant="outline" className="w-full">
                        🔍 View Seller Account Details
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

              {/* Rejected Reason Display */}
              {(listing.status === 'rejected' || listing.status === 'changes_requested') && listing.rejectedReason && (
                <div className="border border-amber-500/30 bg-amber-500/10 rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-300 mb-1">Previous Rejection / Feedback Note</h3>
                  <p className="text-xs text-foreground whitespace-pre-wrap">{listing.rejectedReason}</p>
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
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base text-foreground">Moderation History & Audit Logs</h3>
                  <p className="text-xs text-muted-foreground">Immutable chronological log of seller submissions and admin moderation actions</p>
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
                  <p className="text-sm font-medium text-foreground">No moderation history recorded yet</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 max-h-[500px] overflow-y-auto pr-2 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
                  {history.map((log: any, idx: number) => {
                    const actionStr = (log.action || '').toLowerCase()
                    let badgeVariant: 'success' | 'error' | 'warning' | 'info' | 'secondary' = 'secondary'
                    let iconBg = 'bg-gray-100 text-gray-600'
                    let actionLabel = log.action ? log.action.replace(/^(listing|moderation)\./, '').replace(/_/g, ' ').toUpperCase() : 'ACTION'

                    if (actionStr.includes('approved')) {
                      badgeVariant = 'success'
                      iconBg = 'bg-emerald-500 text-white'
                    } else if (actionStr.includes('rejected')) {
                      badgeVariant = 'error'
                      iconBg = 'bg-red-500 text-white'
                    } else if (actionStr.includes('changes_requested')) {
                      badgeVariant = 'warning'
                      iconBg = 'bg-amber-500 text-white'
                    } else if (actionStr.includes('submitted') || actionStr.includes('resubmitted') || actionStr.includes('created')) {
                      badgeVariant = 'secondary'
                      iconBg = 'bg-indigo-500 text-white'
                    }

                    const actorName = log.actor?.displayName || log.actor?.email || 'System'

                    return (
                      <div key={log.id || idx} className="relative flex items-start gap-4">
                        <div className={`absolute -left-6 top-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${iconBg}`}>
                          •
                        </div>
                        <div className="flex-1 border rounded-xl p-3.5 bg-card space-y-2 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={badgeVariant} className="text-[10px] font-semibold uppercase">
                                {actionLabel}
                              </Badge>
                              <span className="font-semibold text-foreground">{actorName}</span>
                            </div>
                            <span className="text-muted-foreground">{formatDateTime(log.createdAt)}</span>
                          </div>
                          {(log.metadata?.reason || log.metadata?.note) && (
                            <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-foreground">
                              <span className="font-semibold block text-[10px] text-amber-700">Note / Reason:</span>
                              <p className="whitespace-pre-wrap">{String(log.metadata.reason || log.metadata.note)}</p>
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

        {/* RIGHT SIDE - Action Control Panel */}
        <div className="w-full lg:w-96 p-6 bg-muted/30 border-l space-y-6 overflow-y-auto">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">Moderation Controls</h3>
            <p className="text-xs text-muted-foreground">Take official review actions on this listing</p>
          </div>

          {/* Quick Status Info */}
          <div className="p-4 rounded-xl bg-background border space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Status:</span>
              <StatusBadge status={listing.status} domain="listing" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-bold">{formatCurrency(listing.price, listing.currency)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">{formatDate(listing.createdAt)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {showRejectForm ? (
              <div className="border border-destructive/30 rounded-xl p-4 bg-destructive/5 space-y-3 text-xs">
                <label className="block font-semibold text-destructive">Select Rejection Reason:</label>
                <select
                  value={selectedRejectReason}
                  onChange={(e) => setSelectedRejectReason(e.target.value)}
                  className="w-full rounded-md border bg-background p-2.5 text-xs"
                >
                  {REJECT_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <label className="block font-semibold text-destructive">Moderator Explanation Note (Required):</label>
                <textarea
                  placeholder="Provide detailed reasons explaining why this listing is being rejected..."
                  value={rejectReasonNote}
                  onChange={(e) => setRejectReasonNote(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-3 text-xs min-h-[90px]"
                />

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => { setShowRejectForm(false); setRejectReasonNote('') }} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleAction(pendingRevision ? 'reject_revision' : 'reject')}
                    disabled={actionLoading || (!rejectReasonNote.trim() && !selectedRejectReason)}
                    className="flex-1"
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Reject'}
                  </Button>
                </div>
              </div>
            ) : showChangesForm ? (
              <div className="border border-yellow-500/30 rounded-xl p-4 bg-yellow-500/10 space-y-3 text-xs">
                <label className="block font-semibold text-yellow-800 dark:text-yellow-200">Select Reasons for Changes (Multi-select):</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 border rounded bg-background">
                  {REQUEST_CHANGES_REASONS.map((r) => (
                    <label key={r} className="flex items-center gap-1.5 p-1 rounded hover:bg-muted cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={selectedChangeReasons.includes(r)}
                        onChange={() => toggleChangeReason(r)}
                        className="h-3 w-3 rounded"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>

                <label className="block font-semibold text-yellow-800 dark:text-yellow-200">Moderator Note / Instructions (Required):</label>
                <textarea
                  placeholder="Describe exact changes required before listing can be approved..."
                  value={rejectReasonNote}
                  onChange={(e) => setRejectReasonNote(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-3 text-xs min-h-[90px]"
                />

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => { setShowChangesForm(false); setRejectReasonNote(''); setSelectedChangeReasons([]) }} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAction('request_changes')}
                    disabled={actionLoading || (!rejectReasonNote.trim() && selectedChangeReasons.length === 0)}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {actionLoading ? 'Processing...' : 'Submit Request'}
                  </Button>
                </div>
              </div>
            ) : deleteConfirm ? (
              <div className="border border-destructive/30 rounded-xl p-4 bg-destructive/5 space-y-3 text-xs">
                <p className="font-semibold text-destructive">Are you sure you want to delete this listing?</p>
                <p className="text-muted-foreground">This action soft-deletes the listing from the platform.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleAction('delete')} disabled={actionLoading} className="flex-1">
                    Confirm Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* PRIMARY ACTIONS */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Primary Actions
                  </span>
                  <Button
                    onClick={() => handleAction('approve')}
                    disabled={actionLoading || listing.status === 'active'}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm"
                  >
                    ✓ Approve & Publish Listing
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowChangesForm(true)}
                    disabled={actionLoading || listing.status === 'changes_requested'}
                    size="lg"
                    className="w-full border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-950/20"
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

                  <Button
                    variant="outline"
                    onClick={() => setShowBuyerPreview(true)}
                    size="md"
                    className="w-full"
                  >
                    👁 Preview as Buyer
                  </Button>
                </div>

                {/* SECONDARY / MANAGEMENT ACTIONS */}
                <div className="border-t pt-3 space-y-2">
                  <button
                    onClick={() => setShowSecondaryActions(!showSecondaryActions)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground py-1"
                  >
                    <span>Secondary Admin Actions</span>
                    <span>{showSecondaryActions ? '▲' : '▼'}</span>
                  </button>

                  {showSecondaryActions && (
                    <div className="space-y-2 pt-1 animate-in fade-in">
                      <Button
                        variant="outline"
                        onClick={() => handleAction('hide')}
                        disabled={actionLoading || listing.status === 'archived'}
                        size="sm"
                        className="w-full text-xs"
                      >
                        📦 Hide / Archive
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleAction('feature')}
                        disabled={actionLoading}
                        size="sm"
                        className="w-full text-xs"
                      >
                        ★ {listing.isFeatured ? 'Unfeature' : 'Feature'} Listing
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setDeleteConfirm(true)}
                        disabled={actionLoading}
                        size="sm"
                        className="w-full text-xs"
                      >
                        🗑 Delete Permanently
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="error">{error}</Alert>
          )}
        </div>
      </div>

      {/* Buyer Preview Modal */}
      {showBuyerPreview && (
        <Modal open={showBuyerPreview} onClose={() => setShowBuyerPreview(false)} title="Buyer View Preview (Live Data)" size="lg">
          <div className="space-y-6 max-h-[75vh] overflow-y-auto p-2">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-800 dark:text-blue-300">
              ℹ This preview shows how buyers will see this listing on the public marketplace using real listing data without publishing it.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Image */}
              <div className="h-64 rounded-lg bg-muted border overflow-hidden flex items-center justify-center">
                {currentImage ? (
                  <img src={currentImage.url} alt="" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs text-muted-foreground">No Image</span>
                )}
              </div>

              {/* Main Info */}
              <div className="space-y-3">
                <div>
                  <Badge variant="outline" className="text-[10px] mb-1">
                    {listing.category?.name || 'Uncategorized'}
                  </Badge>
                  <h3 className="text-xl font-bold text-foreground">{listing.title}</h3>
                  <p className="text-xs text-muted-foreground">📍 {listing.city || 'Ethiopia'}</p>
                </div>

                <div className="p-3 rounded-lg bg-muted/20 border">
                  <span className="text-xs text-muted-foreground block">Price</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(listing.price, listing.currency)}</span>
                </div>

                <div className="flex gap-2">
                  <Badge variant="secondary" className="capitalize text-xs">Condition: {listing.condition}</Badge>
                  {listing.availableForRent && <Badge variant="success" className="text-xs">Rental Available</Badge>}
                  {listing.customOrderAvailable && <Badge variant="info" className="text-xs">Custom Order</Badge>}
                </div>

                {/* Seller Box */}
                <div className="p-3 rounded-lg border bg-card text-xs space-y-1">
                  <span className="text-muted-foreground block">Seller</span>
                  <p className="font-bold text-foreground">{listing.seller?.displayName || 'Marketplace Seller'}</p>
                  <p className="text-[11px] text-muted-foreground">Verified Merchant • Member since {formatDate(listing.seller?.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-t pt-4 space-y-2">
              <h4 className="font-semibold text-sm">Product Description</h4>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {listing.description || 'No description available.'}
              </p>
            </div>

            <div className="flex justify-end border-t pt-3">
              <Button onClick={() => setShowBuyerPreview(false)}>Close Preview</Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  )
}