'use client'

import { useEffect, useState } from 'react'

export default function ListingsCustomOrdersPage() {
  const [activeTab, setActiveTab] = useState<'sales' | 'rentals' | 'custom'>('sales')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [actionReason, setActionReason] = useState('')
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  useEffect(() => {
    loadItems()
  }, [activeTab, filter, page])

  const loadItems = async () => {
    try {
      setLoading(true)
      const API_BASE = '/api/v1'
      
      // Build query parameters based on tab and filter
      const params: Record<string, string | number | boolean> = {
        page: page,
        limit: 20,
      }
      
      // Add status filter if not 'all'
      if (filter !== 'all') {
        params.status = filter
      }
      
      // Add type-specific filters for tabs
      if (activeTab === 'sales') {
        params.availableForPurchase = true
      } else if (activeTab === 'rentals') {
        params.availableForRent = true
      } else if (activeTab === 'custom') {
        params.customOrderAvailable = true
      }
      
      // Build URL with query parameters
      const queryString = new URLSearchParams(
        Object.entries(params)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)])
      ).toString()
      
      console.log('Fetching from:', `${API_BASE}/admin/listings?${queryString}`)
      console.log('Current filter:', filter, 'Current tab:', activeTab)
      
      const response = await fetch(`${API_BASE}/admin/listings?${queryString}`, {
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Listings API response:', data)
      
      // Handle different response structures
      let itemsArray = []
      if (Array.isArray(data)) {
        itemsArray = data
      } else if (data && Array.isArray(data.data)) {
        itemsArray = data.data
      } else if (data && Array.isArray(data.items)) {
        itemsArray = data.items
      } else if (data && data.data && Array.isArray(data.data.items)) {
        itemsArray = data.data.items
      } else if (data && data.data && typeof data.data === 'object') {
        if (Array.isArray(data.data.items)) {
          itemsArray = data.data.items
        } else if (Array.isArray(data.data.data)) {
          itemsArray = data.data.data
        } else {
          console.log('Inner data object keys:', Object.keys(data.data))
          console.log('Inner data object:', data.data)
        }
      }
      
      console.log('Items array length:', itemsArray.length)
      console.log('Statuses of returned items:', itemsArray.map((i: any) => i.status))
      setItems(itemsArray)
    } catch (error) {
      console.error('Failed to load items:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const API_BASE = '/api/v1'
      console.log('Approving listing:', id)
      const response = await fetch(`${API_BASE}/admin/listings/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      console.log('Approve response status:', response.status)
      const responseData = await response.json()
      console.log('Approve response data:', responseData)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: responseData.message || 'Unknown error'`)
      }
      
      // Refresh the list
      await loadItems()
      setShowDetailModal(false)
    } catch (error) {
      console.error('Failed to approve listing:', error)
      alert(`Failed to approve listing: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleReject = async (id: string, reason?: string) => {
    try {
      const API_BASE = '/api/v1'
      const response = await fetch(`${API_BASE}/admin/listings/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason: reason || '' }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Refresh the list
      await loadItems()
      setShowDetailModal(false)
      setActionReason('')
      setPendingAction(null)
    } catch (error) {
      console.error('Failed to reject listing:', error)
      alert('Failed to reject listing. Please try again.')
    }
  }

  const handleArchive = async (id: string, reason?: string) => {
    try {
      const API_BASE = '/api/v1'
      const response = await fetch(`${API_BASE}/admin/listings/${id}/hide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason: reason || '' }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Refresh the list
      await loadItems()
      setShowDetailModal(false)
      setActionReason('')
      setPendingAction(null)
    } catch (error) {
      console.error('Failed to archive listing:', error)
      alert('Failed to archive listing. Please try again.')
    }
  }

  const handleActivate = async (id: string) => {
    try {
      const API_BASE = '/api/v1'
      const response = await fetch(`${API_BASE}/admin/listings/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Refresh the list
      await loadItems()
      setShowDetailModal(false)
    } catch (error) {
      console.error('Failed to activate listing:', error)
      alert('Failed to activate listing. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'sold':
        return 'bg-blue-100 text-blue-800'
      case 'expired':
        return 'bg-orange-100 text-orange-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'archived':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Listings & Custom Orders</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sales')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'sales'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Sales Listings
          </button>
          <button
            onClick={() => setActiveTab('rentals')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'rentals'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Rental Listings
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'custom'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Custom Orders (Bespoke Tailoring)
          </button>
        </nav>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending_review">Pending Review</option>
          <option value="draft">Draft</option>
          <option value="sold">Sold</option>
          <option value="expired">Expired</option>
          <option value="rejected">Rejected</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Pending Review</dt>
          <dd className="mt-2 text-3xl font-bold text-yellow-600">
            {items.filter((i) => i.status === 'pending_review').length}
          </dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Active</dt>
          <dd className="mt-2 text-3xl font-bold text-green-600">
            {items.filter((i) => i.status === 'active').length}
          </dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Draft</dt>
          <dd className="mt-2 text-3xl font-bold text-gray-600">
            {items.filter((i) => i.status === 'draft').length}
          </dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Total</dt>
          <dd className="mt-2 text-3xl font-bold text-gray-900">
            {items.length}
          </dd>
        </div>
      </div>

      {/* Items Table */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Price
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
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <p className="font-medium">No items found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Filter: {filter}, Tab: {activeTab}, Page: {page}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Check browser console for API errors
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {item.id.slice(0, 8)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <div>
                        <div className="font-medium text-gray-900">{item.seller?.displayName || 'Unknown'}</div>
                        <div className="text-xs text-gray-400">{item.seller?.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-3">
                        {item.images && item.images.length > 0 && (
                          <img
                            src={item.images[0].url || item.images[0]}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        )}
                        <span className="font-medium text-gray-900">{item.title || 'Untitled'}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {item.category?.name || 'Uncategorized'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {item.currency || 'ETB'} {item.price?.toLocaleString() || '0'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedItem(item)
                            setShowDetailModal(true)
                          }}
                          className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                        >
                          View Detail
                        </button>
                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(item.id)}
                              className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(item.id)}
                              className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
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

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-bold">Listing Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-6">
              {/* Images */}
              {selectedItem.images && selectedItem.images.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold">Images</h3>
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedItem.images.map((img: any, idx: number) => (
                      <img
                        key={idx}
                        src={img.url || img}
                        alt={`Listing image ${idx + 1}`}
                        className="h-32 w-32 rounded object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="mb-1 font-semibold">Title</h3>
                  <p className="text-gray-600">{selectedItem.title || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">Status</h3>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(selectedItem.status)}`}>
                    {selectedItem.status}
                  </span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">Price</h3>
                  <p className="text-gray-600">
                    {selectedItem.currency || 'ETB'} {selectedItem.price?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">Condition</h3>
                  <p className="text-gray-600">{selectedItem.condition || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">Category</h3>
                  <p className="text-gray-600">{selectedItem.category?.name || 'Uncategorized'}</p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">City</h3>
                  <p className="text-gray-600">{selectedItem.city || 'N/A'}</p>
                </div>
              </div>

              {/* Availability */}
              <div>
                <h3 className="mb-2 font-semibold">Availability</h3>
                <div className="flex gap-4">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${selectedItem.availableForPurchase ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {selectedItem.availableForPurchase ? 'Available for Purchase' : 'Not for Purchase'}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${selectedItem.availableForRent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {selectedItem.availableForRent ? 'Available for Rent' : 'Not for Rent'}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${selectedItem.customOrderAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {selectedItem.customOrderAvailable ? 'Custom Orders' : 'No Custom Orders'}
                  </span>
                </div>
              </div>

              {/* Rental Info */}
              {selectedItem.availableForRent && (
                <div>
                  <h3 className="mb-2 font-semibold">Rental Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Price per day</p>
                      <p className="font-medium">
                        {selectedItem.currency || 'ETB'} {selectedItem.rentalPricePerDay?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Deposit</p>
                      <p className="font-medium">
                        {selectedItem.currency || 'ETB'} {selectedItem.rentalDeposit?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Seller Info */}
              <div>
                <h3 className="mb-2 font-semibold">Seller Information</h3>
                <div className="rounded bg-gray-50 p-4">
                  <p className="font-medium">{selectedItem.seller?.displayName || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">{selectedItem.seller?.email || 'N/A'}</p>
                  <div className="mt-2 flex gap-2">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${selectedItem.seller?.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {selectedItem.seller?.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
                    </span>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${selectedItem.seller?.isPhoneVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {selectedItem.seller?.isPhoneVerified ? 'Phone Verified' : 'Phone Not Verified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedItem.description && (
                <div>
                  <h3 className="mb-2 font-semibold">Description</h3>
                  <p className="text-gray-600">{selectedItem.description}</p>
                </div>
              )}

              {/* Reason Input */}
              {pendingAction && (
                <div>
                  <label className="mb-2 block font-semibold">Reason for action</label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Please provide a reason for this action..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t pt-4">
                {pendingAction ? (
                  <>
                    <button
                      onClick={() => {
                        setPendingAction(null)
                        setActionReason('')
                      }}
                      className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (pendingAction === 'reject') {
                          handleReject(selectedItem.id, actionReason)
                        } else if (pendingAction === 'archive') {
                          handleArchive(selectedItem.id)
                        }
                      }}
                      disabled={!actionReason.trim()}
                      className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirm {pendingAction}
                    </button>
                  </>
                ) : (
                  <>
                    {selectedItem.status === 'pending_review' && (
                      <>
                        <button
                          onClick={() => setPendingAction('reject')}
                          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            handleApprove(selectedItem.id)
                            setShowDetailModal(false)
                          }}
                          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                        >
                          Approve
                        </button>
                      </>
                    )}
                    {selectedItem.status === 'active' && (
                      <>
                        <button
                          onClick={() => setPendingAction('archive')}
                          className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
                        >
                          Archive
                        </button>
                      </>
                    )}
                    {selectedItem.status === 'draft' && (
                      <>
                        <button
                          onClick={() => {
                            handleActivate(selectedItem.id)
                          }}
                          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                        >
                          Activate
                        </button>
                      </>
                    )}
                    {selectedItem.status === 'rejected' && (
                      <>
                        <button
                          onClick={() => {
                            handleActivate(selectedItem.id)
                          }}
                          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                        >
                          Activate
                        </button>
                      </>
                    )}
                    {selectedItem.status === 'archived' && (
                      <>
                        <button
                          onClick={() => {
                            handleActivate(selectedItem.id)
                          }}
                          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                        >
                          Activate
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
