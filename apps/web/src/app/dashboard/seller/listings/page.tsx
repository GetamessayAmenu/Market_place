"use client"
import {
  Alert, Badge, Button, Card, CardContent, EmptyState, Modal, Pagination, Select, Spinner,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@marketplace/ui';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(amount);
}

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${String(days)}d ago`;
  if (days < 30) return `${String(Math.floor(days / 7))}w ago`;
  return `${String(Math.floor(days / 30))}mo ago`;
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

// ─── Listing Row (Card View) ────────────────────────────────────────────────

interface ListingRowProps {
  listing: SellerListing;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onAction: (action: string, listing: SellerListing) => void;
}

function ListingRow({ listing, selected, onToggleSelect, onAction }: ListingRowProps) {
  return (
    <div className={`flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/30 ${selected ? 'border-primary bg-primary/5' : ''}`}>
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => { onToggleSelect(listing.id); }}
        className="h-4 w-4 shrink-0 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Select ${listing.title}`}
      />
      {/* Image */}
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {listing.primaryImageUrl ? (
          <img src={listing.primaryImageUrl} alt={listing.title} className="h-full w-full object-cover" />
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
          <span>{formatCurrency(listing.price)}</span>
          {listing.city && <span>· {listing.city}</span>}
          <span>· {listing.condition.replace('_', ' ')}</span>
          {listing._count?.favorites !== undefined && (
            <span>· {listing._count.favorites} fav{listing._count.favorites !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
      {/* Status */}
      <Badge variant={statusVariant(listing.status)}>{statusLabel(listing.status)}</Badge>
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
            <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => { onAction('sold', listing); }}>Mark Sold</Button>
            <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => { onAction('hide', listing); }}>Hide</Button>
          </>
        )}
        {listing.status === 'archived' && (
          <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => { onAction('publish', listing); }}>Unhide</Button>
        )}
        {(listing.status === 'expired' || listing.status === 'sold') && (
          <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => { onAction('renew', listing); }}>Renew</Button>
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MyListingsPage() {
  const user = useAuth((s) => s.user);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SellerListing | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const { data, isLoading, isError, refetch } = useMyListings(user?.id ?? '', {
    page, limit: 12,
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

  // Selection helpers
  const allSelected = listings.length > 0 && listings.every((l) => selectedIds.has(l.id));
  const selectableCount = listings.filter((l) => ['active', 'archived'].includes(l.status)).length;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(listings.map((l) => l.id)));
    }
  }

  const selectedListings = useMemo(() => listings.filter((l) => selectedIds.has(l.id)), [listings, selectedIds]);

  async function handleAction(action: string, listing: SellerListing) {
    setActionLoading(listing.id);
    setActionError(null);
    setActionSuccess(null);
    try {
      switch (action) {
        case 'sold': await markSold.mutateAsync(listing.id); setActionSuccess(`"${listing.title}" marked as sold.`); break;
        case 'hide': await hideListingMut.mutateAsync(listing.id); setActionSuccess(`"${listing.title}" hidden.`); break;
        case 'publish': await publishListing.mutateAsync(listing.id); setActionSuccess(`"${listing.title}" published.`); break;
        case 'renew': await renewListing.mutateAsync(listing.id); setActionSuccess(`"${listing.title}" renewed.`); break;
        case 'delete': setConfirmDelete(listing); setActionLoading(null); return;
      }
    } catch { setActionError(`Failed to ${action} listing.`); }
    setActionLoading(null);
  }

  async function handleDeleteConfirm() {
    if (!confirmDelete) return;
    setActionLoading(confirmDelete.id);
    try {
      await deleteListing.mutateAsync({ id: confirmDelete.id });
      setActionSuccess(`"${confirmDelete.title}" deleted.`);
      setConfirmDelete(null);
    } catch { setActionError('Failed to delete listing.'); }
    setActionLoading(null);
  }

  async function handleBulkAction(action: 'hide' | 'sold' | 'delete') {
    if (selectedListings.length === 0) return;
    setBulkLoading(true);
    setActionError(null);
    setActionSuccess(null);
    let successCount = 0;
    for (const listing of selectedListings) {
      try {
        switch (action) {
          case 'hide': await hideListingMut.mutateAsync(listing.id); break;
          case 'sold': await markSold.mutateAsync(listing.id); break;
          case 'delete': await deleteListing.mutateAsync({ id: listing.id }); break;
        }
        successCount++;
      } catch { /* continue with next */ }
    }
    if (successCount > 0) {
      setActionSuccess(`${String(successCount)} listing${successCount > 1 ? 's' : ''} ${action === 'delete' ? 'deleted' : action === 'hide' ? 'hidden' : 'marked sold'}.`);
    } else {
      setActionError(`Failed to ${action} selected listings.`);
    }
    setSelectedIds(new Set());
    setBulkLoading(false);
  }

  if (!user) {
    return <div className="py-8 text-center text-muted-foreground">Please log in to manage listings.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">My Listings</h1>
          <p className="text-muted-foreground">Manage and monitor all your listings.</p>
        </div>
        <Link href="/dashboard/seller/listings/create">
          <Button>Create Listing</Button>
        </Link>
      </div>

      {/* Filters + View Toggle */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-[200px] flex-1">
            <input
              type="text"
              placeholder="Search listings..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Select options={STATUS_FILTERS} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-40" />
          <Select options={SORT_OPTIONS} value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className="w-44" />
          {/* View Toggle */}
          <div className="flex rounded-md border overflow-hidden">
            <button
              type="button"
              onClick={() => { setViewMode('list'); }}
              className={`px-2.5 py-1.5 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-accent'}`}
              aria-label="List view"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('table'); }}
              className={`px-2.5 py-1.5 transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-accent'}`}
              aria-label="Table view"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {actionError && <Alert variant="error" onDismiss={() => { setActionError(null); }}>{actionError}</Alert>}
      {actionSuccess && <Alert variant="success" onDismiss={() => { setActionSuccess(null); }}>{actionSuccess}</Alert>}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
          <p className="text-sm font-medium">
            {String(selectedIds.size)} selected
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 text-xs"
              disabled={bulkLoading}
              onClick={() => { void handleBulkAction('hide'); }}
            >
              {bulkLoading ? <Spinner size="sm" /> : null} Hide
            </Button>
            <Button
              variant="outline"
              className="h-8 text-xs"
              disabled={bulkLoading}
              onClick={() => { void handleBulkAction('sold'); }}
            >
              {bulkLoading ? <Spinner size="sm" /> : null} Mark Sold
            </Button>
            <Button
              variant="outline"
              className="h-8 text-xs text-destructive hover:text-destructive"
              disabled={bulkLoading}
              onClick={() => { void handleBulkAction('delete'); }}
            >
              {bulkLoading ? <Spinner size="sm" /> : null} Delete
            </Button>
            <Button variant="ghost" className="h-8 text-xs" onClick={() => { setSelectedIds(new Set()); }}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Listings Content */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : isError ? (
        <div className="py-12 text-center">
          <p className="text-destructive">Failed to load listings.</p>
          <Button variant="outline" className="mt-3" onClick={() => { void refetch(); }}>Retry</Button>
        </div>
      ) : listings.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                </svg>
              }
              title="No listings found"
              description={search || status ? 'Try adjusting your filters.' : 'Create your first listing to start selling.'}
              action={
                !search && !status ? (
                  <Link href="/dashboard/seller/listings/create"><Button>Create Listing</Button></Link>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        /* ── List View ─────────────────────────────────────────────── */
        <div className="space-y-3">
          {/* Select All */}
          {selectableCount > 0 && (
            <label className="flex items-center gap-2 px-1 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-3.5 w-3.5 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
              Select all ({String(selectableCount)} actionable)
            </label>
          )}
          {listings.map((listing) => (
            <ListingRow
              key={listing.id}
              listing={listing}
              selected={selectedIds.has(listing.id)}
              onToggleSelect={toggleSelect}
              onAction={(action, l) => { void handleAction(action, l); }}
            />
          ))}
        </div>
      ) : (
        /* ── Table View ────────────────────────────────────────────── */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Select all listings"
                    />
                  </TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="hidden fashion-sm:table-cell">Condition</TableHead>
                  <TableHead className="hidden fashion-md:table-cell">Favorites</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden fashion-md:table-cell">Created</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing.id} data-state={selectedIds.has(listing.id) ? 'selected' : undefined}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(listing.id)}
                        onChange={() => { toggleSelect(listing.id); }}
                        className="h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Select ${listing.title}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                          {listing.primaryImageUrl ? (
                            <img src={listing.primaryImageUrl} alt={listing.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/dashboard/seller/listings/${listing.id}`} className="truncate text-sm font-medium hover:text-primary hover:underline">
                            {listing.title}
                          </Link>
                          {listing.city && <p className="truncate text-xs text-muted-foreground">{listing.city}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(listing.price)}</TableCell>
                    <TableCell className="hidden fashion-sm:table-cell text-sm capitalize">{listing.condition.replace('_', ' ')}</TableCell>
                    <TableCell className="hidden fashion-md:table-cell text-sm">{listing._count?.favorites ?? 0}</TableCell>
                    <TableCell><Badge variant={statusVariant(listing.status)}>{statusLabel(listing.status)}</Badge></TableCell>
                    <TableCell className="hidden fashion-md:table-cell text-sm text-muted-foreground">{relativeDate(listing.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/seller/listings/${listing.id}/edit`}>
                          <Button variant="ghost" className="h-7 w-7 p-0" aria-label="Edit">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Button>
                        </Link>
                        <Button variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => { void handleAction('delete', listing); }} aria-label="Delete">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <Modal open={true} onClose={() => { setConfirmDelete(null); }} title="Delete Listing">
          <div className="space-y-4 p-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete &quot;{confirmDelete.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setConfirmDelete(null); }}>Cancel</Button>
              <Button variant="destructive" onClick={() => { void handleDeleteConfirm(); }} disabled={actionLoading === confirmDelete.id}>
                {actionLoading === confirmDelete.id ? <span className="flex items-center gap-2"><Spinner size="sm" /> Deleting...</span> : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
