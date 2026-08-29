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
  MOCK_MESSAGE_CONVERSATIONS,
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
  type MessageConversation,
  type MessagePreview,
  type Notification,
  type PendingAction,
  type PerformanceInsights,
  type RecentOrder,
  type RentalItem,
  type RevenueChartPoint,
} from './dashboardMockData';

// Live in-memory data stores for mock API behavior.
let livePendingActions = [...MOCK_PENDING_ACTIONS];
let liveNotifications = [...MOCK_NOTIFICATIONS];
let liveRecentOrders = [...MOCK_RECENT_ORDERS];
let liveInventoryAlerts = [...MOCK_INVENTORY_ALERTS];
let liveMessageConversations = [...MOCK_MESSAGE_CONVERSATIONS];

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
  return [...liveRecentOrders];
}

export async function fetchPendingActions(_sellerId: string): Promise<PendingAction[]> {
  await delay(250);
  // TODO: return apiGet<PendingAction[]>(`/seller/${_sellerId}/pending-actions`);
  return [...livePendingActions];
}

export async function fetchMessages(_sellerId: string): Promise<MessagePreview[]> {
  await delay(300);
  // TODO: return apiGet<MessagePreview[]>(`/seller/${_sellerId}/messages/preview`);
  return [...MOCK_MESSAGES];
}

export async function fetchMessageConversation(
  _sellerId: string,
  conversationId: string,
): Promise<MessageConversation | null> {
  await delay(250);
  const conversation = liveMessageConversations.find((conv) => conv.conversationId === conversationId);
  return conversation ? { ...conversation, messages: [...conversation.messages] } : null;
}

export async function sendMessageInConversation(
  _sellerId: string,
  conversationId: string,
  text: string,
): Promise<void> {
  await delay(200);
  const now = new Date().toISOString();
  const newMessage = {
    id: `msg-${Date.now()}`,
    sender: 'seller' as const,
    text,
    createdAt: now,
  };
  liveMessageConversations = liveMessageConversations.map((conv) =>
    conv.conversationId === conversationId
      ? { ...conv, messages: [...conv.messages, newMessage], unreadCount: 0 }
      : conv,
  );
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
  return [...liveInventoryAlerts];
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
  return [...liveNotifications];
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
  livePendingActions = livePendingActions.filter((action) => action.id !== _actionId);
}

export async function snoozePendingAction(_actionId: string, _hours: number): Promise<void> {
  await delay(200);
  livePendingActions = livePendingActions.filter((action) => action.id !== _actionId);
}

export async function markNotificationRead(_notifId: string): Promise<void> {
  await delay(150);
  liveNotifications = liveNotifications.map((notif) =>
    notif.id === _notifId ? { ...notif, isRead: true } : notif
  );
}

export async function markNotificationUnread(_notifId: string): Promise<void> {
  await delay(150);
  liveNotifications = liveNotifications.map((notif) =>
    notif.id === _notifId ? { ...notif, isRead: false } : notif
  );
}

export async function markAllNotificationsRead(_sellerId: string): Promise<void> {
  await delay(200);
  liveNotifications = liveNotifications.map((notif) => ({ ...notif, isRead: true }));
}

export async function dismissGrowthRecommendation(_recId: string): Promise<void> {
  await delay(150);
  // TODO: await apiPost(`/seller/recommendations/${_recId}/dismiss`);
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  await delay(300);
  liveRecentOrders = liveRecentOrders.map((order) =>
    order.id === orderId ? { ...order, status: status as any } : order
  );
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
  MessageConversation,
  MessagePreview,
  Notification,
  PendingAction,
  PerformanceInsights,
  RecentOrder,
  RentalItem,
  RevenueChartPoint,
};
