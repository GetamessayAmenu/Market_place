export class ChatMessageSentEvent {
  readonly occurredAt = new Date();

  constructor(
    readonly messageId: string,
    readonly conversationId: string,
    readonly senderId: string,
    readonly recipientId: string,
  ) {}
}

export class ChatSpamSuspectedEvent {
  readonly occurredAt = new Date();

  constructor(
    readonly conversationId: string,
    readonly senderId: string,
    readonly reason: string,
  ) {}
}

export class ChatReportReadyEvent {
  readonly occurredAt = new Date();

  constructor(
    readonly conversationId: string,
    readonly reporterId: string,
  ) {}
}
