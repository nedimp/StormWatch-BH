import type { IWeatherAlertRepository } from '@stormwatch/domain';
import type { GetActiveAlertsQuery, AlertDto } from '../dtos/index.js';
import { toAlertDto } from '../dtos/index.js';
import type { AlertSeverityLevel } from '@stormwatch/domain';
import { AlertSeverity } from '@stormwatch/domain';

/**
 * GetActiveAlertsUseCase
 *
 * Read-only query — returns all active alerts, optionally filtered by
 * region or minimum severity level.
 */
export class GetActiveAlertsUseCase {
  constructor(private readonly alertRepository: IWeatherAlertRepository) {}

  async execute(query: GetActiveAlertsQuery = {}): Promise<AlertDto[]> {
    let alerts = query.regionId
      ? await this.alertRepository.findActiveByRegion(query.regionId)
      : await this.alertRepository.findAllActive();

    if (query.severity) {
      const minSeverity = AlertSeverity.create(query.severity);
      if (minSeverity.ok) {
        alerts = alerts.filter((a) => a.severity.isAtLeast(minSeverity.value));
      }
    }

    if (query.limit && query.limit > 0) {
      alerts = alerts.slice(0, query.limit);
    }

    // Sort: CRITICAL first, then by issuedAt desc
    alerts.sort((a, b) => {
      const severityOrder: Record<AlertSeverityLevel, number> = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };
      const diff = severityOrder[b.severity.level] - severityOrder[a.severity.level];
      if (diff !== 0) return diff;
      return b.issuedAt.getTime() - a.issuedAt.getTime();
    });

    return alerts.map(toAlertDto);
  }
}
