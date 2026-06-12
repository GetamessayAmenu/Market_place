import { DomainEvent } from '../../infrastructure/events/domain-event.base';

export class MessageReceivedEvent extends DomainEvent {
  readonly eventName = 'notification.message_received';

  constructor(
    readonly recipientId: string,
    readonly senderId: string,
    readonly conversationId: string,
    readonly messagePreview: string,
  ) {
    super();
  }
}

export class ListingApprovedEvent extends DomainEvent {
  readonly eventName = 'notification.listing_approved';

  constructor(
    readonly sellerId: string,
    readonly listingId: string,
    readonly listingTitle: string,
  ) {
    super();
  }
}

export class ListingRejectedEvent extends DomainEvent {
  readonly eventName = 'notification.listing_rejected';

  constructor(
    readonly sellerId: string,
    readonly listingId: string,
    readonly listingTitle: string,
    readonly reason?: string,
  ) {
    super();
  }
}

export class ListingFavoritedEvent extends DomainEvent {
  readonly eventName = 'notification.listing_favorited';

  constructor(
    readonly sellerId: string,
    readonly listingId: string,
    readonly listingTitle: string,
    readonly userId: string,
  ) {
    super();
  }
}

export class SellerVerifiedEvent extends DomainEvent {
  readonly eventName = 'notification.seller_verified';

  constructor(
    readonly userId: string,
    readonly verificationType: 'email' | 'phone' | 'identity' | 'business',
  ) {
    super();
  }
}

export class SystemAnnouncementEvent extends DomainEvent {
  readonly eventName = 'notification.system_announcement';

  constructor(
    readonly title: string,
    readonly body: string,
    readonly targetAudience?: 'all' | 'sellers' | 'buyers' | 'admins',
  ) {
    super();
  }
}
