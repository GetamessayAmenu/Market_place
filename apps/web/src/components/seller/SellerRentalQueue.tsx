'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Alert, Spinner, cn } from '@marketplace/ui';
import { apiGet, apiPost, getApiErrorMessage } from '../../lib/api';
import { findOrCreateConversation } from '../../lib/chatApi';

export interface RentalHistoryItem {
  id: string;
  previousStatus?: string | null;
  newStatus: string;
  action: string;
  notes?: string | null;
  changedBy?: {
    id: string;
    displayName: string;
  } | null;
  createdAt: string;
}

export interface RentalExtensionItem {
  id: string;
  previousEndDate: string;
  requestedEndDate: string;
  additionalDays: number;
  additionalFee: number;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED';
  reason?: string | null;
  createdAt: string;
}

export interface SellerRentalOrder {
  id: string;
  orderNumber: string;
  listingId?: string;
  productId?: string;
  listing: {
    id: string;
    title: string;
    images: string[];
    slug: string;
    rentalPricePerDay?: number | null;
    rentalDeposit?: number | null;
    rentalPickupLocation?: string | null;
    rentalNotes?: string | null;
  };
  renter: {
    id: string;
    displayName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  startDate: string;
  endDate: string;
  rentalDurationDays?: number;
  totalAmount: number;
  securityDeposit: number;
  dailyRate?: number;
  pickupLocation?: string | null;
  status: string;
  renterNotes?: string | null;
  rentalNotes?: string | null;
  suggestedStartDate?: string | null;
  suggestedEndDate?: string | null;
  suggestedBy?: string | null;
  declineReason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  histories?: RentalHistoryItem[];
  extensions?: RentalExtensionItem[];
  createdAt: string;
}

type TabType = 'all' | 'PENDING' | 'ACCEPTED' | 'ACTIVE' | 'RETURN_PENDING' | 'COMPLETED' | 'DECLINED_CANCELLED';

const TABS: { id: TabType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'PENDING', label: 'Pending Requests' },
  { id: 'ACCEPTED', label: 'Accepted / Ready' },
  { id: 'ACTIVE', label: 'Active Rentals' },
  { id: 'RETURN_PENDING', label: 'Return Pending' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'DECLINED_CANCELLED', label: 'Declined / Cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  REQUESTED: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  ACCEPTED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  APPROVED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  READY_FOR_PICKUP: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300',
  HANDOVER_PENDING: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300',
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  RETURN_PENDING: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
  RETURN_INITIATED: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
  RETURNED_PENDING_INSPECTION: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
  COMPLETED: 'bg-muted text-muted-foreground',
  DECLINED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
  CANCELLED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
  EXPIRED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
  DISPUTED: 'bg-rose-200 text-rose-900 dark:bg-rose-950 dark:text-rose-200',
};

export default function SellerRentalQueue() {
  const router = useRouter();
  const [orders, setOrders] = useState<SellerRentalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SellerRentalOrder | null>(null);

  // Action modals state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Suggest dates modal
  const [suggestModalOrder, setSuggestModalOrder] = useState<SellerRentalOrder | null>(null);
  const [suggestStartDate, setSuggestStartDate] = useState('');
  const [suggestEndDate, setSuggestEndDate] = useState('');
  const [suggestReason, setSuggestReason] = useState('');

  // Decline modal
  const [declineModalOrder, setDeclineModalOrder] = useState<SellerRentalOrder | null>(null);
  const [declineReason, setDeclineReason] = useState('Dates unavailable');
  const [declineNotes, setDeclineNotes] = useState('');

  // Cancel modal
  const [cancelModalOrder, setCancelModalOrder] = useState<SellerRentalOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<any>('/rentals/seller');
      const rawItems = Array.isArray(res) ? res : res?.data || res?.items || [];
      const mapped: SellerRentalOrder[] = rawItems.map((item: any) => ({
        id: item.id,
        orderNumber: item.orderNumber || `RNT-${item.id.slice(0, 8)}`,
        listingId: item.listingId || item.listing?.id,
        listing: {
          id: item.listingId || item.listing?.id,
          title: item.listing?.title || 'Ethiopian Fashion Item',
          images: item.listing?.images?.map((img: any) => typeof img === 'string' ? img : img.url) || [],
          slug: item.listing?.slug || '',
          rentalPricePerDay: item.listing?.rentalPricePerDay,
          rentalDeposit: item.listing?.rentalDeposit,
          rentalPickupLocation: item.listing?.rentalPickupLocation,
          rentalNotes: item.listing?.rentalNotes,
        },
        renter: {
          id: item.renterId || item.renter?.id,
          displayName: item.renter?.displayName || 'Customer',
          email: item.renter?.email || '',
          phone: item.renter?.phone || '',
          avatarUrl: item.renter?.avatarUrl,
        },
        startDate: item.startDate ? item.startDate.split('T')[0] : '',
        endDate: item.endDate ? item.endDate.split('T')[0] : '',
        rentalDurationDays: item.rentalDurationDays || 1,
        totalAmount: Number(item.rentalFee || item.totalAmount || 0),
        securityDeposit: Number(item.securityDeposit || 0),
        dailyRate: Number(item.dailyRate || 0),
        pickupLocation: item.pickupLocation || item.listing?.rentalPickupLocation || 'Seller store',
        status: item.status,
        renterNotes: item.renterNotes,
        rentalNotes: item.rentalNotes,
        suggestedStartDate: item.suggestedStartDate ? item.suggestedStartDate.split('T')[0] : null,
        suggestedEndDate: item.suggestedEndDate ? item.suggestedEndDate.split('T')[0] : null,
        suggestedBy: item.suggestedBy,
        declineReason: item.declineReason,
        cancelledBy: item.cancelledBy,
        cancelledAt: item.cancelledAt,
        histories: item.histories || [],
        extensions: item.extensions || [],
        createdAt: item.createdAt || new Date().toISOString(),
      }));
      setOrders(mapped);
    } catch (error) {
      console.error('Failed to load rentals:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // Tab filtering
  const filterByTab = (order: SellerRentalOrder, tab: TabType) => {
    if (tab === 'all') return true;
    if (tab === 'PENDING') return order.status === 'PENDING' || order.status === 'REQUESTED';
    if (tab === 'ACCEPTED') return order.status === 'ACCEPTED' || order.status === 'APPROVED' || order.status === 'READY_FOR_PICKUP' || order.status === 'HANDOVER_PENDING';
    if (tab === 'ACTIVE') return order.status === 'ACTIVE';
    if (tab === 'RETURN_PENDING') return order.status === 'RETURN_PENDING' || order.status === 'RETURN_INITIATED' || order.status === 'RETURNED_PENDING_INSPECTION';
    if (tab === 'COMPLETED') return order.status === 'COMPLETED';
    if (tab === 'DECLINED_CANCELLED') return order.status === 'DECLINED' || order.status === 'CANCELLED' || order.status === 'EXPIRED' || order.status === 'DISPUTED';
    return true;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesTab = filterByTab(order, activeTab);
    if (!matchesTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.listing.title.toLowerCase().includes(q) ||
        order.renter.displayName.toLowerCase().includes(q) ||
        order.renter.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusCount = (tab: TabType) => {
    return orders.filter((o) => filterByTab(o, tab)).length;
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00Z');
    const now = new Date();
    const today = new Date(now.toISOString().split('T')[0] + 'T00:00:00Z');
    return Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Actions
  const handleAccept = async (orderId: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await apiPost(`/rentals/${orderId}/accept`);
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'ACCEPTED' } : null));
      }
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to accept rental request.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenChat = async (order: SellerRentalOrder) => {
    try {
      const conv = await findOrCreateConversation(order.renter.id, {
        listingId: order.listing.id,
        rentalId: order.id,
      });
      const convId = (conv as any)?.id || (conv as any)?.data?.id;
      if (convId) {
        router.push(`/seller/messages?conversation=${convId}`);
      } else {
        router.push(`/seller/messages`);
      }
    } catch (err) {
      console.error('Failed to open chat conversation:', err);
      router.push(`/seller/messages`);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    setActionLoading(true);
    try {
      await apiPost(`/rentals/${orderId}/ready`);
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'READY_FOR_PICKUP' } : null));
      }
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to mark ready for pickup.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartRental = async (orderId: string) => {
    setActionLoading(true);
    try {
      await apiPost(`/rentals/${orderId}/start`);
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'ACTIVE' } : null));
      }
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to start rental.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReturn = async (orderId: string) => {
    setActionLoading(true);
    try {
      await apiPost(`/rentals/${orderId}/confirm-return`);
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null));
      }
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to confirm return.'));
    } finally {
      setActionLoading(false);
    }
  };

  const submitSuggestDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestModalOrder || !suggestStartDate || !suggestEndDate) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await apiPost(`/rentals/${suggestModalOrder.id}/suggest-dates`, {
        startDate: suggestStartDate,
        endDate: suggestEndDate,
        reason: suggestReason.trim() || undefined,
      });
      setSuggestModalOrder(null);
      await loadOrders();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to suggest dates.'));
    } finally {
      setActionLoading(false);
    }
  };

  const submitDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineModalOrder) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const finalReason = declineNotes.trim()
        ? `${declineReason}: ${declineNotes.trim()}`
        : declineReason;
      await apiPost(`/rentals/${declineModalOrder.id}/decline`, {
        reason: finalReason,
      });
      setDeclineModalOrder(null);
      await loadOrders();
      if (selectedOrder?.id === declineModalOrder.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'DECLINED', declineReason: finalReason } : null));
      }
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to decline rental.'));
    } finally {
      setActionLoading(false);
    }
  };

  const submitCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await apiPost(`/rentals/${cancelModalOrder.id}/cancel`, {
        reason: cancelReason.trim() || 'Cancelled by seller',
      });
      setCancelModalOrder(null);
      await loadOrders();
      if (selectedOrder?.id === cancelModalOrder.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
      }
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to cancel rental.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveExtension = async (extensionId: string) => {
    setActionLoading(true);
    try {
      await apiPost(`/rentals/extensions/${extensionId}/accept`);
      await loadOrders();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to approve extension.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineExtension = async (extensionId: string) => {
    setActionLoading(true);
    try {
      await apiPost(`/rentals/extensions/${extensionId}/decline`);
      await loadOrders();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to decline extension.'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Rental Requests & Bookings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review incoming rental requests, coordinate handovers, and confirm item returns.
          </p>
        </div>
      </div>

      {actionError && (
        <Alert variant="error" className="py-2.5">
          {actionError}
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-thin">
          {TABS.map((tab) => {
            const count = getStatusCount(tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                )}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.2 text-[10px] font-semibold',
                      activeTab === tab.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-muted-foreground'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[220px]">
          <input
            type="text"
            placeholder="Search by renter, order #, item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-3 pr-4 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            📅
          </div>
          <h3 className="text-base font-semibold text-foreground">No rental requests found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? 'No requests matched your search terms.'
              : 'When buyers request to rent your fashion pieces, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'PENDING' || order.status === 'REQUESTED';
            const isAccepted = order.status === 'ACCEPTED' || order.status === 'APPROVED';
            const isReady = order.status === 'READY_FOR_PICKUP' || order.status === 'HANDOVER_PENDING';
            const isActive = order.status === 'ACTIVE';
            const isReturnPending = order.status === 'RETURN_PENDING' || order.status === 'RETURN_INITIATED' || order.status === 'RETURNED_PENDING_INSPECTION';
            const daysLeft = isActive ? getDaysUntil(order.endDate) : null;
            const hasPendingExtension = order.extensions?.find((e) => e.status === 'PENDING');

            return (
              <div
                key={order.id}
                className="rounded-xl border bg-card p-5 hover:border-primary/40 transition-all shadow-sm space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Item & Renter details */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <img
                      src={order.listing.images[0] || '/placeholder.png'}
                      alt={order.listing.title}
                      className="h-16 w-16 rounded-lg object-cover flex-shrink-0 border"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground text-sm truncate">{order.listing.title}</h3>
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', STATUS_COLORS[order.status] || 'bg-muted text-foreground')}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {order.orderNumber}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div>
                          Renter: <span className="font-medium text-foreground">{order.renter.displayName}</span>
                        </div>
                        <div>
                          Dates: <span className="font-medium text-foreground">{order.startDate} → {order.endDate}</span> ({order.rentalDurationDays}d)
                        </div>
                        <div>
                          Fee: <span className="font-semibold text-foreground">{order.totalAmount.toLocaleString()} ETB</span>
                        </div>
                        {order.securityDeposit > 0 && (
                          <div>
                            Deposit: <span className="font-medium text-foreground">{order.securityDeposit.toLocaleString()} ETB</span>
                          </div>
                        )}
                      </div>

                      {/* Offline Payment Reminder */}
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Payment & deposit are arranged directly with the renter.
                      </p>

                      {/* Suggested dates alert */}
                      {order.suggestedStartDate && order.suggestedEndDate && isPending && (
                        <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] text-amber-800 dark:text-amber-300">
                          Dates suggested to renter: <span className="font-medium">{order.suggestedStartDate} → {order.suggestedEndDate}</span> (Awaiting renter response)
                        </div>
                      )}

                      {/* Active return countdown */}
                      {isActive && daysLeft !== null && (
                        <p className={cn('text-xs font-semibold', daysLeft < 0 ? 'text-destructive' : daysLeft <= 2 ? 'text-amber-600' : 'text-emerald-600')}>
                          {daysLeft < 0 ? `⚠️ Overdue by ${Math.abs(daysLeft)} day(s)` : daysLeft === 0 ? 'Due return today' : `Return in ${daysLeft} day(s)`}
                        </p>
                      )}

                      {/* Extension request alert */}
                      {hasPendingExtension && (
                        <div className="rounded-md bg-purple-500/10 border border-purple-500/20 p-2 text-xs text-purple-900 dark:text-purple-300 flex items-center justify-between gap-2">
                          <span>
                            Renter requested extension to <strong>{hasPendingExtension.requestedEndDate}</strong> (+{hasPendingExtension.additionalDays}d, +{hasPendingExtension.additionalFee} ETB)
                          </span>
                          <div className="flex gap-1.5 shrink-0">
                            <Button size="sm" onClick={() => handleApproveExtension(hasPendingExtension.id)}>Accept</Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeclineExtension(hasPendingExtension.id)}>Decline</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 lg:self-center shrink-0">
                    {isPending && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(order.id)}
                          disabled={actionLoading}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSuggestModalOrder(order);
                            setSuggestStartDate(order.startDate);
                            setSuggestEndDate(order.endDate);
                            setSuggestReason('');
                          }}
                        >
                          Suggest Dates
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setDeclineModalOrder(order);
                            setDeclineReason('Dates unavailable');
                            setDeclineNotes('');
                          }}
                        >
                          Decline
                        </Button>
                      </>
                    )}

                    {isAccepted && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleMarkReady(order.id)}>
                          Mark Ready
                        </Button>
                        <Button size="sm" onClick={() => handleStartRental(order.id)}>
                          Mark as Picked Up
                        </Button>
                      </>
                    )}

                    {isReady && (
                      <Button size="sm" onClick={() => handleStartRental(order.id)}>
                        Mark as Picked Up
                      </Button>
                    )}

                    {(isActive || isReturnPending) && (
                      <Button size="sm" onClick={() => handleConfirmReturn(order.id)}>
                        Confirm Return
                      </Button>
                    )}

                    <Button size="sm" variant="outline" onClick={() => handleOpenChat(order)}>
                      Open Chat
                    </Button>

                    <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && (
        <Modal
          open={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Rental Request: ${selectedOrder.orderNumber}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Item summary */}
            <div className="flex gap-3 p-3 rounded-lg border bg-muted/20">
              <img
                src={selectedOrder.listing.images[0] || '/placeholder.png'}
                alt={selectedOrder.listing.title}
                className="h-16 w-16 rounded-md object-cover border"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-foreground">{selectedOrder.listing.title}</h4>
                <p className="text-muted-foreground mt-0.5">Order ID: {selectedOrder.orderNumber}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', STATUS_COLORS[selectedOrder.status] || 'bg-muted text-foreground')}>
                    {selectedOrder.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-muted-foreground">Created: {new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Renter information */}
            <div className="p-3 rounded-lg border bg-card space-y-1.5">
              <h5 className="font-semibold text-foreground text-xs uppercase tracking-wide">Renter Details</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                <p>Name: <span className="font-medium text-foreground">{selectedOrder.renter.displayName}</span></p>
                <p>Email: <span className="font-medium text-foreground">{selectedOrder.renter.email}</span></p>
                {selectedOrder.renter.phone && (
                  <p>Phone: <span className="font-medium text-foreground">{selectedOrder.renter.phone}</span></p>
                )}
                <p>Pickup Location: <span className="font-medium text-foreground">{selectedOrder.pickupLocation}</span></p>
              </div>
              {selectedOrder.renterNotes && (
                <div className="mt-2 pt-2 border-t text-muted-foreground">
                  <span className="font-semibold text-foreground">Renter Note: </span>
                  {selectedOrder.renterNotes}
                </div>
              )}
            </div>

            {/* Pricing breakdown */}
            <div className="p-3 rounded-lg border bg-card space-y-1.5">
              <h5 className="font-semibold text-foreground text-xs uppercase tracking-wide">Rental Financials (Direct Arrangement)</h5>
              <div className="space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Rental Period: {selectedOrder.startDate} to {selectedOrder.endDate}</span>
                  <span className="font-medium text-foreground">{selectedOrder.rentalDurationDays} day(s)</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Rental Fee:</span>
                  <span className="font-semibold text-foreground">{selectedOrder.totalAmount.toLocaleString()} ETB</span>
                </div>
                {selectedOrder.securityDeposit > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Security Deposit (Offline returnable):</span>
                    <span className="font-medium text-foreground">{selectedOrder.securityDeposit.toLocaleString()} ETB</span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t text-sm font-bold text-foreground">
                  <span>Total Direct Arrangement:</span>
                  <span className="text-primary">{(selectedOrder.totalAmount + selectedOrder.securityDeposit).toLocaleString()} ETB</span>
                </div>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                ⚠️ All payments and deposits are handled directly between you and the renter off-platform.
              </p>
            </div>

            {/* Decline / Cancellation Reason if any */}
            {selectedOrder.declineReason && (
              <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive space-y-1">
                <p className="font-semibold">Decline Reason:</p>
                <p>{selectedOrder.declineReason}</p>
              </div>
            )}

            {/* Audit History Timeline */}
            {selectedOrder.histories && selectedOrder.histories.length > 0 && (
              <div className="p-3 rounded-lg border bg-card space-y-2">
                <h5 className="font-semibold text-foreground text-xs uppercase tracking-wide">Status History & Audit</h5>
                <div className="space-y-2">
                  {selectedOrder.histories.map((h) => (
                    <div key={h.id} className="flex items-start justify-between text-[11px] border-b pb-1.5 last:border-0 last:pb-0">
                      <div>
                        <span className="font-semibold text-foreground">{h.action.replace(/_/g, ' ')}</span>
                        {h.notes && <p className="text-muted-foreground">{h.notes}</p>}
                      </div>
                      <span className="text-muted-foreground shrink-0">{new Date(h.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal actions */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button size="sm" variant="outline" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleOpenChat(selectedOrder)}>
                Open Chat
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Suggest Dates Modal */}
      {suggestModalOrder && (
        <Modal
          open={Boolean(suggestModalOrder)}
          onClose={() => setSuggestModalOrder(null)}
          title="Suggest Alternative Dates"
          size="md"
        >
          <form onSubmit={submitSuggestDates} className="space-y-4 text-xs">
            <p className="text-muted-foreground">
              Propose different rental dates to <span className="font-semibold text-foreground">{suggestModalOrder.renter.displayName}</span> for {suggestModalOrder.listing.title}.
            </p>
            <div className="p-2.5 rounded bg-muted/40 text-muted-foreground">
              Requested dates: <span className="font-semibold text-foreground">{suggestModalOrder.startDate} to {suggestModalOrder.endDate}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">New Start Date</label>
                <input
                  type="date"
                  value={suggestStartDate}
                  onChange={(e) => setSuggestStartDate(e.target.value)}
                  required
                  className="w-full rounded border px-3 py-1.5 text-xs bg-background"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">New Return Date</label>
                <input
                  type="date"
                  min={suggestStartDate}
                  value={suggestEndDate}
                  onChange={(e) => setSuggestEndDate(e.target.value)}
                  required
                  className="w-full rounded border px-3 py-1.5 text-xs bg-background"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Reason / Note for Renter (Optional)</label>
              <textarea
                value={suggestReason}
                onChange={(e) => setSuggestReason(e.target.value)}
                placeholder="e.g., Item is currently rented until then, but available immediately after..."
                rows={2}
                className="w-full rounded border px-3 py-1.5 text-xs bg-background"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" size="sm" variant="outline" onClick={() => setSuggestModalOrder(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={actionLoading}>
                {actionLoading ? 'Sending...' : 'Send Suggested Dates'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Decline Modal */}
      {declineModalOrder && (
        <Modal
          open={Boolean(declineModalOrder)}
          onClose={() => setDeclineModalOrder(null)}
          title="Decline Rental Request"
          size="md"
        >
          <form onSubmit={submitDecline} className="space-y-4 text-xs">
            <p className="text-muted-foreground">
              Select a reason for declining this request from <span className="font-semibold text-foreground">{declineModalOrder.renter.displayName}</span>:
            </p>

            <div>
              <label className="block text-xs font-medium mb-1">Reason</label>
              <select
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full rounded border px-3 py-1.5 text-xs bg-background"
              >
                <option value="Dates unavailable">Dates unavailable</option>
                <option value="Item unavailable">Item unavailable</option>
                <option value="Already rented">Already rented</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Additional Note (Optional)</label>
              <textarea
                value={declineNotes}
                onChange={(e) => setDeclineNotes(e.target.value)}
                placeholder="Provide brief details..."
                rows={2}
                className="w-full rounded border px-3 py-1.5 text-xs bg-background"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" size="sm" variant="outline" onClick={() => setDeclineModalOrder(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="outline" className="text-destructive" disabled={actionLoading}>
                {actionLoading ? 'Declining...' : 'Confirm Decline'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Modal */}
      {cancelModalOrder && (
        <Modal
          open={Boolean(cancelModalOrder)}
          onClose={() => setCancelModalOrder(null)}
          title="Cancel Rental"
          size="md"
        >
          <form onSubmit={submitCancel} className="space-y-4 text-xs">
            <p className="text-muted-foreground">
              Are you sure you want to cancel rental {cancelModalOrder.orderNumber}?
            </p>
            <div>
              <label className="block text-xs font-medium mb-1">Cancellation Reason</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                rows={2}
                required
                className="w-full rounded border px-3 py-1.5 text-xs bg-background"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" size="sm" variant="outline" onClick={() => setCancelModalOrder(null)}>
                Back
              </Button>
              <Button type="submit" size="sm" variant="outline" className="text-destructive" disabled={actionLoading}>
                Confirm Cancellation
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
