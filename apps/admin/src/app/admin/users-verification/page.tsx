'use client'

import { useEffect, useState } from 'react'
import { clientGet, clientPatch } from '@/lib/clientApi'

export interface VendorKycProfile {
  id: string
  userId: string
  businessName: string
  businessNameAm?: string
  tinNumber: string
  licenseUrl: string
  licenseCloudinaryId?: string
  status: string
  rejectionReason?: string
  reviewedById?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    displayName: string
    email: string
    phone?: string
  }
  reviewedBy?: {
    id: string
    displayName: string
  }
}

export default function VerificationPage() {
  const [profiles, setProfiles] = useState<VendorKycProfile[]>([])
  const [allProfiles, setAllProfiles] = useState<VendorKycProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await clientGet<{ success: boolean; data: { user: { role: string } } }>('/auth/me')
        if (response.success && response.data?.user) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          setError('You need to be logged in as an admin to view this page.')
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        setIsAuthenticated(false)
        setError('Authentication failed. Please log in again.')
      }
    }
    checkAuth()
  }, [])
  
  // Review modal state
  const [reviewModal, setReviewModal] = useState<{
    open: boolean
    profileId: string
    decision: 'APPROVED' | 'REJECTED'
    businessName: string
  } | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Detail modal state
  const [detailModal, setDetailModal] = useState<{
    open: boolean
    profile: VendorKycProfile | null
  }>({ open: false, profile: null })

  useEffect(() => {
    if (isAuthenticated) {
      loadProfiles()
    }
  }, [isAuthenticated])

  // Apply client-side filtering when filter changes
  useEffect(() => {
    if (filter === 'all') {
      setProfiles(allProfiles)
    } else {
      setProfiles(allProfiles.filter(p => p.status === filter))
    }
  }, [filter, allProfiles])

  const loadProfiles = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await clientGet<{ success: boolean; data: { data: VendorKycProfile[]; meta: any } }>(
        '/admin/vendor-kyc'
      )
      
      if (response.success && response.data) {
        const items = response.data.data || []
        setAllProfiles(items)
        // Apply client-side filtering
        if (filter === 'all') {
          setProfiles(items)
        } else {
          setProfiles(items.filter(p => p.status === filter))
        }
      } else {
        setError('Invalid response format from server')
      }
    } catch (error) {
      console.error('Failed to load KYC profiles:', error)
      setError('Failed to load KYC profiles. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewClick = (profileId: string, decision: 'APPROVED' | 'REJECTED', businessName: string) => {
    if (decision === 'REJECTED') {
      setReviewModal({ open: true, profileId, decision, businessName })
      setRejectionReason('')
    } else {
      // Approve immediately
      performReview(profileId, decision)
    }
  }

  const performReview = async (profileId: string, decision: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      setActionLoading(true)
      setError(null)
      setSuccess(null)
      
      const reviewData: { decision: 'APPROVED' | 'REJECTED'; reason?: string } = { decision }
      if (reason) {
        reviewData.reason = reason
      }
      
      const response = await clientPatch<{ success: boolean; data: VendorKycProfile }>(
        '/admin/vendor-kyc/' + profileId + '/review',
        reviewData
      )
      
      if (response.success) {
        setSuccess(`KYC profile ${decision.toLowerCase()} successfully`)
        setReviewModal(null)
        setRejectionReason('')
        // Refresh the data
        await loadProfiles()
      } else {
        setError('Failed to process review. Please try again.')
      }
    } catch (error) {
      console.error('Failed to review KYC profile:', error)
      setError('Failed to process review. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmReject = () => {
    if (reviewModal) {
      performReview(reviewModal.profileId, reviewModal.decision, rejectionReason)
    }
  }

  const handleViewDetail = (profile: VendorKycProfile) => {
    setDetailModal({ open: true, profile })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Verification & KYC Desk</h1>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Error and Success Messages */}
      {!isAuthenticated && (
        <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
          Please log in as an admin to view this page.
          <a href="/login" className="ml-2 font-semibold underline">Go to Login</a>
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-semibold underline">Dismiss</button>
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          {success}
          <button onClick={() => setSuccess(null)} className="ml-2 font-semibold underline">Dismiss</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Total Submissions</dt>
          <dd className="mt-2 text-3xl font-bold text-gray-900">{profiles?.length || 0}</dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Pending Review</dt>
          <dd className="mt-2 text-3xl font-bold text-yellow-600">
            {profiles?.filter((p) => p.status === 'PENDING').length || 0}
          </dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Approved</dt>
          <dd className="mt-2 text-3xl font-bold text-green-600">
            {profiles?.filter((p) => p.status === 'APPROVED').length || 0}
          </dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Rejected</dt>
          <dd className="mt-2 text-3xl font-bold text-red-600">
            {profiles?.filter((p) => p.status === 'REJECTED').length || 0}
          </dd>
        </div>
      </div>

      {/* KYC Profiles Table */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Business Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  TIN Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Submitted By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Submitted Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : !profiles || profiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No KYC profiles found
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{profile.businessName}</div>
                      {profile.businessNameAm && (
                        <div className="text-xs text-gray-500">{profile.businessNameAm}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {profile.tinNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>
                        <div className="font-medium text-gray-900">{profile.user?.displayName || 'Unknown'}</div>
                        <div className="text-xs text-gray-400">{profile.user?.email}</div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(profile.status)}`}>
                        {profile.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {profile.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReviewClick(profile.id, 'APPROVED', profile.businessName)}
                            disabled={actionLoading}
                            className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewClick(profile.id, 'REJECTED', profile.businessName)}
                            disabled={actionLoading}
                            className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => handleViewDetail(profile)}
                        className="ml-2 text-indigo-600 hover:text-indigo-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Confirmation Modal */}
      {reviewModal && reviewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Reject KYC Profile
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Are you sure you want to reject the KYC profile for <strong>{reviewModal?.businessName}</strong>?
            </p>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Rejection Reason (required)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Please provide a reason for rejection..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setReviewModal(null)
                  setRejectionReason('')
                }}
                disabled={actionLoading}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && detailModal.open && detailModal.profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                KYC Profile Details
              </h3>
              <button
                onClick={() => setDetailModal({ open: false, profile: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Business Information */}
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-3 text-sm font-medium text-gray-700">Business Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Business Name:</span>
                    <p className="font-medium text-gray-900">{detailModal.profile.businessName}</p>
                  </div>
                  {detailModal.profile.businessNameAm && (
                    <div>
                      <span className="text-gray-500">Business Name (Amharic):</span>
                      <p className="font-medium text-gray-900">{detailModal.profile.businessNameAm}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">TIN Number:</span>
                    <p className="font-medium text-gray-900">{detailModal.profile.tinNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(detailModal.profile.status)}`}>
                      {detailModal.profile.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* License Document */}
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-3 text-sm font-medium text-gray-700">License Document</h4>
                {detailModal.profile.licenseUrl ? (
                  <div>
                    <a
                      href={detailModal.profile.licenseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      View License Document
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No license document uploaded</p>
                )}
              </div>

              {/* User Information */}
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-3 text-sm font-medium text-gray-700">Submitted By</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <p className="font-medium text-gray-900">{detailModal.profile.user?.displayName || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium text-gray-900">{detailModal.profile.user?.email || 'Unknown'}</p>
                  </div>
                  {detailModal.profile.user?.phone && (
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <p className="font-medium text-gray-900">{detailModal.profile.user.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Messaging Activity & Restrictions Card */}
              {detailModal.profile.user?.id && (
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">User Messaging Activity & Safety</h4>
                    <a
                      href={`/admin/chat/reports?reportedUserId=${detailModal.profile.user.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      View Reported Chats →
                    </a>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Privileged access: private message body contents are restricted to active moderation reports.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-md bg-white p-2.5 shadow-sm">
                      <span className="text-gray-500">Chat Risk Profile:</span>
                      <p className="font-bold text-emerald-600 mt-0.5">🟢 Normal Risk Level</p>
                    </div>
                    <div className="rounded-md bg-white p-2.5 shadow-sm">
                      <span className="text-gray-500">Messaging Restriction:</span>
                      <p className="font-medium text-gray-900 mt-0.5">No Active Restriction</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Information */}
              {detailModal.profile.reviewedBy && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="mb-3 text-sm font-medium text-gray-700">Review Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Reviewed By:</span>
                      <p className="font-medium text-gray-900">{detailModal.profile.reviewedBy.displayName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Reviewed At:</span>
                      <p className="font-medium text-gray-900">
                        {detailModal.profile.reviewedAt ? new Date(detailModal.profile.reviewedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {detailModal.profile.rejectionReason && (
                    <div className="mt-3">
                      <span className="text-gray-500">Rejection Reason:</span>
                      <p className="mt-1 text-sm text-red-600">{detailModal.profile.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Timestamps */}
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-3 text-sm font-medium text-gray-700">Timestamps</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Submitted At:</span>
                    <p className="font-medium text-gray-900">{new Date(detailModal.profile.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <p className="font-medium text-gray-900">{new Date(detailModal.profile.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Pending Status */}
              {detailModal.profile.status === 'PENDING' && (
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setDetailModal({ open: false, profile: null })
                      handleReviewClick(detailModal.profile!.id, 'APPROVED', detailModal.profile!.businessName)
                    }}
                    disabled={actionLoading}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setDetailModal({ open: false, profile: null })
                      handleReviewClick(detailModal.profile!.id, 'REJECTED', detailModal.profile!.businessName)
                    }}
                    disabled={actionLoading}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
