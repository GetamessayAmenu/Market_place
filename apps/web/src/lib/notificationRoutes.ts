/**
 * Unified notification route resolver.
 * Ensures every notification navigates to a valid existing page with deep-linking query parameters.
 */

export interface NotificationData {
  actionUrl?: string;
  rentalOrderId?: string;
  orderId?: string;
  customOrderId?: string;
  conversationId?: string;
  listingId?: string;
  isSeller?: boolean;
  isRenter?: boolean;
  role?: string;
  extensionDays?: number;
  approved?: boolean;
  [key: string]: any;
}

export interface NotificationPayload {
  id?: string;
  type?: string;
  title?: string;
  body?: string | null;
  data?: NotificationData | null;
}

export function getNotificationActionUrl(
  notification: NotificationPayload,
  isCurrentSellerContext?: boolean,
): string {
  const data = notification.data || {};
  
  // Normalize existing actionUrl if present
  if (data.actionUrl && typeof data.actionUrl === 'string' && data.actionUrl.trim().length > 0) {
    const raw = data.actionUrl.trim();
    // Normalize legacy direct paths to query parameter format
    const legacyRental = raw.match(/^\/dashboard\/rentals\/([0-9a-f-]+)$/i);
    if (legacyRental) return `/dashboard/rentals?orderId=${legacyRental[1]}`;

    const legacySellerRental = raw.match(/^\/seller\/orders\/rental-queue\/([0-9a-f-]+)$/i);
    if (legacySellerRental) return `/seller/orders/rental-queue?orderId=${legacySellerRental[1]}`;

    const legacyCustom = raw.match(/^\/dashboard\/custom-orders\/([0-9a-f-]+)$/i);
    if (legacyCustom) return `/dashboard/custom-orders?orderId=${legacyCustom[1]}`;

    return raw;
  }

  const titleLower = (notification.title || '').toLowerCase();
  const type = (notification.type || '').toLowerCase();

  // 1. Rental notifications (check explicit rentalOrderId, rental keywords, or extension fields)
  const isRentalOrder =
    Boolean(data.rentalOrderId) ||
    Boolean(data.extensionDays) ||
    data.approved !== undefined ||
    type.startsWith('rental') ||
    titleLower.includes('rental') ||
    titleLower.includes('extension') ||
    titleLower.includes('pickup') ||
    titleLower.includes('overdue');

  if (isRentalOrder && (data.rentalOrderId || data.orderId)) {
    const targetRentalId = String(data.rentalOrderId || data.orderId).trim();

    // Seller keywords in notification title
    const sellerKeywords = [
      'extension request',
      'return initiated',
      'overdue notice',
      'rental request',
      'renter accepted',
      'renter declined',
      'requested extension',
      'new rental request',
    ];

    // Renter keywords in notification title
    const renterKeywords = [
      'extension approved',
      'extension declined',
      'ready for pickup',
      'rental started',
      'rental completed',
      'return verified',
      'penalty settlement required',
      'penalty fee accruing',
      'alternative dates suggested',
      'rental request accepted',
      'rental request declined',
    ];

    const hasSellerKeyword = sellerKeywords.some((kw) => titleLower.includes(kw));
    const hasRenterKeyword = renterKeywords.some((kw) => titleLower.includes(kw));

    const isSeller =
      data.isSeller === true ||
      data.role === 'seller' ||
      type === 'rental_request_received' ||
      (hasSellerKeyword && !hasRenterKeyword) ||
      (Boolean(isCurrentSellerContext) && !hasRenterKeyword);

    if (isSeller) {
      return `/seller/orders/rental-queue?orderId=${encodeURIComponent(targetRentalId)}`;
    }
    return `/dashboard/rentals?orderId=${encodeURIComponent(targetRentalId)}`;
  }

  // 2. Chat / Conversation notifications
  if (data.conversationId) {
    const convId = encodeURIComponent(String(data.conversationId).trim());
    return `/dashboard/messages?conversation=${convId}&conversationId=${convId}`;
  }

  // 3. Custom Orders
  if (data.customOrderId) {
    return `/dashboard/custom-orders?orderId=${encodeURIComponent(String(data.customOrderId).trim())}`;
  }

  // 4. Standard Orders (Sales)
  if (data.orderId) {
    const orderId = String(data.orderId).trim();
    const isSeller =
      data.isSeller === true ||
      data.role === 'seller' ||
      type === 'new_order' ||
      titleLower.includes('new order received') ||
      Boolean(isCurrentSellerContext);

    if (isSeller) {
      return `/seller/orders/${encodeURIComponent(orderId)}`;
    }
    return `/dashboard/orders/${encodeURIComponent(orderId)}`;
  }

  // 5. Listings
  if (data.listingId) {
    const listingId = String(data.listingId).trim();
    if (type === 'listing_rejected') {
      return `/seller/catalog/${encodeURIComponent(listingId)}/edit`;
    }
    return `/products/${encodeURIComponent(listingId)}`;
  }

  // 6. Reports & Disputes
  if (type === 'report_update') {
    return '/dashboard/disputes';
  }

  // 7. Verification Updates
  if (type === 'verification_update') {
    return isCurrentSellerContext ? '/seller/settings' : '/verification-status';
  }

  return '/dashboard/notifications';
}
