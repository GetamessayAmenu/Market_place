'use client'
import {
  Button,
  Select,
  Pagination,
  Modal,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Alert,
  Spinner,
} from '@marketplace/ui'
import React, { useState, useCallback, useEffect } from 'react'

import { clientGet, clientPatch, buildQuery } from '../../lib/clientApi'
import type { VerificationRequest, VerificationHistory } from '../../lib/adminApi'

import { StatusBadge, formatDate, formatDateTime } from './StatusBadge'

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

interface VerificationTableProps {
  initialData?: PaginatedResponse<VerificationRequest>
}

export default function VerificationTable({ initialData }: VerificationTableProps) {
  const [verifications, setVerifications] = useState(initialData?.data || [])
  const [page, setPage] = useState(initialData?.meta.page || 1)
  const [totalPages, setTotalPages] = useState(initialData?.meta.totalPages || 0)
  const [total, setTotal] = useState(initialData?.meta.total || 0)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Fetch data on mount if no initial data provided
  useEffect(() => {
    if (!initialData) {
      void fetchData(1, '', '')
    }
  }, [initialData])

  // Detail modal
  const [detailItem, setDetailItem] = useState<VerificationRequest | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Document preview modal
  const [documentPreview, setDocumentPreview] = useState<{ url: string; title: string } | null>(null)

  // Review modal
  const [reviewItem, setReviewItem] = useState<VerificationRequest | null>(null)
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'changes_requested'>('approved')
  const [reviewNotes, setReviewNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ 
    open: false, 
    title: '', 
    message: '', 
    onConfirm: () => {} 
  })

  const fetchData = useCallback(async (p: number, st: string, type: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await clientGet<PaginatedResponse<VerificationRequest>>(
        '/admin/verifications' + buildQuery({ 
          page: p, 
          limit: 10, 
          status: st || undefined,
          type: type || undefined
        })
      )
      setVerifications(Array.isArray(res.data) ? res.data : [])
      setTotalPages(res.meta.totalPages)
      setTotal(res.meta.total)
    } catch (err) {
      console.error('Failed to load verifications:', err)
      setError('Authentication required. Please log in to view verification requests.')
      setVerifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handlePageChange = (p: number) => {
    setPage(p)
    void fetchData(p, statusFilter, typeFilter)
  }

  const handleFilter = () => {
    setPage(1)
    void fetchData(1, statusFilter, typeFilter)
  }

  const handleViewDetail = async (item: VerificationRequest) => {
    console.log('View detail clicked for item:', item)
    setDetailLoading(true)
    setDetailItem(item)
    try {
      // Fetch full details including history
      const res = await clientGet<{ item: VerificationRequest; history: VerificationHistory[] }>('/admin/verifications/' + item.id + '/detail')
      console.log('Detail response:', res)
      setDetailItem({ ...item, history: res.history })
    } catch (err) {
      console.error('Failed to load verification details:', err)
      setError('Failed to load verification details.')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleStartReview = async (item: VerificationRequest) => {
    setActionLoading(true)
    try {
      await clientPatch('/admin/verifications/' + item.id + '/status', {
        status: 'under_review',
        action: 'start_review'
      })
      setReviewItem(item)
      void fetchData(page, statusFilter, typeFilter)
    } catch (err) {
      if (err instanceof Error && err.message.includes('403')) {
        setError('You do not have permission to perform this action.')
      } else {
        setError('Failed to start review.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleReview = async () => {
    if (!reviewItem) return
    setActionLoading(true)
    try {
      await clientPatch('/admin/verifications/' + reviewItem.id, {
        decision,
        notes: reviewNotes,
        action: 'review_verification'
      })
      setReviewItem(null)
      setReviewNotes('')
      void fetchData(page, statusFilter, typeFilter)
    } catch (err) {
      if (err instanceof Error && err.message.includes('403')) {
        setError('You do not have permission to perform this action.')
      } else {
        setError('Failed to process verification.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const showConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, message, onConfirm })
  }

  const getStatusWorkflow = (status: string) => {
    const workflow = [
      { status: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      { status: 'under_review', label: 'Under Review', color: 'bg-blue-100 text-blue-800' },
      { status: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
      { status: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
      { status: 'changes_requested', label: 'Changes Requested', color: 'bg-orange-100 text-orange-800' },
    ]
    const currentIndex = workflow.findIndex(w => w.status === status)
    return { workflow, currentIndex }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Select
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Pending', value: 'pending' },
              { label: 'Under Review', value: 'under_review' },
              { label: 'Approved', value: 'approved' },
              { label: 'Rejected', value: 'rejected' },
              { label: 'Changes Requested', value: 'changes_requested' },
            ]}
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setStatusFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="w-44">
          <Select
            options={[
              { label: 'All Types', value: '' },
              { label: 'Seller Verification', value: 'seller_verification' },
              { label: 'Identity Verification', value: 'identity_verification' },
              { label: 'Business Verification', value: 'business_verification' },
            ]}
            value={typeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setTypeFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <Button size="sm" onClick={handleFilter}>Apply Filters</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        {loading && <div className="flex justify-center p-8"><Spinner /></div>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Business/Store</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-56">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && verifications.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No verification requests found.
                </TableCell>
              </TableRow>
            )}
            {verifications.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{v.user?.displayName ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{v.user?.email ?? '-'}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm capitalize">{v.type.replace(/_/g, ' ')}</TableCell>
                <TableCell><StatusBadge status={v.status} domain="verification" /></TableCell>
                <TableCell>
                  <div className="text-sm">
                    {v.businessInfo?.businessName && (
                      <p className="font-medium">{v.businessInfo.businessName}</p>
                    )}
                    {v.storeInfo?.storeName && (
                      <p className="text-muted-foreground">{v.storeInfo.storeName}</p>
                    )}
                    {!v.businessInfo?.businessName && !v.storeInfo?.storeName && (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(v.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { void handleViewDetail(v) }}>
                      View
                    </Button>
                    {v.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => { void handleStartReview(v) }}>
                        Review
                      </Button>
                    )}
                    {v.status === 'under_review' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => { setReviewItem(v); setDecision('approved') }}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setReviewItem(v); setDecision('rejected') }}>
                          Reject
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setReviewItem(v); setDecision('changes_requested') }}>
                          Request Changes
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{String(total)} total requests</p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={detailItem !== null} onClose={() => { setDetailItem(null) }} title="Verification Details" size="lg">
        {detailItem && (
          <div className="space-y-6">
            {detailLoading && <div className="flex justify-center p-8"><Spinner /></div>}
            
            {/* Workflow Status */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Verification Workflow</h3>
              <div className="flex items-center gap-2">
                {getStatusWorkflow(detailItem.status).workflow.map((step, index) => {
                  const isActive = index <= getStatusWorkflow(detailItem.status).currentIndex
                  return (
                    <React.Fragment key={step.status}>
                      <div className={`flex-1 text-center px-3 py-2 rounded-md text-sm font-medium ${
                        isActive ? step.color : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.label}
                      </div>
                      {index < getStatusWorkflow(detailItem.status).workflow.length - 1 && (
                        <div className={`w-8 h-0.5 ${
                          index < getStatusWorkflow(detailItem.status).currentIndex ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>

            {/* User Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">User:</span>
                <p className="text-sm">{detailItem.user?.displayName ?? 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{detailItem.user?.email ?? '-'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Type:</span>
                <p className="text-sm capitalize">{detailItem.type.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <div className="mt-1"><StatusBadge status={detailItem.status} domain="verification" /></div>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Submitted:</span>
                <p className="text-sm">{formatDate(detailItem.createdAt)}</p>
              </div>
            </div>

            {/* Business Information */}
            {detailItem.businessInfo && (
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">Business Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Business Name:</span>
                    <p className="mt-1">{detailItem.businessInfo.businessName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Business Type:</span>
                    <p className="mt-1">{detailItem.businessInfo.businessType}</p>
                  </div>
                  {detailItem.businessInfo.taxId && (
                    <div>
                      <span className="font-medium text-muted-foreground">Tax ID:</span>
                      <p className="mt-1">{detailItem.businessInfo.taxId}</p>
                    </div>
                  )}
                  {detailItem.businessInfo.registrationNumber && (
                    <div>
                      <span className="font-medium text-muted-foreground">Registration Number:</span>
                      <p className="mt-1">{detailItem.businessInfo.registrationNumber}</p>
                    </div>
                  )}
                  {detailItem.businessInfo.address && (
                    <div className="col-span-2">
                      <span className="font-medium text-muted-foreground">Address:</span>
                      <p className="mt-1">{detailItem.businessInfo.address}</p>
                    </div>
                  )}
                  {detailItem.businessInfo.city && detailItem.businessInfo.country && (
                    <div>
                      <span className="font-medium text-muted-foreground">Location:</span>
                      <p className="mt-1">{detailItem.businessInfo.city}, {detailItem.businessInfo.country}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Store Information */}
            {detailItem.storeInfo && (
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">Store Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Store Name:</span>
                    <p className="mt-1">{detailItem.storeInfo.storeName}</p>
                  </div>
                  {detailItem.storeInfo.category && (
                    <div>
                      <span className="font-medium text-muted-foreground">Category:</span>
                      <p className="mt-1">{detailItem.storeInfo.category}</p>
                    </div>
                  )}
                  {detailItem.storeInfo.storeDescription && (
                    <div className="col-span-2">
                      <span className="font-medium text-muted-foreground">Description:</span>
                      <p className="mt-1">{detailItem.storeInfo.storeDescription}</p>
                    </div>
                  )}
                  {detailItem.storeInfo.storeUrl && (
                    <div>
                      <span className="font-medium text-muted-foreground">Store URL:</span>
                      <a
                        href={detailItem.storeInfo.storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 text-primary hover:underline block"
                      >
                        {detailItem.storeInfo.storeUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Identity Documents */}
            {detailItem.identityDocument && (
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">Identity Document</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Document Type:</span>
                    <p className="mt-1 capitalize">{detailItem.identityDocument.type.replace(/_/g, ' ')}</p>
                  </div>
                  {detailItem.identityDocument.documentNumber && (
                    <div>
                      <span className="font-medium text-muted-foreground">Document Number:</span>
                      <p className="mt-1">{detailItem.identityDocument.documentNumber}</p>
                    </div>
                  )}
                  {detailItem.identityDocument.expiryDate && (
                    <div>
                      <span className="font-medium text-muted-foreground">Expiry Date:</span>
                      <p className="mt-1">{formatDate(detailItem.identityDocument.expiryDate)}</p>
                    </div>
                  )}
                  {detailItem.identityDocument.frontUrl && (
                    <div>
                      <span className="font-medium text-muted-foreground">Front Side:</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1"
                        onClick={() => setDocumentPreview({ url: detailItem.identityDocument!.frontUrl!, title: 'Document Front' })}
                      >
                        View Front
                      </Button>
                    </div>
                  )}
                  {detailItem.identityDocument.backUrl && (
                    <div>
                      <span className="font-medium text-muted-foreground">Back Side:</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1"
                        onClick={() => setDocumentPreview({ url: detailItem.identityDocument!.backUrl!, title: 'Document Back' })}
                      >
                        View Back
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Documents */}
            {detailItem.documents && detailItem.documents.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">Additional Documents</h3>
                <div className="grid grid-cols-2 gap-4">
                  {detailItem.documents.map((doc, index) => (
                    <div key={index}>
                      <span className="text-sm font-medium text-muted-foreground">{doc.type.replace(/_/g, ' ')}:</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1"
                        onClick={() => setDocumentPreview({ url: doc.url, title: doc.type.replace(/_/g, ' ') })}
                      >
                        View Document
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Notes */}
            {detailItem.notes && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">User Notes:</span>
                <p className="mt-1 text-sm">{detailItem.notes}</p>
              </div>
            )}

            {/* Reviewer Notes */}
            {detailItem.reviewerNotes && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Reviewer Notes:</span>
                <p className="mt-1 text-sm">{detailItem.reviewerNotes}</p>
              </div>
            )}

            {/* Verification History */}
            {detailItem.history && detailItem.history.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">Verification History</h3>
                <div className="space-y-2">
                  {detailItem.history.map((history) => (
                    <div key={history.id} className="flex items-start gap-3 text-sm pb-2 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">{history.action.replace(/_/g, ' ').toUpperCase()}</p>
                        <p className="text-muted-foreground">Status: {history.status.replace(/_/g, ' ')}</p>
                        {history.notes && <p className="text-muted-foreground mt-1">{history.notes}</p>}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{history.actorName ?? 'Unknown'}</p>
                        <p>{formatDateTime(history.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {detailItem.status === 'pending' && (
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => { void handleStartReview(detailItem) }}>
                  Start Review
                </Button>
              </div>
            )}
            {detailItem.status === 'under_review' && (
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => { setReviewItem(detailItem); setDecision('approved') }}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setReviewItem(detailItem); setDecision('rejected') }}>
                  Reject
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setReviewItem(detailItem); setDecision('changes_requested') }}>
                  Request Changes
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Document Preview Modal */}
      <Modal open={documentPreview !== null} onClose={() => { setDocumentPreview(null) }} title={documentPreview?.title ?? 'Document Preview'} size="lg">
        {documentPreview && (
          <div className="flex justify-center">
            <img
              src={documentPreview.url}
              alt={documentPreview.title}
              className="max-w-full max-h-[600px] object-contain rounded-lg"
            />
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal open={reviewItem !== null} onClose={() => { setReviewItem(null) }} title="Review Verification" size="sm">
        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-muted-foreground">User:</span>
            <p className="text-sm">{reviewItem?.user?.displayName ?? 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{reviewItem?.user?.email ?? '-'}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Type:</span>
            <p className="text-sm capitalize">{reviewItem?.type.replace(/_/g, ' ')}</p>
          </div>
          <Select
            label="Decision"
            options={[
              { label: 'Approve', value: 'approved' },
              { label: 'Reject', value: 'rejected' },
              { label: 'Request Changes', value: 'changes_requested' },
            ]}
            value={decision}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setDecision(e.target.value as any) }}
          />
          <textarea
            placeholder="Reviewer notes (required for reject and changes requested)"
            value={reviewNotes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setReviewNotes(e.target.value) }}
            className="w-full rounded-md border border-input bg-background p-3 text-sm min-h-[100px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setReviewItem(null) }}>Cancel</Button>
            <Button 
              onClick={() => {
                if (decision === 'rejected' || decision === 'changes_requested') {
                  if (!reviewNotes.trim()) {
                    setError('Notes are required for rejection and change requests.')
                    return
                  }
                  const decisionLabel = decision.replace(/_/g, ' ')
                  showConfirmDialog(
                    `Confirm ${decisionLabel}?`,
                    `Are you sure you want to ${decisionLabel} this verification request?`,
                    () => { void handleReview() }
                  )
                } else {
                  void handleReview()
                }
              }} 
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Submit Decision'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <Modal open={confirmDialog.open} onClose={() => { setConfirmDialog({ ...confirmDialog, open: false }) }} title={confirmDialog.title} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{confirmDialog.message}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setConfirmDialog({ ...confirmDialog, open: false }) }}>Cancel</Button>
            <Button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, open: false }) }}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
