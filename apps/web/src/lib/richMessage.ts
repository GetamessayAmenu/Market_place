// Rich message types and parser/serializer for the JSON envelope convention.
// Plain text messages are backward-compatible; rich messages use a JSON wrapper.

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MessageAttachment {
  url: string;
  name: string;
  type: 'image' | 'file';
  size?: number;
}

export interface ListingRef {
  id: string;
  title: string;
  slug: string;
  price?: number;
  imageUrl?: string;
}

export interface RentalQuoteData {
  pricePerDay: number;
  deposit: number;
  durationDays: number;
  total: number;
}

export interface CustomOrderData {
  measurements?: Record<string, string>;
  fabricChoice?: string;
  colorChoice?: string;
  designNotes?: string;
  status?: string;
}

export type RichMessageType = 'text' | 'listing_ref' | 'custom_order' | 'rental_quote' | 'system';

export interface RichMessage {
  type: RichMessageType;
  body: string;
  attachments?: MessageAttachment[];
  listingRef?: ListingRef;
  quoteData?: RentalQuoteData;
  orderData?: CustomOrderData;
  systemAction?: string;
}

// ─── Parser ──────────────────────────────────────────────────────────────────

/** Parse a message body string into a RichMessage. Falls back to plain text for non-JSON bodies. */
export function parseRichMessage(raw: string): RichMessage {
  if (!raw.startsWith('{')) {
    return { type: 'text', body: raw };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<RichMessage>;
    if (!parsed.type) {
      return { type: 'text', body: raw };
    }
    return {
      type: parsed.type,
      body: parsed.body ?? '',
      ...(parsed.attachments ? { attachments: parsed.attachments } : {}),
      ...(parsed.listingRef ? { listingRef: parsed.listingRef } : {}),
      ...(parsed.quoteData ? { quoteData: parsed.quoteData } : {}),
      ...(parsed.orderData ? { orderData: parsed.orderData } : {}),
      ...(parsed.systemAction ? { systemAction: parsed.systemAction } : {}),
    };
  } catch {
    // Not valid JSON — treat as plain text
    return { type: 'text', body: raw };
  }
}

/** Get a plain text preview of a message (strips JSON, truncates) */
export function getMessagePreview(raw: string, maxLen = 60): string {
  const parsed = parseRichMessage(raw);
  let text = parsed.body;

  // Add type-specific prefix
  switch (parsed.type) {
    case 'listing_ref':
      text = (text ? text + ' ' : '') + '📦 ' + (parsed.listingRef?.title ?? 'Listing');
      break;
    case 'rental_quote':
      text = (text ? text + ' ' : '') + '📋 Rental quote';
      break;
    case 'custom_order':
      text = (text ? text + ' ' : '') + '🎨 Custom order update';
      break;
    case 'system':
      text = '⚙️ ' + (parsed.systemAction?.replace(/_/g, ' ') ?? 'System message');
      break;
  }

  // Add attachment indicator
  if (parsed.attachments && parsed.attachments.length > 0) {
    text += (text ? ' ' : '') + '📎 ' + String(parsed.attachments.length) + ' attachment' + (parsed.attachments.length > 1 ? 's' : '');
  }

  if (text.length > maxLen) {
    return text.slice(0, maxLen) + '…';
  }
  return text;
}

// ─── Serializers ─────────────────────────────────────────────────────────────

export function serializeTextMessage(body: string, attachments?: MessageAttachment[]): string {
  if (!attachments || attachments.length === 0) {
    return body;
  }
  return JSON.stringify({ type: 'text', body, attachments });
}

export function serializeListingRefMessage(listingRef: ListingRef, body?: string): string {
  return JSON.stringify({
    type: 'listing_ref',
    body: body ?? '',
    listingRef,
  });
}

export function serializeRentalQuoteMessage(quoteData: RentalQuoteData, body?: string): string {
  return JSON.stringify({
    type: 'rental_quote',
    body: body ?? 'Here\'s a rental quote for you:',
    quoteData,
  });
}

export function serializeCustomOrderMessage(orderData: CustomOrderData, body?: string): string {
  return JSON.stringify({
    type: 'custom_order',
    body: body ?? 'Custom order update:',
    orderData,
  });
}

export function serializeSystemMessage(systemAction: string, body?: string): string {
  return JSON.stringify({
    type: 'system',
    body: body ?? '',
    systemAction,
  });
}
