'use client';

import React, { useState } from 'react';

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
  useMarkRentalCondition,
  useMessages,
  useNotifications,
  usePendingActions,
  usePerformanceInsights,
  useRecentOrders,
  useRentalOverview,
  useRevenueChart,
  useSnoozePendingAction,
  useUpdateOrderStatus,
} from '../../../hooks/useDashboard';
import { useDashboardStore } from '../../../hooks/useDashboardStore';
import { useOnlineStatus, useRealtimeUpdates } from '../../../hooks/useRealtimeUpdates';

export default function SellerOverviewPage() {
  const user = useAuth((s) => s.user);

  // Global state
  const language = useDashboardStore((s) => s.language);
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

  // Local state for UI overlays
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const sellerId = user?.id ?? '';

  // Network & Realtime
  const isOnline = useOnlineStatus();
  const { status: socketStatus } = useRealtimeUpdates({ sellerId, enabled: !!sellerId && isOnline });

  // Data Queries
  const { data: kpis, isLoading: kpisLoading } = useDashboardKpis(sellerId);
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders(sellerId);
  const { data: pendingActions, isLoading: pendingLoading } = usePendingActions(sellerId);
  const { data: messages, isLoading: msgsLoading } = useMessages(sellerId);
  const { data: notifications, isLoading: notifsLoading } = useNotifications(sellerId);
  const { data: revenueChart, isLoading: chartLoading } = useRevenueChart(sellerId, chartRange);
  const { data: rentals, isLoading: rentalsLoading } = useRentalOverview(sellerId);
  const { data: customPipeline, isLoading: customLoading } = useCustomOrderPipeline(sellerId);
  const { data: inventoryAlerts, isLoading: alertsLoading } = useInventoryAlerts(sellerId);
  const { data: performanceInsights, isLoading: perfLoading } = usePerformanceInsights(sellerId);
  const { data: growthRecs, isLoading: recsLoading } = useGrowthRecommendations(sellerId);

  // Mutations
  const { mutate: dismissPending } = useDismissPendingAction();
  const { mutate: snoozePending } = useSnoozePendingAction();
  const { mutate: markNotifRead } = useMarkNotificationRead();
  const { mutate: markAllNotifsRead } = useMarkAllNotificationsRead();
  const { mutate: updateOrder } = useUpdateOrderStatus();
  const { mutate: markRental } = useMarkRentalCondition();
  const { mutate: dismissRecMutate } = useDismissRecommendation();

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
  const handleMarkRentalCondition = (id: string, condition: 'good' | 'damaged' | 'needs_cleaning') => markRental({ rentalId: id, condition });
  const handleDismissRec = (id: string) => {
    dismissRecommendation(id);
    dismissRecMutate(id);
  };

  return (
    <div className="space-y-6 pb-24">
      <OfflineBanner isOnline={isOnline} lang={language} />
      
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <WelcomeSection
            displayName={user.displayName ?? 'Seller'}
            hasListings={hasListings}
            pendingActionsCount={pendingActionsCount}
            lang={language}
          />
          <div className="mt-2">
            <ConnectionStatusIndicator status={socketStatus} lang={language} />
          </div>
        </div>
        <div className="hidden sm:block">
          <NotificationsDropdown
            notifications={notifications}
            isLoading={notifsLoading}
            lang={language}
            onMarkRead={(id) => markNotifRead(id)}
            onMarkAllRead={() => markAllNotifsRead(sellerId)}
          />
        </div>
      </div>

      {/* Seasonal Alert */}
      <SeasonalSuggestionsSection
        lang={language}
        onDismiss={dismissSeasonalSuggestion}
        dismissedIds={dismissedSeasonalSuggestions}
      />

      {/* Main KPI Grid */}
      <KpiGrid kpis={kpis} isLoading={kpisLoading} lang={language} />

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 gap-6 fashion-xl:grid-cols-3">
        {/* Left Column (Main Focus) */}
        <div className="space-y-6 fashion-xl:col-span-2">
          {/* Urgent / Pending Actions */}
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

          {/* Business Models (Rentals & Custom Orders) */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <RentalOverviewModule
              rentals={rentals}
              isLoading={rentalsLoading}
              lang={language}
              onMarkCondition={handleMarkRentalCondition}
            />
            <CustomOrderModule
              pipeline={customPipeline}
              isLoading={customLoading}
              lang={language}
            />
          </div>
        </div>

        {/* Right Column (Secondary Focus) */}
        <div className="space-y-6">
          {/* Messages */}
          <MessagesModule
            messages={messages}
            isLoading={msgsLoading}
            lang={language}
            avgResponseHours={performanceInsights?.avgResponseHours ?? 0}
            onOpenConversation={(id) => setActiveConversationId(id)}
            activeFilter={messageFilter}
            onFilterChange={setMessageFilter}
          />

          {/* Quick Actions Widget */}
          <QuickActionsWidget
            pinnedActions={pinnedQuickActions}
            lang={language}
            onCustomize={setPinnedQuickActions}
          />

          {/* Inventory Alerts */}
          <InventoryAlertsModule
            alerts={inventoryAlerts}
            isLoading={alertsLoading}
            lang={language}
          />

          {/* Performance & Growth */}
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
        </div>
      </div>

      {/* Floating Messaging Drawer */}
      <MessageOverlayPanel
        conversationId={activeConversationId}
        onClose={() => setActiveConversationId(null)}
      />
    </div>
  );
}
