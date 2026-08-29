/**
 * Realistic mock data for the Seller Dashboard.
 * These types and values mirror what real API responses would return.
 * Replace API calls in dashboardApi.ts with real endpoints when ready.
 */

import { maskName } from './formatters';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardKpis {
  todaysRevenue: number;
  todaysRevenueChange: number; // percentage vs yesterday
  pendingActionsCount: number;
  activeProductsCount: number;
  unreadMessagesCount: number;
  latestMessagePreview: string;
  weekRevenue: number;
  weekOrdersFulfilled: number;
  weekConversionRate: number; // percentage
}

export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
export type OrderType = 'sale' | 'rent' | 'custom';
export type ActionUrgency = 'critical' | 'important' | 'info';

export interface RecentOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  type: OrderType;
  customerName: string; // already masked
  customerCity: string;
  itemTitle: string;
  value: number;
  createdAt: string; // ISO
}

export interface PendingAction {
  id: string;
  urgency: ActionUrgency;
  title: string;
  description: string;
  actionLabel: string;
  actionType: 'confirm_order' | 'reply_message' | 'renew_listing' | 'update_status' | 'other';
  relatedId?: string; // orderId, listingId, etc.
  createdAt: string;
}

export interface MessagePreview {
  id: string;
  conversationId: string;
  customerName: string;
  snippet: string; // max 50 chars
  timestamp: string;
  isUnread: boolean;
  type: 'inquiry' | 'order' | 'rental' | 'custom';
}

export interface ConversationMessage {
  id: string;
  sender: 'buyer' | 'seller';
  text: string;
  createdAt: string;
}

export interface MessageConversation {
  conversationId: string;
  customerName: string;
  listingTitle: string;
  messages: ConversationMessage[];
  unreadCount: number;
}

export interface RentalItem {
  id: string;
  title: string;
  customerName: string; // masked
  rentalStartDate: string;
  rentalEndDate: string;
  returnDate: string;
  totalDaysBooked: number;
  totalDaysAvailable: number;
  status: 'active' | 'overdue' | 'returned';
  needsInspection: boolean;
}

export interface CustomOrderPipeline {
  newRequests: number;
  inProduction: number;
  ready: number;
  delivered: number;
  awaitingDesignApproval: number;
  awaitingMaterials: number;
  avgProductionDays: number;
  avgProductionDaysChange: number; // vs previous period
  urgentDeadlines: {
    id: string;
    title: string;
    customerName: string;
    daysUntilDeadline: number;
  }[];
}

export interface InventoryAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring' | 'few_photos' | 'incomplete';
  listingId: string;
  listingTitle: string;
  message: string;
  severity: 'warning' | 'error' | 'info';
}

export interface PerformanceInsights {
  healthScore: number; // 0-100
  listingQualityScore: number;
  responseTimeScore: number;
  fulfillmentRateScore: number;
  avgResponseHours: number;
  peerPercentile: number; // e.g. 75 = top 25%
  tips: {
    id: string;
    message: string;
    impact: string;
    priority: number;
  }[];
}

export interface GrowthRecommendation {
  id: string;
  title: string;
  description: string;
  impact: string;
  category: 'pricing' | 'cross_sell' | 'listing_quality' | 'timing' | 'category';
}

export interface Notification {
  id: string;
  type: 'order' | 'message' | 'listing_update' | 'system' | 'milestone';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  linkUrl?: string;
}

