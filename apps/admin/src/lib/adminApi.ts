import { clientGet, clientPatch, clientPost, clientPut, clientDelete, buildQuery } from './clientApi'

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

// ─── Admin Categories ─────────────────────────────────────────────────────────

export interface AdminCategory {
  id: string
  name: string
  slug: string
  parentId: string | null
  type: string
  iconUrl: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export async function fetchAdminCategories(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<AdminCategory>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return clientGet<PaginatedResponse<AdminCategory>>('/admin/categories' + qs)
}

export async function fetchAdminCategory(id: string): Promise<ApiResponse<AdminCategory>> {
  return clientGet<ApiResponse<AdminCategory>>('/admin/categories/' + id)
}

// ─── Admin Attributes ─────────────────────────────────────────────────────────

export interface AdminAttribute {
  id: string
  name: string
  type: string
  values: string[]
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export async function fetchAdminAttributes(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<AdminAttribute>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return clientGet<PaginatedResponse<AdminAttribute>>('/admin/attributes' + qs)
}

export async function fetchAdminAttribute(id: string): Promise<ApiResponse<AdminAttribute>> {
  return clientGet<ApiResponse<AdminAttribute>>('/admin/attributes/' + id)
}

// ─── Admin Orders ─────────────────────────────────────────────────────────

export interface AdminOrder {
  id: string
  orderNumber: string
  type: string
  status: string
  paymentStatus: string
  buyerId: string
  sellerId: string
  listingId: string
  totalAmount: number
  currency: string
  rentalStartDate: string | null
  rentalEndDate: string | null
  rentalDeposit: number | null
  customOrderId: string | null
  measurements: any
  fabricChoice: string | null
  colorChoice: string | null
  designNotes: string | null
  shippingAddress: any
  trackingNumber: string | null
  paymentMethod: string | null
  paymentId: string | null
  cancelledAt: string | null
  cancelledReason: string | null
  refundedAt: string | null
  refundAmount: number | null
  refundReason: string | null
  confirmedAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  createdAt: string
  updatedAt: string
  buyer: {
    id: string
    displayName: string
    email: string
    phone: string | null
    avatarUrl: string | null
  }
  seller: {
    id: string
    displayName: string
    email: string
    phone: string | null
    avatarUrl: string | null
  }
  listing: {
    id: string
    title: string
    slug: string
    price: number
    currency: string
    images: any[]
  }
}

export async function fetchAdminOrders(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<AdminOrder>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return clientGet<PaginatedResponse<AdminOrder>>('/admin/orders' + qs)
}

export async function fetchAdminOrder(id: string): Promise<ApiResponse<AdminOrder>> {
  return clientGet<ApiResponse<AdminOrder>>('/admin/orders/' + id)
}

// ─── Admin Disputes ─────────────────────────────────────────────────────────

export interface AdminDisputeCategory {
  id: string
  name: string
  nameAm?: string | null
  slug: string
  description?: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminDisputeEvidence {
  id: string
  disputeId: string
  uploaderId: string
  fileUrl: string
  fileName?: string | null
  fileType?: string | null
  fileSize?: number | null
  cloudinaryPublicId?: string | null
  createdAt: string
  uploader?: {
    id: string
    displayName: string
    email: string
  }
}

export interface AdminDisputeHistory {
  id: string
  disputeId: string
  actorId: string
  action: string
  fromState?: any
  toState?: any
  note?: string | null
  createdAt: string
  actor?: {
    id: string
    displayName: string
    email: string
    avatarUrl?: string | null
  }
}

export interface AdminDisputeComment {
  id: string
  disputeId: string
  authorId: string
  content: string
  isInternal: boolean
  createdAt: string
  author: {
    id: string
    displayName: string
    email: string
    avatarUrl?: string | null
  }
}

export interface AdminDispute {
  id: string
  ticketNumber: string
  type: string
  status: 'open' | 'in_progress' | 'awaiting_response' | 'under_review' | 'waiting_for_info' | 'waiting_for_information' | 'resolved' | 'closed' | 'escalated'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  description: string
  reporterId: string
  reportedUserId?: string | null
  assignedAdminId?: string | null
  listingId?: string | null
  orderId?: string | null
  rentalId?: string | null
  customOrderId?: string | null
  conversationId?: string | null
  reportId?: string | null
  categoryId?: string | null
  resolutionOutcome?: string | null
  resolutionReason?: string | null
  resolutionNote?: string | null
  resolutionAction?: string | null
  resolvedById?: string | null
  escalatedById?: string | null
  closedById?: string | null
  reopenedById?: string | null
  resolvedAt?: string | null
  escalatedAt?: string | null
  closedAt?: string | null
  reopenedAt?: string | null
  lastActivityAt?: string | null
  createdAt: string
  updatedAt: string
  reporter?: {
    id: string
    displayName: string
    email: string
    avatarUrl?: string | null
    phone?: string | null
  }
  reportedUser?: {
    id: string
    displayName: string
    email: string
    avatarUrl?: string | null
    phone?: string | null
  }
  assignedAdmin?: {
    id: string
    displayName: string
    email: string
  } | null
  resolvedBy?: {
    id: string
    displayName: string
    email: string
  } | null
  escalatedBy?: {
    id: string
    displayName: string
    email: string
  } | null
  reopenedBy?: {
    id: string
    displayName: string
    email: string
  } | null
  category?: AdminDisputeCategory | null
  listing?: {
    id: string
    title: string
    slug: string
    price: number;
    currency?: string;
  } | null
  order?: {
    id: string
    orderNumber: string
    type: string
    status: string
    agreedPrice: number
  } | null
  rental?: {
    id: string
    orderNumber: string
    status: string
    startDate: string
    endDate: string
    totalAmount: number
  } | null
  customOrder?: {
    id: string
    status: string
    agreedPrice?: number | null
  } | null
  evidence?: AdminDisputeEvidence[]
  history?: AdminDisputeHistory[]
  comments?: AdminDisputeComment[]
  _count?: {
    comments: number
    evidence: number
  }
}

export interface AdminDisputeStats {
  total: number
  open: number
  underReview: number
  waitingForInfo: number
  escalated: number
  resolved: number
  closed: number
  highPriority: number
  avgResolutionHours: number
  repeatOffendersCount: number
  categories: Array<{ id: string; name: string; slug: string; count: number }>
}

export async function fetchAdminDisputes(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<AdminDispute>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  const res = await clientGet<any>('/disputes/admin/list' + qs)
  const payload = res.data ?? res
  const list = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : [])
  const total = payload.total ?? payload.meta?.total ?? list.length
  const page = payload.page ?? payload.meta?.page ?? 1
  const limit = payload.limit ?? payload.meta?.limit ?? 20
  const totalPages = Math.ceil(total / limit) || 1

