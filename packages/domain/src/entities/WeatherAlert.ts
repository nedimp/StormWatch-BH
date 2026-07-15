import { AggregateRoot, Result, ok, err } from '../core/index.js';
import { Coordinates } from '../value-objects/Coordinates.js';
import { AlertSeverity, AlertSeverityLevel } from '../value-objects/AlertSeverity.js';
import { WeatherCondition } from '../value-objects/WeatherCondition.js';
import { AlertCreatedEvent, AlertEscalatedEvent, AlertResolvedEvent } from '../events/index.js';

export type AlertStatus = 'ACTIVE' | 'ESCALATED' | 'RESOLVED' | 'EXPIRED';

export interface WeatherAlertProps {
  regionId: string;
  regionName: string;
  affectedArea: Coordinates[];
  severity: AlertSeverity;
  condition: WeatherCondition;
  title: string;
  description: string;
  recommendations: string[];
  issuedAt: Date;
  validUntil: Date;
  status: AlertStatus;
  observationIds: string[];
  /**
   * When set, this alert is based on forecast data, not observed conditions.
   * forecastFor is the predicted time when the severe weather will occur.
   * isForecasted: true enables lower visual urgency in the UI and a
   * "Prognoza" prefix on the title.
   */
  forecastFor?: Date;
  isForecasted: boolean;
}

/**
 * WeatherAlert aggregate root.
 *
 * Central aggregate of the domain. An alert is issued for a region
 * when observed weather metrics breach severity thresholds.
 * Lifecycle: ACTIVE → ESCALATED (severity rises) → RESOLVED | EXPIRED
 */
export class WeatherAlert extends AggregateRoot<string> {
  private readonly props: WeatherAlertProps;

  private constructor(id: string, props: WeatherAlertProps) {
    super(id);
    this.props = { ...props };
  }

  static create(id: string, props: Omit<WeatherAlertProps, 'status'>): Result<WeatherAlert> {
    if (!id.trim()) return err('Alert ID cannot be empty');
    if (!props.title.trim()) return err('Alert title cannot be empty');
    if (props.validUntil <= props.issuedAt) return err('validUntil must be after issuedAt');
    if (props.affectedArea.length < 3) return err('Affected area needs at least 3 coordinates');
    // Forecast alerts must reference a future time
    if (props.isForecasted && props.forecastFor && props.forecastFor <= props.issuedAt) {
      return err('forecastFor must be after issuedAt for forecast alerts');
    }

    const alert = new WeatherAlert(id, { ...props, status: 'ACTIVE' });
    alert.addDomainEvent(
      new AlertCreatedEvent(id, props.regionId, props.severity.level, props.issuedAt),
    );
    return ok(alert);
  }

  escalate(newSeverity: AlertSeverity): Result<void> {
    if (!newSeverity.isSevererThan(this.props.severity)) {
      return err('New severity must be higher than current severity to escalate');
    }
    if (this.props.status === 'RESOLVED' || this.props.status === 'EXPIRED') {
      return err('Cannot escalate a resolved or expired alert');
    }
    this.props.severity = newSeverity;
    this.props.status = 'ESCALATED';
    this.addDomainEvent(new AlertEscalatedEvent(this.id, this.props.regionId, newSeverity.level));
    return ok(undefined);
  }

  resolve(resolvedAt: Date): Result<void> {
    if (this.props.status === 'RESOLVED') return err('Alert is already resolved');
    if (this.props.status === 'EXPIRED') return err('Cannot resolve an expired alert');
    this.props.status = 'RESOLVED';
    this.addDomainEvent(new AlertResolvedEvent(this.id, this.props.regionId, resolvedAt));
    return ok(undefined);
  }

  expire(): void {
    if (this.props.status === 'ACTIVE' || this.props.status === 'ESCALATED') {
      this.props.status = 'EXPIRED';
    }
  }

  get regionId(): string {
    return this.props.regionId;
  }
  get regionName(): string {
    return this.props.regionName;
  }
  get affectedArea(): ReadonlyArray<Coordinates> {
    return this.props.affectedArea;
  }
  get severity(): AlertSeverity {
    return this.props.severity;
  }
  get condition(): WeatherCondition {
    return this.props.condition;
  }
  get title(): string {
    return this.props.title;
  }
  get description(): string {
    return this.props.description;
  }
  get recommendations(): ReadonlyArray<string> {
    return this.props.recommendations;
  }
  get issuedAt(): Date {
    return this.props.issuedAt;
  }
  get validUntil(): Date {
    return this.props.validUntil;
  }
  get status(): AlertStatus {
    return this.props.status;
  }
  get observationIds(): ReadonlyArray<string> {
    return this.props.observationIds;
  }

  get isForecasted(): boolean { return this.props.isForecasted; }
  get forecastFor(): Date | undefined { return this.props.forecastFor; }

  isActive(): boolean {
    return this.props.status === 'ACTIVE' || this.props.status === 'ESCALATED';
  }

  isCritical(): boolean {
    return this.props.severity.level === AlertSeverityLevel.CRITICAL;
  }
}
