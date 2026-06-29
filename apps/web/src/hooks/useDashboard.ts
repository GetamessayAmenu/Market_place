/**
 * React Query hooks for seller dashboard data fetching.
 * Stale times are set per requirements (analytics = 5 min, messages = 1 min, etc.)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  dismissGrowthRecommendation,
  dismissPendingAction,
  fetchCustomOrderPipeline,
  fetchDashboardKpis,
  fetchGrowthRecommendations,
  fetchInventoryAlerts,
  fetchMessages,
  fetchNotifications,
  fetchPendingActions,
  fetchPerformanceInsights,
  fetchRecentOrders,
  fetchRentalOverview,
  fetchRevenueChart,
  markAllNotificationsRead,
  markNotificationRead,
  markRentalCondition,
  snoozePendingAction,
  updateOrderStatus,
} from '../lib/dashboardApi';

const FIVE_MIN = 5 * 60 * 1000;
const ONE_MIN = 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export function useDashboardKpis(sellerId: string) {
  return useQuery({
    queryKey: ['dashboard-kpis', sellerId],
    queryFn: () => fetchDashboardKpis(sellerId),
    staleTime: FIVE_MIN,
    enabled: !!sellerId,
    refetchInterval: FIVE_MIN,
  });
}

// ─── Revenue Chart ─────────────────────────────────────────────────────────────

export function useRevenueChart(sellerId: string, range: '7d' | '30d' | '90d' | '1y') {
  return useQuery({
    queryKey: ['revenue-chart', sellerId, range],
    queryFn: () => fetchRevenueChart(sellerId, range),
    staleTime: FIVE_MIN,
    enabled: !!sellerId,
  });
}

// ─── Recent Orders ─────────────────────────────────────────────────────────────

export function useRecentOrders(sellerId: string) {
  return useQuery({
    queryKey: ['recent-orders', sellerId],
    queryFn: () => fetchRecentOrders(sellerId),
    staleTime: FIVE_MIN,
    enabled: !!sellerId,
    refetchInterval: FIVE_MIN,
  });
}

// ─── Pending Actions ──────────────────────────────────────────────────────────

export function usePendingActions(sellerId: string) {
  return useQuery({
    queryKey: ['pending-actions', sellerId],
    queryFn: () => fetchPendingActions(sellerId),
    staleTime: ONE_MIN,
    enabled: !!sellerId,
    refetchInterval: ONE_MIN,
  });
}

export function useDismissPendingAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (actionId: string) => dismissPendingAction(actionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['pending-actions'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
  });
}

export function useSnoozePendingAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ actionId, hours }: { actionId: string; hours: number }) =>
      snoozePendingAction(actionId, hours),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function useMessages(sellerId: string) {
  return useQuery({
    queryKey: ['messages-preview', sellerId],
    queryFn: () => fetchMessages(sellerId),
    staleTime: ONE_MIN,
    enabled: !!sellerId,
    refetchInterval: ONE_MIN,
  });
}

// ─── Rental Overview ──────────────────────────────────────────────────────────

export function useRentalOverview(sellerId: string) {
  return useQuery({
    queryKey: ['rental-overview', sellerId],
    queryFn: () => fetchRentalOverview(sellerId),
    staleTime: FIVE_MIN,
    enabled: !!sellerId,
  });
}

export function useMarkRentalCondition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      rentalId,
      condition,
    }: {
      rentalId: string;
      condition: 'good' | 'damaged' | 'needs_cleaning';
    }) => markRentalCondition(rentalId, condition),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['rental-overview'] });
    },
  });
}

// ─── Custom Order Pipeline ────────────────────────────────────────────────────

export function useCustomOrderPipeline(sellerId: string) {
  return useQuery({
    queryKey: ['custom-order-pipeline', sellerId],
    queryFn: () => fetchCustomOrderPipeline(sellerId),
    staleTime: FIVE_MIN,
    enabled: !!sellerId,
  });
}

// ─── Inventory Alerts ─────────────────────────────────────────────────────────

export function useInventoryAlerts(sellerId: string) {
  return useQuery({
    queryKey: ['inventory-alerts', sellerId],
    queryFn: () => fetchInventoryAlerts(sellerId),
    staleTime: FIVE_MIN,
    enabled: !!sellerId,
  });
}

// ─── Performance Insights ─────────────────────────────────────────────────────

export function usePerformanceInsights(sellerId: string) {
  return useQuery({
    queryKey: ['performance-insights', sellerId],
    queryFn: () => fetchPerformanceInsights(sellerId),
    staleTime: ONE_DAY,
    enabled: !!sellerId,
  });
}

// ─── Growth Recommendations ───────────────────────────────────────────────────

export function useGrowthRecommendations(sellerId: string) {
  return useQuery({
    queryKey: ['growth-recommendations', sellerId],
    queryFn: () => fetchGrowthRecommendations(sellerId),
    staleTime: 7 * ONE_DAY,
    enabled: !!sellerId,
  });
}

export function useDismissRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recId: string) => dismissGrowthRecommendation(recId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['growth-recommendations'] });
    },
  });
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export function useNotifications(sellerId: string) {
  return useQuery({
    queryKey: ['notifications', sellerId],
    queryFn: () => fetchNotifications(sellerId),
    staleTime: ONE_MIN,
    enabled: !!sellerId,
    refetchInterval: ONE_MIN,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notifId: string) => markNotificationRead(notifId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sellerId: string) => markAllNotificationsRead(sellerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ─── Order Actions ────────────────────────────────────────────────────────────

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['recent-orders'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
  });
}
