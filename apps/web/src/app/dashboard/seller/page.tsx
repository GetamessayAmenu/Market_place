'use client';

import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  ConnectionStatusIndicator,
  CustomOrderModule,
  GrowthRecommendationsSection,
  InventoryAlertsModule,
  KpiGrid,
  MessageOverlayPanel,
  MessagesModule,
  NotificationsDropdown,
  OfflineBanner,
  PendingActionsModule,
  PerformanceInsightsModule,
  QuickActionsWidget,
  RecentOrdersSection,
  RentalOverviewModule,
  SalesOverviewModule,
  SeasonalSuggestionsSection,
  SkeletonDashboard,
  WelcomeSection,
} from '../../../components/dashboard/seller';
import useAuth from '../../../hooks/useAuth';
import {
  useCustomOrderPipeline,
  useDashboardKpis,
  useDismissPendingAction,
  useDismissRecommendation,
  useGrowthRecommendations,
  useInventoryAlerts,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkNotificationUnread,
  useMarkRentalCondition,
  useMessageConversation,
  useMessages,
  useNotifications,
  usePendingActions,
  usePerformanceInsights,
  useRecentOrders,
  useRentalOverview,
  useRevenueChart,
  useSendMessageToConversation,
  useSnoozePendingAction,
  useUpdateOrderStatus,
} from '../../../hooks/useDashboard';
import { useDashboardStore } from '../../../hooks/useDashboardStore';
import { useOnlineStatus, useRealtimeUpdates } from '../../../hooks/useRealtimeUpdates';
import { formatRelativeTime } from '../../../lib/formatters';
import { t } from '../../../lib/i18n';

