import { apiDelete, apiGet, apiPatch, apiPost } from './api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ListingImage {
  id: string;
  url: string;
  cloudinaryPublicId: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ContactOptions {
  showPhone?: boolean;
  whatsapp?: string;
  telegram?: string;
  inAppMessaging?: boolean;
}

export interface SellerListing {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  status: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  isFeatured: boolean;
  images: ListingImage[];
  primaryImageUrl?: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  contactOptions?: ContactOptions | null;
  availableForPurchase?: boolean | null;
  availableForRent?: boolean | null;
  customOrderAvailable?: boolean | null;
  rentalPricePerDay?: number | null;
  rentalDeposit?: number | null;
  attributes?: Record<string, unknown> | null;
  _count?: {
    favorites: number;
  };
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
}

export interface SellerListingsResponse {
  success: boolean;
  data: SellerListing[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SingleListingResponse {
  success: boolean;
  data: SellerListing;
}

export interface SignedUploadParams {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadPreset?: string;
  transformation?: string;
}

export interface SellerStats {
  activeListings: number;
  soldListings: number;
  pendingListings: number;
  totalListings: number;
}

// ─── Listings API ────────────────────────────────────────────────────────────

export async function fetchMyListings(params?: Record<string, string | number | boolean | undefined>): Promise<SellerListingsResponse> {
  // The backend GET /listings supports sellerId filter; we pass it from the hook
  return apiGet<SellerListingsResponse>('/listings', params);
}

export async function fetchMyListing(id: string): Promise<SingleListingResponse> {
  return apiGet<SingleListingResponse>(`/listings/${id}`);
}

export async function createListing(data: Record<string, unknown>): Promise<SingleListingResponse> {
  return apiPost<SingleListingResponse>('/listings', data);
}

export async function updateListing(id: string, data: Record<string, unknown>): Promise<SingleListingResponse> {
  return apiPatch<SingleListingResponse>(`/listings/${id}`, data);
}

export async function deleteListing(id: string, hard = false): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/listings/${id}?hard=${String(hard)}`);
}

// ─── Listing Actions ─────────────────────────────────────────────────────────

export async function markListingSold(id: string): Promise<SingleListingResponse> {
  return apiPost<SingleListingResponse>(`/listings/${id}/sold`);
}

export async function renewListing(id: string): Promise<SingleListingResponse> {
  return apiPost<SingleListingResponse>(`/listings/${id}/renew`);
}

export async function hideListing(id: string): Promise<SingleListingResponse> {
  return apiPost<SingleListingResponse>(`/listings/${id}/hide`);
}

export async function publishListing(id: string): Promise<SingleListingResponse> {
  return apiPost<SingleListingResponse>(`/listings/${id}/publish`);
}

// ─── Upload API ──────────────────────────────────────────────────────────────

export async function getSignedUpload(count = 1): Promise<SignedUploadParams[]> {
  const res = await apiPost<SignedUploadParams[]>('/uploads/sign', { count });
  return res;
}

// ─── Seller Stats (client-computed from listings) ────────────────────────────

export function computeSellerStats(listings: SellerListing[]): SellerStats {
  return {
    activeListings: listings.filter((l) => l.status === 'active').length,
    soldListings: listings.filter((l) => l.status === 'sold').length,
    pendingListings: listings.filter((l) => l.status === 'pending_review').length,
    totalListings: listings.length,
  };
}
