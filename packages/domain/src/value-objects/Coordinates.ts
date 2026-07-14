import { ValueObject, Result, ok, err } from '../core/index.js';

interface CoordinatesProps {
  latitude: number;
  longitude: number;
}

/**
 * Coordinates value object.
 * BiH bounding box: lat 42.55 – 45.27, lng 15.72 – 19.62
 */
export class Coordinates extends ValueObject<CoordinatesProps> {
  private constructor(props: CoordinatesProps) {
    super(props);
  }

  static create(lat: number, lng: number): Result<Coordinates> {
    if (lat < -90 || lat > 90) return err('Latitude must be between -90 and 90');
    if (lng < -180 || lng > 180) return err('Longitude must be between -180 and 180');
    return ok(new Coordinates({ latitude: lat, longitude: lng }));
  }

  get latitude(): number {
    return this.props.latitude;
  }

  get longitude(): number {
    return this.props.longitude;
  }

  isWithinBiH(): boolean {
    return (
      this.props.latitude >= 42.55 &&
      this.props.latitude <= 45.27 &&
      this.props.longitude >= 15.72 &&
      this.props.longitude <= 19.62
    );
  }

  distanceTo(other: Coordinates): number {
    const R = 6371; // Earth radius km
    const dLat = this.toRad(other.latitude - this.props.latitude);
    const dLng = this.toRad(other.longitude - this.props.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(this.props.latitude)) *
        Math.cos(this.toRad(other.latitude)) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  toString(): string {
    return `${this.props.latitude.toFixed(4)}, ${this.props.longitude.toFixed(4)}`;
  }
}
