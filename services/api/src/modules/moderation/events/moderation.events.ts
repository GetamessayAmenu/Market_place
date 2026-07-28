export class ModerationApprovedEvent {
  constructor(
    public readonly itemId: string,
    public readonly moderatorId: string,
  ) {}
}

export class ModerationRejectedEvent {
  constructor(
    public readonly itemId: string,
    public readonly moderatorId: string,
    public readonly reason?: string,
  ) {}
}

export class ModerationDeletedEvent {
  constructor(
    public readonly itemId: string,
    public readonly moderatorId: string,
  ) {}
}

export class ModerationRestoredEvent {
  constructor(
    public readonly itemId: string,
    public readonly moderatorId: string,
  ) {}
}

export class ModerationSpamFlaggedEvent {
  constructor(
    public readonly itemId: string,
    public readonly moderatorId: string,
    public readonly reason?: string,
  ) {}
}