  return {
    success: true,
    data: list,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  }
}

export async function fetchAdminDispute(id: string): Promise<ApiResponse<AdminDispute>> {
  const res = await clientGet<any>('/disputes/' + id)
  const data = res.data !== undefined ? res.data : res
  return { success: true, data }
}

export async function fetchAdminDisputeStats(): Promise<ApiResponse<AdminDisputeStats>> {
  const res = await clientGet<any>('/disputes/admin/stats')
  const data = res.data !== undefined ? res.data : res
  return { success: true, data }
}

export async function assignAdminDispute(id: string, assignedAdminId: string | null): Promise<ApiResponse<AdminDispute>> {
  const res = await clientPatch<any>('/disputes/' + id + '/assign', { assignedAdminId })
  return { success: true, data: res.data ?? res }
}

export async function updateAdminDisputeStatus(id: string, status: string): Promise<ApiResponse<AdminDispute>> {
  const res = await clientPatch<any>('/disputes/' + id + '/status', { status })
  return { success: true, data: res.data ?? res }
}

export async function requestInfoAdminDispute(id: string, targetUser: 'reporter' | 'respondent' | 'both', message: string): Promise<ApiResponse<unknown>> {
  const res = await clientPost<any>('/disputes/' + id + '/request-info', { targetUser, message })
  return { success: true, data: res.data ?? res }
}

export async function resolveAdminDispute(id: string, data: { resolutionOutcome: string; resolutionReason: string; resolutionNote?: string; resolutionAction?: string }): Promise<ApiResponse<AdminDispute>> {
  const res = await clientPatch<any>('/disputes/' + id + '/resolve', data)
  return { success: true, data: res.data ?? res }
}

export async function escalateAdminDispute(id: string, reason?: string): Promise<ApiResponse<AdminDispute>> {
  const res = await clientPatch<any>('/disputes/' + id + '/escalate', { reason })
  return { success: true, data: res.data ?? res }
}

export async function closeAdminDispute(id: string): Promise<ApiResponse<AdminDispute>> {
  const res = await clientPatch<any>('/disputes/' + id + '/close', {})
  return { success: true, data: res.data ?? res }
}

export async function reopenAdminDispute(id: string, reason: string): Promise<ApiResponse<AdminDispute>> {
  const res = await clientPatch<any>('/disputes/' + id + '/reopen', { reason })
  return { success: true, data: res.data ?? res }
}

export async function takeDisputeAction(id: string, data: { action: string; targetUserId?: string; listingId?: string; reason: string; durationDays?: number }): Promise<ApiResponse<unknown>> {
  const res = await clientPost<any>('/disputes/' + id + '/action', data)
  return { success: true, data: res.data ?? res }
}

export async function addAdminDisputeComment(id: string, data: { content: string; isInternal?: boolean }): Promise<ApiResponse<AdminDisputeComment>> {
  const res = await clientPost<any>('/disputes/' + id + '/comments', data)
  return { success: true, data: res.data ?? res }
}

export async function fetchAdminDisputeComments(id: string): Promise<ApiResponse<AdminDisputeComment[]>> {
  const res = await clientGet<any>('/disputes/' + id + '/comments')
  return { success: true, data: res.data ?? res }
}

// ── Dispute Categories Admin Helpers ──

export async function fetchDisputeCategories(): Promise<AdminDisputeCategory[]> {
  const res = await clientGet<any>('/dispute-categories')
  const payload = res.data ?? res
  return Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : [])
}

export async function createDisputeCategory(data: { name: string; nameAm?: string | undefined; slug: string; description?: string | undefined; sortOrder?: number | undefined; isActive?: boolean | undefined }): Promise<AdminDisputeCategory> {
  const res = await clientPost<any>('/dispute-categories', data)
  return res.data ?? res
}

export async function updateDisputeCategory(id: string, data: { name?: string | undefined; nameAm?: string | undefined; slug?: string | undefined; description?: string | undefined; sortOrder?: number | undefined; isActive?: boolean | undefined }): Promise<AdminDisputeCategory> {
  const res = await clientPatch<any>('/dispute-categories/' + id, data)
  return res.data ?? res
}

export async function deleteDisputeCategory(id: string): Promise<AdminDisputeCategory> {
  const res = await clientDelete<any>('/dispute-categories/' + id)
  return res.data ?? res
}

export async function convertReportToDispute(reportId: string, data?: { categoryId?: string; priority?: string; note?: string }): Promise<ApiResponse<AdminDispute>> {
  const res = await clientPost<any>('/reports/' + reportId + '/convert-to-dispute', data || {})
  return { success: true, data: res.data ?? res }
}

// ─── Admin Taxonomies ───────────────────────────────────────────────────────

export interface AdminTaxonomyCategory {
  id: string
  name: string
  nameAm: string | null
  slug: string
  slugAm: string | null
  parentId: string | null
  type: string
  description: string | null
  descriptionAm: string | null
  iconUrl: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  parent?: {
    id: string
    name: string
    nameAm: string | null
  }
  children?: {
    id: string
    name: string
    nameAm: string | null
  }[]
  _count?: {
    listings: number
  }
}

export interface AdminTaxonomyAttribute {
  id: string
  name: string
  nameAm: string | null
  type: string
  values: { value: string; valueAm?: string }[]
  description: string | null
  descriptionAm: string | null
  sortOrder: number
  isActive: boolean
  categoryIds?: string[]
  createdAt: string
  updatedAt: string
}

export interface AdminRegionalHub {
  id: string
  name: string
  nameAm: string | null
  description: string | null
  descriptionAm: string | null
  type: string
  city: string | null
  cityAm: string | null
  coordinates: string | null
  sortOrder: number
  isActive: boolean
  isPopular: boolean
  createdAt: string
  updatedAt: string
}

export async function fetchAdminTaxonomyCategories(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<AdminTaxonomyCategory>> {
  const qs = params && Object.keys(params).length > 0 
    ? '?' + new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
      ).toString() 
    : ''
  return clientGet<PaginatedResponse<AdminTaxonomyCategory>>('/admin/taxonomies/categories' + qs)
}

export async function fetchAdminTaxonomyCategory(id: string): Promise<ApiResponse<AdminTaxonomyCategory>> {
  return clientGet<ApiResponse<AdminTaxonomyCategory>>('/admin/taxonomies/categories/' + id)
}

export async function createAdminTaxonomyCategory(data: any): Promise<ApiResponse<AdminTaxonomyCategory>> {
  return clientPost<ApiResponse<AdminTaxonomyCategory>>('/admin/taxonomies/categories', data)
}

export async function updateAdminTaxonomyCategory(id: string, data: any): Promise<ApiResponse<AdminTaxonomyCategory>> {
  return clientPatch<ApiResponse<AdminTaxonomyCategory>>('/admin/taxonomies/categories/' + id, data)
}

export async function deleteAdminTaxonomyCategory(id: string): Promise<ApiResponse<AdminTaxonomyCategory>> {
  return clientDelete<ApiResponse<AdminTaxonomyCategory>>('/admin/taxonomies/categories/' + id)
}

export async function fetchAdminTaxonomyAttributes(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<AdminTaxonomyAttribute>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return clientGet<PaginatedResponse<AdminTaxonomyAttribute>>('/admin/taxonomies/attributes' + qs)
}

export async function fetchAdminTaxonomyAttribute(id: string): Promise<ApiResponse<AdminTaxonomyAttribute>> {
  return clientGet<ApiResponse<AdminTaxonomyAttribute>>('/admin/taxonomies/attributes/' + id)
}

export async function createAdminTaxonomyAttribute(data: any): Promise<ApiResponse<AdminTaxonomyAttribute>> {
  return clientPost<ApiResponse<AdminTaxonomyAttribute>>('/admin/taxonomies/attributes', data)
}

export async function updateAdminTaxonomyAttribute(id: string, data: any): Promise<ApiResponse<AdminTaxonomyAttribute>> {
  return clientPatch<ApiResponse<AdminTaxonomyAttribute>>('/admin/taxonomies/attributes/' + id, data)
}

export async function deleteAdminTaxonomyAttribute(id: string): Promise<ApiResponse<AdminTaxonomyAttribute>> {
  return clientDelete<ApiResponse<AdminTaxonomyAttribute>>('/admin/taxonomies/attributes/' + id)
}

export async function fetchAdminRegionalHubs(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<AdminRegionalHub>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return clientGet<PaginatedResponse<AdminRegionalHub>>('/admin/taxonomies/regional-hubs' + qs)
}

export async function fetchAdminRegionalHub(id: string): Promise<ApiResponse<AdminRegionalHub>> {
  return clientGet<ApiResponse<AdminRegionalHub>>('/admin/taxonomies/regional-hubs/' + id)
}

export async function createAdminRegionalHub(data: any): Promise<ApiResponse<AdminRegionalHub>> {
  return clientPost<ApiResponse<AdminRegionalHub>>('/admin/taxonomies/regional-hubs', data)
}

export async function updateAdminRegionalHub(id: string, data: any): Promise<ApiResponse<AdminRegionalHub>> {
  return clientPatch<ApiResponse<AdminRegionalHub>>('/admin/taxonomies/regional-hubs/' + id, data)
}

export async function deleteAdminRegionalHub(id: string): Promise<ApiResponse<AdminRegionalHub>> {
  return clientDelete<ApiResponse<AdminRegionalHub>>('/admin/taxonomies/regional-hubs/' + id)
}

export async function getRegionalHubsByProximity(lat: number, lng: number, radiusKm?: number): Promise<ApiResponse<any[]>> {
  const params = new URLSearchParams()
  params.append('lat', lat.toString())
  params.append('lng', lng.toString())
  if (radiusKm) params.append('radius', radiusKm.toString())
  return clientGet<ApiResponse<any[]>>('/admin/taxonomies/regional-hubs/proximity?' + params.toString())
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
  state?: string | null
  country?: string | null
  isFeatured: boolean
  availableForPurchase: boolean
  availableForRent: boolean
  customOrderAvailable: boolean
  rentalPricePerDay?: number | null
  rentalDeposit?: number | null
  rejectedReason?: string | null
  primaryImageUrl?: string | null
  images?: { url: string; isPrimary: boolean; cloudinaryPublicId?: string; id?: string }[]
  seller?: {
    id: string
    displayName?: string
    email?: string
    phone?: string | null
    location?: string | null
    emailVerifiedAt?: string | null
    phoneVerifiedAt?: string | null
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
  return clientGet<PaginatedResponse<AdminListing>>('/admin/listings' + qs)
}

export async function fetchAdminListing(id: string): Promise<ApiResponse<AdminListing>> {
  return clientGet<ApiResponse<AdminListing>>('/admin/listings/' + id)
}

export async function bulkListingAction(listingIds: string[], action: 'approve' | 'reject' | 'archive', reason?: string): Promise<ApiResponse<unknown>> {
  return clientPost<ApiResponse<unknown>>('/admin/listings/bulk-action', {
    listingIds,
    action,
    ...(reason ? { reason } : {}),
  })
}

export interface ListingRevision {
  id: string
  listingId: string
  sellerId: string
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  riskLevel: 'LOW' | 'SIGNIFICANT' | 'HIGH'
  changedFields: string[]
  changes: Record<string, any>
  previousData: Record<string, any>
  rejectionReason?: string | null
  createdAt: string
  updatedAt: string
  reviewedAt?: string | null
  seller?: { id: string; displayName?: string; email?: string } | null
  reviewedBy?: { id: string; displayName?: string; email?: string } | null
  listing?: AdminListing | null
}

export async function fetchListingHistory(id: string): Promise<AuditLog[]> {
  return clientGet<AuditLog[]>('/admin/listings/' + id + '/history')
}

export async function fetchPendingRevisions(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<ListingRevision>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return clientGet<PaginatedResponse<ListingRevision>>('/admin/listings/revisions/pending' + qs)
}

export async function fetchListingRevisions(listingId: string): Promise<ListingRevision[]> {
  return clientGet<ListingRevision[]>('/admin/listings/' + listingId + '/revisions')
}

export async function fetchRevision(revisionId: string): Promise<ListingRevision> {
  return clientGet<ListingRevision>('/admin/listings/revisions/' + revisionId)
}

export async function approveRevision(revisionId: string): Promise<AdminListing> {
  return clientPost<AdminListing>('/admin/listings/revisions/' + revisionId + '/approve')
}

export async function rejectRevision(revisionId: string, reason?: string): Promise<ListingRevision> {
  return clientPost<ListingRevision>('/admin/listings/revisions/' + revisionId + '/reject', {
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
  return clientGet<PaginatedResponse<AdminUser>>('/admin/users' + qs)
}

export async function fetchAdminUser(id: string): Promise<ApiResponse<AdminUser>> {
  return clientGet<ApiResponse<AdminUser>>('/admin/users/' + id)
}

export async function fetchUserStats(): Promise<ApiResponse<Record<string, number>>> {
  return clientGet<ApiResponse<Record<string, number>>>('/admin/users/stats')
}

export async function adminUpdateUser(id: string, data: { status?: string; role?: string; reason?: string }): Promise<ApiResponse<AdminUser>> {
  return clientPatch<ApiResponse<AdminUser>>('/admin/users/' + id, data)
}

export async function bulkUserAction(userIds: string[], action: 'activate' | 'suspend' | 'ban' | 'verify_email' | 'verify_phone' | 'change_role', reason?: string, newRole?: string): Promise<ApiResponse<unknown>> {
  return clientPost<ApiResponse<unknown>>('/admin/users/bulk-action', {
    userIds,
    action,
    ...(reason ? { reason } : {}),
    ...(newRole ? { newRole } : {}),
  })
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
  evidence?: string[]
  createdAt: string
  updatedAt: string
  reporter?: { id: string; displayName?: string; email?: string } | null
  listing?: { id: string; title: string } | null
  reportedUser?: { id: string; displayName?: string; email?: string; status?: string } | null
  resolvedBy?: { id: string; displayName?: string } | null
}

export async function fetchReports(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<AdminReport>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return clientGet<PaginatedResponse<AdminReport>>('/reports' + qs)
}

export async function fetchReportStats(): Promise<ApiResponse<Record<string, number>>> {
  return clientGet<ApiResponse<Record<string, number>>>('/reports/stats')
}

export async function fetchReport(id: string): Promise<ApiResponse<AdminReport>> {
  return clientGet<ApiResponse<AdminReport>>('/reports/' + id)
}

export async function setReportUnderReview(id: string): Promise<ApiResponse<AdminReport>> {
  return clientPatch<ApiResponse<AdminReport>>('/reports/' + id + '/review')
}

export async function resolveReport(id: string, resolution: 'resolved' | 'dismissed', resolutionNote?: string): Promise<ApiResponse<AdminReport>> {
  return clientPatch<ApiResponse<AdminReport>>('/reports/' + id + '/resolve', {
    resolution,
    ...(resolutionNote ? { resolutionNote } : {}),
  })
}

export async function setReportInvestigating(id: string): Promise<ApiResponse<AdminReport>> {
  return clientPatch<ApiResponse<AdminReport>>('/reports/' + id + '/investigate')
}

export async function closeReport(id: string, note?: string): Promise<ApiResponse<AdminReport>> {
  return clientPatch<ApiResponse<AdminReport>>('/reports/' + id + '/close', { note })
}

export async function fetchReportConversationHistory(id: string): Promise<any[]> {
  return clientGet<any[]>('/reports/' + id + '/conversation')
}

export async function fetchReportAuditLogs(id: string): Promise<AuditLog[]> {
  return clientGet<AuditLog[]>('/reports/' + id + '/audit-logs')
}

// ─── Verifications ───────────────────────────────────────────────────────────

export interface BusinessInfo {
  businessName: string
  businessType: string
  taxId?: string | null
  registrationNumber?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
}

export interface StoreInfo {
  storeName: string
  storeDescription?: string | null
  storeUrl?: string | null
  category?: string | null
}

export interface IdentityDocument {
  type: string
  documentNumber?: string | null
  expiryDate?: string | null
  frontUrl?: string | null
  backUrl?: string | null
}

export interface VerificationHistory {
  id: string
  action: string
  status: string
  notes?: string | null
  actorId: string
  actorName?: string | null
  createdAt: string
}

export interface VerificationRequest {
  id: string
  userId: string
  type: 'seller_verification' | 'identity_verification' | 'business_verification'
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'changes_requested'
  documentUrl?: string | null
  notes?: string | null
  reviewerNotes?: string | null
  createdAt: string
  updatedAt: string
  user?: { id: string; displayName?: string; email?: string } | null
  businessInfo?: BusinessInfo | null
  storeInfo?: StoreInfo | null
  identityDocument?: IdentityDocument | null
  documents?: { type: string; url: string }[]
  history?: VerificationHistory[]
}

export async function fetchVerifications(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<VerificationRequest>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return clientGet<PaginatedResponse<VerificationRequest>>('/admin/verifications' + qs)
}

export async function fetchVerification(id: string): Promise<ApiResponse<VerificationRequest>> {
  return clientGet<ApiResponse<VerificationRequest>>('/admin/verifications/' + id)
}

export async function reviewVerification(id: string, decision: 'approved' | 'rejected' | 'changes_requested', notes?: string): Promise<ApiResponse<VerificationRequest>> {
  return clientPatch<ApiResponse<VerificationRequest>>('/admin/verifications/' + id, {
    decision,
    ...(notes ? { notes } : {}),
  })
}

export async function updateVerificationStatus(id: string, status: 'under_review' | 'pending' | 'approved' | 'rejected' | 'changes_requested', notes?: string): Promise<ApiResponse<VerificationRequest>> {
  return clientPatch<ApiResponse<VerificationRequest>>('/admin/verifications/' + id + '/status', {
    status,
    ...(notes ? { notes } : {}),
  })
}

export async function fetchVerificationHistory(id: string): Promise<VerificationHistory[]> {
  return clientGet<VerificationHistory[]>('/admin/verifications/' + id + '/history')
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface KpiMetric {
  current: number
  previous: number
  pctChange: number
  absoluteChange: number
  trend: 'up' | 'down' | 'neutral'
}

export interface ActivityTimeSeriesPoint {
  date: string
  users: number
  buyers: number
  sellers: number
  listings: number
  views: number
  contacts: number
  orders: number
  gmv: number
}

export interface AnalyticsOverviewResponse {
  range: string
  dateFrom: string
  dateTo: string
  kpis: {
    totalUsers: KpiMetric
    activeBuyers: KpiMetric
    activeSellers: KpiMetric
    totalListings: KpiMetric
    activeListings: KpiMetric
    listingViews: KpiMetric
    sellerContacts: KpiMetric
    orders: KpiMetric
    gmv: KpiMetric
  }
  charts: ActivityTimeSeriesPoint[]
}

export interface BuyerAnalyticsResponse {
  acquisition: {
    totalBuyers: number
    newBuyers: number
    activeBuyers: number
    returningBuyers: number
    returningRatePct: number
  }
  engagement: {
    listingViews: number
    searches: number
    favorites: number
    sellerContacts: number
    chatStarts: number
    whatsappClicks: number
    phoneClicks: number
  }
  funnel: Array<{
    step: string
    count: number
    conversionPct: number
    dropoffPct: number
  }>
  retention: {
    sevenDayRetentionPct: number
    thirtyDayRetentionPct: number
    returningUserRatePct: number
  }
}

export interface TopSellerRow {
  id: string
  name: string
  email: string
  sellerType: string | null
  isVerified: boolean
  status: string
  listings: number
  views: number
  favorites: number
  contacts: number
  orders: number
  gmv: number
  conversionPct: number
  responseRate: number
}

export interface SellerAnalyticsResponse {
  metrics: {
    totalSellers: number
    newSellers: number
    activeSellers: number
    verifiedSellers: number
    suspendedSellers: number
    avgListingsPerSeller: number
  }
  healthIndicators: {
    growingSellers: number
    inactiveSellers: number
    highViewLowContactSellers: number
    highContactLowOrderSellers: number
    decliningSellers: number
  }
  topSellers: TopSellerRow[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface TopListingRow {
  id: string
  title: string
  slug: string
  price: number
  currency: string
  status: string
  categoryName: string
  sellerName: string
  views: number
  favorites: number
  contacts: number
  orders: number
  conversionPct: number
}

export interface LowPerformingListingRow {
  id: string
  title: string
  price: number
  views: number
  favorites: number
  orders: number
  issue: string
}

export interface CategoryBreakdownRow {
  id: string
  name: string
  slug: string
  listings: number
  views: number
  avgPrice: number
}

export interface ListingAnalyticsResponse {
  metrics: {
    totalListings: number
    activeListings: number
    pendingListings: number
    rejectedListings: number
    newListings: number
    draftListings: number
    expiredListings: number
    soldListings: number
  }
  topListings: TopListingRow[]
  lowPerformingListings: LowPerformingListingRow[]
  categoryBreakdown: CategoryBreakdownRow[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface MarketplaceHealthResponse {
  supply: {
    activeSellers: number
    activeListings: number
    newListings: number
    listingsPerSeller: number
  }
  demand: {
    activeBuyers: number
    searches: number
    listingViews: number
    sellerContacts: number
    orders: number
  }
  healthMetrics: {
    engagementRatePct: number
    viewToContactRatePct: number
    contactToOrderRatePct: number
    pctListingsReceivingContacts: number
    pctListingsReceivingOrders: number
    sellerResponseRatePct: number
    avgTimeToSellerResponseMinutes: number
    avgTimeToFirstContactHours: number
    avgOrderCompletionDays: number
  }
  funnel: Array<{
    step: string
    count: number
  }>
}

export interface SearchAnalyticsResponse {
  searchVolume: number
  searchesWithResultsCount: number
  searchesWithNoResultsCount: number
  searchToViewRatePct: number
  searchToContactRatePct: number
  popularSearches: Array<{ query: string; count: number; resultCount: number }>
  noResultSearches: Array<{ query: string; count: number; resultCount: number }>
}

export interface CommunicationAnalyticsResponse {
  chatConversationsStarted: number
  sellerContacts: number
  whatsappClicks: number
  phoneClicks: number
  chatResponseRatePct: number
  avgResponseTimeMinutes: number
  conversationsResultingInOrder: number
}

export interface OrderAnalyticsResponse {
  sales: {
    totalOrders: number
    completedOrders: number
    cancelledOrders: number
    totalValue: number
    avgOrderValue: number
  }
  rentals: {
    rentalRequests: number
    activeRentals: number
    completedRentals: number
    cancelledRentals: number
    totalValue: number
    conversionPct: number
  }
  customOrders: {
    customRequests: number
    acceptedRequests: number
    completedCustomOrders: number
    cancelledRequests: number
    totalValue: number
    conversionPct: number
  }
}

export interface ReportResponse {
  type: string
  columns: string[]
  rows: Record<string, any>[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

// Client API Helper functions
export async function fetchAnalyticsOverview(params?: Record<string, string | number | boolean | undefined>): Promise<AnalyticsOverviewResponse> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  const res = await clientGet<any>('/admin/analytics/overview' + qs)
  return (res?.data !== undefined ? res.data : res) as AnalyticsOverviewResponse
}

export async function fetchBuyerAnalytics(params?: Record<string, string | number | boolean | undefined>): Promise<BuyerAnalyticsResponse> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  const res = await clientGet<any>('/admin/analytics/buyers' + qs)
  return (res?.data !== undefined ? res.data : res) as BuyerAnalyticsResponse
}

export async function fetchSellerAnalytics(params?: Record<string, string | number | boolean | undefined>): Promise<SellerAnalyticsResponse> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  const res = await clientGet<any>('/admin/analytics/sellers' + qs)
  return (res?.data !== undefined ? res.data : res) as SellerAnalyticsResponse
}

export async function fetchListingAnalytics(params?: Record<string, string | number | boolean | undefined>): Promise<ListingAnalyticsResponse> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  const res = await clientGet<any>('/admin/analytics/listings' + qs)
  return (res?.data !== undefined ? res.data : res) as ListingAnalyticsResponse
}

export async function fetchMarketplaceHealth(params?: Record<string, string | number | boolean | undefined>): Promise<MarketplaceHealthResponse> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  const res = await clientGet<any>('/admin/analytics/marketplace' + qs)
  return (res?.data !== undefined ? res.data : res) as MarketplaceHealthResponse
}

export async function fetchSearchAnalytics(params?: Record<string, string | number | boolean | undefined>): Promise<SearchAnalyticsResponse> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  const res = await clientGet<any>('/admin/analytics/search' + qs)
  return (res?.data !== undefined ? res.data : res) as SearchAnalyticsResponse
}

export async function fetchCommunicationAnalytics(params?: Record<string, string | number | boolean | undefined>): Promise<CommunicationAnalyticsResponse> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  const res = await clientGet<any>('/admin/analytics/communication' + qs)
  return (res?.data !== undefined ? res.data : res) as CommunicationAnalyticsResponse
}

export async function fetchOrderAnalytics(params?: Record<string, string | number | boolean | undefined>): Promise<OrderAnalyticsResponse> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  const res = await clientGet<any>('/admin/analytics/orders' + qs)
  return (res?.data !== undefined ? res.data : res) as OrderAnalyticsResponse
}

export async function fetchAnalyticsReport(params?: Record<string, string | number | boolean | undefined>): Promise<ReportResponse> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  const res = await clientGet<any>('/admin/analytics/reports' + qs)
  return (res?.data !== undefined ? res.data : res) as ReportResponse
}

export function getAnalyticsReportExportUrl(params?: Record<string, string | number | boolean | undefined>): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return `${apiBase}/admin/analytics/reports/export${qs}`
}

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
  return clientGet<DashboardStats>('/admin/analytics/dashboard' + qs)
}

