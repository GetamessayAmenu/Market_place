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
  Spinner,
  Alert,
  Badge,
} from '@marketplace/ui'
import React, { useState, useCallback } from 'react'

import { clientGet, buildQuery } from '../../lib/clientApi'

import { formatDate } from './StatusBadge'

interface Order {
  id: string
  orderNumber: string
  type: string
  status: string
  paymentStatus: string
  buyerId: string
  sellerId: string
  listingId: string
  totalAmount: number
  currency: string
  rentalStartDate: string | null
  rentalEndDate: string | null
  rentalDeposit: number | null
  customOrderId: string | null
  measurements: any
  fabricChoice: string | null
  colorChoice: string | null
  designNotes: string | null
  shippingAddress: any
  trackingNumber: string | null
  paymentMethod: string | null
  paymentId: string | null
  cancelledAt: string | null
  cancelledReason: string | null
  refundedAt: string | null
  refundAmount: number | null
  refundReason: string | null
  confirmedAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  createdAt: string
  updatedAt: string
  buyer: {
    id: string
    displayName: string
    email: string
    phone: string | null
    avatarUrl: string | null
  }
  seller: {
    id: string
    displayName: string
    email: string
    phone: string | null
    avatarUrl: string | null
  }
  listing: {
    id: string
    title: string
    slug: string
    price: number
    currency: string
    images: any[]
  }
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

interface OrdersTableProps {
  initialData: PaginatedResponse<Order>
}

export default function OrdersTable({ initialData }: OrdersTableProps) {
  const [orders, setOrders] = useState(initialData.data)
  const [page, setPage] = useState(initialData.meta.page)
  const [totalPages, setTotalPages] = useState(initialData.meta.totalPages)
  const [total, setTotal] = useState(initialData.meta.total)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const fetchData = useCallback(async (p: number, t: string, s: string, ps: string, srch: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await clientGet<PaginatedResponse<Order>>(
        '/admin/orders' + buildQuery({
          page: p,
          limit: 20,
          type: t || undefined,
          status: s || undefined,
          paymentStatus: ps || undefined,
          search: srch || undefined,
        })
      )
      setOrders(res.data)
      setTotalPages(res.meta.totalPages)
      setTotal(res.meta.total)
    } catch {
      setError('Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handlePageChange = (p: number) => {
    setPage(p)
    void fetchData(p, typeFilter, statusFilter, paymentStatusFilter, search)
  }

  const handleFilter = () => {
    setPage(1)
    void fetchData(1, typeFilter, statusFilter, paymentStatusFilter, search)
  }

  const handleExport = async () => {
    try {
      const res = await clientGet<PaginatedResponse<Order>>(
        '/admin/orders' + buildQuery({
          page: 1,
          limit: 1000,
          type: typeFilter || undefined,
          status: statusFilter || undefined,
          paymentStatus: paymentStatusFilter || undefined,
          search: search || undefined,
        })
      )
      
      // Create CSV
      const headers = ['Order Number', 'Type', 'Status', 'Payment Status', 'Buyer', 'Seller', 'Listing', 'Amount', 'Created At']
      const rows = res.data.map(order => [
        order.orderNumber,
        order.type,
        order.status,
        order.paymentStatus,
        order.buyer.displayName,
        order.seller.displayName,
        order.listing.title,
        `${order.currency} ${order.totalAmount}`,
        order.createdAt,
      ])
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Failed to export orders.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'confirmed': return 'default'
      case 'processing': return 'default'
      case 'shipped': return 'default'
      case 'delivered': return 'success'
      case 'cancelled': return 'destructive'
      case 'refunded': return 'destructive'
      default: return 'secondary'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'processing': return 'default'
      case 'paid': return 'success'
      case 'failed': return 'destructive'
      case 'refunded': return 'destructive'
      case 'partial_refund': return 'default'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Type</label>
          <Select
            options={[
              { label: 'All Types', value: '' },
              { label: 'Product', value: 'product' },
              { label: 'Rental', value: 'rental' },
              { label: 'Custom Service', value: 'custom_service' },
            ]}
            value={typeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setTypeFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="w-40">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Order Status</label>
          <Select
            options={[
              { label: 'All Status', value: '' },
              { label: 'Pending', value: 'pending' },
              { label: 'Confirmed', value: 'confirmed' },
              { label: 'Processing', value: 'processing' },
              { label: 'Shipped', value: 'shipped' },
              { label: 'Delivered', value: 'delivered' },
              { label: 'Cancelled', value: 'cancelled' },
              { label: 'Refunded', value: 'refunded' },
            ]}
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setStatusFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="w-40">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Payment Status</label>
          <Select
            options={[
              { label: 'All Status', value: '' },
              { label: 'Pending', value: 'pending' },
              { label: 'Processing', value: 'processing' },
              { label: 'Paid', value: 'paid' },
              { label: 'Failed', value: 'failed' },
              { label: 'Refunded', value: 'refunded' },
              { label: 'Partial Refund', value: 'partial_refund' },
            ]}
            value={paymentStatusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setPaymentStatusFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Search</label>
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value) }}
            className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button size="sm" onClick={handleFilter}>Apply Filters</Button>
        <Button size="sm" variant="outline" onClick={handleExport}>Export CSV</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {loading && <div className="flex justify-center p-8"><Spinner /></div>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{order.type.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(order.status) as any} className="capitalize">{order.status.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPaymentStatusColor(order.paymentStatus) as any} className="capitalize">{order.paymentStatus.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {order.buyer.avatarUrl && (
                      <img src={order.buyer.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                    )}
                    <span className="text-sm">{order.buyer.displayName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {order.seller.avatarUrl && (
                      <img src={order.seller.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                    )}
                    <span className="text-sm">{order.seller.displayName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium">{order.currency} {order.totalAmount}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedOrder(order)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{String(total)} total orders</p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal 
        open={selectedOrder !== null} 
        onClose={() => setSelectedOrder(null)} 
        title={`Order ${selectedOrder?.orderNumber}`} 
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Order Type</p>
                <p className="font-medium capitalize">{selectedOrder.type.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Order Status</p>
                <Badge variant={getStatusColor(selectedOrder.status) as any} className="capitalize">{selectedOrder.status.replace('_', ' ')}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment Status</p>
                <Badge variant={getPaymentStatusColor(selectedOrder.paymentStatus) as any} className="capitalize">{selectedOrder.paymentStatus.replace('_', ' ')}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="font-medium">{selectedOrder.currency} {selectedOrder.totalAmount}</p>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="font-semibold mb-3">Order Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Order Created</p>
                    <p className="text-xs text-muted-foreground">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>
                {selectedOrder.confirmedAt && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Order Confirmed</p>
                      <p className="text-xs text-muted-foreground">{formatDate(selectedOrder.confirmedAt)}</p>
                    </div>
                  </div>
                )}
                {selectedOrder.shippedAt && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Order Shipped</p>
                      <p className="text-xs text-muted-foreground">{formatDate(selectedOrder.shippedAt)}</p>
                      {selectedOrder.trackingNumber && (
                        <p className="text-xs text-muted-foreground">Tracking: {selectedOrder.trackingNumber}</p>
                      )}
                    </div>
                  </div>
                )}
                {selectedOrder.deliveredAt && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Order Delivered</p>
                      <p className="text-xs text-muted-foreground">{formatDate(selectedOrder.deliveredAt)}</p>
                    </div>
                  </div>
                )}
                {selectedOrder.cancelledAt && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Order Cancelled</p>
                      <p className="text-xs text-muted-foreground">{formatDate(selectedOrder.cancelledAt)}</p>
                      {selectedOrder.cancelledReason && (
                        <p className="text-xs text-muted-foreground">Reason: {selectedOrder.cancelledReason}</p>
                      )}
                    </div>
                  </div>
                )}
                {selectedOrder.refundedAt && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Refund Processed</p>
                      <p className="text-xs text-muted-foreground">{formatDate(selectedOrder.refundedAt)}</p>
                      {selectedOrder.refundAmount && (
                        <p className="text-xs text-muted-foreground">Amount: {selectedOrder.currency} {selectedOrder.refundAmount}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Details */}
            <div>
              <h3 className="font-semibold mb-3">Customer Details</h3>
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-3 mb-2">
                  {selectedOrder.buyer.avatarUrl && (
                    <img src={selectedOrder.buyer.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="font-medium">{selectedOrder.buyer.displayName}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.buyer.email}</p>
                  </div>
                </div>
                {selectedOrder.buyer.phone && (
                  <p className="text-sm text-muted-foreground">Phone: {selectedOrder.buyer.phone}</p>
                )}
              </div>
            </div>

            {/* Seller Details */}
            <div>
              <h3 className="font-semibold mb-3">Seller Details</h3>
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-3 mb-2">
                  {selectedOrder.seller.avatarUrl && (
                    <img src={selectedOrder.seller.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="font-medium">{selectedOrder.seller.displayName}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.seller.email}</p>
                  </div>
                </div>
                {selectedOrder.seller.phone && (
                  <p className="text-sm text-muted-foreground">Phone: {selectedOrder.seller.phone}</p>
                )}
              </div>
            </div>

            {/* Listing Details */}
            <div>
              <h3 className="font-semibold mb-3">Listing Details</h3>
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  {selectedOrder.listing.images.length > 0 && (
                    <img src={selectedOrder.listing.images[0].url} alt="" className="h-16 w-16 rounded object-cover" />
                  )}
                  <div>
                    <p className="font-medium">{selectedOrder.listing.title}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.currency} {selectedOrder.listing.price}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Type-specific details */}
            {selectedOrder.type === 'rental' && (
              <div>
                <h3 className="font-semibold mb-3">Rental Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedOrder.rentalStartDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <p className="text-sm">{formatDate(selectedOrder.rentalStartDate)}</p>
                    </div>
                  )}
                  {selectedOrder.rentalEndDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">End Date</p>
                      <p className="text-sm">{formatDate(selectedOrder.rentalEndDate)}</p>
                    </div>
                  )}
                  {selectedOrder.rentalDeposit && (
                    <div>
                      <p className="text-xs text-muted-foreground">Deposit</p>
                      <p className="text-sm">{selectedOrder.currency} {selectedOrder.rentalDeposit}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedOrder.type === 'custom_service' && (
              <div>
                <h3 className="font-semibold mb-3">Custom Order Details</h3>
                <div className="space-y-2">
                  {selectedOrder.fabricChoice && (
                    <div>
                      <p className="text-xs text-muted-foreground">Fabric Choice</p>
                      <p className="text-sm">{selectedOrder.fabricChoice}</p>
                    </div>
                  )}
                  {selectedOrder.colorChoice && (
                    <div>
                      <p className="text-xs text-muted-foreground">Color Choice</p>
                      <p className="text-sm">{selectedOrder.colorChoice}</p>
                    </div>
                  )}
                  {selectedOrder.designNotes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Design Notes</p>
                      <p className="text-sm">{selectedOrder.designNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