export default function SellerOverviewPage() {
  const user = useAuth((s) => s.user);

  // Global state
  const language = useDashboardStore((s) => s.language);
  const setLanguage = useDashboardStore((s) => s.setLanguage);
  const chartRange = useDashboardStore((s) => s.chartRange);
  const setChartRange = useDashboardStore((s) => s.setChartRange);
  const snoozedActions = useDashboardStore((s) => s.snoozedActions.map((a) => a.id));
  const snoozeAction = useDashboardStore((s) => s.snoozeAction);
  const messageFilter = useDashboardStore((s) => s.messageFilter);
  const setMessageFilter = useDashboardStore((s) => s.setMessageFilter);
  const pinnedQuickActions = useDashboardStore((s) => s.pinnedQuickActions);
  const setPinnedQuickActions = useDashboardStore((s) => s.setPinnedQuickActions);
  const dismissedRecommendations = useDashboardStore((s) => s.dismissedRecommendations);
  const dismissRecommendation = useDashboardStore((s) => s.dismissRecommendation);
  const dismissedSeasonalSuggestions = useDashboardStore((s) => s.dismissedSeasonalSuggestions);
  const dismissSeasonalSuggestion = useDashboardStore((s) => s.dismissSeasonalSuggestion);
  const hiddenSections = useDashboardStore((s) => s.hiddenSections);
  const dismissOptionalSection = useDashboardStore((s) => s.dismissOptionalSection);

  // Local state for UI overlays
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const sellerId = user?.id ?? '';

  // Network & Realtime
  const isOnline = useOnlineStatus();
  const { status: socketStatus } = useRealtimeUpdates({ sellerId, enabled: !!sellerId && isOnline });

  // Data Queries
  const queryClient = useQueryClient();

  const { data: kpis, isLoading: kpisLoading, dataUpdatedAt: kpisUpdatedAt } = useDashboardKpis(sellerId);
  const { data: recentOrders, isLoading: ordersLoading, dataUpdatedAt: ordersUpdatedAt } = useRecentOrders(sellerId);
  const { data: pendingActions, isLoading: pendingLoading, dataUpdatedAt: pendingUpdatedAt } = usePendingActions(sellerId);
  const { data: messages, isLoading: msgsLoading, dataUpdatedAt: messagesUpdatedAt } = useMessages(sellerId);
  const { data: notifications, isLoading: notifsLoading, dataUpdatedAt: notificationsUpdatedAt } = useNotifications(sellerId);
  const { data: activeConversation, isLoading: activeConversationLoading } = useMessageConversation(
    sellerId,
    activeConversationId,
  );
  const { data: revenueChart, isLoading: chartLoading, dataUpdatedAt: chartUpdatedAt } = useRevenueChart(sellerId, chartRange);
  const { data: rentals, isLoading: rentalsLoading, dataUpdatedAt: rentalsUpdatedAt } = useRentalOverview(sellerId);
  const { data: customPipeline, isLoading: customLoading, dataUpdatedAt: customUpdatedAt } = useCustomOrderPipeline(sellerId);
  const { data: inventoryAlerts, isLoading: alertsLoading, dataUpdatedAt: alertsUpdatedAt } = useInventoryAlerts(sellerId);
  const { data: performanceInsights, isLoading: perfLoading, dataUpdatedAt: perfUpdatedAt } = usePerformanceInsights(sellerId);
  const { data: growthRecs, isLoading: recsLoading, dataUpdatedAt: recsUpdatedAt } = useGrowthRecommendations(sellerId);

  // Mutations
  const { mutate: dismissPending } = useDismissPendingAction();
  const { mutate: snoozePending } = useSnoozePendingAction();
  const { mutate: markNotifRead } = useMarkNotificationRead();
  const { mutate: markNotifUnread } = useMarkNotificationUnread();
  const { mutate: markAllNotifsRead } = useMarkAllNotificationsRead();
  const { mutate: updateOrder } = useUpdateOrderStatus();
  const { mutate: markRental } = useMarkRentalCondition();
  const { mutate: dismissRecMutate } = useDismissRecommendation();
  const { mutate: sendMessageToConversation } = useSendMessageToConversation();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const lastUpdatedAt = useMemo(() => {
    return Math.max(
      kpisUpdatedAt ?? 0,
      ordersUpdatedAt ?? 0,
      pendingUpdatedAt ?? 0,
      messagesUpdatedAt ?? 0,
      notificationsUpdatedAt ?? 0,
      chartUpdatedAt ?? 0,
      rentalsUpdatedAt ?? 0,
      customUpdatedAt ?? 0,
      alertsUpdatedAt ?? 0,
      perfUpdatedAt ?? 0,
      recsUpdatedAt ?? 0,
    );
  }, [
    kpisUpdatedAt,
    ordersUpdatedAt,
    pendingUpdatedAt,
    messagesUpdatedAt,
    notificationsUpdatedAt,
    chartUpdatedAt,
    rentalsUpdatedAt,
    customUpdatedAt,
    alertsUpdatedAt,
    perfUpdatedAt,
    recsUpdatedAt,
  ]);

  const lastUpdatedLabel = lastUpdatedAt ? formatRelativeTime(new Date(lastUpdatedAt)) : null;

  const handleRefresh = async () => {
    if (!sellerId || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard-kpis', sellerId] }),
        queryClient.invalidateQueries({ queryKey: ['recent-orders', sellerId] }),
        queryClient.invalidateQueries({ queryKey: ['pending-actions', sellerId] }),
        queryClient.invalidateQueries({ queryKey: ['messages-preview', sellerId] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', sellerId] }),
        queryClient.invalidateQueries({ queryKey: ['revenue-chart', sellerId, chartRange] }),
        queryClient.invalidateQueries({ queryKey: ['rental-overview', sellerId] }),
        queryClient.invalidateQueries({ queryKey: ['custom-order-pipeline', sellerId] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-alerts', sellerId] }),
        queryClient.invalidateQueries({ queryKey: ['performance-insights', sellerId] }),
        queryClient.invalidateQueries({ queryKey: ['growth-recommendations', sellerId] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial loading state
  const isInitialLoading = !user || (kpisLoading && pendingLoading);

  if (isInitialLoading) {
    return <SkeletonDashboard />;
  }

  if (!user) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Please log in to view your seller dashboard.
      </div>
    );
  }

  const hasListings = (kpis?.activeProductsCount ?? 0) > 0;
  const pendingActionsCount = (pendingActions ?? []).filter(
    (a) => !snoozedActions.includes(a.id)
  ).length;

  const visibleRecs = (growthRecs ?? []).filter(r => !dismissedRecommendations.includes(r.id));

  const isMessagesAvailable = (messages ?? []).length > 0;
  const firstUnreadConversation = (messages ?? []).find((msg) => msg.isUnread)?.conversationId ?? (messages ?? [])[0]?.conversationId ?? null;

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleDismissPendingAction = (id: string) => dismissPending(id);
  const handleSnoozePendingAction = (id: string, hours: number) => {
    snoozeAction(id, hours);
    snoozePending({ actionId: id, hours });
  };
  const handleAction = (action: any) => {
    if (action.actionType === 'reply_message' && action.relatedId) {
      setActiveConversationId(action.relatedId);
    } else if (action.actionType === 'confirm_order') {
      window.location.href = `/dashboard/seller/orders/${action.relatedId}`;
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: string) => updateOrder({ orderId, status });
  const handleMessageCustomer = (order: any) => setActiveConversationId(`conv-${order.id}`);
  const handleQuickReply = () => {
    if (firstUnreadConversation) setActiveConversationId(firstUnreadConversation);
  };
  const handleSendMessage = (message: string) => {
    if (!activeConversationId) return;
    sendMessageToConversation({ sellerId, conversationId: activeConversationId, text: message });
  };
  const handleMarkRentalCondition = (id: string, condition: 'good' | 'damaged' | 'needs_cleaning') => markRental({ rentalId: id, condition });
  const handleDismissRec = (id: string) => {
    dismissRecommendation(id);
    dismissRecMutate(id);
  };
  const handleHideRentals = () => dismissOptionalSection('rentals');
  const handleHideCustomOrders = () => dismissOptionalSection('custom_orders');

  return (
    <div className="min-h-screen bg-slate-50">
      <OfflineBanner isOnline={isOnline} lang={language} />
      
      {/* Header section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <WelcomeSection
              displayName={user.displayName ?? 'Seller'}
              hasListings={hasListings}
              pendingActionsCount={pendingActionsCount}
              lang={language}
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <ConnectionStatusIndicator status={socketStatus} lang={language} />
              {lastUpdatedLabel && (
                <p className="text-xs text-muted-foreground">
                  {t('updated_ago', language)} {lastUpdatedLabel}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.location.href = '/dashboard/seller/create'}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Listing
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRefreshing ? t('loading', language) : t('refresh', language)}
            </button>
            <label htmlFor="language-select" className="sr-only">
              Language
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="en">English</option>
              <option value="am">አማርኛ</option>
            </select>
            <div className="hidden sm:block">
              <NotificationsDropdown
                notifications={notifications}
                isLoading={notifsLoading}
                lang={language}
                onMarkRead={(id) => markNotifRead(id)}
                onMarkUnread={(id) => markNotifUnread(id)}
                onMarkAllRead={() => markAllNotifsRead(sellerId)}
              />
            </div>
          </div>
        </div>

        {/* Main KPI Grid */}
        <div className="mb-6">
          <KpiGrid kpis={kpis} isLoading={kpisLoading} lang={language} />
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column - Main Business Content (8 columns) */}
          <div className="space-y-6 lg:col-span-8">
            {/* Pending Actions */}
            <PendingActionsModule
              actions={pendingActions}
              isLoading={pendingLoading}
              lang={language}
              onDismiss={handleDismissPendingAction}
              onSnooze={handleSnoozePendingAction}
              onAction={handleAction}
              snoozedIds={snoozedActions}
            />

            {/* Sales Overview */}
            <SalesOverviewModule
              chartData={revenueChart}
              isLoading={chartLoading}
              range={chartRange}
              onRangeChange={setChartRange}
            />

            {/* Recent Orders */}
            <RecentOrdersSection
              orders={recentOrders}
              isLoading={ordersLoading}
              lang={language}
              onMessageCustomer={handleMessageCustomer}
              onUpdateStatus={handleUpdateOrderStatus}
            />
          </div>

          {/* Right Column - Compact Sidebar (4 columns) */}
          <div className="space-y-4 lg:col-span-4">
            {/* Quick Actions Widget */}
            <QuickActionsWidget
              pinnedActions={pinnedQuickActions}
              lang={language}
              onCustomize={setPinnedQuickActions}
            />

            {/* Messages */}
            <MessagesModule
              messages={messages}
              isLoading={msgsLoading}
              lang={language}
              avgResponseHours={performanceInsights?.avgResponseHours ?? 0}
              onOpenConversation={(id) => setActiveConversationId(id)}
              onQuickReply={handleQuickReply}
              activeFilter={messageFilter}
              onFilterChange={setMessageFilter}
            />

            {/* Inventory Alerts */}
            <InventoryAlertsModule
              alerts={inventoryAlerts}
              isLoading={alertsLoading}
              lang={language}
            />

            {/* Performance Insights */}
            <PerformanceInsightsModule
              insights={performanceInsights}
              isLoading={perfLoading}
              lang={language}
            />

            {visibleRecs.length > 0 && (
              <GrowthRecommendationsSection
                recommendations={visibleRecs}
                isLoading={recsLoading}
                lang={language}
                onDismiss={handleDismissRec}
              />
            )}

            {/* Business Models (Rentals & Custom Orders) */}
            {!hiddenSections.includes('rentals') && (
              <RentalOverviewModule
                rentals={rentals}
                isLoading={rentalsLoading}
                lang={language}
                onMarkCondition={handleMarkRentalCondition}
                onHideSuggestion={handleHideRentals}
              />
            )}
            {!hiddenSections.includes('custom_orders') && (
              <CustomOrderModule
                pipeline={customPipeline}
                isLoading={customLoading}
                lang={language}
                onHideSuggestion={handleHideCustomOrders}
              />
            )}

            {/* Seasonal Suggestions */}
            <SeasonalSuggestionsSection
              lang={language}
              onDismiss={dismissSeasonalSuggestion}
              dismissedIds={dismissedSeasonalSuggestions}
            />
          </div>
        </div>

        {/* Floating Messaging Drawer */}
        <MessageOverlayPanel
          conversationId={activeConversationId}
          conversation={activeConversation}
          isLoading={activeConversationLoading}
          lang={language}
          onSend={handleSendMessage}
          onClose={() => setActiveConversationId(null)}
        />
      </div>
    </div>
  );
}