export async function fetchListingsByStatus(): Promise<Record<string, number>> {
  return clientGet<Record<string, number>>('/admin/analytics/listings-by-status')
}

export async function fetchUsersByStatus(): Promise<Record<string, number>> {
  return clientGet<Record<string, number>>('/admin/analytics/users-by-status')
}

export interface TopCategory {
  id: string
  name: string
  slug: string
  listingCount: number
}

export async function fetchTopCategories(): Promise<TopCategory[]> {
  return clientGet<TopCategory[]>('/admin/analytics/top-categories')
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string
  actorId: string
  actorType?: string
  action: string
  resource: string
  resourceId?: string | null
  description?: string | null
  metadata?: Record<string, unknown> | null
  changes?: Record<string, { before: any; after: any }> | null
  ipAddress?: string | null
  userAgent?: string | null
  status?: string
  createdAt: string
  actor?: {
    id: string
    displayName?: string | null
    email?: string
    role?: { id?: string; name?: string; description?: string } | null
  } | null
}

export async function fetchAuditLogs(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<AuditLog>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return clientGet<PaginatedResponse<AuditLog>>('/admin/audit-logs' + qs)
}

export async function fetchAuditLog(id: string): Promise<ApiResponse<AuditLog>> {
  return clientGet<ApiResponse<AuditLog>>('/admin/audit-logs/' + id)
}

