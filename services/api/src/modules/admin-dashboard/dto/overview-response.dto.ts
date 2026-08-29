export interface KpiMetricDto {
  current: number;
  previous: number;
  pctChange: number | null;
  trend: 'up' | 'down' | 'neutral';
  comparisonLabel: string;
}

export interface NeedsAttentionItemDto {
  key: string;
  title: string;
  count: number;
  severity: 'urgent' | 'warning' | 'info';
  description: string;
  category: string;
  actionUrl: string;
  actionLabel: string;
}

export interface ListingSummaryDto {
  pending: number;
  active: number;
  rejected: number;
  draft: number;
  expired: number;
  sold: number;
  archived: number;
  total: number;
}

export interface UserSellerSummaryDto {
  totalUsers: number;
  newUsersPeriod: number;
  activeUsers: number;
  totalSellers: number;
  newSellersPeriod: number;
  activeSellers: number;
  suspendedUsers: number;
  pendingVerifications: number;
}

export interface OrdersSummaryDto {
  new: number;
  active: number;
  completed: number;
  cancelled: number;
  total: number;
}

export interface RentalsSummaryDto {
  upcoming: number;
  active: number;
  returningOverdue: number;
  completed: number;
  disputed: number;
  total: number;
}

export interface CustomOrdersSummaryDto {
  newRequests: number;
  inProgress: number;
  awaitingAction: number;
  completed: number;
  cancelled: number;
  total: number;
}

export interface ModerationHealthDto {
  openReports: number;
  flaggedListings: number;
  reportedUsers: number;
  suspendedUsers: number;
  chatFlagsPending: number;
  recentlyResolvedReports: number;
}

export interface NotificationsSummaryDto {
  unreadAdminCount: number;
  activeBroadcasts: number;
  sentBroadcastsPeriod: number;
}

export interface SystemHealthDto {
  api: 'operational' | 'degraded' | 'offline';
  database: 'operational' | 'degraded' | 'offline';
  redis: 'operational' | 'degraded' | 'offline';
  search: 'operational' | 'degraded' | 'offline';
  backgroundJobs: 'operational' | 'degraded' | 'offline';
  notifications: 'operational' | 'degraded' | 'offline';
  timestamp: string;
}

export interface OverviewResponseDto {
  range: string;
  dateFrom: string;
  dateTo: string;
  lastUpdated: string;
  kpis: {
    totalUsers: KpiMetricDto;
    activeSellers: KpiMetricDto;
    activeListings: KpiMetricDto;
    orders: KpiMetricDto;
    rentals: KpiMetricDto;
    customOrders: KpiMetricDto;
  };
  needsAttention: NeedsAttentionItemDto[];
  listings: ListingSummaryDto;
  userSeller: UserSellerSummaryDto;
  orders: OrdersSummaryDto;
  rentals: RentalsSummaryDto;
  customOrders: CustomOrdersSummaryDto;
  moderationHealth: ModerationHealthDto;
  notificationsSummary: NotificationsSummaryDto;
  systemHealth: SystemHealthDto;
}

export interface ActivityPointDto {
  date: string;
  newUsers: number;
  newListings: number;
  orders: number;
  rentals: number;
  customOrders: number;
}
