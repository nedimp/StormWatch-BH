import type { FastifyInstance } from 'fastify';

type AlertEventMessage =
  | { type: 'ALERT_CREATED'; payload: unknown }
  | { type: 'ALERT_ESCALATED'; payload: unknown }
  | { type: 'ALERT_RESOLVED'; payload: unknown }
  | { type: 'PING' };

/**
 * WebSocket endpoint — clients subscribe here for real-time alert updates.
 * The event bus pushes updates to all connected clients.
 */
export async function websocketRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/alerts',
    { websocket: true },
    (socket, _request) => {
      app.log.info('WebSocket client connected');

      // Send initial active alerts on connect
      void (async () => {
        const useCase = app.container.getActiveAlertsUseCase;
        const alerts = await useCase.execute();
        socket.send(
          JSON.stringify({ type: 'INITIAL_ALERTS', payload: alerts }),
        );
      })();

      // Register for event bus broadcasts
      const unsubscribe = app.container.eventBus.subscribe((eventName: string, payload: unknown) => {
        const msg: AlertEventMessage | null = mapEventToMessage(eventName, payload);
        if (msg) socket.send(JSON.stringify(msg));
      });

      // Heartbeat
      const heartbeat = setInterval(() => {
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify({ type: 'PING' }));
        }
      }, 30_000);

      socket.on('close', () => {
        clearInterval(heartbeat);
        unsubscribe();
        app.log.info('WebSocket client disconnected');
      });

      socket.on('error', (err: Error) => {
        app.log.error(err, 'WebSocket error');
      });
    },
  );
}

function mapEventToMessage(eventName: string, payload: unknown): AlertEventMessage | null {
  switch (eventName) {
    case 'alert.created':
      return { type: 'ALERT_CREATED', payload };
    case 'alert.escalated':
      return { type: 'ALERT_ESCALATED', payload };
    case 'alert.resolved':
      return { type: 'ALERT_RESOLVED', payload };
    default:
      return null;
  }
}