export function getAuditLogsExportUrl(params?: Record<string, string | number | boolean | undefined>): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return `${apiBase}/admin/audit-logs/export${qs}`
}

// ─── Content Moderation ─────────────────────────────────────────────────────

export interface ModerationItem {
  id: string
  itemType: string
  itemId: string
  reviewId?: string | null
  content?: string | null
  imageUrl?: string | null
  cloudinaryPublicId?: string | null
  status: string
  rejectionReason?: string | null
  moderatedById?: string | null
  moderatedAt?: string | null
  isSpam: boolean
  spamScore?: number | null
  reportCount: number
  deletedAt?: string | null
  restoredAt?: string | null
  createdAt: string
  updatedAt: string
  review?: {
    id: string
    rating: number
    title?: string | null
    body?: string | null
    images: string[]
    verifiedPurchase: boolean
    helpfulCount: number
    moderationStatus: string
    moderationReason?: string | null
    createdAt: string
    listing?: {
      id: string
      title: string
      slug: string
    }
    reviewer?: {
      id: string
      displayName?: string
      email?: string
    }
    seller?: {
      id: string
      displayName?: string
      email?: string
    }
  }
  moderatedBy?: {
    id: string
    displayName?: string
    email?: string
  }
  reports?: Array<{
    id: string
    reason: string
    description?: string | null
    status: string
    createdAt: string
    reporter?: {
      id: string
      displayName?: string
      email?: string
    }
  }>
}

