import { serverGet, serverPatch, serverPost } from './serverApi'

// ─── Shared types ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
}

// ─── Admin Listings ──────────────────────────────────────────────────────────

export interface AdminListing {
  id: string
  title: string
  slug: string
  description: string
  price: number
  currency: string
  condition: string
  status: string
  city?: string | null
  isFeatured: boolean
  primaryImageUrl?: string | null
  images?: { url: string; isPrimary: boolean }[]
  seller?: {
    id: string
    displayName?: string
    email?: string
  } | null
  category?: {
    id: string
    name: string
    slug: string
  } | null
  _count?: { favorites: number }
  createdAt: string
  updatedAt: string
}

export async function fetchAdminListings(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<AdminListing>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return serverGet<PaginatedResponse<AdminListing>>('/admin/listings' + qs)
}

export async function fetchAdminListing(id: string): Promise<ApiResponse<AdminListing>> {
  return serverGet<ApiResponse<AdminListing>>('/admin/listings/' + id)
}

export async function bulkListingAction(listingIds: string[], action: 'approve' | 'reject' | 'archive', reason?: string): Promise<ApiResponse<unknown>> {
  return serverPost<ApiResponse<unknown>>('/admin/listings/bulk-action', {
    listingIds,
    action,
    ...(reason ? { reason } : {}),
  })
}

// ─── Admin Users ─────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  displayName?: string
  email: string
  status: string
  roles?: string[]
  avatarUrl?: string | null
  emailVerifiedAt?: string | null
  phoneVerifiedAt?: string | null
  createdAt: string
  _count?: {
    listings: number
    reports: number
  }
}

export async function fetchAdminUsers(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<AdminUser>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return serverGet<PaginatedResponse<AdminUser>>('/admin/users' + qs)
}

export async function fetchAdminUser(id: string): Promise<ApiResponse<AdminUser>> {
  return serverGet<ApiResponse<AdminUser>>('/admin/users/' + id)
}

export async function fetchUserStats(): Promise<ApiResponse<Record<string, number>>> {
  return serverGet<ApiResponse<Record<string, number>>>('/admin/users/stats')
}

export async function adminUpdateUser(id: string, data: { status?: string; role?: string; reason?: string }): Promise<ApiResponse<AdminUser>> {
  return serverPatch<ApiResponse<AdminUser>>('/admin/users/' + id, data)
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface AdminReport {
  id: string
  reason: string
  description: string
  status: string
  targetType: string
  targetId?: string | null
  reporterId: string
  reportedUserId?: string | null
  listingId?: string | null
  resolution?: string | null
  resolutionNote?: string | null
  createdAt: string
  updatedAt: string
  reporter?: { id: string; displayName?: string; email?: string } | null
  listing?: { id: string; title: string } | null
}

export async function fetchReports(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<AdminReport>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return serverGet<PaginatedResponse<AdminReport>>('/reports' + qs)
}

export async function fetchReportStats(): Promise<ApiResponse<Record<string, number>>> {
  return serverGet<ApiResponse<Record<string, number>>>('/reports/stats')
}

export async function fetchReport(id: string): Promise<ApiResponse<AdminReport>> {
  return serverGet<ApiResponse<AdminReport>>('/reports/' + id)
}

export async function setReportUnderReview(id: string): Promise<ApiResponse<AdminReport>> {
  return serverPatch<ApiResponse<AdminReport>>('/reports/' + id + '/review')
}

export async function resolveReport(id: string, resolution: 'resolved' | 'dismissed', resolutionNote?: string): Promise<ApiResponse<AdminReport>> {
  return serverPatch<ApiResponse<AdminReport>>('/reports/' + id + '/resolve', {
    resolution,
    ...(resolutionNote ? { resolutionNote } : {}),
  })
}

// ─── Verifications ───────────────────────────────────────────────────────────

export interface VerificationRequest {
  id: string
  userId: string
  type: string
  status: string
  documentUrl?: string | null
  notes?: string | null
  reviewerNotes?: string | null
  createdAt: string
  updatedAt: string
  user?: { id: string; displayName?: string; email?: string } | null
}

export async function fetchVerifications(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<VerificationRequest>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return serverGet<PaginatedResponse<VerificationRequest>>('/admin/verifications' + qs)
}

export async function reviewVerification(id: string, decision: 'approved' | 'rejected', notes?: string): Promise<ApiResponse<VerificationRequest>> {
  return serverPatch<ApiResponse<VerificationRequest>>('/admin/verifications/' + id, {
    decision,
    ...(notes ? { notes } : {}),
  })
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  users: { total: number; newInRange: number }
  listings: { total: number; active: number; pending: number; newInRange: number }
  reports: { total: number; pending: number }
  messaging: { conversations: number; messages: number }
}

export async function fetchDashboardStats(from?: string, to?: string): Promise<DashboardStats> {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString() ? '?' + params.toString() : ''
  return serverGet<DashboardStats>('/admin/analytics/dashboard' + qs)
}

export async function fetchListingsByStatus(): Promise<Record<string, number>> {
  return serverGet<Record<string, number>>('/admin/analytics/listings-by-status')
}

export async function fetchUsersByStatus(): Promise<Record<string, number>> {
  return serverGet<Record<string, number>>('/admin/analytics/users-by-status')
}

export interface TopCategory {
  id: string
  name: string
  slug: string
  listingCount: number
}

export async function fetchTopCategories(): Promise<TopCategory[]> {
  return serverGet<TopCategory[]>('/admin/analytics/top-categories')
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string
  actorId: string
  action: string
  resource: string
  resourceId?: string | null
  metadata?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
}

export async function fetchAuditLogs(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<AuditLog>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return serverGet<PaginatedResponse<AuditLog>>('/admin/audit-logs' + qs)
}
