import { Entity, Result, ok, err } from '../core/index.js';
import { Coordinates } from '../value-objects/Coordinates.js';

export type StationStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';

export interface WeatherStationProps {
  name: string;
  regionId: string;
  coordinates: Coordinates;
  elevation: number;
  status: StationStatus;
  lastSeenAt: Date | null;
  capabilities: StationCapability[];
}

export type StationCapability =
  | 'TEMPERATURE'
  | 'WIND'
  | 'PRECIPITATION'
  | 'HUMIDITY'
  | 'PRESSURE'
  | 'VISIBILITY'
  | 'LIGHTNING_DETECTION';

/**
 * WeatherStation entity.
 * Represents a physical or virtual monitoring station in BiH.
 */
export class WeatherStation extends Entity<string> {
  private props: WeatherStationProps;

  private constructor(id: string, props: WeatherStationProps) {
    super(id);
    this.props = { ...props };
  }

  static create(id: string, props: WeatherStationProps): Result<WeatherStation> {
    if (!id.trim()) return err('Station ID cannot be empty');
    if (!props.name.trim()) return err('Station name cannot be empty');
    if (!props.coordinates.isWithinBiH()) {
      return err('Station coordinates must be within Bosnia and Herzegovina');
    }
    return ok(new WeatherStation(id, props));
  }

  markOnline(seenAt: Date): void {
    this.props.status = 'ONLINE';
    this.props.lastSeenAt = seenAt;
  }

  markOffline(): void {
    this.props.status = 'OFFLINE';
  }

  putInMaintenance(): void {
    this.props.status = 'MAINTENANCE';
  }

  hasCapability(cap: StationCapability): boolean {
    return this.props.capabilities.includes(cap);
  }

  get name(): string {
    return this.props.name;
  }
  get regionId(): string {
    return this.props.regionId;
  }
  get coordinates(): Coordinates {
    return this.props.coordinates;
  }
  get elevation(): number {
    return this.props.elevation;
  }
  get status(): StationStatus {
    return this.props.status;
  }
  get lastSeenAt(): Date | null {
    return this.props.lastSeenAt;
  }
  get capabilities(): ReadonlyArray<StationCapability> {
    return this.props.capabilities;
  }

  isOperational(): boolean {
    return this.props.status === 'ONLINE';
  }
}