export async function fetchModerationItems(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<ModerationItem>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return clientGet<PaginatedResponse<ModerationItem>>('/admin/moderation' + qs)
}

export async function fetchModerationItem(id: string): Promise<ApiResponse<ModerationItem>> {
  return clientGet<ApiResponse<ModerationItem>>('/admin/moderation/' + id)
}

export async function fetchModerationStats(): Promise<ApiResponse<Record<string, number>>> {
  return clientGet<ApiResponse<Record<string, number>>>('/admin/moderation/stats')
}

export async function fetchModerationHistory(id: string): Promise<AuditLog[]> {
  return clientGet<AuditLog[]>('/admin/moderation/' + id + '/history')
}

export async function moderateItem(id: string, action: 'approve' | 'reject' | 'delete' | 'restore', reason?: string): Promise<ApiResponse<ModerationItem>> {
  const endpoint = `/admin/moderation/${id}/${action}`
  if (action === 'reject') {
    return clientPost<ApiResponse<ModerationItem>>(endpoint, { reason })
  }
  return clientPost<ApiResponse<ModerationItem>>(endpoint)
}

export async function moderateReview(reviewId: string, status: string, reason?: string, isSpam?: boolean): Promise<ApiResponse<unknown>> {
  return clientPost<ApiResponse<unknown>>(`/admin/moderation/review/${reviewId}`, {
    status,
    reason,
    isSpam,
  })
}

export async function toggleSpamFlag(id: string, isSpam: boolean, reason?: string): Promise<ApiResponse<ModerationItem>> {
  return clientPatch<ApiResponse<ModerationItem>>(`/admin/moderation/${id}/spam`, {
    isSpam,
    reason,
  })
}

export async function bulkModerationAction(itemIds: string[], action: string, reason?: string): Promise<ApiResponse<unknown>> {
  return clientPost<ApiResponse<unknown>>('/admin/moderation/bulk-action', {
    itemIds,
    action,
    reason,
  })
}

// ─── Homepage Content ─────────────────────────────────────────────────────────

export interface HomepageContent {
  id: string
  type: string
  title: string
  subtitle?: string | null
  description?: string | null
  imageUrl?: string | null
  cloudinaryPublicId?: string | null
  linkUrl?: string | null
  linkLabel?: string | null
  buttonText?: string | null
  backgroundColor?: string | null
  textColor?: string | null
  status: string
  sortOrder: number
  publishAt?: string | null
  unpublishAt?: string | null
  featuredListingId?: string | null
  featuredCategoryId?: string | null
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
  featuredListing?: {
    id: string
    title: string
    slug: string
    price: number
    currency: string
    seller?: {
      id: string
      displayName?: string
    }
    images?: Array<{ url: string; isPrimary: boolean }>
  } | null
  featuredCategory?: {
    id: string
    name: string
    slug: string
  } | null
  createdBy?: {
    id: string
    displayName?: string
    email?: string
  } | null
  updatedBy?: {
    id: string
    displayName?: string
    email?: string
  } | null
}

