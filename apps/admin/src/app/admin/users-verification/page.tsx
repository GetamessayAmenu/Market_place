'use client'

import { useEffect, useState } from 'react'
import { getVendorKycProfiles, type VendorKycProfile } from '@/lib/adminApi'

export default function VerificationPage() {
  const [profiles, setProfiles] = useState<VendorKycProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadProfiles()
  }, [filter, page])

  const loadProfiles = async () => {
    try {
      setLoading(true)
      const query: any = {
        page,
        limit: 20,
      }
      if (filter !== 'all') {
        query.status = filter
      }
      const response = await getVendorKycProfiles(query)
      if (response.success && response.data) {
        setProfiles(response.data.items)
      }
    } catch (error) {
      console.error('Failed to load KYC profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (profileId: string, decision: 'APPROVED' | 'REJECTED', reason?: string) => {
    // TODO: Implement review logic
    console.log('Review profile:', profileId, decision, reason)
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Total Submissions</dt>
          <dd className="mt-2 text-3xl font-bold text-gray-900">{profiles.length}</dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Pending Review</dt>
          <dd className="mt-2 text-3xl font-bold text-yellow-600">
            {profiles.filter((p) => p.status === 'PENDING').length}
          </dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Approved</dt>
          <dd className="mt-2 text-3xl font-bold text-green-600">
            {profiles.filter((p) => p.status === 'APPROVED').length}
          </dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Rejected</dt>
          <dd className="mt-2 text-3xl font-bold text-red-600">
            {profiles.filter((p) => p.status === 'REJECTED').length}
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
              ) : profiles.length === 0 ? (
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
                            onClick={() => handleReview(profile.id, 'APPROVED')}
                            className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(profile.id, 'REJECTED')}
                            className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      <button className="ml-2 text-indigo-600 hover:text-indigo-900">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <div className="text-sm text-gray-500">
            Showing page {page}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
