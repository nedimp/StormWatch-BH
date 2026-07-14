import { v4 as uuidv4 } from 'uuid';
import {
  WeatherAlert,
  WeatherObservation,
  WeatherAlertDomainService,
  IWeatherAlertRepository,
  IWeatherObservationRepository,
} from '@stormwatch/domain';
import {
  GetActiveAlertsUseCase,
  RecordObservationUseCase,
  ResolveAlertUseCase,
} from '@stormwatch/application';
import type { IIdGenerator, IEventBus, INotificationService } from '@stormwatch/application';
import { InMemoryAlertRepository } from './repositories/InMemoryAlertRepository.js';
import { InMemoryObservationRepository } from './repositories/InMemoryObservationRepository.js';
import { InProcessEventBus } from './events/InProcessEventBus.js';
import { ConsoleNotificationService } from './notifications/ConsoleNotificationService.js';

/**
 * Dependency Injection Container
 *
 * In production this would wire to Postgres (via DrizzleORM) and Redis.
 * For now uses in-memory implementations so the project runs without infra.
 */
export interface AppContainer {
  alertRepository: IWeatherAlertRepository;
  observationRepository: IWeatherObservationRepository;
  eventBus: InProcessEventBus;
  getActiveAlertsUseCase: GetActiveAlertsUseCase;
  recordObservationUseCase: RecordObservationUseCase;
  resolveAlertUseCase: ResolveAlertUseCase;
}

export function buildContainer(): AppContainer {
  const alertRepository = new InMemoryAlertRepository();
  const observationRepository = new InMemoryObservationRepository();
  const eventBus = new InProcessEventBus();
  const notificationService = new ConsoleNotificationService();
  const idGenerator: IIdGenerator = { generate: () => uuidv4() };
  const alertDomainService = new WeatherAlertDomainService();

  const getActiveAlertsUseCase = new GetActiveAlertsUseCase(alertRepository);

  const recordObservationUseCase = new RecordObservationUseCase({
    alertRepository,
    observationRepository,
    alertDomainService,
    idGenerator,
    notificationService,
    eventBus,
  });

  const resolveAlertUseCase = new ResolveAlertUseCase(alertRepository, eventBus);

  return {
    alertRepository,
    observationRepository,
    eventBus,
    getActiveAlertsUseCase,
    recordObservationUseCase,
    resolveAlertUseCase,
  };
}

// Fastify type augmentation
declare module 'fastify' {
  interface FastifyInstance {
    container: AppContainer;
  }
}
