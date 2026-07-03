/**
 * i18n string maps for the Seller Dashboard.
 * Supports English (en) and Amharic (am).
 */

export type Lang = 'en' | 'am';

const strings = {
  // ─── Greetings ──────────────────────────────────────────────────────────────
  greeting_morning: { en: 'Good morning', am: 'እንደምን አደሩ' },
  greeting_afternoon: { en: 'Good afternoon', am: 'እንደምን ዋሉ' },
  greeting_evening: { en: 'Good evening', am: 'እንደምን አመሹ' },

  // ─── Dashboard headers ──────────────────────────────────────────────────────
  dashboard_title: { en: "Your Seller Dashboard", am: 'የሻጭ ዳሽቦርድ' },
  dashboard_subtitle: { en: "Here's how your shop is performing today.", am: 'ዛሬ ሱቅዎ እንዴት እንደሚሠራ ይኸው።' },
  sales_overview_title: { en: 'Revenue Overview', am: 'የገቢ አጠቃላይ እይታ' },

  // ─── KPI Cards ──────────────────────────────────────────────────────────────
  kpi_todays_revenue: { en: "Today's Revenue", am: 'የዛሬ ገቢ' },
  kpi_pending_actions: { en: 'Pending Actions', am: 'በጠባቂ ላይ ያሉ እርምጃዎች' },
  kpi_active_products: { en: 'Active Products', am: 'ንቁ ምርቶች' },
  kpi_total_messages: { en: 'Total Messages', am: 'ጠቅላላ መልዕክቶች' },
  kpi_weekly_performance: { en: "This Week's Performance", am: 'የዚህ ሳምንት አፈጻጸም' },
  kpi_vs_yesterday: { en: 'vs yesterday', am: 'ከትናንት ጋር ሲነፃፀር' },
  kpi_no_sales_yet: { en: 'No sales yet today', am: 'ዛሬ ሽያጭ የለም' },
  kpi_all_clear: { en: 'All caught up!', am: 'ሁሉም ተጠናቋል!' },
  kpi_unread: { en: 'unread', am: 'ያልተነበቡ' },

  // ─── Pending Actions ────────────────────────────────────────────────────────
  pending_title: { en: 'Pending Actions', am: 'በጠባቂ ላይ ያሉ እርምጃዎች' },
  pending_critical: { en: 'Critical', am: 'አስቸኳይ' },
  pending_important: { en: 'Important', am: 'አስፈላጊ' },
  pending_info: { en: 'Info', am: 'መረጃ' },
  pending_dismiss: { en: 'Dismiss', am: 'አሰናብት' },
  pending_snooze: { en: 'Snooze', am: 'አስቆይ' },
  pending_snooze_1h: { en: '1 hour', am: '1 ሰዓት' },
  pending_snooze_4h: { en: '4 hours', am: '4 ሰዓት' },
  pending_snooze_1d: { en: '1 day', am: '1 ቀን' },
  pending_confirm_order: { en: 'Confirm Order', am: 'ትዕዛዙን አረጋግጥ' },
  pending_reply: { en: 'Reply', am: 'መልስ ስጥ' },
  pending_renew: { en: 'Renew Listing', am: 'ዝርዝርን አድስ' },

  // ─── Quick Actions ──────────────────────────────────────────────────────────
  qa_title: { en: 'Quick Actions', am: 'ፈጣን እርምጃዎች' },
  qa_new_listing: { en: 'New Listing', am: 'አዲስ ዝርዝር' },
  qa_manage_listings: { en: 'Manage Listings', am: 'ዝርዝሮችን አቻ' },
  qa_manage_inventory: { en: 'Manage Inventory', am: 'ክምችት አቻ' },
  qa_view_orders: { en: 'View Orders', am: 'ትዕዛዞችን ይዩ' },
  qa_view_analytics: { en: 'View Analytics', am: 'ትንታኔዎችን ይዩ' },
  qa_seller_settings: { en: 'Seller Settings', am: 'የሻጭ ቅንጅቶች' },
  qa_promote_listings: { en: 'Promote Listings', am: 'ዝርዝሮችን አስተዋውቅ' },
  qa_view_reviews: { en: 'View Reviews', am: 'ግምገማዎችን ይዩ' },
  qa_download_reports: { en: 'Download Reports', am: 'ሪፖርቶችን አውርድ' },
  qa_customize: { en: 'Customize', am: 'አበጃጅ' },

  // ─── Orders ─────────────────────────────────────────────────────────────────
  orders_title: { en: 'Recent Orders', am: 'የቅርብ ጊዜ ትዕዛዞች' },
  orders_view_all: { en: 'View all orders', am: 'ሁሉንም ትዕዛዞች ይዩ' },
  orders_view_details: { en: 'View Details', am: 'ዝርዝሮችን ይዩ' },
  orders_message_customer: { en: 'Message Customer', am: 'ደንበኛን ይልዑ' },
  orders_update_status: { en: 'Update Status', am: 'ሁኔታ አዘምን' },
  orders_status_new: { en: 'New', am: 'አዲስ' },
  orders_status_confirmed: { en: 'Confirmed', am: 'ተረጋገጠ' },
  orders_status_shipped: { en: 'Shipped', am: 'ተላከ' },
  orders_status_delivered: { en: 'Delivered', am: 'ደረሰ' },
  orders_status_completed: { en: 'Completed', am: 'ተጠናቀቀ' },
  orders_type_sale: { en: 'Sale', am: 'ሽያጭ' },
  orders_type_rent: { en: 'Rent', am: 'ኪራይ' },
  orders_type_custom: { en: 'Custom', am: 'ብጁ' },

  // ─── Messages ───────────────────────────────────────────────────────────────
  messages_title: { en: 'Messages', am: 'መልዕክቶች' },
  messages_response_time: { en: 'You typically respond within', am: 'ብዙውን ጊዜ በ ውስጥ ምላሽ ትሰጣለህ' },
  messages_quick_reply: { en: 'Quick Reply', am: 'ፈጣን ምላሽ' },
  messages_filter_all: { en: 'All', am: 'ሁሉ' },
  messages_filter_inquiries: { en: 'Inquiries', am: 'ጥያቄዎች' },
  messages_filter_orders: { en: 'Orders', am: 'ትዕዛዞች' },
  messages_filter_rentals: { en: 'Rentals', am: 'ኪራዮች' },
  messages_filter_custom: { en: 'Custom Requests', am: 'ብጁ ጥያቄዎች' },
  messages_no_messages: { en: "Buyers message active sellers", am: 'ገዢዎች ንቁ ሻጮችን ይልዑሉ' },

  // ─── Notifications ──────────────────────────────────────────────────────────
  notif_title: { en: 'Notifications', am: 'ማሳወቂያዎች' },
  notif_mark_read: { en: 'Mark as read', am: 'እንደተነበበ ምልክት አድርግ' },
  notif_mark_unread: { en: 'Mark as unread', am: 'ያልተነበበ ምልክት አድርግ' },
  notif_clear_all: { en: 'Clear all', am: 'ሁሉንም አጽዳ' },
  notif_preferences: { en: 'Notification Preferences', am: 'የማሳወቂያ ምርጫዎች' },

  // ─── Performance Insights ───────────────────────────────────────────────────
  perf_title: { en: 'Performance Insights', am: 'የአፈጻጸም ምልከታዎች' },
  perf_health_score: { en: 'Business Health Score', am: 'የንግድ ጤና ነጥብ' },
  perf_listing_quality: { en: 'Listing Quality', am: 'የዝርዝር ጥራት' },
  perf_response_time: { en: 'Response Time', am: 'የምላሽ ጊዜ' },
  perf_fulfillment_rate: { en: 'Fulfillment Rate', am: 'የምሳሌ መጠን' },
  perf_peer_comparison: { en: 'Peer Comparison', am: 'የእኩያ ንፅፅር' },

  // ─── Rental Overview ────────────────────────────────────────────────────────
  rental_title: { en: 'Rental Overview', am: 'የኪራይ ዝርዝር' },
  rental_active: { en: 'Active Rentals', am: 'ንቁ ኪራዮች' },
  rental_utilization: { en: 'Utilization Rate', am: 'የአጠቃቀም መጠን' },
  rental_returns: { en: 'Expected Returns', am: 'የሚጠበቁ ተመላሾች' },
  rental_overdue: { en: 'Overdue', am: 'ዘግይቷል' },
  rental_condition: { en: 'Mark Condition', am: 'ሁኔታ ምልክት አድርግ' },
  rental_good: { en: 'Good', am: 'ጥሩ' },
  rental_damaged: { en: 'Damaged', am: 'ተበላሽቷል' },
  rental_needs_cleaning: { en: 'Needs Cleaning', am: 'ማፅዳት ያስፈልጋል' },

  // ─── Custom Orders ──────────────────────────────────────────────────────────
  custom_title: { en: 'Custom Order Pipeline', am: 'የብጁ ትዕዛዝ ቧንቧ' },
  custom_new: { en: 'New Requests', am: 'አዲስ ጥያቄዎች' },
  custom_in_production: { en: 'In Production', am: 'በምርት ላይ' },
  custom_ready: { en: 'Ready', am: 'ዝግጁ' },
  custom_delivered: { en: 'Delivered', am: 'ደርሷል' },
  custom_urgent: { en: 'Urgent Deadlines', am: 'አስቸኳይ የጊዜ ገደቦች' },

  // ─── Inventory Alerts ───────────────────────────────────────────────────────
  inventory_title: { en: 'Inventory Alerts', am: 'የክምችት ማሳወቂያዎች' },
  inventory_low_stock: { en: 'Low stock', am: 'ክምችት ዝቅተኛ ነው' },
  inventory_out_of_stock: { en: 'Out of stock', am: 'ክምችት አልቋል' },
  inventory_expiring: { en: 'Listing expiring soon', am: 'ዝርዝሩ ይጠናቀቃል' },
  inventory_few_photos: { en: 'Add more photos', am: 'ተጨማሪ ፎቶዎች ጨምር' },
  inventory_incomplete: { en: 'Incomplete listing', am: 'ያልተሟላ ዝርዝር' },

  // ─── Empty States ───────────────────────────────────────────────────────────
  empty_no_listings_title: { en: 'Start selling in 5 minutes', am: 'በ5 ደቂቃ ሽያጭ ጀምር' },
  empty_no_listings_desc: { en: 'Create your first listing and reach thousands of buyers across Ethiopia.', am: 'የመጀመሪያ ዝርዝርህን ፍጠር እና በኢትዮጵያ ውስጥ ሺዎች ገዢዎችን ደርስ።' },
  empty_create_first: { en: 'Create Your First Listing', am: 'የመጀመሪያ ዝርዝርህን ፍጠር' },
  empty_no_orders_title: { en: 'Boost your first sale', am: 'የመጀመሪያ ሽያጭህን ጨምር' },
  empty_no_orders_desc: { en: 'Complete your listings to attract buyers: add 5+ photos, write detailed descriptions, and price competitively.', am: 'ገዢዎችን ለመሳብ ዝርዝሮቹን አጠናቅ።' },
  empty_no_messages_title: { en: 'No messages yet', am: 'ምንም መልዕክቶች የሉም' },
  empty_no_messages_desc: { en: 'Buyers message active sellers — enable quick responses to get more inquiries!', am: 'ገዢዎች ንቁ ሻጮችን ይልዑሉ — ፈጣን ምላሾችን ንቃ!' },
  empty_no_rentals_title: { en: 'Unlock rental income', am: 'የኪራይ ገቢ ፍቀድ' },
  empty_no_rentals_desc: { en: 'Add rental items to earn passive income — learn how to get started.', am: 'ለምን? የኪራይ ዕቃዎችን ጨምር።' },
  empty_no_custom_title: { en: 'Accept custom orders to increase revenue by 40%', am: 'ብጁ ትዕዛዞችን ተቀበል' },
  empty_no_custom_desc: { en: 'Set up custom order intake to attract buyers who want bespoke fashion.', am: 'ብጁ ዋጋ ጥያቄ ቅርፊቱን ቀርጸህ ጀምር።' },

  // ─── General UI ─────────────────────────────────────────────────────────────
  retry: { en: 'Retry', am: 'እንደገና ሞክር' },
  loading: { en: 'Loading...', am: 'በመጫን ላይ...' },
  error_generic: { en: 'Something went wrong', am: 'የሆነ ችግር ተፈጠረ' },
  offline_banner: { en: "You're offline — showing cached data", am: 'ከመስመር ውጪ ነዎት — የተቀመጠ ውሂብ እያሳዩ ነው' },
  live_paused: { en: 'Live updates paused — reconnecting...', am: 'ቀጥታ ዝማኔዎች ቁራጭ — እንደገና እያገናኘ...' },
  refresh: { en: 'Refresh', am: 'አድስ' },
  updated_ago: { en: 'Updated', am: 'ዘምኗል' },
  view_all: { en: 'View all', am: 'ሁሉንም ይዩ' },
  dismiss: { en: 'Dismiss', am: 'አሰናብት' },
  not_interested: { en: 'Not interested', am: 'ፍላጎት የለኝም' },
  create_sale: { en: 'Create Sale', am: 'ሽያጭ ፍጠር' },
  learn_how: { en: 'Learn how', am: 'ወይ እንዴት' },
} as const;

type StringKey = keyof typeof strings;

/**
 * Translate a string key to the given language.
 * Falls back to English if Amharic is not available.
 */
export function t(key: StringKey, lang: Lang = 'en'): string {
  const entry = strings[key];
  if (!entry) return key;
  return (entry as Record<Lang, string>)[lang] ?? (entry as Record<string, string>)['en'] ?? key;
}

export type { StringKey };
export { strings };
