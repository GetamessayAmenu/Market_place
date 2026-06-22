import type { CustomOrder, Prisma } from '@prisma/client';

export interface SerializedCustomOrder {
  readonly id: string;
  readonly listingId: string;
  readonly buyerId: string;
  readonly sellerId: string;
  readonly status: string;
  readonly measurements: Record<string, unknown> | null;
  readonly fabricChoice: string | null;
  readonly colorChoice: string | null;
  readonly designNotes: string | null;
  readonly referenceImages: readonly string[];
  readonly estimatedPrice: number | null;
  readonly finalPrice: number | null;
  readonly estimatedDays: number | null;
  readonly conversationId: string | null;
  readonly cancelledReason: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly listing?: {
    readonly id: string;
    readonly title: string;
    readonly slug: string;
  };
  readonly buyer?: {
    readonly id: string;
    readonly displayName: string;
    readonly avatarUrl: string | null;
  };
  readonly seller?: {
    readonly id: string;
    readonly displayName: string;
    readonly avatarUrl: string | null;
  };
}

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  if (value === null) return null;
  return Number(value);
}

function parseJson(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

export type CustomOrderWithRelations = CustomOrder & {
  listing?: { id: string; title: string; slug: string };
  buyer?: { id: string; displayName: string; avatarUrl: string | null };
  seller?: { id: string; displayName: string; avatarUrl: string | null };
};

export function serializeCustomOrder(
  order: CustomOrderWithRelations,
): SerializedCustomOrder {
  return {
    id: order.id,
    listingId: order.listingId,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    status: order.status,
    measurements: parseJson(order.measurements),
    fabricChoice: order.fabricChoice,
    colorChoice: order.colorChoice,
    designNotes: order.designNotes,
    referenceImages: order.referenceImages,
    estimatedPrice: decimalToNumber(order.estimatedPrice),
    finalPrice: decimalToNumber(order.finalPrice),
    estimatedDays: order.estimatedDays,
    conversationId: order.conversationId,
    cancelledReason: order.cancelledReason,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    ...(order.listing
      ? {
          listing: {
            id: order.listing.id,
            title: order.listing.title,
            slug: order.listing.slug,
          },
        }
      : {}),
    ...(order.buyer
      ? {
          buyer: {
            id: order.buyer.id,
            displayName: order.buyer.displayName,
            avatarUrl: order.buyer.avatarUrl,
          },
        }
      : {}),
    ...(order.seller
      ? {
          seller: {
            id: order.seller.id,
            displayName: order.seller.displayName,
            avatarUrl: order.seller.avatarUrl,
          },
        }
      : {}),
  };
}
