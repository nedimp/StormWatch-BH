import { ValueObject, Result, ok, err } from '../core/index.js';

/**
 * Weather condition types relevant for severe weather in BiH.
 */
export enum WeatherConditionType {
  THUNDERSTORM = 'THUNDERSTORM',
  HEAVY_RAIN = 'HEAVY_RAIN',
  HAIL = 'HAIL',
  STRONG_WIND = 'STRONG_WIND',
  HEAVY_SNOW = 'HEAVY_SNOW',
  FOG = 'FOG',
  EXTREME_HEAT = 'EXTREME_HEAT',
  FROST = 'FROST',
  TORNADO_RISK = 'TORNADO_RISK',
}

interface WeatherConditionProps {
  type: WeatherConditionType;
  description: string;
}

export class WeatherCondition extends ValueObject<WeatherConditionProps> {
  private constructor(props: WeatherConditionProps) {
    super(props);
  }

  static create(type: WeatherConditionType, description: string): Result<WeatherCondition> {
    if (!description.trim()) return err('Weather condition description cannot be empty');
    return ok(new WeatherCondition({ type, description: description.trim() }));
  }

  get type(): WeatherConditionType {
    return this.props.type;
  }

  get description(): string {
    return this.props.description;
  }

  get localizedName(): string {
    const names: Record<WeatherConditionType, string> = {
      [WeatherConditionType.THUNDERSTORM]: 'Nevrijeme / Grmljavina',
      [WeatherConditionType.HEAVY_RAIN]: 'Jaka kiša',
      [WeatherConditionType.HAIL]: 'Tuča / Grad',
      [WeatherConditionType.STRONG_WIND]: 'Jak vjetar',
      [WeatherConditionType.HEAVY_SNOW]: 'Jak snijeg',
      [WeatherConditionType.FOG]: 'Magla',
      [WeatherConditionType.EXTREME_HEAT]: 'Ekstremna vrućina',
      [WeatherConditionType.FROST]: 'Mraz',
      [WeatherConditionType.TORNADO_RISK]: 'Opasnost od tornada',
    };
    return names[this.props.type];
  }
}
