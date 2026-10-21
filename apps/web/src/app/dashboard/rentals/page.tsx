'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Modal, Button, Alert, Spinner, Rating, cn } from '@marketplace/ui';
import { apiGet, apiPost, getApiErrorMessage } from '../../../lib/api';
import { findOrCreateConversation } from '../../../lib/chatApi';
import { createReview } from '../../../lib/marketplaceApi';

interface RentalHistoryItem {
  id: string;
  previousStatus?: string | null;
  newStatus: string;
  action: string;
  notes?: string | null;
  createdAt: string;
}

interface RentalExtensionItem {
  id: string;
  previousEndDate: string;
  requestedEndDate: string;
  additionalDays: number;
  additionalFee: number;
  status: 'PENDING' | 'REQUESTED' | 'APPROVED' | 'DECLINED' | 'CANCELLED';
  reason?: string | null;
  createdAt: string;
}

interface RenterRentalOrder {
  id: string;
  orderNumber: string;
  listingId?: string;
  listing: {
    id: string;
    title: string;
    images: string[];
    slug: string;
    rentalPricePerDay?: number | null;
    rentalDeposit?: number | null;
    rentalPickupLocation?: string | null;
  };
  seller: {
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
  isOverdue?: boolean;
  overdueDays?: number;
  penaltyDays?: number;
  penaltyFee?: number;
  dailyLateRate?: number;
  penaltyPaid?: boolean;
  penaltyPaidAt?: string | null;
  penaltyNotes?: string | null;
}

type TabType = 'all' | 'PENDING' | 'ACCEPTED' | 'ACTIVE' | 'RETURN_PENDING' | 'COMPLETED' | 'CANCELLED_DECLINED';

const TABS: { id: TabType; label: string }[] = [
  { id: 'all', label: 'All Rentals' },
  { id: 'PENDING', label: 'Pending Requests' },
  { id: 'ACCEPTED', label: 'Upcoming & Ready' },
  { id: 'ACTIVE', label: 'Active Rentals' },
  { id: 'RETURN_PENDING', label: 'Return Pending' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED_DECLINED', label: 'Cancelled / Declined' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  REQUESTED: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  ACCEPTED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  APPROVED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  READY_FOR_PICKUP: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300',
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  RETURN_PENDING: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
  RETURN_INITIATED: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
  COMPLETED: 'bg-muted text-muted-foreground',
  DECLINED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
  CANCELLED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
  EXPIRED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
  DISPUTED: 'bg-rose-200 text-rose-900 dark:bg-rose-950 dark:text-rose-200',
};

function RenterRentalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetOrderId = searchParams.get('orderId') || searchParams.get('rentalId') || searchParams.get('id');

  const [rentals, setRentals] = useState<RenterRentalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedRental, setSelectedRental] = useState<RenterRentalOrder | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Return Modal State
  const [returnModalOrder, setReturnModalOrder] = useState<RenterRentalOrder | null>(null);
  const [returnNotes, setReturnNotes] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  // Extension Modal State
  const [extensionModalOrder, setExtensionModalOrder] = useState<RenterRentalOrder | null>(null);
  const [newExtensionDate, setNewExtensionDate] = useState('');
  const [extensionReason, setExtensionReason] = useState('');

