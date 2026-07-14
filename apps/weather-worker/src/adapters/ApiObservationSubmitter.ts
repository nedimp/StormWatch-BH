import { fetch } from 'undici';
import type { RecordObservationCommand } from '@stormwatch/application';
import { logger } from '../config/logger.js';

/**
 * ApiObservationSubmitter
 *
 * Posts observations to the StormWatch API via HTTP.
 * Used by the weather-worker to decouple data collection from processing.
 */
export class ApiObservationSubmitter {
  constructor(private readonly apiBaseUrl: string) {}

  async submitObservation(cmd: RecordObservationCommand): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/observations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...cmd,
        observedAt: cmd.observedAt.toISOString(),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error({ status: response.status, body }, 'Failed to submit observation');
      throw new Error(`API submission failed: ${response.status}`);
    }

    const result = await response.json() as { message: string };
    if (result.message.includes('alert issued')) {
      logger.warn({ stationId: cmd.stationId }, result.message);
    }
  }
}
