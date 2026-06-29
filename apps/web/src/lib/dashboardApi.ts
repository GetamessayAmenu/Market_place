/**
 * Dashboard API wrappers.
 * Currently backed by mock data — replace each function body with real
 * API calls (via apiGet/apiPost) when backend endpoints are ready.
 */

import {
  MOCK_CUSTOM_ORDER_PIPELINE,
  MOCK_GROWTH_RECOMMENDATIONS,
  MOCK_INVENTORY_ALERTS,
  MOCK_KPIS,
  MOCK_MESSAGES,
  MOCK_NOTIFICATIONS,
  MOCK_PENDING_ACTIONS,
  MOCK_PERFORMANCE_INSIGHTS,
  MOCK_RECENT_ORDERS,
  MOCK_RENTAL_ITEMS,
  generateRevenueChartData,
  type CustomOrderPipeline,
  type DashboardKpis,
  type GrowthRecommendation,
  type InventoryAlert,
  type MessagePreview,
  type Notification,
  type PendingAction,
  type PerformanceInsights,
  type RecentOrder,
  type RentalItem,
  type RevenueChartPoint,
} from './dashboardMockData';

// Simulated network delay for realistic UX testing
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── API Functions ──────────────────────────────────────────────────────────

export async function fetchDashboardKpis(_sellerId: string): Promise<DashboardKpis> {
  await delay(300);
  // TODO: return apiGet<DashboardKpis>(`/seller/${_sellerId}/dashboard/kpis`);
  return { ...MOCK_KPIS };
}

export async function fetchRecentOrders(_sellerId: string): Promise<RecentOrder[]> {
  await delay(350);
  // TODO: return apiGet<RecentOrder[]>(`/seller/${_sellerId}/orders/recent`);
  return [...MOCK_RECENT_ORDERS];
}

export async function fetchPendingActions(_sellerId: string): Promise<PendingAction[]> {
  await delay(250);
  // TODO: return apiGet<PendingAction[]>(`/seller/${_sellerId}/pending-actions`);
  return [...MOCK_PENDING_ACTIONS];
}

export async function fetchMessages(_sellerId: string): Promise<MessagePreview[]> {
  await delay(300);
  // TODO: return apiGet<MessagePreview[]>(`/seller/${_sellerId}/messages/preview`);
  return [...MOCK_MESSAGES];
}

export async function fetchRentalOverview(_sellerId: string): Promise<RentalItem[]> {
  await delay(400);
  // TODO: return apiGet<RentalItem[]>(`/seller/${_sellerId}/rentals/overview`);
  return [...MOCK_RENTAL_ITEMS];
}

export async function fetchCustomOrderPipeline(_sellerId: string): Promise<CustomOrderPipeline> {
  await delay(350);
  // TODO: return apiGet<CustomOrderPipeline>(`/seller/${_sellerId}/custom-orders/pipeline`);
  return { ...MOCK_CUSTOM_ORDER_PIPELINE };
}

export async function fetchInventoryAlerts(_sellerId: string): Promise<InventoryAlert[]> {
  await delay(300);
  // TODO: return apiGet<InventoryAlert[]>(`/seller/${_sellerId}/inventory/alerts`);
  return [...MOCK_INVENTORY_ALERTS];
}

export async function fetchPerformanceInsights(_sellerId: string): Promise<PerformanceInsights> {
  await delay(500);
  // TODO: return apiGet<PerformanceInsights>(`/seller/${_sellerId}/performance/insights`);
  return { ...MOCK_PERFORMANCE_INSIGHTS };
}

export async function fetchGrowthRecommendations(_sellerId: string): Promise<GrowthRecommendation[]> {
  await delay(400);
  // TODO: return apiGet<GrowthRecommendation[]>(`/seller/${_sellerId}/recommendations/growth`);
  return [...MOCK_GROWTH_RECOMMENDATIONS];
}

export async function fetchNotifications(_sellerId: string): Promise<Notification[]> {
  await delay(250);
  // TODO: return apiGet<Notification[]>(`/seller/${_sellerId}/notifications`);
  return [...MOCK_NOTIFICATIONS];
}

export async function fetchRevenueChart(
  _sellerId: string,
  range: '7d' | '30d' | '90d' | '1y'
): Promise<RevenueChartPoint[]> {
  await delay(400);
  // TODO: return apiGet<RevenueChartPoint[]>(`/seller/${_sellerId}/analytics/revenue?range=${range}`);
  return generateRevenueChartData(range);
}

export async function dismissPendingAction(_actionId: string): Promise<void> {
  await delay(200);
  // TODO: await apiPost(`/seller/pending-actions/${_actionId}/dismiss`);
}

export async function snoozePendingAction(_actionId: string, _hours: number): Promise<void> {
  await delay(200);
  // TODO: await apiPost(`/seller/pending-actions/${_actionId}/snooze`, { hours: _hours });
}

export async function markNotificationRead(_notifId: string): Promise<void> {
  await delay(150);
  // TODO: await apiPost(`/notifications/${_notifId}/read`);
}

export async function markAllNotificationsRead(_sellerId: string): Promise<void> {
  await delay(200);
  // TODO: await apiPost(`/seller/${_sellerId}/notifications/read-all`);
}

export async function dismissGrowthRecommendation(_recId: string): Promise<void> {
  await delay(150);
  // TODO: await apiPost(`/seller/recommendations/${_recId}/dismiss`);
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  await delay(300);
  // TODO: await apiPatch(`/orders/${orderId}`, { status });
  console.info('Order status updated:', orderId, status);
}

export async function markRentalCondition(
  rentalId: string,
  condition: 'good' | 'damaged' | 'needs_cleaning'
): Promise<void> {
  await delay(300);
  // TODO: await apiPost(`/rentals/${rentalId}/condition`, { condition });
  console.info('Rental condition marked:', rentalId, condition);
}

// Re-export types for convenience
export type {
  CustomOrderPipeline,
  DashboardKpis,
  GrowthRecommendation,
  InventoryAlert,
  MessagePreview,
  Notification,
  PendingAction,
  PerformanceInsights,
  RecentOrder,
  RentalItem,
  RevenueChartPoint,
};
