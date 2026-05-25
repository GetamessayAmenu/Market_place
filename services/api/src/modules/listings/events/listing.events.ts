import { DomainEvent } from '../../../infrastructure/events/domain-event.base';

export class ListingCreatedEvent extends DomainEvent {
  readonly eventName = 'listing.created';

  constructor(
    readonly listingId: string,
    readonly sellerId: string,
  ) {
    super();
  }
}

export class ListingUpdatedEvent extends DomainEvent {
  readonly eventName = 'listing.updated';

  constructor(
    readonly listingId: string,
    readonly sellerId: string,
  ) {
    super();
  }
}

export class ListingDeletedEvent extends DomainEvent {
  readonly eventName = 'listing.deleted';

  constructor(
    readonly listingId: string,
    readonly sellerId: string,
  ) {
    super();
  }
}

export class ListingViewedEvent extends DomainEvent {
  readonly eventName = 'listing.viewed';

  constructor(
    readonly listingId: string,
    readonly viewerId?: string,
  ) {
    super();
  }
}

export class ListingFavoritedEvent extends DomainEvent {
  readonly eventName = 'listing.favorited';

  constructor(
    readonly listingId: string,
    readonly userId: string,
  ) {
    super();
  }
}

export class ListingContactClickedEvent extends DomainEvent {
  readonly eventName = 'listing.contact_clicked';

  constructor(
    readonly listingId: string,
    readonly channel: 'phone' | 'whatsapp' | 'telegram' | 'in_app',
    readonly userId?: string,
  ) {
    super();
  }
}

export class ListingModerationFlaggedEvent extends DomainEvent {
  readonly eventName = 'listing.moderation_flagged';

  constructor(
    readonly listingId: string,
    readonly reason: string,
  ) {
    super();
  }
}

export class ListingSpamSuspectedEvent extends DomainEvent {
  readonly eventName = 'listing.spam_suspected';

  constructor(
    readonly listingId: string,
    readonly sellerId: string,
  ) {
    super();
  }
}