export interface RevenueChartPoint {
  label: string;
  value: number;
  date: string;
  category: 'sale' | 'rent' | 'custom';
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function hoursAgo(n: number): string {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

export const MOCK_KPIS: DashboardKpis = {
  todaysRevenue: 4250,
  todaysRevenueChange: 12.5,
  pendingActionsCount: 5,
  activeProductsCount: 23,
  unreadMessagesCount: 7,
  latestMessagePreview: 'Is this dress available in size M?',
  weekRevenue: 28750,
  weekOrdersFulfilled: 14,
  weekConversionRate: 3.8,
};

export const MOCK_RECENT_ORDERS: RecentOrder[] = [
  {
    id: 'ord-001',
    orderNumber: 'MKT-2024-0891',
    status: 'new',
    type: 'sale',
    customerName: maskName('Hirut Tadesse'),
    customerCity: 'Addis Ababa',
    itemTitle: 'Habesha Kemis – Green Embroidery',
    value: 2200,
    createdAt: hoursAgo(2),
  },
  {
    id: 'ord-002',
    orderNumber: 'MKT-2024-0890',
    status: 'confirmed',
    type: 'custom',
    customerName: maskName('Selam Bekele'),
    customerCity: 'Bahir Dar',
    itemTitle: 'Custom Bridesmaid Dress – Ivory',
    value: 5500,
    createdAt: hoursAgo(18),
  },
  {
    id: 'ord-003',
    orderNumber: 'MKT-2024-0889',
    status: 'shipped',
    type: 'sale',
    customerName: maskName('Dawit Girma'),
    customerCity: 'Dire Dawa',
    itemTitle: 'Men\'s Traditional Suit',
    value: 3800,
    createdAt: daysAgo(1),
  },
  {
    id: 'ord-004',
    orderNumber: 'MKT-2024-0885',
    status: 'delivered',
    type: 'rent',
    customerName: maskName('Meron Alemu'),
    customerCity: 'Hawassa',
    itemTitle: 'Wedding Dress – Rental',
    value: 800,
    createdAt: daysAgo(3),
  },
  {
    id: 'ord-005',
    orderNumber: 'MKT-2024-0880',
    status: 'completed',
    type: 'sale',
    customerName: maskName('Yohannes Tesfaye'),
    customerCity: 'Gondar',
    itemTitle: 'Silk Scarf – Handwoven',
    value: 1200,
    createdAt: daysAgo(5),
  },
];

export const MOCK_PENDING_ACTIONS: PendingAction[] = [
  {
    id: 'pa-001',
    urgency: 'critical',
    title: 'Order awaiting confirmation',
    description: 'Order #MKT-2024-0891 from Hirut T. has been waiting 2+ hours for confirmation.',
    actionLabel: 'Confirm Order',
    actionType: 'confirm_order',
    relatedId: 'ord-001',
    createdAt: hoursAgo(26),
  },
  {
    id: 'pa-002',
    urgency: 'critical',
    title: 'Unanswered message',
    description: 'Buyer Selam B. has been waiting 14 hours for a reply about sizing.',
    actionLabel: 'Reply Now',
    actionType: 'reply_message',
    relatedId: 'msg-003',
    createdAt: hoursAgo(14),
  },
  {
    id: 'pa-003',
    urgency: 'important',
    title: 'Listing pending admin approval',
    description: '"Blue Silk Habesha Kemis" has been pending review for 2 days.',
    actionLabel: 'View Listing',
    actionType: 'other',
    relatedId: 'lst-042',
    createdAt: daysAgo(2),
  },
  {
    id: 'pa-004',
    urgency: 'important',
    title: 'Low stock warning',
    description: '"Men\'s Gabi – White Cotton" only has 3 units left.',
    actionLabel: 'Update Stock',
    actionType: 'update_status',
    relatedId: 'lst-015',
    createdAt: daysAgo(1),
  },
  {
    id: 'pa-005',
    urgency: 'info',
    title: 'Listing expiring soon',
    description: '"Embroidered Evening Shawl" expires in 5 days (auto-expire after 60 days).',
    actionLabel: 'Renew Listing',
    actionType: 'renew_listing',
    relatedId: 'lst-028',
    createdAt: daysAgo(55),
  },
];

export const MOCK_MESSAGES: MessagePreview[] = [
  {
    id: 'msg-001',
    conversationId: 'conv-001',
    customerName: maskName('Hirut Tadesse'),
    snippet: 'Is this dress available in size M?',
    timestamp: hoursAgo(2),
    isUnread: true,
    type: 'inquiry',
  },
  {
    id: 'msg-002',
    conversationId: 'conv-002',
    customerName: maskName('Abebe Kebede'),
    snippet: 'Thank you! Can you ship to Mekelle?',
    timestamp: hoursAgo(5),
    isUnread: true,
    type: 'order',
  },
  {
    id: 'msg-003',
    conversationId: 'conv-003',
    customerName: maskName('Selam Bekele'),
    snippet: 'I want measurements for the kemis please',
    timestamp: hoursAgo(14),
    isUnread: true,
    type: 'custom',
  },
];

export const MOCK_MESSAGE_CONVERSATIONS: MessageConversation[] = [
  {
    conversationId: 'conv-001',
    customerName: maskName('Hirut Tadesse'),
    listingTitle: 'Habesha Kemis – Green Embroidery',
    unreadCount: 1,
    messages: [
      {
        id: 'mconv-001-1',
        sender: 'buyer',
        text: 'Is this dress available in size M?',
        createdAt: hoursAgo(2),
      },
      {
        id: 'mconv-001-2',
        sender: 'seller',
        text: 'Yes, we have size M available. Would you like measurements too?',
        createdAt: hoursAgo(1),
      },
    ],
  },
  {
    conversationId: 'conv-002',
    customerName: maskName('Abebe Kebede'),
    listingTitle: 'Men’s Traditional Suit',
    unreadCount: 1,
    messages: [
      {
        id: 'mconv-002-1',
        sender: 'seller',
        text: 'Your item is ready for shipping.',
        createdAt: hoursAgo(8),
      },
      {
        id: 'mconv-002-2',
        sender: 'buyer',
        text: 'Thank you! Can you ship to Mekelle?',
        createdAt: hoursAgo(5),
      },
    ],
  },
  {
    conversationId: 'conv-003',
    customerName: maskName('Selam Bekele'),
    listingTitle: 'Custom Bridesmaid Dress – Ivory',
    unreadCount: 1,
    messages: [
      {
        id: 'mconv-003-1',
        sender: 'buyer',
        text: 'I want measurements for the kemis please',
        createdAt: hoursAgo(14),
      },
    ],
  },
];

export const MOCK_RENTAL_ITEMS: RentalItem[] = [
  {
    id: 'rent-001',
    title: 'Wedding Dress – White Lace',
    customerName: maskName('Tigist Haile'),
    rentalStartDate: daysAgo(5),
    rentalEndDate: new Date(Date.now() + 2 * 86400000).toISOString(), // 2 days from now
    returnDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    totalDaysBooked: 22,
    totalDaysAvailable: 30,
    status: 'active',
    needsInspection: false,
  },
  {
    id: 'rent-002',
    title: 'Groom\'s Suit – Navy Blue',
    customerName: maskName('Dawit Mulatu'),
    rentalStartDate: daysAgo(8),
    rentalEndDate: daysAgo(1),
    returnDate: daysAgo(1),
    totalDaysBooked: 10,
    totalDaysAvailable: 30,
    status: 'overdue',
    needsInspection: true,
  },
  {
    id: 'rent-003',
    title: 'Traditional Habesha Dress Set',
    customerName: maskName('Meron Tesfaye'),
    rentalStartDate: daysAgo(2),
    rentalEndDate: new Date(Date.now() + 8 * 86400000).toISOString(),
    returnDate: new Date(Date.now() + 8 * 86400000).toISOString(),
    totalDaysBooked: 28,
    totalDaysAvailable: 30,
    status: 'active',
    needsInspection: false,
  },
];

export const MOCK_CUSTOM_ORDER_PIPELINE: CustomOrderPipeline = {
  newRequests: 3,
  inProduction: 5,
  ready: 2,
  delivered: 8,
  awaitingDesignApproval: 2,
  awaitingMaterials: 1,
  avgProductionDays: 6.5,
  avgProductionDaysChange: -0.8, // improved by 0.8 days
  urgentDeadlines: [
    {
      id: 'co-001',
      title: 'Bridesmaid Set – 6 pieces',
      customerName: maskName('Betelehem Girma'),
      daysUntilDeadline: 2,
    },
    {
      id: 'co-002',
      title: 'Custom Habesha for Wedding',
      customerName: maskName('Eden Wolde'),
      daysUntilDeadline: 1,
    },
  ],
};

export const MOCK_INVENTORY_ALERTS: InventoryAlert[] = [
  {
    id: 'inv-001',
    type: 'low_stock',
    listingId: 'lst-015',
    listingTitle: "Men's Gabi – White Cotton",
    message: 'Only 3 units remaining. Restock soon to avoid missed sales.',
    severity: 'warning',
  },
  {
    id: 'inv-002',
    type: 'out_of_stock',
    listingId: 'lst-033',
    listingTitle: 'Silk Headscarf – Burgundy',
    message: 'Out of stock with 5 inquiries in the last 7 days. Add inventory to capture demand.',
    severity: 'error',
  },
  {
    id: 'inv-003',
    type: 'expiring',
    listingId: 'lst-028',
    listingTitle: 'Embroidered Evening Shawl',
    message: 'Listing expires in 5 days (after 60 days auto-expire). Renew to stay visible.',
    severity: 'warning',
  },
  {
    id: 'inv-004',
    type: 'few_photos',
    listingId: 'lst-041',
    listingTitle: 'Modern Habesha Kemis – Blue',
    message: 'Only 2 photos. Listings with 5+ photos get 2× more views.',
    severity: 'info',
  },
];

export const MOCK_PERFORMANCE_INSIGHTS: PerformanceInsights = {
  healthScore: 72,
  listingQualityScore: 68,
  responseTimeScore: 71,
  fulfillmentRateScore: 80,
  avgResponseHours: 4.5,
  peerPercentile: 68,
  tips: [
    {
      id: 'tip-001',
      message: 'Your response time (4.5 hours) is slower than average (2 hours)',
      impact: 'Faster responses increase sales by 30%',
      priority: 1,
    },
    {
      id: 'tip-002',
      message: 'You have 3 listings with fewer than 5 photos',
      impact: 'Listings with 5+ photos get 2× more views',
      priority: 2,
    },
    {
      id: 'tip-003',
      message: 'You have 1 listing missing a price',
      impact: 'Add a price to increase conversion',
      priority: 3,
    },
  ],
};

export const MOCK_GROWTH_RECOMMENDATIONS: GrowthRecommendation[] = [
  {
    id: 'rec-001',
    title: 'Optimize pricing on "Blue Silk Habesha Kemis"',
    description: 'Your price (ETB 2,800) is 25% higher than similar items. Similar dresses sell 3× faster at ETB 2,200.',
    impact: 'Est. +3 sales/month',
    category: 'pricing',
  },
  {
    id: 'rec-002',
    title: 'Cross-sell accessories to dress buyers',
    description: 'Customers who buy Habesha Kemis also search for matching headbands and jewelry. Add these to your shop.',
    impact: 'Est. +ETB 1,500/month',
    category: 'cross_sell',
  },
  {
    id: 'rec-003',
    title: 'Add measurements to clothing listings',
    description: '5 of your clothing listings have no size measurements. Adding them reduces return rate.',
    impact: 'Reduces returns by 40%',
    category: 'listing_quality',
  },
  {
    id: 'rec-004',
    title: 'Post new listings on Thursday evenings',
    description: 'Your listings posted Thursday 6–9 PM get 25% more views in the first 48 hours.',
    impact: '+25% first-week views',
    category: 'timing',
  },
  {
    id: 'rec-005',
    title: 'Explore accessories category',
    description: 'Habesha Kemis sellers in your area who also sell matching jewelry earn 40% more monthly.',
    impact: 'Potential +ETB 3,000/month',
    category: 'category',
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    type: 'order',
    title: 'New order received!',
    body: 'Hirut T. placed an order for Habesha Kemis – Green Embroidery (ETB 2,200)',
    isRead: false,
    createdAt: hoursAgo(2),
    linkUrl: '/dashboard/seller/orders/ord-001',
  },
  {
    id: 'notif-002',
    type: 'message',
    title: 'New message from Selam B.',
    body: 'I want measurements for the kemis please',
    isRead: false,
    createdAt: hoursAgo(14),
    linkUrl: '/dashboard/seller/messages',
  },
  {
    id: 'notif-003',
    type: 'milestone',
    title: "You've reached 50 sales! 🎉",
    body: "Congratulations! You're in the top 30% of sellers in your category.",
    isRead: false,
    createdAt: daysAgo(1),
  },
  {
    id: 'notif-004',
    type: 'listing_update',
    title: 'Listing approved',
    body: '"Traditional Gabi – Hand-woven" has been approved and is now live.',
    isRead: true,
    createdAt: daysAgo(2),
    linkUrl: '/dashboard/seller/listings',
  },
  {
    id: 'notif-005',
    type: 'system',
    title: 'Policy update',
    body: 'We updated our seller terms. Please review the changes before June 30.',
    isRead: true,
    createdAt: daysAgo(3),
  },
  {
    id: 'notif-006',
    type: 'order',
    title: 'Order completed',
    body: 'Order #MKT-2024-0880 from Yohannes T. has been marked as completed.',
    isRead: true,
    createdAt: daysAgo(5),
  },
];

export function generateRevenueChartData(range: '7d' | '30d' | '90d' | '1y'): RevenueChartPoint[] {
  const configs = {
    '7d': { days: 7, fmt: (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short' }) },
    '30d': { days: 30, fmt: (d: Date) => `${d.getDate()}` },
    '90d': { days: 90, fmt: (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
    '1y': { days: 365, fmt: (d: Date) => d.toLocaleDateString('en-US', { month: 'short' }) },
  };
  const { days, fmt } = configs[range];
  const step = range === '1y' ? 30 : range === '90d' ? 7 : 1;
  const points: RevenueChartPoint[] = [];

  // Sample every `step` days
  for (let i = days; i >= 0; i -= step) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const base = 2000 + Math.random() * 3000;
    // Add slight upward trend
    const trend = ((days - i) / days) * 1500;
    const noise = (Math.random() - 0.5) * 800;
    points.push({
      label: fmt(d),
      value: Math.max(0, Math.round(base + trend + noise)),
      date: d.toISOString(),
      category: 'sale',
    });
  }

  return points;
}
