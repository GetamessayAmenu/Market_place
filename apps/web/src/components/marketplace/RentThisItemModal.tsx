'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Alert, Spinner, Badge } from '@marketplace/ui';
import useAuth from '../../hooks/useAuth';
import { apiGet, apiPost, getApiErrorMessage } from '../../lib/api';

export interface RentThisItemModalProps {
  open: boolean;
  onClose: () => void;
  listing: {
    id: string;
    title: string;
    price: number;
    currency?: string | undefined;
    rentalPricePerDay?: number | null | undefined;
    rentalDeposit?: number | null | undefined;
    minRentalDurationDays?: number | null | undefined;
    maxRentalDurationDays?: number | null | undefined;
    rentalPickupLocation?: string | null | undefined;
    rentalNotes?: string | null | undefined;
    primaryImageUrl?: string | null | undefined;
    images?: Array<{ url: string; isPrimary?: boolean }> | undefined;
    seller?: {
      id: string;
      displayName: string;
      avatarUrl?: string | null | undefined;
    } | null | undefined;
    city?: string | undefined;
  };
}

export default function RentThisItemModal({
  open,
  onClose,
  listing,
}: RentThisItemModalProps) {
  const router = useRouter();
  const user = useAuth((s) => s.user);

  const currency = listing.currency || 'ETB';
  const pricePerDay = Number(listing.rentalPricePerDay || 0);
  const deposit = Number(listing.rentalDeposit || 0);
  const minDays = Math.max(1, Number(listing.minRentalDurationDays || 1));
  const maxDays = listing.maxRentalDurationDays ? Number(listing.maxRentalDurationDays) : null;
  const pickupLocation = listing.rentalPickupLocation || listing.city || 'Direct pickup from seller';
  const imageUrl = listing.primaryImageUrl || listing.images?.[0]?.url || '/placeholder.png';

  // Dates state
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [renterNotes, setRenterNotes] = useState('');
  const [bookedRanges, setBookedRanges] = useState<Array<{ startDate: string; endDate: string }>>([]);

  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch booked date ranges when modal opens
  useEffect(() => {
    if (!open || !listing.id) return;
    apiGet<any>(`/rentals/booked-dates/${listing.id}`)
      .then((res) => {
        const ranges = Array.isArray(res) ? res : res?.data || [];
        setBookedRanges(ranges);
      })
      .catch((err) => {
        console.warn('Could not load booked dates for listing', err);
      });
  }, [open, listing.id]);

  // Duration in days calculation
  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T00:00:00Z');
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  const totalRentalFee = durationDays * pricePerDay;

  // Real-time server availability check whenever dates change
  useEffect(() => {
    if (!startDate || !endDate || durationDays < minDays) {
      setIsAvailable(null);
      setAvailabilityMessage(null);
      return;
    }

    if (maxDays && durationDays > maxDays) {
      setIsAvailable(false);
      setAvailabilityMessage(`Maximum rental duration is ${maxDays} days.`);
      return;
    }

    let isMounted = true;
    setCheckingAvailability(true);
    setAvailabilityMessage(null);

    apiGet<{ available: boolean; reason?: string }>(`/rentals/availability/${listing.id}`, {
      startDate,
      endDate,
    })
      .then((res) => {
        if (!isMounted) return;
        if (res.available) {
          setIsAvailable(true);
          setAvailabilityMessage(null);
        } else {
          setIsAvailable(false);
          setAvailabilityMessage(res.reason || 'These dates are no longer available. Please select different dates.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setIsAvailable(false);
        const msg = getApiErrorMessage(err, 'These dates are no longer available. Please select different dates.');
        setAvailabilityMessage(msg);
      })
      .finally(() => {
        if (isMounted) setCheckingAvailability(false);
      });

    return () => {
      isMounted = false;
    };
  }, [startDate, endDate, durationDays, listing.id, minDays, maxDays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push(`/login?redirect=/products/${listing.id}`);
      return;
    }

    if (!startDate || !endDate) {
      setSubmitError('Please select both a start date and return date.');
      return;
    }

    if (durationDays < minDays) {
      setSubmitError(`Minimum rental duration is ${minDays} day${minDays > 1 ? 's' : ''}.`);
      return;
    }

    if (maxDays && durationDays > maxDays) {
      setSubmitError(`Maximum rental duration is ${maxDays} days.`);
      return;
    }

    if (isAvailable === false) {
      setSubmitError(availabilityMessage || 'These dates are no longer available. Please select different dates.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await apiPost('/rentals', {
        listingId: listing.id,
        startDate,
        endDate,
        renterNotes: renterNotes.trim() || undefined,
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
        router.push('/dashboard/rentals');
      }, 1200);
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to submit rental request. Please try again.');
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Request to Rent" size="lg">
      {submitSuccess ? (
        <div className="py-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Rental Request Sent!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your request has been submitted to {listing.seller?.displayName || 'the seller'}. You will be notified when they accept.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Item & Seller Card */}
          <div className="flex gap-4 p-3 rounded-lg border bg-muted/30">
            <img
              src={imageUrl}
              alt={listing.title}
              className="h-20 w-20 rounded-md object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm truncate">{listing.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Seller: <span className="font-medium text-foreground">{listing.seller?.displayName || 'Fashion Designer'}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">
                  {currency} {pricePerDay.toLocaleString()} / day
                </Badge>
                {deposit > 0 && (
                  <Badge variant="secondary">
                    Deposit: {currency} {deposit.toLocaleString()}
                  </Badge>
                )}
                <Badge variant="secondary">
                  Min: {minDays} day{minDays > 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>

          {/* Location & Instructions */}
          <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/20 p-3 rounded-md">
            <div>
              <span className="font-semibold text-foreground">Pickup Location: </span>
              {pickupLocation}
            </div>
            {listing.rentalNotes && (
              <div>
                <span className="font-semibold text-foreground">Seller Notes: </span>
                {listing.rentalNotes}
              </div>
            )}
          </div>

          {/* Date Range Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
              Select Rental Dates
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Start Date (Pickup)</label>
                <input
                  type="date"
                  min={tomorrow}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Return Date</label>
                <input
                  type="date"
                  min={startDate || tomorrow}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Booked ranges notice */}
            {bookedRanges.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                ℹ️ Currently booked: {bookedRanges.map((r) => `${r.startDate} to ${r.endDate}`).join(', ')}
              </p>
            )}
          </div>

          {/* Availability Status Indicator */}
          {checkingAvailability && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
              <Spinner size="sm" />
              <span>Checking availability with seller schedule...</span>
            </div>
          )}

          {isAvailable === false && availabilityMessage && (
            <Alert variant="error" className="py-2 text-xs">
              {availabilityMessage}
            </Alert>
          )}

          {isAvailable === true && durationDays >= minDays && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
              <span>✓</span> Dates are available!
            </div>
          )}

          {/* Live Price Summary */}
          {durationDays > 0 && (
            <div className="rounded-lg border bg-card p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Rental Duration</span>
                <span className="font-medium text-foreground">{durationDays} day{durationDays !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Rental Fee ({currency} {pricePerDay.toLocaleString()} × {durationDays}d)</span>
                <span className="font-semibold text-foreground">{currency} {totalRentalFee.toLocaleString()}</span>
              </div>
              {deposit > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Security Deposit (Refundable upon return)</span>
                  <span className="font-medium text-foreground">{currency} {deposit.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-sm font-bold text-foreground">
                <span>Estimated Direct Arrangement Total</span>
                <span className="text-primary">{currency} {(totalRentalFee + deposit).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Renter Note Field */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Note for Seller <span className="font-normal text-muted-foreground">(Optional)</span>
            </label>
            <textarea
              value={renterNotes}
              onChange={(e) => setRenterNotes(e.target.value)}
              placeholder="e.g., Preferred pickup time, fitting questions, or event details..."
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          {/* Payment Transparency Notice (Requirement Section 6 & 15) */}
          <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-semibold">⚠️ Offline Payment Arrangement</p>
            <p className="text-[11px] leading-relaxed">
              Payment and security deposit are arranged directly between you and the seller. The platform does not process payments or collect automatic deposits.
            </p>
          </div>

          {submitError && (
            <Alert variant="error" className="py-2 text-xs">
              {submitError}
            </Alert>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || checkingAvailability || isAvailable === false || durationDays < minDays}
            >
              {isSubmitting ? 'Submitting Request...' : user ? 'Request to Rent' : 'Sign In to Request'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
