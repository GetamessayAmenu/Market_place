import { apiGet, apiPost, apiPatch, apiDelete } from './api'

// ─── Custom Orders ────────────────────────────────────────────────────────────

export interface CustomOrderData {
  id: string
  listingId: string
  buyerId: string
  sellerId: string
  status: string
  measurements: Record<string, unknown> | null
  fabricChoice: string | null
  colorChoice: string | null
  designNotes: string | null
  referenceImages: string[]
  estimatedPrice: number | null
  finalPrice: number | null
  estimatedDays: number | null
  conversationId: string | null
  cancelledReason: string | null
  createdAt: string
  updatedAt: string
  listing?: { id: string; title: string; slug: string }
  buyer?: { id: string; displayName: string; avatarUrl: string | null }
  seller?: { id: string; displayName: string; avatarUrl: string | null }
}

export interface CreateCustomOrderPayload {
  listingId: string
  measurements?: Record<string, unknown>
  fabricChoice?: string
  colorChoice?: string
  designNotes?: string
  referenceImages?: string[]
  estimatedPrice?: number
  estimatedDays?: number
}

export async function createCustomOrder(payload: CreateCustomOrderPayload) {
  return apiPost<CustomOrderData>('/custom-orders', payload as unknown as Record<string, unknown>)
}

export async function getCustomOrder(id: string) {
  return apiGet<CustomOrderData>(`/custom-orders/${id}`)
}

export async function getMyCustomOrders(params?: { page?: number; limit?: number; status?: string; role?: string }) {
  const queryParams: Record<string, string | number | boolean | undefined> = {}
  if (params?.page) queryParams.page = params.page
  if (params?.limit) queryParams.limit = params.limit
  if (params?.status) queryParams.status = params.status
  if (params?.role) queryParams.role = params.role
  return apiGet<{ data: CustomOrderData[]; meta: { total: number; page: number; totalPages: number } }>('/custom-orders', queryParams)
}

export async function updateCustomOrderStatus(id: string, status: string, extra?: { finalPrice?: number; cancelledReason?: string }) {
  return apiPatch<CustomOrderData>(`/custom-orders/${id}/status`, { status, ...extra } as Record<string, unknown>)
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface ReviewData {
  id: string
  listingId: string
  reviewerId: string
  sellerId: string
  rating: number
  title: string | null
  body: string | null
  images: string[]
  verifiedPurchase: boolean
  helpfulCount: number
  createdAt: string
  reviewer?: { id: string; displayName: string; avatarUrl: string | null }
}

export interface ReviewSummaryData {
  averageRating: number
  totalReviews: number
  distribution: { stars: number; count: number }[]
}

export async function createReview(payload: { listingId: string; rating: number; title?: string; body?: string; images?: string[] }) {
  return apiPost<ReviewData>('/reviews', payload as unknown as Record<string, unknown>)
}

export async function getListReviews(listingId: string, params?: { page?: number; limit?: number }) {
  const queryParams: Record<string, string | number | boolean | undefined> = {}
  if (params?.page) queryParams.page = params.page
  if (params?.limit) queryParams.limit = params.limit
  return apiGet<{ data: ReviewData[]; meta: { total: number; page: number; totalPages: number } }>(`/reviews/listing/${listingId}`, queryParams)
}

export async function getListReviewSummary(listingId: string) {
  return apiGet<ReviewSummaryData>(`/reviews/listing/${listingId}/summary`)
}

export async function getSellerReviews(sellerId: string, params?: { page?: number; limit?: number }) {
  const queryParams: Record<string, string | number | boolean | undefined> = {}
  if (params?.page) queryParams.page = params.page
  if (params?.limit) queryParams.limit = params.limit
  return apiGet<{ data: ReviewData[]; meta: { total: number; page: number; totalPages: number } }>(`/reviews/seller/${sellerId}`, queryParams)
}

export async function deleteReview(id: string) {
  return apiDelete<{ deleted: boolean }>(`/reviews/${id}`)
}
