import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '../../lib/api';

export type OrderModel = 'sale' | 'rental' | 'custom';
export type OrderStatus = 'requested' | 'approved' | 'in_progress' | 'completed' | 'returned' | 'cancelled';
export type CustomMilestone = 'measurements_received' | 'fabric_cutting' | 'tailoring' | 'ready';

export interface SellerOrder {
  id: string;
  orderNumber?: string;
  model?: OrderModel;
  type?: string;
  status: OrderStatus | string;
  title?: string;
  customerName?: string;
  price?: number;
  agreedPrice?: number;
  deposit?: number;
  agreedDeposit?: number | null;
  rentalDates?: { start: string; end: string };
  rentalStartDate?: string | null;
  rentalEndDate?: string | null;
  customMilestone?: CustomMilestone;
  buyer?: {
    id?: string;
    displayName?: string;
    email?: string;
    phone?: string | null;
    avatarUrl?: string | null;
    location?: string | null;
  };
  product?: {
    id?: string;
    title?: string;
    slug?: string;
    price?: number;
    currency?: string;
    images?: any[];
  };
  customMeasurements?: any;
  createdAt: string;
  updatedAt?: string;
}

interface UseSellerOrdersParams {
  model?: OrderModel;
  status?: OrderStatus;
}

export function useSellerOrders(sellerId: string, params?: UseSellerOrdersParams) {
  return useQuery<SellerOrder[]>({
    queryKey: ['seller-orders', sellerId, params],
    queryFn: async () => {
      const res = await apiGet<SellerOrder[]>('/seller/orders', params as Record<string, string>);
      return res;
    },
    enabled: !!sellerId,
  });
}

export function useSellerOrder(orderId: string) {
  return useQuery<SellerOrder>({
    queryKey: ['seller-order', orderId],
    queryFn: async () => {
      const res = await apiGet<SellerOrder>(`/seller/orders/${orderId}`);
      return res;
    },
    enabled: !!orderId,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      apiPatch(`/seller/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller-orders'] });
      void qc.invalidateQueries({ queryKey: ['seller-order'] });
    },
  });
}

export function useUpdateCustomMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, milestone }: { orderId: string; milestone: CustomMilestone }) =>
      apiPatch(`/seller/orders/${orderId}/milestone`, { milestone }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller-orders'] });
      void qc.invalidateQueries({ queryKey: ['seller-order'] });
    },
  });
}
