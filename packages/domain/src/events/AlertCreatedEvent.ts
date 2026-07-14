import { DomainEvent } from '../core/index.js';
import { AlertSeverityLevel } from '../value-objects/AlertSeverity.js';

export class AlertCreatedEvent implements DomainEvent {
  readonly eventName = 'alert.created';
  readonly occurredAt: Date;

  constructor(
    readonly aggregateId: string,
    readonly regionId: string,
    readonly severity: AlertSeverityLevel,
    readonly issuedAt: Date,
  ) {
    this.occurredAt = new Date();
  }
}

export class AlertEscalatedEvent implements DomainEvent {
  readonly eventName = 'alert.escalated';
  readonly occurredAt: Date;

  constructor(
    readonly aggregateId: string,
    readonly regionId: string,
    readonly newSeverity: AlertSeverityLevel,
  ) {
    this.occurredAt = new Date();
  }
}

export class AlertResolvedEvent implements DomainEvent {
  readonly eventName = 'alert.resolved';
  readonly occurredAt: Date;

  constructor(
    readonly aggregateId: string,
    readonly regionId: string,
    readonly resolvedAt: Date,
  ) {
    this.occurredAt = new Date();
  }
}

export class ObservationRecordedEvent implements DomainEvent {
  readonly eventName = 'observation.recorded';
  readonly occurredAt: Date;

  constructor(
    readonly aggregateId: string,
    readonly stationId: string,
    readonly regionId: string,
    readonly observedAt: Date,
  ) {
    this.occurredAt = new Date();
  }
}
