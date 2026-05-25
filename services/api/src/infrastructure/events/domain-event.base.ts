/**
 * Base class for in-process domain events (Phase 8+ handlers).
 */
export abstract class DomainEvent {
  readonly occurredAt: Date = new Date();

  abstract readonly eventName: string;
}
