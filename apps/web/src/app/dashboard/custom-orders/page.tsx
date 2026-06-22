"use client"
import { Badge, Button, Pagination, Select, type SelectOption } from '@marketplace/ui'
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'

import { useAuth } from '../../../hooks/useAuth'
import { getMyCustomOrders, updateCustomOrderStatus, type CustomOrderData } from '../../../lib/marketplaceApi'

const STATUS_FILTERS_BUYER: SelectOption[] = [
  { value: '', label: 'All Orders' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_production', label: 'In Production' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_FILTERS_SELLER: SelectOption[] = [
  { value: '', label: 'All Orders' },
  { value: 'submitted', label: 'New (Submitted)' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_production', label: 'In Production' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'submitted': return 'info'
    case 'under_review': return 'warning'
    case 'confirmed': return 'success'
    case 'in_production': return 'info'
    case 'shipped': return 'info'
    case 'delivered': return 'success'
    case 'cancelled': return 'error'
    default: return 'default'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'submitted': return 'Submitted'
    case 'under_review': return 'Under Review'
    case 'confirmed': return 'Confirmed'
    case 'in_production': return 'In Production'
    case 'shipped': return 'Shipped'
    case 'delivered': return 'Delivered'
    case 'cancelled': return 'Cancelled'
    default: return status
  }
}

const NEXT_STATUS: Record<string, string> = {
  submitted: 'under_review',
  under_review: 'confirmed',
  confirmed: 'in_production',
  in_production: 'shipped',
  shipped: 'delivered',
}

export default function CustomOrdersPage() {
  const { user } = useAuth()
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [orders, setOrders] = useState<CustomOrderData[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const res = await getMyCustomOrders({
        page,
        limit: 10,
        role,
        ...(statusFilter ? { status: statusFilter } : {}),
      })
      setOrders(res.data)
      setTotalPages(res.meta.totalPages)
    } catch {
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [user, page, role, statusFilter])

  useEffect(() => {
    void fetchOrders()
  }, [fetchOrders])

  const handleStatusAdvance = async (orderId: string, newStatus: string) => {
    try {
      await updateCustomOrderStatus(orderId, newStatus)
      void fetchOrders()
    } catch {
      setError('Failed to update order status')
    }
  }

  const handleCancel = async (orderId: string) => {
    try {
      await updateCustomOrderStatus(orderId, 'cancelled', { cancelledReason: 'Cancelled by user' })
      void fetchOrders()
    } catch {
      setError('Failed to cancel order')
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Custom Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track and manage your custom orders.</p>
      </div>

      {/* Role toggle */}
      <div className="flex items-center gap-4">
        <div className="flex rounded-lg border overflow-hidden">
          <button
            type="button"
            onClick={() => { setRole('buyer'); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${role === 'buyer' ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground hover:bg-accent'}`}
          >
            My Orders
          </button>
          <button
            type="button"
            onClick={() => { setRole('seller'); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${role === 'seller' ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground hover:bg-accent'}`}
          >
            Received Orders
          </button>
        </div>

        <div className="w-48">
          <Select
            options={role === 'buyer' ? STATUS_FILTERS_BUYER : STATUS_FILTERS_SELLER}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            aria-label="Filter by status"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      ) : null}

      {/* Orders list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border bg-card p-4 space-y-3">
              <div className="h-5 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : orders.length > 0 ? (
        <>
          <div className="space-y-4">
            {orders.map((order) => {
              const nextStatus = NEXT_STATUS[order.status]
              const canAdvance = role === 'seller' && nextStatus != null
              const canCancel = ['submitted', 'under_review', 'confirmed', 'in_production'].includes(order.status)

              return (
                <div key={order.id} className="rounded-lg border bg-card p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={statusVariant(order.status)}>{statusLabel(order.status)}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      {order.listing ? (
                        <Link href={`/listings/${order.listing.id}`} className="font-medium text-card-foreground hover:text-primary transition-colors">
                          {order.listing.title}
                        </Link>
                      ) : (
                        <p className="font-medium text-card-foreground">Order #{order.id.slice(0, 8)}</p>
                      )}
                      {role === 'seller' && order.buyer ? (
                        <p className="text-sm text-muted-foreground">From: {order.buyer.displayName}</p>
                      ) : null}
                      {role === 'buyer' && order.seller ? (
                        <p className="text-sm text-muted-foreground">Designer: {order.seller.displayName}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {order.fabricChoice ? <span>Fabric: {order.fabricChoice}</span> : null}
                        {order.colorChoice ? <span>Color: {order.colorChoice}</span> : null}
                        {order.estimatedPrice != null ? <span>Est: {String(order.estimatedPrice)}</span> : null}
                        {order.estimatedDays != null ? <span>~{String(order.estimatedDays)} days</span> : null}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {canAdvance && nextStatus ? (
                        <Button
                          onClick={() => { void handleStatusAdvance(order.id, nextStatus) }}
                          className="bg-brand-wine text-white hover:bg-brand-wine/90"
                        >
                          → {statusLabel(nextStatus)}
                        </Button>
                      ) : null}
                      {canCancel ? (
                        <Button variant="outline" onClick={() => { void handleCancel(order.id) }}>
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {totalPages > 1 ? (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          ) : null}
        </>
      ) : (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No custom orders found.</p>
          <Link href="/search" className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary/80">
            Browse listings
          </Link>
        </div>
      )}
    </div>
  )
}
