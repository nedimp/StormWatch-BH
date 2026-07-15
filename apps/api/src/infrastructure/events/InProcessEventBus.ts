type Subscriber = (eventName: string, payload: unknown) => void;

/**
 * In-process event bus — synchronous, for dev / single-process deployments.
 * Replace with Redis Pub/Sub or RabbitMQ adapter for production.
 */
export class InProcessEventBus {
  private readonly subscribers: Set<Subscriber> = new Set();

  publish(eventName: string, payload: unknown): Promise<void> {
    for (const sub of this.subscribers) {
      sub(eventName, payload);
    }
    return Promise.resolve();
  }

  subscribe(subscriber: Subscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }
}
