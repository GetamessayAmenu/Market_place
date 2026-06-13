"use client"
import { Alert, Badge, Button, Card, CardContent, Modal, Pagination, Select, Spinner } from '@marketplace/ui';
import Link from 'next/link';
import React, { useState } from 'react';

import useAuth from '../../../../hooks/useAuth';
import {
  useDeleteListing,
  useHideListing,
  useMarkSold,
  useMyListings,
  usePublishListing,
  useRenewListing,
} from '../../../../hooks/useSeller';
import type { SellerListing } from '../../../../lib/sellerApi';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'active': return 'success';
    case 'sold': return 'info';
    case 'pending_review': return 'warning';
    case 'rejected': return 'error';
    case 'expired': return 'error';
    case 'archived': return 'default';
    default: return 'default';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Active';
    case 'sold': return 'Sold';
    case 'pending_review': return 'Pending Review';
    case 'rejected': return 'Rejected';
    case 'expired': return 'Expired';
    case 'archived': return 'Hidden';
    case 'draft': return 'Draft';
    default: return status;
  }
}

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'sold', label: 'Sold' },
  { value: 'archived', label: 'Hidden' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'price_asc', label: 'Price: Low to High' },
];

// ─── Listing Row ─────────────────────────────────────────────────────────────

interface ListingRowProps {
  listing: SellerListing;
  onAction: (action: string, listing: SellerListing) => void;
}

function ListingRow({ listing, onAction }: ListingRowProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/30">
      {/* Image */}
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {listing.primaryImageUrl ? (
          <img
            src={listing.primaryImageUrl}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <Link href={`/dashboard/seller/listings/${listing.id}`} className="truncate text-sm font-medium hover:text-primary hover:underline">
          {listing.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>${listing.price.toLocaleString()}</span>
          {listing.city && <span>· {listing.city}</span>}
          <span>· {listing.condition.replace('_', ' ')}</span>
          {listing._count?.favorites !== undefined && (
            <span>· {listing._count.favorites} favorite{listing._count.favorites !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Status */}
      <Badge variant={statusVariant(listing.status)}>
        {statusLabel(listing.status)}
      </Badge>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Link href={`/dashboard/seller/listings/${listing.id}/edit`}>
          <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Edit listing">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>
        </Link>
        {listing.status === 'active' && (
          <>
            <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => { onAction('sold', listing); }}>
              Mark Sold
            </Button>
            <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => { onAction('hide', listing); }}>
              Hide
            </Button>
          </>
        )}
        {listing.status === 'archived' && (
          <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => { onAction('publish', listing); }}>
            Unhide
          </Button>
        )}
        {(listing.status === 'expired' || listing.status === 'sold') && (
          <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => { onAction('renew', listing); }}>
            Renew
          </Button>
        )}
        <Button variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => { onAction('delete', listing); }} aria-label="Delete listing">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </Button>
      </div>
    </div>
  );
}

// ─── My Listings Page ────────────────────────────────────────────────────────

export default function MyListingsPage() {
  const user = useAuth((s) => s.user);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SellerListing | null>(null);

  const { data, isLoading, isError, refetch } = useMyListings(user?.id ?? '', {
    page,
    limit: 12,
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
    sortBy,
  });

  const markSold = useMarkSold();
  const hideListingMut = useHideListing();
  const publishListing = usePublishListing();
  const renewListing = useRenewListing();
  const deleteListing = useDeleteListing();

  const listings = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;

  async function handleAction(action: string, listing: SellerListing) {
    setActionLoading(listing.id);
    setActionError(null);
    setActionSuccess(null);
    try {
      switch (action) {
        case 'sold':
          await markSold.mutateAsync(listing.id);
          setActionSuccess(`"${listing.title}" marked as sold.`);
          break;
        case 'hide':
          await hideListingMut.mutateAsync(listing.id);
          setActionSuccess(`"${listing.title}" hidden.`);
          break;
        case 'publish':
          await publishListing.mutateAsync(listing.id);
          setActionSuccess(`"${listing.title}" published.`);
          break;
        case 'renew':
          await renewListing.mutateAsync(listing.id);
          setActionSuccess(`"${listing.title}" renewed.`);
          break;
        case 'delete':
          setConfirmDelete(listing);
          setActionLoading(null);
          return;
      }
    } catch {
      setActionError(`Failed to ${action} listing.`);
    }
    setActionLoading(null);
  }

  async function handleDeleteConfirm() {
    if (!confirmDelete) return;
    setActionLoading(confirmDelete.id);
    try {
      await deleteListing.mutateAsync({ id: confirmDelete.id });
      setActionSuccess(`"${confirmDelete.title}" deleted.`);
      setConfirmDelete(null);
    } catch {
      setActionError('Failed to delete listing.');
    }
    setActionLoading(null);
  }

  if (!user) {
    return <div className="py-8 text-center text-muted-foreground">Please log in to manage listings.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Listings</h1>
          <p className="text-muted-foreground">Manage and monitor all your listings.</p>
        </div>
        <Link href="/dashboard/seller/create">
          <Button>Create Listing</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-[200px] flex-1">
            <input
              type="text"
              placeholder="Search listings..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Select
            options={STATUS_FILTERS}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="w-40"
          />
          <Select
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="w-44"
          />
        </CardContent>
      </Card>

      {/* Alerts */}
      {actionError && (
        <Alert variant="error" onDismiss={() => { setActionError(null); }}>
          {actionError}
        </Alert>
      )}
      {actionSuccess && (
        <Alert variant="success" onDismiss={() => { setActionSuccess(null); }}>
          {actionSuccess}
        </Alert>
      )}

      {/* Listings */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : isError ? (
        <div className="py-12 text-center">
          <p className="text-destructive">Failed to load listings.</p>
          <Button variant="outline" className="mt-3" onClick={() => { void refetch(); }}>
            Retry
          </Button>
        </div>
      ) : listings.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No listings found.</p>
          <Link href="/dashboard/seller/create">
            <Button className="mt-4">Create your first listing</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <ListingRow
              key={listing.id}
              listing={listing}
              onAction={(action, l) => { void handleAction(action, l); }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <Modal
          open={true}
          onClose={() => { setConfirmDelete(null); }}
          title="Delete Listing"
        >
          <div className="space-y-4 p-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete &quot;{confirmDelete.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setConfirmDelete(null); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => { void handleDeleteConfirm(); }}
                disabled={actionLoading === confirmDelete.id}
              >
                {actionLoading === confirmDelete.id ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" /> Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
