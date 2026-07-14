export interface Subscriber {
  email: string;
  subscribedAt: Date;
  regions: string[]; // empty = all regions
}

/**
 * In-memory subscriber store.
 * Production: swap for a Postgres table.
 */
export class InMemorySubscriptionRepository {
  private readonly store = new Map<string, Subscriber>();

  subscribe(email: string, regions: string[] = []): Subscriber {
    const existing = this.store.get(email.toLowerCase());
    if (existing) return existing;
    const sub: Subscriber = { email: email.toLowerCase(), subscribedAt: new Date(), regions };
    this.store.set(email.toLowerCase(), sub);
    return sub;
  }

  unsubscribe(email: string): boolean {
    return this.store.delete(email.toLowerCase());
  }

  findByEmail(email: string): Subscriber | null {
    return this.store.get(email.toLowerCase()) ?? null;
  }

  getAll(): Subscriber[] {
    return [...this.store.values()];
  }

  getAllEmails(): string[] {
    return [...this.store.values()].map((s) => s.email);
  }

  count(): number {
    return this.store.size;
  }
}
