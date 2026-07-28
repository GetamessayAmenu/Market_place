'use client'

import { useEffect, useState } from 'react'

export default function SellerRentalsPage() {
  const [rentals, setRentals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadRentals()
  }, [filter, page])

  const loadRentals = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call to seller rental endpoint
      // const response = await getSellerRentals({ page, limit: 20, status: filter !== 'all' ? filter : undefined })
      // if (response.success && response.data) {
      //   setRentals(response.data.items)
      // }
      setRentals([])
    } catch (error) {
      console.error('Failed to load rentals:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'OVERDUE':
        return 'bg-red-200 text-red-900'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rental Tracker</h1>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Total Rentals</dt>
          <dd className="mt-2 text-3xl font-bold text-gray-900">{rentals.length}</dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Active Rentals</dt>
          <dd className="mt-2 text-3xl font-bold text-green-600">
            {rentals.filter((r) => r.status === 'ACTIVE').length}
          </dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Pending Returns expected</dt>
          <dd className="mt-2 text-3xl font-bold text-yellow-600">
            {rentals.filter((r) => r.status === 'ACTIVE').length}
          </dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Overdue</dt>
          <dd className="mt-2 text-3xl font-bold text-red-600">
            {rentals.filter((r) => r.status === 'OVERDUE').length}
          </dd>
        </div>
      </div>

      {/* Rentals Table */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Rental Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
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
              ) : rentals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No rental orders found
                  </td>
                </tr>
              ) : (
                rentals.map((rental) => (
                  <tr key={rental.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {rental.id.slice(0, 8)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {rental.renter?.displayName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {rental.listing?.title || 'Unknown Item'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span>{new Date(rental.startDate).toLocaleDateString()}</span>
                        <span className="text-gray-400">to</span>
                        <span>{new Date(rental.endDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      ${rental.totalAmount.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(rental.status)}`}>
                        {rental.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <button className="text-indigo-600 hover:text-indigo-900">
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
