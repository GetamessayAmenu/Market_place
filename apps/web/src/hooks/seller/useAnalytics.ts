import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '../../lib/api';

export interface Analytics {
  listingViews: number;
  chatStarts: number;
  whatsappClicks: number;
  phoneReveals: number;
  activeListings?: number;
  totalOrders?: number;
  period: string;
}

export interface DepositLog {
  id: string;
  type: 'held' | 'refunded';
  amount: number;
  customerName: string;
  relatedOrder: string;
  date: string;
  notes?: string;
}

export interface ReviewItem {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  listing?: string;
  response?: string;
}

export interface SellerReviewsData {
  averageRating: number;
  totalReviews: number;
  reviews: ReviewItem[];
}

export interface CustomerItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  totalOrders: number;
  lastOrderDate: string;
  storedMeasurements?: Record<string, number>;
}

export function useAnalytics(sellerId: string, period: string = '30d') {
  return useQuery<Analytics>({
    queryKey: ['analytics', sellerId, period],
    queryFn: async () => {
      const res = await apiGet<Analytics>('/seller/analytics', { period });
      return res;
    },
    enabled: !!sellerId,
  });
}

export function useDeposits(sellerId: string) {
  return useQuery<DepositLog[]>({
    queryKey: ['seller-deposits', sellerId],
    queryFn: async () => {
      const res = await apiGet<DepositLog[]>('/seller/deposits');
      return res || [];
    },
    enabled: !!sellerId,
  });
}

export function useAddDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: 'held' | 'refunded'; amount: number; customerName: string; relatedOrder?: string | undefined; notes?: string | undefined }) =>
      apiPost('/seller/deposits', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller-deposits'] });
    },
  });
}

export function useSellerReviews(sellerId: string) {
  return useQuery<SellerReviewsData>({
    queryKey: ['seller-reviews', sellerId],
    queryFn: async () => {
      const res = await apiGet<SellerReviewsData>('/seller/reviews');
      return res || { averageRating: 5.0, totalReviews: 0, reviews: [] };
    },
    enabled: !!sellerId,
  });
}

export function useRespondToReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, response }: { reviewId: string; response: string }) =>
      apiPost(`/seller/reviews/${reviewId}/response`, { response }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller-reviews'] });
    },
  });
}

export function useCustomers(sellerId: string) {
  return useQuery<CustomerItem[]>({
    queryKey: ['seller-customers', sellerId],
    queryFn: async () => {
      const res = await apiGet<CustomerItem[]>('/seller/customers');
      return res || [];
    },
    enabled: !!sellerId,
  });
}
