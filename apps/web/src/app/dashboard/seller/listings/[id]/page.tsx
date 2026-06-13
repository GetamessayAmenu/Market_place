"use client"
import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle, Modal, Skeleton, Spinner } from '@marketplace/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import useAuth from '../../../../../hooks/useAuth';
import {
  useDeleteListing,
  useHideListing,
  useMarkSold,
  useMyListing,
  usePublishListing,
  useRenewListing,
} from '../../../../../hooks/useSeller';

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

interface PageProps {
  params: { id: string };
}

export default function ListingDetailPage({ params }: PageProps) {
  const { id } = params;
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const { data: listing, isLoading, isError, refetch } = useMyListing(id);

  const markSold = useMarkSold();
  const hideMut = useHideListing();
  const publishMut = usePublishListing();
  const renewMut = useRenewListing();
  const deleteMut = useDeleteListing();

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  async function handleAction(action: string) {
    if (!listing) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      switch (action) {
        case 'sold':
          await markSold.mutateAsync(listing.id);
          setActionSuccess('Listing marked as sold.');
          break;
        case 'hide':
          await hideMut.mutateAsync(listing.id);
          setActionSuccess('Listing hidden.');
          break;
        case 'publish':
          await publishMut.mutateAsync(listing.id);
          setActionSuccess('Listing published.');
          break;
        case 'renew':
          await renewMut.mutateAsync(listing.id);
          setActionSuccess('Listing renewed.');
          break;
      }
      void refetch();
    } catch {
      setActionError('Action failed. Please try again.');
    }
    setActionLoading(false);
  }

  async function handleDelete() {
    setActionLoading(true);
    try {
      await deleteMut.mutateAsync({ id });
      router.push('/dashboard/seller/listings');
    } catch {
      setActionError('Failed to delete listing.');
      setActionLoading(false);
    }
  }

  if (!user) {
    return <div className="py-8 text-center text-muted-foreground">Please log in.</div>;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">Failed to load listing.</p>
        <Button variant="outline" className="mt-3" onClick={() => { void refetch(); }}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{listing.title}</h1>
            <Badge variant={statusVariant(listing.status)}>
              {statusLabel(listing.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Created {new Date(listing.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/seller/listings/${id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Link href="/dashboard/seller/listings">
            <Button variant="ghost">Back to listings</Button>
          </Link>
        </div>
      </div>

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

      {/* Images */}
      {listing.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Photos ({listing.images.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {listing.images
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((img, i) => (
                  <div key={img.id} className="relative overflow-hidden rounded-lg border bg-muted">
                    <div className="aspect-square">
                      <img src={img.url} alt={'Photo ' + String(i + 1)} className="h-full w-full object-cover" />
                    </div>
                    {img.isPrimary && (
                      <div className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Listing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Price</span>
              <p className="text-lg font-bold">${listing.price.toLocaleString()} {listing.currency}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Condition</span>
              <p className="text-sm capitalize">{listing.condition.replace('_', ' ')}</p>
            </div>
            {listing.city && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Location</span>
                <p className="text-sm">{listing.city}{listing.state ? ', ' + listing.state : ''}{listing.country ? ', ' + listing.country : ''}</p>
              </div>
            )}
            {listing.category && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Category</span>
                <p className="text-sm">{listing.category.name}</p>
              </div>
            )}
            {listing.expiresAt && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Expires</span>
                <p className="text-sm">{new Date(listing.expiresAt).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{listing.description}</p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Options */}
      {listing.contactOptions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {listing.contactOptions.showPhone && <Badge>Phone</Badge>}
              {listing.contactOptions.inAppMessaging && <Badge>In-App Messaging</Badge>}
              {listing.contactOptions.whatsapp && <Badge>WhatsApp: {listing.contactOptions.whatsapp}</Badge>}
              {listing.contactOptions.telegram && <Badge>Telegram: {listing.contactOptions.telegram}</Badge>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{listing._count?.favorites ?? 0}</p>
              <p className="text-xs text-muted-foreground">Favorites</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold capitalize">{listing.condition.replace('_', ' ')}</p>
              <p className="text-xs text-muted-foreground">Condition</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{listing.isFeatured ? 'Yes' : 'No'}</p>
              <p className="text-xs text-muted-foreground">Featured</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {listing.status === 'active' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => { void handleAction('sold'); }}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Spinner size="sm" /> : null}
                  Mark as Sold
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { void handleAction('hide'); }}
                  disabled={actionLoading}
                >
                  Hide Listing
                </Button>
              </>
            )}
            {listing.status === 'archived' && (
              <Button
                variant="outline"
                onClick={() => { void handleAction('publish'); }}
                disabled={actionLoading}
              >
                Publish Listing
              </Button>
            )}
            {(listing.status === 'expired' || listing.status === 'sold') && (
              <Button
                variant="outline"
                onClick={() => { void handleAction('renew'); }}
                disabled={actionLoading}
              >
                Renew Listing
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => { setShowDelete(true); }}
            >
              Delete Listing
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Modal */}
      {showDelete && (
        <Modal
          open={true}
          onClose={() => { setShowDelete(false); }}
          title="Delete Listing"
        >
          <div className="space-y-4 p-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete &quot;{listing.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowDelete(false); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => { void handleDelete(); }}
                disabled={actionLoading}
              >
                {actionLoading ? (
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
