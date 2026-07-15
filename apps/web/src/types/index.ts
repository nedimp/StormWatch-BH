/**
 * All frontend type imports come from @stormwatch/shared — the single source of
 * truth for the HTTP API contract between the server and the web client.
 */
export type {
  AlertSeverity,
  AlertStatus,
  WeatherConditionType as WeatherCondition,  // re-export with the alias the frontend uses
  BiHEntity,
  AlertDto,
  RegionDto,
  CurrentConditionDto,
} from '@stormwatch/shared';
