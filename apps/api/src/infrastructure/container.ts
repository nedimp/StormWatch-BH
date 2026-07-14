import { v4 as uuidv4 } from 'uuid';
import {
  WeatherAlertDomainService,
  IWeatherAlertRepository,
  IWeatherObservationRepository,
} from '@stormwatch/domain';
import {
  GetActiveAlertsUseCase,
  RecordObservationUseCase,
  ResolveAlertUseCase,
} from '@stormwatch/application';
import type { IIdGenerator, IEventBus } from '@stormwatch/application';
import { InMemoryAlertRepository } from './repositories/InMemoryAlertRepository.js';
import { InMemoryObservationRepository } from './repositories/InMemoryObservationRepository.js';
import { InProcessEventBus } from './events/InProcessEventBus.js';
import { GmailNotificationService } from './notifications/GmailNotificationService.js';
import { DrizzleSubscriptionRepository } from './repositories/DrizzleSubscriptionRepository.js';
import { db } from './database/db.js';

export interface AppContainer {
  alertRepository: IWeatherAlertRepository;
  observationRepository: InMemoryObservationRepository;
  subscriptionRepository: DrizzleSubscriptionRepository;
  eventBus: InProcessEventBus;
  getActiveAlertsUseCase: GetActiveAlertsUseCase;
  recordObservationUseCase: RecordObservationUseCase;
  resolveAlertUseCase: ResolveAlertUseCase;
}

export function buildContainer(): AppContainer {
  const alertRepository = new InMemoryAlertRepository();
  const observationRepository = new InMemoryObservationRepository();
  const subscriptionRepository = new DrizzleSubscriptionRepository(db);
  const eventBus = new InProcessEventBus();
  const notificationService = new GmailNotificationService(subscriptionRepository);
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
    subscriptionRepository,
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
