"use client"
import { Alert, Badge, Button, Card, CardContent, Drawer, EmptyState, Pagination, Select, Spinner, type SelectOption } from '@marketplace/ui';
import React, { useCallback, useEffect, useState } from 'react';

import useAuth from '../../../../hooks/useAuth';
import { getMyCustomOrders, updateCustomOrderStatus, type CustomOrderData } from '../../../../lib/marketplaceApi';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_FILTERS: SelectOption[] = [
  { value: '', label: 'All Orders' },
  { value: 'submitted', label: 'New (Submitted)' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_production', label: 'In Production' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'submitted': return 'info';
    case 'under_review': return 'warning';
    case 'confirmed': return 'success';
    case 'in_production': return 'info';
    case 'shipped': return 'info';
    case 'delivered': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'submitted': return 'Submitted';
    case 'under_review': return 'Under Review';
    case 'confirmed': return 'Confirmed';
    case 'in_production': return 'In Production';
    case 'shipped': return 'Shipped';
    case 'delivered': return 'Delivered';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

const NEXT_STATUS: Record<string, string> = {
  submitted: 'under_review',
  under_review: 'confirmed',
  confirmed: 'in_production',
  in_production: 'shipped',
  shipped: 'delivered',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Order Card ──────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: CustomOrderData;
  onSelect: (order: CustomOrderData) => void;
}

function OrderCard({ order, onSelect }: OrderCardProps) {
  return (
    <button
      type="button"
      onClick={() => { onSelect(order); }}
      className="w-full text-left rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30 hover:border-primary/30"
    >
      <div className="flex items-center justify-between mb-2">
        <Badge variant={statusVariant(order.status)}>{statusLabel(order.status)}</Badge>
        <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
      </div>
      {order.listing ? (
        <p className="font-medium text-card-foreground">{order.listing.title}</p>
      ) : (
        <p className="font-medium text-card-foreground">Order #{order.id.slice(0, 8)}</p>
      )}
      {order.buyer && (
        <p className="text-sm text-muted-foreground">From: {order.buyer.displayName}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {order.fabricChoice && <span>Fabric: {order.fabricChoice}</span>}
        {order.estimatedPrice != null && <span>Est: {String(order.estimatedPrice)}</span>}
        {order.estimatedDays != null && <span>~{String(order.estimatedDays)} days</span>}
      </div>
    </button>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SellerOrdersPage() {
  const user = useAuth((s) => s.user);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<CustomOrderData[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<CustomOrderData | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMyCustomOrders({
        page, limit: 10, role: 'seller',
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setOrders(res.data);
      setTotalPages(res.meta.totalPages);
    } catch {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [user, page, statusFilter]);

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  const handleAdvance = async (orderId: string, newStatus: string) => {
    setAdvancing(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await updateCustomOrderStatus(orderId, newStatus);
      setSuccessMsg(`Order advanced to "${statusLabel(newStatus)}".`);
      setSelectedOrder(null);
      void fetchOrders();
    } catch {
      setError('Failed to update order status');
    }
    setAdvancing(false);
  };

  const handleCancel = async (orderId: string) => {
    setAdvancing(true);
    setError(null);
    try {
      await updateCustomOrderStatus(orderId, 'cancelled', { cancelledReason: 'Cancelled by seller' });
      setSuccessMsg('Order cancelled.');
      setSelectedOrder(null);
      void fetchOrders();
    } catch {
      setError('Failed to cancel order');
    }
    setAdvancing(false);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Custom Orders</h1>
        <p className="text-muted-foreground">Manage orders received from buyers.</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="w-48">
          <Select
            options={STATUS_FILTERS}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            aria-label="Filter by status"
          />
        </div>
      </div>

      {/* Alerts */}
      {error && <Alert variant="error" onDismiss={() => { setError(null); }}>{error}</Alert>}
      {successMsg && <Alert variant="success" onDismiss={() => { setSuccessMsg(null); }}>{successMsg}</Alert>}

      {/* Orders */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                </svg>
              }
              title="No custom orders"
              description={statusFilter ? 'Try changing your filter.' : 'Orders from buyers will appear here.'}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 fashion-lg:grid-cols-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onSelect={setSelectedOrder} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Order Detail Drawer */}
      <Drawer
        open={selectedOrder !== null}
        onClose={() => { setSelectedOrder(null); }}
        title={selectedOrder?.listing ? selectedOrder.listing.title : `Order #${selectedOrder?.id.slice(0, 8) ?? ''}`}
      >
        {selectedOrder && (
          <div className="space-y-6 p-2">
            {/* Status */}
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant(selectedOrder.status)}>{statusLabel(selectedOrder.status)}</Badge>
              <span className="text-sm text-muted-foreground">{formatDate(selectedOrder.createdAt)}</span>
            </div>

            {/* Buyer Info */}
            {selectedOrder.buyer && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Buyer</h4>
                <p className="text-sm text-muted-foreground">{selectedOrder.buyer.displayName}</p>
              </div>
            )}

            {/* Order Details */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Specifications</h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {selectedOrder.fabricChoice && (
                  <><dt className="text-muted-foreground">Fabric</dt><dd>{selectedOrder.fabricChoice}</dd></>
                )}
                {selectedOrder.colorChoice && (
                  <><dt className="text-muted-foreground">Color</dt><dd>{selectedOrder.colorChoice}</dd></>
                )}
                {selectedOrder.estimatedPrice != null && (
                  <><dt className="text-muted-foreground">Est. Price</dt><dd>{String(selectedOrder.estimatedPrice)}</dd></>
                )}
                {selectedOrder.estimatedDays != null && (
                  <><dt className="text-muted-foreground">Est. Days</dt><dd>{String(selectedOrder.estimatedDays)}</dd></>
                )}
                {selectedOrder.finalPrice != null && (
                  <><dt className="text-muted-foreground">Final Price</dt><dd>{String(selectedOrder.finalPrice)}</dd></>
                )}
              </dl>
            </div>

            {/* Design Notes */}
            {selectedOrder.designNotes && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Design Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedOrder.designNotes}</p>
              </div>
            )}

            {/* Measurements */}
            {selectedOrder.measurements && Object.keys(selectedOrder.measurements).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Measurements</h4>
                <dl className="grid grid-cols-2 gap-1 text-sm">
                  {Object.entries(selectedOrder.measurements).map(([key, val]) => (
                    <React.Fragment key={key}>
                      <dt className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                      <dd>{String(val)}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              {NEXT_STATUS[selectedOrder.status] != null && (
                (() => {
                  const nextStatus = NEXT_STATUS[selectedOrder.status];
                  return (
                    <Button
                      className="flex-1 bg-brand-wine text-white hover:bg-brand-wine/90"
                      disabled={advancing}
                      onClick={() => { if (nextStatus) { void handleAdvance(selectedOrder.id, nextStatus); } }}
                    >
                      {advancing ? <Spinner size="sm" /> : null}
                      {nextStatus ? `Advance to ${statusLabel(nextStatus)}` : 'Advance'}
                    </Button>
                  );
                })()
              )}
              {['submitted', 'under_review', 'confirmed', 'in_production'].includes(selectedOrder.status) && (
                <Button
                  variant="outline"
                  disabled={advancing}
                  onClick={() => { void handleCancel(selectedOrder.id); }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
