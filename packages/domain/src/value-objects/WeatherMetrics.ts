import { ValueObject, Result, ok, err } from '../core/index.js';

interface WeatherMetricsProps {
  temperatureCelsius: number;
  windSpeedKmh: number;
  windGustKmh: number;
  precipitationMmPerHour: number;
  humidityPercent: number;
  visibilityKm: number;
  pressureHpa: number;
}

/**
 * WeatherMetrics — all physical measurements for a single observation.
 * Immutable value object; domain logic for threshold detection lives here.
 */
export class WeatherMetrics extends ValueObject<WeatherMetricsProps> {
  private constructor(props: WeatherMetricsProps) {
    super(props);
  }

  static create(props: WeatherMetricsProps): Result<WeatherMetrics> {
    if (props.humidityPercent < 0 || props.humidityPercent > 100) {
      return err('Humidity must be between 0 and 100');
    }
    if (props.windSpeedKmh < 0) return err('Wind speed cannot be negative');
    if (props.precipitationMmPerHour < 0) return err('Precipitation cannot be negative');
    if (props.visibilityKm < 0) return err('Visibility cannot be negative');
    return ok(new WeatherMetrics(props));
  }

  get temperature(): number {
    return this.props.temperatureCelsius;
  }
  get windSpeed(): number {
    return this.props.windSpeedKmh;
  }
  get windGust(): number {
    return this.props.windGustKmh;
  }
  get precipitation(): number {
    return this.props.precipitationMmPerHour;
  }
  get humidity(): number {
    return this.props.humidityPercent;
  }
  get visibility(): number {
    return this.props.visibilityKm;
  }
  get pressure(): number {
    return this.props.pressureHpa;
  }

  // ── Threshold helpers ────────────────────────────────────────────────────
  isThunderstormLikely(): boolean {
    return this.props.pressureHpa < 990 && this.props.humidityPercent > 80;
  }

  isHeavyRain(): boolean {
    return this.props.precipitationMmPerHour >= 10;
  }

  isExtremeRain(): boolean {
    return this.props.precipitationMmPerHour >= 30;
  }

  isStrongWind(): boolean {
    return this.props.windSpeedKmh >= 60 || this.props.windGustKmh >= 80;
  }

  isExtremeWind(): boolean {
    return this.props.windSpeedKmh >= 90 || this.props.windGustKmh >= 120;
  }

  isDenseFog(): boolean {
    return this.props.visibilityKm < 0.2;
  }

  isExtremeHeat(): boolean {
    return this.props.temperatureCelsius >= 40;
  }

  isFrost(): boolean {
    return this.props.temperatureCelsius <= -5;
  }
}
