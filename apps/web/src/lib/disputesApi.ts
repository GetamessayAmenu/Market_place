import { apiGet, apiPost } from './api';

export interface DisputeCategory {
  id: string;
  name: string;
  nameAm?: string | null;
  slug: string;
  description?: string | null;
}

export interface DisputeEvidence {
  id: string;
  fileUrl: string;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  createdAt: string;
  uploader?: {
    id: string;
    displayName: string;
    email: string;
  };
}

export interface DisputeHistory {
  id: string;
  action: string;
  toState?: Record<string, any> | null;
  note?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface DisputeComment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface Dispute {
  id: string;
  ticketNumber: string;
  status: 'open' | 'in_progress' | 'awaiting_response' | 'under_review' | 'waiting_for_info' | 'waiting_for_information' | 'resolved' | 'closed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type?: string;
  title: string;
  description: string;
  reporterId: string;
  reportedUserId?: string | null;
  listingId?: string | null;
  orderId?: string | null;
  rentalId?: string | null;
  customOrderId?: string | null;
  conversationId?: string | null;
  reportId?: string | null;
  categoryId?: string | null;
  resolutionOutcome?: string | null;
  resolutionReason?: string | null;
  resolutionNote?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string | null;
    phone?: string | null;
  };
  reportedUser?: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string | null;
    phone?: string | null;
  };
  assignedAdmin?: {
    id: string;
    displayName: string;
    email: string;
  };
  category?: DisputeCategory | null;
  listing?: {
    id: string;
    title: string;
    slug: string;
    price: number;
    currency?: string;
    images?: Array<{ url: string; isPrimary?: boolean }>;
  } | null;
  order?: {
    id: string;
    orderNumber: string;
    type: string;
    status: string;
    agreedPrice: number;
  } | null;
  rental?: {
    id: string;
    orderNumber: string;
    status: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
  } | null;
  customOrder?: {
    id: string;
    status: string;
    agreedPrice?: number | null;
    selectedSize?: string | null;
    selectedColor?: string | null;
    selectedFabric?: string | null;
  } | null;
  evidence?: DisputeEvidence[];
  history?: DisputeHistory[];
  comments?: DisputeComment[];
  _count?: {
    comments: number;
    evidence: number;
  };
}

export interface CreateDisputePayload {
  title: string;
  description: string;
  type?: 'off_platform_transaction' | 'payment_dispute' | 'delivery_issue' | 'quality_mismatch' | 'communication_conflict' | 'other' | undefined;
  categoryId?: string | undefined;
  categorySlug?: string | undefined;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | undefined;
  listingId?: string | undefined;
  orderId?: string | undefined;
  rentalId?: string | undefined;
  customOrderId?: string | undefined;
  conversationId?: string | undefined;
  reportedUserId?: string | undefined;
  evidence?: Array<{
    fileUrl: string;
    fileName?: string | undefined;
    fileType?: string | undefined;
    fileSize?: number | undefined;
    cloudinaryPublicId?: string | undefined;
  }> | undefined;
  evidenceUrls?: string[] | undefined;
}

export interface PaginatedDisputesResponse {
  data: Dispute[];
  total: number;
  skip: number;
  take: number;
}

export async function fetchDisputeCategories(): Promise<DisputeCategory[]> {
  return apiGet<DisputeCategory[]>('/dispute-categories');
}

export async function fetchMyDisputes(params?: {
  status?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}): Promise<PaginatedDisputesResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  const queryString = query.toString() ? `?${query.toString()}` : '';

  return apiGet<PaginatedDisputesResponse>(`/disputes/mine${queryString}`);
}

export async function fetchDispute(id: string): Promise<Dispute> {
  return apiGet<Dispute>(`/disputes/${id}`);
}

export async function createDispute(payload: CreateDisputePayload): Promise<Dispute> {
  return apiPost<Dispute>('/disputes', payload as unknown as Record<string, unknown>);
}

export async function addEvidence(disputeId: string, evidenceData: {
  fileUrl: string;
  fileName?: string | undefined;
  fileType?: string | undefined;
  fileSize?: number | undefined;
  cloudinaryPublicId?: string | undefined;
}): Promise<DisputeEvidence> {
  return apiPost<DisputeEvidence>(`/disputes/${disputeId}/evidence`, evidenceData as unknown as Record<string, unknown>);
}

export async function addDisputeComment(disputeId: string, content: string): Promise<DisputeComment> {
  return apiPost<DisputeComment>(`/disputes/${disputeId}/comments`, { content, isInternal: false } as Record<string, unknown>);
}

export async function getDisputeComments(disputeId: string): Promise<DisputeComment[]> {
  return apiGet<DisputeComment[]>(`/disputes/${disputeId}/comments`);
}
