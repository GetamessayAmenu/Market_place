'use client'

import { useState, useEffect } from 'react'
import { cn } from '@marketplace/ui'

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const PackageIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
)

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const MoreVerticalIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
)

export interface RentalOrder {
  id: string
  orderNumber: string
  listing: {
    id: string
    title: string
    images: string[]
    slug: string
  }
  renter: {
    id: string
    displayName: string
    email: string
    phone?: string
    avatarUrl?: string
  }
  startDate: string
  endDate: string
  totalAmount: number
  securityDeposit: number
  pickupHub: string
  status: 'REQUESTED' | 'APPROVED' | 'HANDOVER_PENDING' | 'ACTIVE' | 'RETURN_INITIATED' | 'RETURNED_PENDING_INSPECTION' | 'COMPLETED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED' | 'DISPUTED'
  pricingTierUsed: string
  createdAt: string
}

type TabType = 'all' | 'REQUESTED' | 'APPROVED' | 'ACTIVE' | 'RETURNED_PENDING_INSPECTION' | 'COMPLETED'

const TABS: { id: TabType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'REQUESTED', label: 'Requested' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'RETURNED_PENDING_INSPECTION', label: 'Returned/Inspection' },
  { id: 'COMPLETED', label: 'Completed' },
]

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  HANDOVER_PENDING: 'bg-purple-100 text-purple-800',
  ACTIVE: 'bg-green-100 text-green-800',
  RETURN_INITIATED: 'bg-orange-100 text-orange-800',
  RETURNED_PENDING_INSPECTION: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  DECLINED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-red-100 text-red-800',
  DISPUTED: 'bg-red-200 text-red-900',
}

export default function SellerRentalQueue() {
  const [orders, setOrders] = useState<RentalOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<RentalOrder | null>(null)

  useEffect(() => {
    void loadOrders()
  }, [activeTab])

  const loadOrders = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      setOrders([])
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (_orderId: string) => {
    try {
      await loadOrders()
    } catch (error) {
      console.error('Failed to approve order:', error)
    }
  }

  const handleDecline = async (_orderId: string, _reason: string) => {
    try {
      await loadOrders()
    } catch (error) {
      console.error('Failed to decline order:', error)
    }
  }

  const handleStatusChange = async (_orderId: string, _newStatus: string) => {
    try {
      await loadOrders()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.listing.title.toLowerCase().includes(query) ||
        order.renter.displayName.toLowerCase().includes(query) ||
        order.renter.email.toLowerCase().includes(query)
      )
    }
    return true
  })

  const getStatusCount = (status: string) => {
    if (status === 'all') return orders.length
    return orders.filter((order) => order.status === status).length
  }

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Rental Queue</h1>
        <p className="text-muted-foreground">Manage rental requests, handovers, returns, and inspections.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
        {TABS.slice(1).map((tab) => (
          <div key={tab.id} className="rounded-lg border bg-card p-4">
            <div className="text-2xl font-bold text-card-foreground">{getStatusCount(tab.id)}</div>
            <div className="text-sm text-muted-foreground">{tab.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              )}
            >
              {tab.label}
              {getStatusCount(tab.id) > 0 && (
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {getStatusCount(tab.id)}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <PackageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-card-foreground">No orders found</h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery ? 'Try adjusting your search terms' : 'No rental orders in this category'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {order.listing.images[0] && (
                    <img
                      src={order.listing.images[0]}
                      alt={order.listing.title}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-card-foreground">{order.listing.title}</h3>
                        <p className="text-sm text-muted-foreground">{order.orderNumber}</p>
                      </div>
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                        STATUS_COLORS[order.status]
                      )}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Renter</p>
                        <p className="font-medium text-card-foreground">{order.renter.displayName}</p>
                        <p className="text-xs text-muted-foreground">{order.renter.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Rental Period</p>
                        <p className="font-medium text-card-foreground">
                          {new Date(order.startDate).toLocaleDateString()} - {new Date(order.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{order.pickupHub}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium text-card-foreground">
                          {order.totalAmount.toLocaleString()} ETB
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Deposit: {order.securityDeposit.toLocaleString()} ETB
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pricing</p>
                        <p className="font-medium text-card-foreground">{order.pricingTierUsed}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.status === 'ACTIVE' && getDaysUntil(order.endDate) > 0
                            ? `${getDaysUntil(order.endDate)} days left`
                            : order.status === 'ACTIVE' && getDaysUntil(order.endDate) <= 0
                            ? 'Overdue'
                            : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:min-w-[200px]">
                  {order.status === 'REQUESTED' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(order.id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                      >
                        <CheckIcon className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecline(order.id, 'Not available')}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-red-600 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                      >
                        <XIcon className="h-4 w-4" />
                        Decline
                      </button>
                    </div>
                  )}

                  {order.status === 'APPROVED' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(order.id, 'HANDOVER_PENDING')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <PackageIcon className="h-4 w-4" />
                      Ready for Handover
                    </button>
                  )}

                  {order.status === 'HANDOVER_PENDING' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(order.id, 'ACTIVE')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Confirm Handover
                    </button>
                  )}

                  {order.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(order.id, 'RETURN_INITIATED')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      <ArrowRightIcon className="h-4 w-4" />
                      Initiate Return
                    </button>
                  )}

                  {order.status === 'RETURN_INITIATED' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(order.id, 'RETURNED_PENDING_INSPECTION')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Received - Pending Inspection
                    </button>
                  )}

                  {order.status === 'RETURNED_PENDING_INSPECTION' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(order.id, 'COMPLETED')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Complete & Refund Deposit
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-muted px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted/80"
                  >
                    <MoreVerticalIcon className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-card-foreground">Order Details</h2>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <XIcon className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                {selectedOrder.listing.images[0] && (
                  <img
                    src={selectedOrder.listing.images[0]}
                    alt={selectedOrder.listing.title}
                    className="h-32 w-32 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-card-foreground">{selectedOrder.listing.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedOrder.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Renter</p>
                  <p className="font-medium text-card-foreground">{selectedOrder.renter.displayName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.renter.email}</p>
                  {selectedOrder.renter.phone && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.renter.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                    STATUS_COLORS[selectedOrder.status]
                  )}>
                    {selectedOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium text-card-foreground">
                    {new Date(selectedOrder.startDate).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted p-4">
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium text-card-foreground">
                    {new Date(selectedOrder.endDate).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted p-4">
                <p className="text-sm text-muted-foreground">Pickup Location</p>
                <p className="font-medium text-card-foreground">{selectedOrder.pickupHub}</p>
              </div>

              <div className="rounded-lg border bg-muted p-4">
                <p className="text-sm text-muted-foreground">Financial Summary</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-card-foreground">Rental Fee</span>
                    <span className="font-medium text-card-foreground">
                      {selectedOrder.totalAmount.toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-card-foreground">Security Deposit</span>
                    <span className="font-medium text-card-foreground">
                      {selectedOrder.securityDeposit.toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border/50 font-semibold">
                    <span className="text-card-foreground">Total</span>
                    <span className="text-primary">
                      {(selectedOrder.totalAmount + selectedOrder.securityDeposit).toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
