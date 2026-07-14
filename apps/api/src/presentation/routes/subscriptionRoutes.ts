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
    return reply.code(201).send({
      message: 'Uspješno ste se pretplatili na upozorenja o nevremenu!',
      subscriber: { email: subscriber.email, subscribedAt: subscriber.subscribedAt },
    });
  });

  // DELETE /api/v1/subscriptions/:email — unsubscribe (used from email footer)
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