export async function fetchHomepageContents(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<HomepageContent>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return clientGet<PaginatedResponse<HomepageContent>>('/admin/homepage-content' + qs)
}

export async function fetchHomepageContent(id: string): Promise<ApiResponse<HomepageContent>> {
  return clientGet<ApiResponse<HomepageContent>>('/admin/homepage-content/' + id)
}

export async function fetchPublishedHomepageContent(): Promise<ApiResponse<HomepageContent[]>> {
  return clientGet<ApiResponse<HomepageContent[]>>('/admin/homepage-content/published')
}

export async function createHomepageContent(data: {
  type: string
  title: string
  subtitle?: string
  description?: string
  imageUrl?: string
  cloudinaryPublicId?: string
  linkUrl?: string
  linkLabel?: string
  buttonText?: string
  backgroundColor?: string
  textColor?: string
  status: string
  sortOrder?: number
  publishAt?: string
  unpublishAt?: string
  featuredListingId?: string
  featuredCategoryId?: string
}): Promise<ApiResponse<HomepageContent>> {
  return clientPost<ApiResponse<HomepageContent>>('/admin/homepage-content', data)
}

export async function updateHomepageContent(id: string, data: Partial<{
  type: string
  title: string
  subtitle?: string
  description?: string
  imageUrl?: string
  cloudinaryPublicId?: string
  linkUrl?: string
  linkLabel?: string
  buttonText?: string
  backgroundColor?: string
  textColor?: string
  status: string
  sortOrder?: number
  publishAt?: string
  unpublishAt?: string
  featuredListingId?: string
  featuredCategoryId?: string
}>): Promise<ApiResponse<HomepageContent>> {
  return clientPatch<ApiResponse<HomepageContent>>('/admin/homepage-content/' + id, data)
}

export async function deleteHomepageContent(id: string): Promise<ApiResponse<unknown>> {
  return clientDelete<ApiResponse<unknown>>('/admin/homepage-content/' + id)
}

export async function restoreHomepageContent(id: string): Promise<ApiResponse<unknown>> {
  return clientPost<ApiResponse<unknown>>('/admin/homepage-content/' + id + '/restore')
}

export async function reorderHomepageContent(itemIds: string[]): Promise<ApiResponse<unknown>> {
  return clientPost<ApiResponse<unknown>>('/admin/homepage-content/reorder', { itemIds })
}

// ─── Image Upload ───────────────────────────────────────────────────────────

export interface SignedUploadResponse {
  timestamp: number
  signature: string
  apiKey: string
  cloudName: string
  folder: string
  uploadPreset?: string
  transformation?: string
}

export async function signUpload(count: number = 1): Promise<SignedUploadResponse[]> {
  return clientPost<SignedUploadResponse[]>('/uploads/sign', { count })
}

export async function validateUpload(mimeType: string, bytes: number): Promise<{ valid: boolean }> {
  return clientPost<{ valid: boolean }>('/uploads/validate', { mimeType, bytes })
}

export async function uploadImageFile(file: File): Promise<{ url: string; publicId?: string }> {
  try {
    const signedUploads = await signUpload(1)
    const signedUpload = signedUploads[0]
    if (signedUpload && signedUpload.cloudName && signedUpload.signature) {
      const url = `https://api.cloudinary.com/v1_1/${signedUpload.cloudName}/image/upload`
      const body = new FormData()
      body.append('file', file)
      body.append('api_key', signedUpload.apiKey)
      body.append('timestamp', String(signedUpload.timestamp))
      body.append('signature', signedUpload.signature)
      body.append('folder', signedUpload.folder)
      if (signedUpload.transformation) {
        body.append('transformation', signedUpload.transformation)
      }

      const res = await fetch(url, { method: 'POST', body })
      if (res.ok) {
        const data = await res.json()
        return {
          url: data.secure_url || data.url,
          publicId: data.public_id,
        }
      }
    }
  } catch (err) {
    console.warn('Cloudinary upload fallback triggered:', err)
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ url: reader.result as string })
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

// ─── Rentals ────────────────────────────────────────────────────────────────

export interface RentalOrder {
  id: string
  userId: string
  listingId: string
  status: string
  startDate: string
  endDate: string
  totalAmount: number
  depositAmount: number
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    displayName: string
    email: string
  }
  listing?: {
    id: string
    title: string
    images: string[]
  }
}

export interface RentalExtension {
  id: string
  rentalOrderId: string
  additionalDays: number
  additionalAmount: number
  status: string
  createdAt: string
}

export async function getRentalOrders(query?: {
  page?: number
  limit?: number
  status?: string
  userId?: string
}): Promise<ApiResponse<{ items: RentalOrder[]; total: number }>> {
  const params = new URLSearchParams()
  if (query?.page) params.append('page', query.page.toString())
  if (query?.limit) params.append('limit', query.limit.toString())
  if (query?.status) params.append('status', query.status)
  if (query?.userId) params.append('userId', query.userId)
  return clientGet<ApiResponse<{ items: RentalOrder[]; total: number }>>('/admin/rentals?' + params.toString())
}

export async function getRentalOrder(id: string): Promise<ApiResponse<RentalOrder>> {
  return clientGet<ApiResponse<RentalOrder>>('/admin/rentals/' + id)
}

export async function updateRentalOrder(id: string, data: {
  status?: string
  returnDate?: string
}): Promise<ApiResponse<RentalOrder>> {
  return clientPatch<ApiResponse<RentalOrder>>('/admin/rentals/' + id, data)
}

export async function createRentalExtension(data: {
  rentalOrderId: string
  additionalDays: number
}): Promise<ApiResponse<RentalExtension>> {
  return clientPost<ApiResponse<RentalExtension>>('/admin/rentals/extensions', data)
}

export async function getRentalExtensions(rentalOrderId: string): Promise<ApiResponse<RentalExtension[]>> {
  return clientGet<ApiResponse<RentalExtension[]>>('/admin/rentals/' + rentalOrderId + '/extensions')
}

// ─── Hero Banners ────────────────────────────────────────────────────────────

export interface HeroBanner {
  id: string
  title: string
  titleAm?: string
  subtitle?: string
  subtitleAm?: string
  imageUrl: string
  cloudinaryPublicId?: string
  linkUrl?: string
  holidayTheme?: string
  themeStartDate?: string
  themeEndDate?: string
  searchWeight?: number
  sortOrder?: number
  status: string
  publishAt?: string
  unpublishAt?: string
  createdAt: string
  updatedAt: string
  createdBy?: {
    id: string
    displayName: string
  }
}

export async function getHeroBanners(query?: {
  page?: number
  limit?: number
  status?: string
}): Promise<ApiResponse<{ items: HeroBanner[]; total: number }>> {
  const params = new URLSearchParams()
  if (query?.page) params.append('page', query.page.toString())
  if (query?.limit) params.append('limit', query.limit.toString())
  if (query?.status) params.append('status', query.status)
  return clientGet<ApiResponse<{ items: HeroBanner[]; total: number }>>('/admin/hero-banners?' + params.toString())
}

export async function getActiveHeroBanners(): Promise<ApiResponse<HeroBanner[]>> {
  return clientGet<ApiResponse<HeroBanner[]>>('/admin/hero-banners/active')
}

