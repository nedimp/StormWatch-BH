import type { INotificationService } from '@stormwatch/application';
import type { AlertDto } from '@stormwatch/application';
import { logger } from '../logger.js';

/**
 * Console notification service — logs to stdout.
 * Replace with EmailNotificationService / SMSNotificationService in production.
 */
export class ConsoleNotificationService implements INotificationService {
  async sendAlertCreated(alert: AlertDto, subscriberIds: string[]): Promise<void> {
    logger.info(
      { alertId: alert.id, region: alert.regionName, severity: alert.severity, subscribers: subscriberIds.length },
      `[NOTIFICATION] New alert: ${alert.title}`,
    );
  }

  async sendAlertEscalated(alert: AlertDto, subscriberIds: string[]): Promise<void> {
    logger.warn(
      { alertId: alert.id, region: alert.regionName, severity: alert.severity, subscribers: subscriberIds.length },
      `[NOTIFICATION] Alert escalated: ${alert.title}`,
    );
  }

  async sendAlertResolved(alertId: string, regionId: string, subscriberIds: string[]): Promise<void> {
    logger.info(
      { alertId, regionId, subscribers: subscriberIds.length },
      '[NOTIFICATION] Alert resolved',
    );
  }
}
