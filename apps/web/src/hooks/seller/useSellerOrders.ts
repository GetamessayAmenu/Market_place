import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '../../lib/api';

export type OrderModel = 'sale' | 'rental' | 'custom';
export type OrderStatus = 'requested' | 'approved' | 'in_progress' | 'completed' | 'returned' | 'cancelled';
export type CustomMilestone = 'measurements_received' | 'fabric_cutting' | 'tailoring' | 'ready';

export interface SellerOrder {
  id: string;
  model: OrderModel;
  status: OrderStatus;
  title: string;
  customerName: string;
  price?: number;
  deposit?: number;
  rentalDates?: { start: string; end: string };
  customMilestone?: CustomMilestone;
  createdAt: string;
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
