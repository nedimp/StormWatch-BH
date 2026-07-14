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
import { DrizzleObservationRepository } from './repositories/DrizzleObservationRepository.js';
import { InProcessEventBus } from './events/InProcessEventBus.js';
import { GmailNotificationService } from './notifications/GmailNotificationService.js';
import { DrizzleSubscriptionRepository } from './repositories/DrizzleSubscriptionRepository.js';
import { BIH_REGIONS } from './data/bihRegions.js';
import { db } from './database/db.js';

const regionNameMap = new Map(BIH_REGIONS.map((r) => [r.id, r.localName]));

export interface AppContainer {
  alertRepository: IWeatherAlertRepository;
  observationRepository: IWeatherObservationRepository;
  subscriptionRepository: DrizzleSubscriptionRepository;
  notificationService: GmailNotificationService;
  eventBus: InProcessEventBus;
  getActiveAlertsUseCase: GetActiveAlertsUseCase;
  recordObservationUseCase: RecordObservationUseCase;
  resolveAlertUseCase: ResolveAlertUseCase;
}

export function buildContainer(): AppContainer {
  const alertRepository = new InMemoryAlertRepository();
  const observationRepository = new DrizzleObservationRepository(db);
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
    regionNameResolver: { resolve: (id) => regionNameMap.get(id) },
  });

  const resolveAlertUseCase = new ResolveAlertUseCase(alertRepository, eventBus);

  return {
    alertRepository,
    observationRepository,
    subscriptionRepository,
    notificationService,
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
