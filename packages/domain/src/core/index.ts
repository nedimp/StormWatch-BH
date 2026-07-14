/**
 * Base Entity
 *
 * All domain entities extend this. Identity equality — two entities
 * with the same id are the same entity regardless of their attributes.
 */
export abstract class Entity<TId> {
  protected constructor(public readonly id: TId) {}

  equals(other: Entity<TId>): boolean {
    if (!(other instanceof this.constructor)) return false;
    return this.id === other.id;
  }
}

/**
 * Aggregate Root
 *
 * Entry point into an aggregate. Owns domain event collection.
 * Only aggregate roots are retrieved from repositories.
 */
export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}

/**
 * Value Object
 *
 * Structural equality — two value objects with the same properties are equal.
 */
export abstract class ValueObject<T extends object> {
  protected constructor(protected readonly props: T) {
    Object.freeze(props);
  }

  equals(other: ValueObject<T>): boolean {
    if (other.constructor !== this.constructor) return false;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}

/**
 * Domain Event base
 */
export interface DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
}

/**
 * Result type — avoids throwing for expected domain failures.
 */
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <E = string>(error: E): Result<never, E> => ({
  ok: false,
  error,
});