export async function getHeroBannersByTheme(theme: string): Promise<ApiResponse<HeroBanner[]>> {
  return clientGet<ApiResponse<HeroBanner[]>>('/admin/hero-banners/holiday/' + theme)
}

export async function getHeroBanner(id: string): Promise<ApiResponse<HeroBanner>> {
  return clientGet<ApiResponse<HeroBanner>>('/admin/hero-banners/' + id)
}

export async function createHeroBanner(data: {
  title: string
  titleAm?: string
  subtitle?: string
  subtitleAm?: string
  imageUrl: string
  cloudinaryPublicId?: string
  linkUrl?: string
  holidayTheme?: string
  themeStartDate?: string
  themeEndDate?: string
  searchWeight?: number
  sortOrder?: number
}): Promise<ApiResponse<HeroBanner>> {
  return clientPost<ApiResponse<HeroBanner>>('/admin/hero-banners', data)
}

export async function updateHeroBanner(id: string, data: Partial<{
  title: string
  titleAm?: string
  subtitle?: string
  subtitleAm?: string
  imageUrl: string
  cloudinaryPublicId?: string
  linkUrl?: string
  holidayTheme?: string
  themeStartDate?: string
  themeEndDate?: string
  searchWeight?: number
  sortOrder?: number
}>): Promise<ApiResponse<HeroBanner>> {
  return clientPatch<ApiResponse<HeroBanner>>('/admin/hero-banners/' + id, data)
}

export async function publishHeroBanner(id: string): Promise<ApiResponse<HeroBanner>> {
  return clientPatch<ApiResponse<HeroBanner>>('/admin/hero-banners/' + id + '/publish', {})
}

export async function unpublishHeroBanner(id: string): Promise<ApiResponse<HeroBanner>> {
  return clientPatch<ApiResponse<HeroBanner>>('/admin/hero-banners/' + id + '/unpublish', {})
}

export async function deleteHeroBanner(id: string): Promise<ApiResponse<unknown>> {
  return clientDelete<ApiResponse<unknown>>('/admin/hero-banners/' + id)
}

// ─── Vendor KYC ───────────────────────────────────────────────────────────────

export interface VendorKycProfile {
  id: string
  userId: string
  businessName: string
  businessNameAm?: string
  tinNumber: string
  licenseUrl: string
  licenseCloudinaryId?: string
  status: string
  rejectionReason?: string
  reviewedById?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    displayName: string
    email: string
    phone?: string
  }
  reviewedBy?: {
    id: string
    displayName: string
  }
}

export async function getVendorKycProfiles(query?: {
  page?: number
  limit?: number
  status?: string
  userId?: string
  tinNumber?: string
}): Promise<ApiResponse<{ items: VendorKycProfile[]; total: number }>> {
  const params = new URLSearchParams()
  if (query?.page) params.append('page', query.page.toString())
  if (query?.limit) params.append('limit', query.limit.toString())
  if (query?.status) params.append('status', query.status)
  if (query?.userId) params.append('userId', query.userId)
  if (query?.tinNumber) params.append('tinNumber', query.tinNumber)
  return clientGet<ApiResponse<{ items: VendorKycProfile[]; total: number }>>('/admin/vendor-kyc?' + params.toString())
}

export async function getVendorKycProfile(id: string): Promise<ApiResponse<VendorKycProfile>> {
  return clientGet<ApiResponse<VendorKycProfile>>('/admin/vendor-kyc/' + id)
}

export async function reviewVendorKyc(id: string, data: {
  decision: 'APPROVED' | 'REJECTED'
  reason?: string
}): Promise<ApiResponse<VendorKycProfile>> {
  return clientPatch<ApiResponse<VendorKycProfile>>('/admin/vendor-kyc/' + id + '/review', data)
}

export async function createVendorKycProfile(data: {
  businessName: string
  businessNameAm?: string
  tinNumber: string
  licenseUrl: string
  licenseCloudinaryId?: string
}): Promise<ApiResponse<VendorKycProfile>> {
  return clientPost<ApiResponse<VendorKycProfile>>('/vendor-kyc', data)
}

// ─── Homepage CMS Sections, Featured Items & SEO ─────────────────────────────

export interface HomepageSection {
  id: string
  sectionKey: string
  title: string
  subtitle?: string | null
  isEnabled: boolean
  sortOrder: number
  itemCount: number
  contentSource: 'automatic' | 'manual'
  manualItemIds: string[]
  createdAt: string
  updatedAt: string
}

export interface HomepageFeaturedListing {
  id: string
  listingId: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  listing?: AdminListing | null
}

export interface HomepageFeaturedSeller {
  id: string
  sellerId: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  seller?: {
    id: string
    displayName?: string
    email?: string
    avatarUrl?: string | null
    location?: string | null
    sellerType?: string | null
    emailVerifiedAt?: string | null
    phoneVerifiedAt?: string | null
  } | null
}

export interface HomepageSeo {
  id: string
  title: string
  description: string
  ogImageUrl?: string | null
  ogImageCloudinaryId?: string | null
  createdAt: string
  updatedAt: string
}

export async function fetchHomepageSections(): Promise<ApiResponse<HomepageSection[]>> {
  return clientGet<ApiResponse<HomepageSection[]>>('/admin/homepage/sections')
}

export async function updateHomepageSection(id: string, data: Partial<HomepageSection>): Promise<ApiResponse<HomepageSection>> {
  return clientPatch<ApiResponse<HomepageSection>>('/admin/homepage/sections/' + id, data)
}

export async function reorderHomepageSections(itemIds: string[]): Promise<ApiResponse<unknown>> {
  return clientPost<ApiResponse<unknown>>('/admin/homepage/sections/reorder', { itemIds })
}

export async function fetchHomepageFeaturedListings(): Promise<ApiResponse<HomepageFeaturedListing[]>> {
  return clientGet<ApiResponse<HomepageFeaturedListing[]>>('/admin/homepage/featured-listings')
}

export async function addHomepageFeaturedListing(listingId: string, sortOrder?: number): Promise<ApiResponse<HomepageFeaturedListing>> {
  return clientPost<ApiResponse<HomepageFeaturedListing>>('/admin/homepage/featured-listings', { listingId, sortOrder })
}

export async function removeHomepageFeaturedListing(id: string): Promise<ApiResponse<unknown>> {
  return clientDelete<ApiResponse<unknown>>('/admin/homepage/featured-listings/' + id)
}

export async function reorderHomepageFeaturedListings(itemIds: string[]): Promise<ApiResponse<unknown>> {
  return clientPost<ApiResponse<unknown>>('/admin/homepage/featured-listings/reorder', { itemIds })
}

export async function fetchHomepageFeaturedSellers(): Promise<ApiResponse<HomepageFeaturedSeller[]>> {
  return clientGet<ApiResponse<HomepageFeaturedSeller[]>>('/admin/homepage/featured-sellers')
}

export async function addHomepageFeaturedSeller(sellerId: string, sortOrder?: number): Promise<ApiResponse<HomepageFeaturedSeller>> {
  return clientPost<ApiResponse<HomepageFeaturedSeller>>('/admin/homepage/featured-sellers', { sellerId, sortOrder })
}

export async function removeHomepageFeaturedSeller(id: string): Promise<ApiResponse<unknown>> {
  return clientDelete<ApiResponse<unknown>>('/admin/homepage/featured-sellers/' + id)
}

export async function reorderHomepageFeaturedSellers(itemIds: string[]): Promise<ApiResponse<unknown>> {
  return clientPost<ApiResponse<unknown>>('/admin/homepage/featured-sellers/reorder', { itemIds })
}

export async function fetchHomepageSeo(): Promise<ApiResponse<HomepageSeo>> {
  return clientGet<ApiResponse<HomepageSeo>>('/admin/homepage/seo')
}