  // Review Modal State
  const [reviewModalOrder, setReviewModalOrder] = useState<RenterRentalOrder | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Cancel Modal State
  const [cancelModalOrder, setCancelModalOrder] = useState<RenterRentalOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const loadRentals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<any>('/rentals/my');
      const raw = Array.isArray(res) ? res : res?.data || res?.items || [];
      const mapped: RenterRentalOrder[] = raw.map((item: any) => ({
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
        },
        seller: {
          id: item.sellerId || item.seller?.id,
          displayName: item.seller?.displayName || 'Fashion Designer',
          email: item.seller?.email || '',
          phone: item.seller?.phone || '',
          avatarUrl: item.seller?.avatarUrl,
        },
        startDate: item.startDate ? item.startDate.split('T')[0] : '',
        endDate: item.endDate ? item.endDate.split('T')[0] : '',
        rentalDurationDays: item.rentalDurationDays || (item.startDate && item.endDate ? Math.max(1, Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24))) : 1),
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
        extensions: (item.extensions || []).map((ext: any) => ({
          id: ext.id,
          previousEndDate: ext.previousEndDate || item.endDate,
          requestedEndDate: ext.newEndDate ? ext.newEndDate.split('T')[0] : (ext.requestedEndDate || ''),
          additionalDays: ext.additionalDays,
          additionalFee: Number(ext.additionalCost ?? ext.additionalFee ?? 0),
          status: ext.status,
          reason: ext.reason,
          createdAt: ext.createdAt,
        })),
        createdAt: item.createdAt || new Date().toISOString(),
        isOverdue: item.isOverdue,
        overdueDays: item.overdueDays,
        penaltyDays: item.penaltyDays || item.overdueDays,
        penaltyFee: Number(item.penaltyFee || 0),
        dailyLateRate: Number(item.dailyLateRate || item.dailyRate || item.listing?.rentalPricePerDay || 0),
        penaltyPaid: Boolean(item.penaltyPaid),
        penaltyPaidAt: item.penaltyPaidAt,
        penaltyNotes: item.penaltyNotes,
      }));
      setRentals(mapped);
    } catch (err) {
      console.error('Failed to load rentals:', err);
      setRentals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRentals();
  }, [loadRentals]);

  // Auto-select and open rental details when orderId is provided in URL params
  useEffect(() => {
    if (!targetOrderId || rentals.length === 0) return;
    const match = rentals.find((r) => r.id === targetOrderId || r.orderNumber === targetOrderId);
    if (match) {
      setSelectedRental(match);
      setActiveTab('all');
    }
  }, [targetOrderId, rentals]);

  const filterByTab = (r: RenterRentalOrder, tab: TabType) => {
    if (tab === 'all') return true;
    if (tab === 'PENDING') return r.status === 'PENDING' || r.status === 'REQUESTED';
    if (tab === 'ACCEPTED') return r.status === 'ACCEPTED' || r.status === 'APPROVED' || r.status === 'READY_FOR_PICKUP';
    if (tab === 'ACTIVE') return r.status === 'ACTIVE';
    if (tab === 'RETURN_PENDING') return r.status === 'RETURN_PENDING' || r.status === 'RETURN_INITIATED';
    if (tab === 'COMPLETED') return r.status === 'COMPLETED';
    if (tab === 'CANCELLED_DECLINED') return r.status === 'CANCELLED' || r.status === 'DECLINED' || r.status === 'EXPIRED';
    return true;
  };

  const filteredRentals = rentals.filter((r) => {
    if (!filterByTab(r, activeTab)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.orderNumber.toLowerCase().includes(q) ||
        r.listing.title.toLowerCase().includes(q) ||
        r.seller.displayName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getDaysUntil = (dateString: string) => {
    const target = new Date(dateString + 'T00:00:00Z');
    const now = new Date();
    const today = new Date(now.toISOString().split('T')[0] + 'T00:00:00Z');
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Actions
  const handleOpenChat = async (rental: RenterRentalOrder) => {
    try {
      const conv = await findOrCreateConversation(rental.seller.id, {
        listingId: rental.listing.id,
        rentalId: rental.id,
      });
      const convId = (conv as any)?.id || (conv as any)?.data?.id;
      if (convId) {
        router.push(`/dashboard/messages?conversation=${convId}`);
      } else {
        router.push(`/dashboard/messages`);
      }
    } catch (err) {
      console.error('Failed to open conversation:', err);
      router.push(`/dashboard/messages`);
    }
  };

  const handleRespondDates = async (rentalId: string, accept: boolean) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await apiPost(`/rentals/${rentalId}/respond-dates`, { accept });
      await loadRentals();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to respond to suggested dates.'));
    } finally {
      setActionLoading(false);
    }
  };

  const openReturnModal = (rental: RenterRentalOrder) => {
    setReturnModalOrder(rental);
    setReturnNotes('');
  };

  const submitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalOrder) return;
    setReturnSubmitting(true);
    try {
      await apiPost(`/rentals/${returnModalOrder.id}/return`, {
        notes: returnNotes.trim() || undefined,
      });
      const orderId = returnModalOrder.id;
      setReturnModalOrder(null);
      await loadRentals();
      if (selectedRental?.id === orderId) {
        setSelectedRental((prev) => (prev ? { ...prev, status: 'RETURN_PENDING' } : null));
      }
      alert('Return recorded successfully! The seller has been notified to inspect the item and finalize deposit refund.');
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to report return.'));
    } finally {
      setReturnSubmitting(false);
    }
  };

  const submitCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder) return;
    setActionLoading(true);
    try {
      await apiPost(`/rentals/${cancelModalOrder.id}/cancel`, {
        reason: cancelReason.trim() || 'Cancelled by renter',
      });
      setCancelModalOrder(null);
      await loadRentals();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to cancel rental.'));
    } finally {
      setActionLoading(false);
    }
  };

  const submitExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extensionModalOrder || !newExtensionDate) return;
    setActionLoading(true);
    try {
      const currentEnd = new Date(extensionModalOrder.endDate);
      const newEnd = new Date(newExtensionDate);
      const additionalDays = Math.max(1, Math.ceil((newEnd.getTime() - currentEnd.getTime()) / (1000 * 60 * 60 * 24)));

      await apiPost(`/rentals/${extensionModalOrder.id}/extensions`, {
        newEndDate: newExtensionDate,
        requestedEndDate: newExtensionDate,
        additionalDays,
        reason: extensionReason.trim() || undefined,
      });
      setExtensionModalOrder(null);
      await loadRentals();
      alert('Extension request sent to seller! You will be notified when the seller responds.');
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to request extension.'));
    } finally {
      setActionLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalOrder) return;
    setReviewSubmitting(true);
    try {
      const payload: { listingId: string; rating: number; title?: string; body?: string } = {
        listingId: reviewModalOrder.listing.id,
        rating: reviewRating,
      };
      const trimmedTitle = reviewTitle.trim();
      if (trimmedTitle) payload.title = trimmedTitle;
      const trimmedBody = reviewBody.trim();
      if (trimmedBody) payload.body = trimmedBody;

      await createReview(payload);
      setReviewSuccess(true);
      setTimeout(() => {
        setReviewModalOrder(null);
        setReviewSuccess(false);
        setReviewTitle('');
        setReviewBody('');
      }, 1500);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to submit review.'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
            My Rentals
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track your active fashion rentals, return dates, extensions, and communicate with sellers.
          </p>
        </div>
        <Link
          href="/search?type=rent"
          className="text-xs font-medium text-primary hover:underline self-start sm:self-auto"
        >
          Browse more items →
        </Link>
      </div>

      {actionError && (
        <Alert variant="error" className="py-2.5">
          {actionError}
        </Alert>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total Bookings</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{rentals.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Active Rentals</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {rentals.filter((r) => r.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Return Due Soon</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {rentals.filter((r) => r.status === 'ACTIVE' && getDaysUntil(r.endDate) <= 2).length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {rentals.filter((r) => r.status === 'COMPLETED').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-thin">
          {TABS.map((tab) => {
            const count = rentals.filter((r) => filterByTab(r, tab.id)).length;
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

        <input
          type="text"
          placeholder="Search my rentals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-w-[200px]"
        />
      </div>

      {/* Rental items list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : filteredRentals.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            👗
          </div>
          <h3 className="text-base font-semibold text-foreground">No rentals found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery ? 'No rental orders matched your search.' : 'You have not made any rental requests yet.'}
          </p>
          <Link href="/search?type=rent">
            <Button size="sm" variant="outline" className="mt-2">
              Browse Rentable Outfits
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRentals.map((rental) => {
            const isPending = rental.status === 'PENDING' || rental.status === 'REQUESTED';
            const isAccepted = rental.status === 'ACCEPTED' || rental.status === 'APPROVED';
            const isReady = rental.status === 'READY_FOR_PICKUP';
            const isActive = rental.status === 'ACTIVE';
            const isReturnPending = rental.status === 'RETURN_PENDING' || rental.status === 'RETURN_INITIATED';
            const isCompleted = rental.status === 'COMPLETED';
            const daysLeft = isActive ? getDaysUntil(rental.endDate) : null;
            const hasPendingExtension = rental.extensions?.find((e) => e.status === 'PENDING' || e.status === 'REQUESTED');

            return (
              <div
                key={rental.id}
                className="rounded-xl border bg-card p-5 hover:border-primary/40 transition-all shadow-sm space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Item & details */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <img
                      src={rental.listing.images[0] || '/placeholder.png'}
                      alt={rental.listing.title}
                      className="h-16 w-16 rounded-lg object-cover flex-shrink-0 border"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/products/${rental.listing.id}`}
                          className="font-semibold text-foreground text-sm hover:underline truncate"
                        >
                          {rental.listing.title}
                        </Link>
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', STATUS_COLORS[rental.status] || 'bg-muted text-foreground')}>
                          {rental.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {rental.orderNumber}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div>
                          Seller: <span className="font-medium text-foreground">{rental.seller.displayName}</span>
                        </div>
                        <div>
                          Dates: <span className="font-medium text-foreground">{rental.startDate} → {rental.endDate}</span> ({rental.rentalDurationDays}d)
                        </div>
                        <div>
                          Rental Fee: <span className="font-semibold text-foreground">{rental.totalAmount.toLocaleString()} ETB</span>
                        </div>
                        {rental.securityDeposit > 0 && (
                          <div>
                            Deposit: <span className="font-medium text-foreground">{rental.securityDeposit.toLocaleString()} ETB</span>
                          </div>
                        )}
                      </div>

                      {/* Offline Payment Reminder */}
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Payment & deposit are arranged directly with the seller.
                      </p>

                      {/* Seller suggested dates */}
                      {rental.suggestedStartDate && rental.suggestedEndDate && isPending && (
                        <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-900 dark:text-amber-300 space-y-1.5">
                          <p className="font-semibold">
                            Seller suggested alternative dates: {rental.suggestedStartDate} – {rental.suggestedEndDate}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleRespondDates(rental.id, true)}
                              disabled={actionLoading}
                            >
                              Accept New Dates
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRespondDates(rental.id, false)}
                              disabled={actionLoading}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Active Return Countdown and Penalty display */}
                      {isActive && daysLeft !== null && (() => {
                        const isOverdue = daysLeft < 0;
                        const overdueDays = Math.abs(daysLeft);
                        const dailyRate =
                          rental.dailyLateRate ||
                          rental.dailyRate ||
                          (rental.listing.rentalPricePerDay ? Number(rental.listing.rentalPricePerDay) : 0);
                        const penaltyFee =
                          rental.penaltyFee && rental.penaltyFee > 0
                            ? rental.penaltyFee
                            : overdueDays * dailyRate;

                        if (isOverdue) {
                          return (
                            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive space-y-1 mt-1">
                              <div className="font-semibold flex flex-wrap items-center gap-1.5">
                                <span>⚠️ Overdue by {overdueDays} day(s)!</span>
                                <span className="text-foreground/80 font-normal">Late Penalty Fee:</span>
                                <span className="font-bold underline decoration-destructive/40 text-amber-800 dark:text-amber-300">
                                  {penaltyFee.toLocaleString()} ETB
                                </span>
                                <span className="text-[11px] font-normal text-muted-foreground">
                                  ({overdueDays}d × {dailyRate.toLocaleString()} ETB/day)
                                </span>
                              </div>
                              <p className="text-[11px] text-destructive/90">
                                According to rental terms, an overdue penalty is charged daily. Please coordinate return and settle the accrued penalty with the seller immediately.
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className={cn('text-xs font-semibold mt-1', daysLeft <= 2 ? 'text-amber-600' : 'text-emerald-600')}>
                            {daysLeft === 0
                              ? 'Your rental ends today! Please return to seller.'
                              : `Your rental ends in ${daysLeft} day(s) on ${rental.endDate}.`}
                          </div>
                        );
                      })()}

                      {/* Completed with settled penalty indicator */}
                      {rental.status === 'COMPLETED' && rental.penaltyFee && rental.penaltyFee > 0 && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                          ✓ Rental completed · Late penalty settled: {rental.penaltyFee.toLocaleString()} ETB ({rental.penaltyDays || 1}d)
                        </p>
                      )}

                      {/* Return pending indicator */}
                      {isReturnPending && (
                        <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                          You have marked the item as returned. Waiting for seller to confirm return.
                        </div>
                      )}

                      {/* Pending extension status */}
                      {hasPendingExtension && (
                        <div className="text-xs text-purple-600 font-medium">
                          Extension request pending seller approval: requested until {hasPendingExtension.requestedEndDate} (+{hasPendingExtension.additionalDays}d)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 lg:self-center shrink-0">
                    {isPending && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setCancelModalOrder(rental);
                          setCancelReason('');
                        }}
                      >
                        Cancel Request
                      </Button>
                    )}

                    {(isAccepted || isReady) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setCancelModalOrder(rental);
                          setCancelReason('');
                        }}
                      >
                        Cancel
                      </Button>
                    )}

                    {isActive && (
                      <>
                        <Button size="sm" onClick={() => openReturnModal(rental)}>
                          I Have Returned the Item
                        </Button>
                        {!hasPendingExtension && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setExtensionModalOrder(rental);
                              setNewExtensionDate('');
                              setExtensionReason('');
                            }}
                          >
                            Request Extension
                          </Button>
                        )}
                      </>
                    )}

                    {isCompleted && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setReviewModalOrder(rental);
                          setReviewRating(5);
                          setReviewTitle('');
                          setReviewBody('');
                        }}
                      >
                        Leave Review
                      </Button>
                    )}

                    <Button size="sm" variant="outline" onClick={() => handleOpenChat(rental)}>
                      Open Chat
                    </Button>

                    <Button size="sm" variant="outline" onClick={() => setSelectedRental(rental)}>
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
      {selectedRental && (
        <Modal
          open={Boolean(selectedRental)}
          onClose={() => setSelectedRental(null)}
          title={`Rental Details: ${selectedRental.orderNumber}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Item summary */}
            <div className="flex gap-3 p-3 rounded-lg border bg-muted/20">
              <img
                src={selectedRental.listing.images[0] || '/placeholder.png'}
                alt={selectedRental.listing.title}
                className="h-16 w-16 rounded-md object-cover border"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-foreground">{selectedRental.listing.title}</h4>
                <p className="text-muted-foreground mt-0.5">Order ID: {selectedRental.orderNumber}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', STATUS_COLORS[selectedRental.status] || 'bg-muted text-foreground')}>
                    {selectedRental.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-muted-foreground">Booked on: {new Date(selectedRental.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Seller & Pickup Info */}
            <div className="p-3 rounded-lg border bg-card space-y-1.5">
              <h5 className="font-semibold text-foreground text-xs uppercase tracking-wide">Seller & Pickup Location</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                <p>Seller: <span className="font-medium text-foreground">{selectedRental.seller.displayName}</span></p>
                <p>Email: <span className="font-medium text-foreground">{selectedRental.seller.email}</span></p>
                {selectedRental.seller.phone && (
                  <p>Phone: <span className="font-medium text-foreground">{selectedRental.seller.phone}</span></p>
                )}
                <p>Pickup Location: <span className="font-medium text-foreground">{selectedRental.pickupLocation}</span></p>
              </div>
            </div>

            {/* Direct arrangement financials */}
            <div className="p-3 rounded-lg border bg-card space-y-1.5">
              <h5 className="font-semibold text-foreground text-xs uppercase tracking-wide">Rental Financials (Direct Arrangement)</h5>
              <div className="space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Rental Period: {selectedRental.startDate} to {selectedRental.endDate}</span>
                  <span className="font-medium text-foreground">{selectedRental.rentalDurationDays} day(s)</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Rental Fee:</span>
                  <span className="font-semibold text-foreground">{selectedRental.totalAmount.toLocaleString()} ETB</span>
                </div>
                {selectedRental.securityDeposit > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Security Deposit (Refundable upon return):</span>
                    <span className="font-medium text-foreground">{selectedRental.securityDeposit.toLocaleString()} ETB</span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t text-sm font-bold text-foreground">
                  <span>Total Direct Arrangement:</span>
                  <span className="text-primary">{(selectedRental.totalAmount + selectedRental.securityDeposit).toLocaleString()} ETB</span>
                </div>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                ⚠️ Payment and security deposit are arranged directly between you and the seller.
              </p>
            </div>

            {/* Overdue & Penalty Breakdown if applicable */}
            {(Boolean(selectedRental.penaltyFee && selectedRental.penaltyFee > 0) || (selectedRental.endDate && new Date(selectedRental.endDate).getTime() < Date.now() && (selectedRental.status === 'ACTIVE' || selectedRental.status === 'RETURN_PENDING'))) && (() => {
              const daysLeft = Math.ceil((new Date(selectedRental.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const overdueDays = daysLeft < 0 ? Math.abs(daysLeft) : (selectedRental.penaltyDays || 1);
              const dailyRate = selectedRental.dailyLateRate || selectedRental.dailyRate || (selectedRental.listing.rentalPricePerDay ? Number(selectedRental.listing.rentalPricePerDay) : 0);
              const penaltyFee = selectedRental.penaltyFee && selectedRental.penaltyFee > 0 ? selectedRental.penaltyFee : overdueDays * dailyRate;

              return (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-destructive text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <span>⚠️ Overdue Penalty Terms</span>
                    </h5>
                    <span className="font-bold text-destructive text-sm">{penaltyFee.toLocaleString()} ETB</span>
                  </div>
                  <div className="space-y-1.5 text-xs bg-background/60 p-2.5 rounded border border-border/50">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Days Overdue:</span>
                        <p className="font-medium text-foreground">{overdueDays} day(s)</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Daily Late Rate:</span>
                        <p className="font-medium text-foreground">{dailyRate.toLocaleString()} ETB / day</p>
                      </div>
                    </div>
                    <div className="pt-1.5 border-t flex justify-between items-center">
                      <span className="text-muted-foreground">Settlement Status:</span>
                      <span className={cn('font-semibold', selectedRental.penaltyPaid ? 'text-emerald-600' : 'text-amber-600')}>
                        {selectedRental.penaltyPaid ? '✓ Paid & Verified by Seller' : '⚠️ Pending Settlement with Seller'}
                      </span>
                    </div>
                    {selectedRental.penaltyNotes && (
                      <p className="text-[11px] text-muted-foreground italic">Note: {selectedRental.penaltyNotes}</p>
                    )}
                  </div>
                  <p className="text-[11px] text-destructive/80">
                    Please coordinate return with the seller and settle the accrued late penalty fee upon item handover.
                  </p>
                </div>
              );
            })()}

            {/* Status History */}
            {selectedRental.histories && selectedRental.histories.length > 0 && (
              <div className="p-3 rounded-lg border bg-card space-y-2">
                <h5 className="font-semibold text-foreground text-xs uppercase tracking-wide">History & Audit</h5>
                <div className="space-y-2">
                  {selectedRental.histories.map((h) => (
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

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button size="sm" variant="outline" onClick={() => setSelectedRental(null)}>
                Close
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleOpenChat(selectedRental)}>
                Open Chat
              </Button>
              {selectedRental.status === 'ACTIVE' && (
                <Button
                  size="sm"
                  onClick={() => {
                    const toReturn = selectedRental;
                    setSelectedRental(null);
                    openReturnModal(toReturn);
                  }}
                >
                  Return Item
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Extension Modal */}
      {extensionModalOrder && (() => {
        const currentEnd = new Date(extensionModalOrder.endDate);
        const minDateStr = new Date(
          Math.max(currentEnd.getTime() + 86400000, Date.now() + 86400000)
        ).toISOString().split('T')[0];
        const newEnd = newExtensionDate ? new Date(newExtensionDate) : null;
        const additionalDays = newEnd && !isNaN(newEnd.getTime())
          ? Math.max(1, Math.ceil((newEnd.getTime() - currentEnd.getTime()) / (1000 * 60 * 60 * 24)))
          : 0;
        const dailyRate = Number(
          extensionModalOrder.dailyRate ||
          extensionModalOrder.listing.rentalPricePerDay ||
          0
        );
        const additionalFee = additionalDays * dailyRate;

        return (
          <Modal
            open={Boolean(extensionModalOrder)}
            onClose={() => setExtensionModalOrder(null)}
            title="Request Rental Extension"
            size="md"
          >
            <form onSubmit={submitExtension} className="space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border">
                <img
                  src={extensionModalOrder.listing.images[0] || '/placeholder.png'}
                  alt={extensionModalOrder.listing.title}
                  className="w-12 h-12 rounded object-cover border"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-foreground text-sm truncate">{extensionModalOrder.listing.title}</h4>
                  <p className="text-muted-foreground text-xs">
                    Current scheduled return: <span className="font-medium text-foreground">{extensionModalOrder.endDate}</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">New Requested Return Date</label>
                <input
                  type="date"
                  min={minDateStr}
                  value={newExtensionDate}
                  onChange={(e) => setNewExtensionDate(e.target.value)}
                  required
                  className="w-full rounded border px-3 py-2 text-xs bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Must be after your current return date ({extensionModalOrder.endDate}).
                </p>
              </div>

              {newExtensionDate && additionalDays > 0 && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Additional rental duration:</span>
                    <span className="font-semibold text-foreground">+{additionalDays} day(s)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Daily rental rate:</span>
                    <span className="font-semibold text-foreground">{dailyRate.toLocaleString()} ETB / day</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1.5 border-t border-primary/20">
                    <span className="font-medium text-foreground">Estimated Additional Fee:</span>
                    <span className="font-bold text-primary text-sm">+{additionalFee.toLocaleString()} ETB</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Once accepted by the seller, your booking return date is extended and this additional fee is payable directly to the seller upon return.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1">Reason for Extension (Optional)</label>
                <textarea
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="e.g., Event was rescheduled, need the outfit for a couple more days..."
                  rows={2}
                  className="w-full rounded border px-3 py-2 text-xs bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" size="sm" variant="outline" onClick={() => setExtensionModalOrder(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={actionLoading || !newExtensionDate}>
                  {actionLoading ? 'Submitting...' : 'Send Extension Request'}
                </Button>
              </div>
            </form>
          </Modal>
        );
      })()}

      {/* Return Item / Penalty Modal */}
      {returnModalOrder && (() => {
        const daysLeft = returnModalOrder.endDate
          ? Math.ceil((new Date(returnModalOrder.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null;
        const isOverdue = daysLeft !== null && daysLeft < 0;
        const overdueDays = isOverdue ? Math.abs(daysLeft) : 0;
        const dailyLateRate = Number(
          returnModalOrder.dailyLateRate ||
          returnModalOrder.dailyRate ||
          returnModalOrder.listing?.rentalPricePerDay ||
          0
        );
        const calculatedPenalty = returnModalOrder.penaltyFee && returnModalOrder.penaltyFee > 0
          ? returnModalOrder.penaltyFee
          : overdueDays * dailyLateRate;

        return (
          <Modal
            open={Boolean(returnModalOrder)}
            onClose={() => setReturnModalOrder(null)}
            title={isOverdue ? '⚠️ Return Overdue Rental & Review Penalty' : 'Confirm Rental Return Handover'}
            size="md"
          >
            <form onSubmit={submitReturn} className="space-y-4 text-xs">
              {/* Item Summary */}
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border">
                <img
                  src={returnModalOrder.listing.images[0] || '/placeholder.png'}
                  alt={returnModalOrder.listing.title}
                  className="w-12 h-12 rounded object-cover border"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-foreground text-sm truncate">{returnModalOrder.listing.title}</h4>
                  <div className="flex flex-wrap gap-x-3 text-muted-foreground text-[11px] mt-0.5">
                    <span>Seller: <strong className="text-foreground">{returnModalOrder.seller.displayName}</strong></span>
                    <span>Order: <strong className="font-mono text-foreground">{returnModalOrder.orderNumber}</strong></span>
                    <span>Scheduled Return: <strong className="text-foreground">{returnModalOrder.endDate}</strong></span>
                  </div>
                </div>
              </div>

              {/* Overdue Breakdown Banner */}
              {isOverdue ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-destructive flex items-center gap-1.5 text-xs">
                      <span>⚠️</span> Overdue by {overdueDays} Day(s)
                    </span>
                    <span className="font-bold text-destructive text-sm">
                      {calculatedPenalty.toLocaleString()} ETB Penalty
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground bg-background/60 p-2.5 rounded border border-destructive/20">
                    <div className="flex justify-between">
                      <span>Scheduled Return Date:</span>
                      <span className="font-medium text-foreground">{returnModalOrder.endDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overdue Duration:</span>
                      <span className="font-medium text-destructive">{overdueDays} day(s) late</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Late Penalty Rate:</span>
                      <span className="font-medium text-foreground">{dailyLateRate.toLocaleString()} ETB / day</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-destructive/20 font-semibold text-foreground">
                      <span>Total Accrued Penalty:</span>
                      <span className="text-destructive font-bold">{calculatedPenalty.toLocaleString()} ETB</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-destructive/90 space-y-1 bg-destructive/10 p-2 rounded">
                    <p className="font-semibold">Direct Settlement Obligation:</p>
                    <p>
                      According to marketplace rental terms, this late penalty must be paid directly to {returnModalOrder.seller.displayName} upon handover (via cash, Telebirr, or CBE) or deducted from your {returnModalOrder.securityDeposit.toLocaleString()} ETB security deposit.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-900 dark:text-emerald-300 space-y-1.5">
                  <p className="font-semibold flex items-center gap-1">
                    <span>✓</span> On-Time Return
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Please ensure the item is in good condition with all parts and accessories included. The seller will inspect the item and finalize release of your <strong>{returnModalOrder.securityDeposit.toLocaleString()} ETB</strong> deposit.
                  </p>
                </div>
              )}

              {/* Handover Notes */}
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Handover Notes / Return Condition (Optional)
                </label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Handed over directly at the seller's boutique in Bole. Clean condition with all original tags/accessories."
                  rows={2}
                  className="w-full rounded border px-3 py-2 text-xs bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" size="sm" variant="outline" onClick={() => setReturnModalOrder(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className={isOverdue ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                  disabled={returnSubmitting}
                >
                  {returnSubmitting
                    ? 'Submitting...'
                    : isOverdue
                    ? `Confirm Return & Acknowledge ${calculatedPenalty.toLocaleString()} ETB Penalty`
                    : 'Confirm Item Returned'}
                </Button>
              </div>
            </form>
          </Modal>
        );
      })()}

      {/* Cancel Request Modal */}
      {cancelModalOrder && (
        <Modal
          open={Boolean(cancelModalOrder)}
          onClose={() => setCancelModalOrder(null)}
          title="Cancel Rental Request"
          size="md"
        >
          <form onSubmit={submitCancel} className="space-y-4 text-xs">
            <p className="text-muted-foreground">
              Are you sure you want to cancel your rental request for {cancelModalOrder.listing.title}?
            </p>
            <div>
              <label className="block text-xs font-medium mb-1">Cancellation Reason</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                rows={2}
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

      {/* Review Modal */}
      {reviewModalOrder && (
        <Modal
          open={Boolean(reviewModalOrder)}
          onClose={() => setReviewModalOrder(null)}
          title="Review Your Rental Experience"
          size="md"
        >
          {reviewSuccess ? (
            <div className="py-6 text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                ✓
              </div>
              <h3 className="text-base font-bold text-foreground">Thank you for your review!</h3>
              <p className="text-xs text-muted-foreground">Your feedback helps the Ethiopian fashion community.</p>
            </div>
          ) : (
            <form onSubmit={submitReview} className="space-y-4 text-xs">
              <div>
                <p className="font-semibold text-foreground text-sm">{reviewModalOrder.listing.title}</p>
                <p className="text-muted-foreground">Rented from {reviewModalOrder.seller.displayName}</p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Your Rating</label>
                <Rating value={reviewRating} onChange={(val) => setReviewRating(val)} size="lg" />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g., Gorgeous dress, perfect fit!"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full rounded border px-3 py-1.5 text-xs bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Your Review</label>
                <textarea
                  placeholder="How was the quality, fit, and pickup/return experience?"
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  rows={3}
                  required
                  className="w-full rounded border px-3 py-1.5 text-xs bg-background"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" size="sm" variant="outline" onClick={() => setReviewModalOrder(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={reviewSubmitting}>
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}

export default function RenterRentalsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading rentals...</div>}>
      <RenterRentalsContent />
    </Suspense>
  );
}
