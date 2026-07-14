import type { FastifyInstance } from 'fastify';

export async function websocketRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/alerts',
    { websocket: true },
    (connection, _request) => {
      const ws = connection.socket;
      app.log.info('WebSocket client connected');

      // Send initial alerts on connect
      void (async () => {
        try {
          const useCase = app.container.getActiveAlertsUseCase;
          const alerts = await useCase.execute();
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'INITIAL_ALERTS', payload: alerts }));
          }
        } catch (err) {
          app.log.error(err, 'Failed to send initial alerts');
        }
      })();

      // Subscribe to domain events
      const unsubscribe = app.container.eventBus.subscribe((eventName: string, payload: unknown) => {
        if (ws.readyState !== ws.OPEN) return;
        const typeMap: Record<string, string> = {
          'alert.created':   'ALERT_CREATED',
          'alert.escalated': 'ALERT_ESCALATED',
          'alert.resolved':  'ALERT_RESOLVED',
        };
        const type = typeMap[eventName];
        if (type) ws.send(JSON.stringify({ type, payload }));
      });

      // Heartbeat every 30s
      const heartbeat = setInterval(() => {
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'PING' }));
      }, 30_000);

      ws.on('close', () => {
        clearInterval(heartbeat);
        unsubscribe();
        app.log.info('WebSocket client disconnected');
      });

      ws.on('error', (err: Error) => {
        app.log.error(err, 'WebSocket error');
      });
    },
  );
}
