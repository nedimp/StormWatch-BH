import { AggregateRoot, Result, ok, err } from '../core/index.js';
import { Coordinates } from '../value-objects/Coordinates.js';
import { WeatherMetrics } from '../value-objects/WeatherMetrics.js';
import { WeatherCondition } from '../value-objects/WeatherCondition.js';
import { ObservationRecordedEvent } from '../events/index.js';

export interface WeatherObservationProps {
  stationId: string;
  regionId: string;
  coordinates: Coordinates;
  metrics: WeatherMetrics;
  conditions: WeatherCondition[];
  observedAt: Date;
  source: 'AUTOMATIC_STATION' | 'MANUAL' | 'API_PROVIDER' | 'RADAR';
}

/**
 * WeatherObservation aggregate root.
 *
 * Represents a single weather snapshot at a location and time.
 * Raises a domain event when created so downstream handlers
 * (e.g. alert generation) can react.
 */
export class WeatherObservation extends AggregateRoot<string> {
  private readonly props: WeatherObservationProps;

  private constructor(id: string, props: WeatherObservationProps) {
    super(id);
    this.props = props;
  }

  static create(id: string, props: WeatherObservationProps): Result<WeatherObservation> {
    if (!id.trim()) return err('Observation ID cannot be empty');
    if (!props.stationId.trim()) return err('Station ID cannot be empty');
    const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);
    if (props.observedAt > tenMinutesFromNow) return err('Observation cannot be in the future');

    const observation = new WeatherObservation(id, props);
    observation.addDomainEvent(
      new ObservationRecordedEvent(id, props.stationId, props.regionId, props.observedAt),
    );
    return ok(observation);
  }

  get stationId(): string {
    return this.props.stationId;
  }
  get regionId(): string {
    return this.props.regionId;
  }
  get coordinates(): Coordinates {
    return this.props.coordinates;
  }
  get metrics(): WeatherMetrics {
    return this.props.metrics;
  }
  get conditions(): ReadonlyArray<WeatherCondition> {
    return this.props.conditions;
  }
  get observedAt(): Date {
    return this.props.observedAt;
  }
  get source(): WeatherObservationProps['source'] {
    return this.props.source;
  }
}
