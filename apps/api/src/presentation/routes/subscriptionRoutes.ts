import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const subscribeSchema = z.object({
  email: z.string().email('Unesite ispravnu email adresu'),
  regions: z.array(z.string()).optional(),
});

export async function subscriptionRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/subscriptions — subscribe
  app.post('/', {
    schema: { tags: ['subscriptions'], summary: 'Subscribe to weather alert emails' },
  }, async (request, reply) => {
    const parsed = subscribeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    }
    const { email, regions = [] } = parsed.data;
    const repo = app.container.subscriptionRepository;

    const existing = await repo.findByEmail(email);
    if (existing) {
      return reply.code(200).send({
        message: 'Već ste pretplaćeni na upozorenja.',
        subscriber: { email: existing.email, subscribedAt: existing.subscribedAt },
      });
    }

    const subscriber = await repo.subscribe(email, regions);
    app.log.info({ email }, 'New subscriber');

    // Send welcome email via the notification service port (not instanceof check)
    void app.container.notificationService.sendWelcomeEmail(subscriber.email);

    return reply.code(201).send({
      message: 'Uspješno ste se pretplatili na upozorenja o nevremenu!',
      subscriber: { email: subscriber.email, subscribedAt: subscriber.subscribedAt },
    });
  });

  // GET /api/v1/subscriptions/:email — one-click unsubscribe from email footer
  app.get('/:email', {
    schema: { tags: ['subscriptions'], summary: 'One-click unsubscribe (email footer link)' },
  }, async (request, reply) => {
    const { email } = request.params as { email: string };
    const decoded = decodeURIComponent(email);
    await app.container.subscriptionRepository.unsubscribe(decoded);

    // Return a friendly HTML page instead of JSON
    return reply
      .header('Content-Type', 'text/html; charset=utf-8')
      .code(200)
      .send(`<!DOCTYPE html>
<html lang="bs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pretplata otkazana — StormWatch BH</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #f1f5f9; display: flex; align-items: center;
           justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0;
            box-shadow: 0 4px 24px rgba(0,0,0,0.06); max-width: 480px;
            width: 100%; padding: 48px 36px; text-align: center; }
    .icon { font-size: 48px; margin-bottom: 20px; }
    h1 { color: #0f172a; font-size: 22px; font-weight: 800; margin-bottom: 12px; }
    p { color: #64748b; font-size: 15px; line-height: 1.6; margin-bottom: 32px; }
    a { display: inline-block; background: #0f172a; color: #fff;
        text-decoration: none; padding: 12px 28px; border-radius: 10px;
        font-size: 14px; font-weight: 700; }
    a:hover { background: #1e293b; }
    .email { color: #1e293b; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>Pretplata otkazana</h1>
    <p>Adresa <span class="email">${decoded}</span> je uklonjena sa liste pretplatnika.
       Više nećete primati upozorenja o nevremenu na ovaj email.</p>
    <a href="${process.env['DASHBOARD_URL'] ?? 'http://localhost:5173'}">Povratak na StormWatch BH</a>
  </div>
</body>
</html>`);
  });

  // DELETE /api/v1/subscriptions/:email — programmatic unsubscribe (API use)
  app.delete('/:email', {
    schema: { tags: ['subscriptions'], summary: 'Unsubscribe from weather alerts' },
  }, async (request, reply) => {
    const { email } = request.params as { email: string };
    const removed = await app.container.subscriptionRepository.unsubscribe(decodeURIComponent(email));
    if (!removed) {
      return reply.code(200).send({ message: 'Email adresa nije pronađena.' });
    }
    return reply.code(200).send({ message: 'Uspješno ste otkazali pretplatu.' });
  });

  // GET /api/v1/subscriptions/count
  app.get('/count', {
    schema: { tags: ['subscriptions'], summary: 'Get subscriber count' },
  }, async (_request, reply) => {
    const count = await app.container.subscriptionRepository.count();
    return reply.code(200).send({ count });
  });
}
