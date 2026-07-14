import type { IWeatherAlertRepository } from '@stormwatch/domain';
import type { ResolveAlertCommand, AlertDto } from '../dtos/index.js';
import { toAlertDto } from '../dtos/index.js';
import type { IEventBus } from '../ports/index.js';

export class ResolveAlertUseCase {
  constructor(
    private readonly alertRepository: IWeatherAlertRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(cmd: ResolveAlertCommand): Promise<AlertDto> {
    const alert = await this.alertRepository.findById(cmd.alertId);
    if (!alert) throw new Error(`Alert ${cmd.alertId} not found`);

    const result = alert.resolve(new Date());
    if (!result.ok) throw new Error(result.error);

    await this.alertRepository.save(alert);

    for (const event of alert.domainEvents) {
      await this.eventBus.publish(event.eventName, event);
    }
    alert.clearDomainEvents();

    return toAlertDto(alert);
  }
}
