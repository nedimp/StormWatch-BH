import { eq } from 'drizzle-orm';
import { subscribers } from '../database/schema.js';
import type { Db } from '../database/db.js';

export interface Subscriber {
  email: string;
  subscribedAt: Date;
  regions: string[];
}

/**
 * DrizzleSubscriptionRepository
 *
 * Persists email subscriptions in PostgreSQL via Drizzle ORM.
 */
export class DrizzleSubscriptionRepository {
  constructor(private readonly db: Db) {}

  async subscribe(email: string, regions: string[] = []): Promise<Subscriber> {
    const [row] = await this.db
      .insert(subscribers)
      .values({ email: email.toLowerCase(), regions })
      .onConflictDoUpdate({
        target: subscribers.email,
        set: { regions },
      })
      .returning();

    return {
      email: row!.email,
      subscribedAt: row!.subscribedAt,
      regions: row!.regions,
    };
  }

  async unsubscribe(email: string): Promise<boolean> {
    const result = await this.db
      .delete(subscribers)
      .where(eq(subscribers.email, email.toLowerCase()))
      .returning({ email: subscribers.email });
    return result.length > 0;
  }

  async findByEmail(email: string): Promise<Subscriber | null> {
    const [row] = await this.db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email.toLowerCase()))
      .limit(1);
    if (!row) return null;
    return { email: row.email, subscribedAt: row.subscribedAt, regions: row.regions };
  }

  async getAll(): Promise<Subscriber[]> {
    const rows = await this.db.select().from(subscribers);
    return rows.map((r) => ({ email: r.email, subscribedAt: r.subscribedAt, regions: r.regions }));
  }

  async getAllEmails(): Promise<string[]> {
    const rows = await this.db.select({ email: subscribers.email }).from(subscribers);
    return rows.map((r) => r.email);
  }

  async count(): Promise<number> {
    const rows = await this.db.select({ email: subscribers.email }).from(subscribers);
    return rows.length;
  }
}