export async function updateHomepageSeo(data: { title: string; description: string; ogImageUrl?: string; ogImageCloudinaryId?: string }): Promise<ApiResponse<HomepageSeo>> {
  return clientPut<ApiResponse<HomepageSeo>>('/admin/homepage/seo', data)
}

// ─── Admin Broadcasts ────────────────────────────────────────────────────────

export interface AdminBroadcast {
  id: string
  title: string
  message: string
  imageUrl: string | null
  actionUrl: string | null
  actionLabel: string | null
  audience: 'ALL_USERS' | 'BUYERS' | 'SELLERS'
  scheduledAt: string | null
  sentAt: string | null
  status: 'DRAFT' | 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'CANCELLED' | 'FAILED'
  totalRecipients: number
  deliveredCount: number
  readCount: number
  failedCount: number
  createdAt: string
  updatedAt: string
  createdBy?: {
    id: string
    displayName: string
    email: string
  }
}

export interface AdminBroadcastStats {
  activeBroadcasts: number
  sentToday: number
  totalRecipients: number
  readRate: number
}

export async function fetchAdminBroadcasts(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<AdminBroadcast>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return clientGet<PaginatedResponse<AdminBroadcast>>('/notifications/admin/broadcasts' + qs)
}

export async function fetchAdminBroadcastStats(): Promise<ApiResponse<AdminBroadcastStats>> {
  return clientGet<ApiResponse<AdminBroadcastStats>>('/notifications/admin/broadcasts/stats')
}

export async function fetchAdminBroadcast(id: string): Promise<ApiResponse<AdminBroadcast>> {
  return clientGet<ApiResponse<AdminBroadcast>>('/notifications/admin/broadcasts/' + id)
}

export async function createAdminBroadcast(data: {
  title: string
  message: string
  imageUrl?: string
  actionUrl?: string
  actionLabel?: string
  audience?: string
  scheduledAt?: string
}): Promise<ApiResponse<AdminBroadcast>> {
  return clientPost<ApiResponse<AdminBroadcast>>('/notifications/admin/broadcasts', data)
}

export async function updateAdminBroadcast(id: string, data: Partial<AdminBroadcast>): Promise<ApiResponse<AdminBroadcast>> {
  return clientPatch<ApiResponse<AdminBroadcast>>('/notifications/admin/broadcasts/' + id, data)
}

export async function deleteAdminBroadcastDraft(id: string): Promise<ApiResponse<unknown>> {
  return clientDelete<ApiResponse<unknown>>('/notifications/admin/broadcasts/' + id)
}

export async function sendAdminBroadcastNow(id: string): Promise<ApiResponse<unknown>> {
  return clientPost<ApiResponse<unknown>>('/notifications/admin/broadcasts/' + id + '/send')
}

export async function cancelAdminBroadcast(id: string): Promise<ApiResponse<AdminBroadcast>> {
  return clientPost<ApiResponse<AdminBroadcast>>('/notifications/admin/broadcasts/' + id + '/cancel')
}

// ─── Admin Dashboard Overview ──────────────────────────────────────────────────

export interface DashboardKpiMetric {
  current: number
  previous: number
  pctChange: number | null
  trend: 'up' | 'down' | 'neutral'
  comparisonLabel: string
}

export interface NeedsAttentionItem {
  key: string
  title: string
  count: number
  severity: 'urgent' | 'warning' | 'info'
  description: string
  category: string
  actionUrl: string
  actionLabel: string
}

export interface ListingOperationalSummary {
  pending: number
  active: number
  rejected: number
  draft: number
  expired: number
  sold: number
  archived: number
  total: number
}

export interface UserSellerSummary {
  totalUsers: number
  newUsersPeriod: number
  activeUsers: number
  totalSellers: number
  newSellersPeriod: number
  activeSellers: number
  suspendedUsers: number
  pendingVerifications: number
}

export interface OrdersOperationalSummary {
  new: number
  active: number
  completed: number
  cancelled: number
  total: number
}

export interface RentalsOperationalSummary {
  upcoming: number
  active: number
  returningOverdue: number
  completed: number
  disputed: number
  total: number
}

export interface CustomOrdersOperationalSummary {
  newRequests: number
  inProgress: number
  awaitingAction: number
  completed: number
  cancelled: number
  total: number
}

export interface ModerationHealthSummary {
  openReports: number
  flaggedListings: number
  reportedUsers: number
  suspendedUsers: number
  chatFlagsPending: number
  recentlyResolvedReports: number
}

export interface NotificationsSummary {
  unreadAdminCount: number
  activeBroadcasts: number
  sentBroadcastsPeriod: number
}

export interface SystemHealthStatus {
  api: 'operational' | 'degraded' | 'offline'
  database: 'operational' | 'degraded' | 'offline'
  redis: 'operational' | 'degraded' | 'offline'
  search: 'operational' | 'degraded' | 'offline'
  backgroundJobs: 'operational' | 'degraded' | 'offline'
  notifications: 'operational' | 'degraded' | 'offline'
  timestamp: string
}

export interface AdminDashboardOverviewData {
  range: string
  dateFrom: string
  dateTo: string
  lastUpdated: string
  kpis: {
    totalUsers: DashboardKpiMetric
    activeSellers: DashboardKpiMetric
    activeListings: DashboardKpiMetric
    orders: DashboardKpiMetric
    rentals: DashboardKpiMetric
    customOrders: DashboardKpiMetric
  }
  needsAttention: NeedsAttentionItem[]
  listings: ListingOperationalSummary
  userSeller: UserSellerSummary
  orders: OrdersOperationalSummary
  rentals: RentalsOperationalSummary
  customOrders: CustomOrdersOperationalSummary
  moderationHealth: ModerationHealthSummary
  notificationsSummary: NotificationsSummary
  systemHealth: SystemHealthStatus
}

export interface ActivityPoint {
  date: string
  newUsers: number
  newListings: number
  orders: number
  rentals: number
  customOrders: number
}

export async function fetchAdminDashboardOverview(params?: {
  range?: string | undefined
  from?: string | undefined
  to?: string | undefined
}): Promise<AdminDashboardOverviewData> {
  const qs = params ? buildQuery(params) : ''
  const res = await clientGet<{ success: boolean; data: AdminDashboardOverviewData } | AdminDashboardOverviewData>('/admin/dashboard/overview' + qs)
  return 'data' in res && res.data ? res.data : (res as AdminDashboardOverviewData)
}

export async function fetchAdminDashboardActivity(params?: {
  range?: string | undefined
  from?: string | undefined
  to?: string | undefined
}): Promise<ActivityPoint[]> {
  const qs = params ? buildQuery(params) : ''
  const res = await clientGet<{ success: boolean; data: ActivityPoint[] } | ActivityPoint[]>('/admin/dashboard/activity' + qs)
  if (Array.isArray(res)) return res
  if ('data' in res && Array.isArray(res.data)) return res.data
  return []
}

export async function fetchAdminDashboardSystemHealth(): Promise<SystemHealthStatus> {
  const res = await clientGet<{ success: boolean; data: SystemHealthStatus } | SystemHealthStatus>('/admin/dashboard/system-health')
  return 'data' in res && res.data ? res.data : (res as SystemHealthStatus)
}

export async function fetchAdminDashboardRecentActivity(limit = 10): Promise<AuditLog[]> {
  const res = await clientGet<{ success: boolean; data: AuditLog[] } | AuditLog[]>(`/admin/dashboard/recent-activity?limit=${limit}`)
  if (Array.isArray(res)) return res
  if ('data' in res && Array.isArray(res.data)) return res.data
  return []
}

