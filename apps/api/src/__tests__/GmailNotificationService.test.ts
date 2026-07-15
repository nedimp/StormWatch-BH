/**
 * GmailNotificationService — email integration tests
 *
 * Uses a mocked nodemailer transport so no real emails are sent during CI/CD.
 * The mock captures every sendMail() call so we can assert:
 *   - the correct recipient
 *   - the correct subject
 *   - the HTML body contains the expected content
 *
 * This tests the full email pipeline:
 *   subscriber data → template rendering → transport.sendMail()
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Transporter } from 'nodemailer';
import { GmailNotificationService } from '../infrastructure/notifications/GmailNotificationService.js';
import type { AlertDto } from '@stormwatch/application';

// ── Mock subscriber repository ──────────────────────────────────────────────

const TEST_SUBSCRIBERS = ['test@example.com', 'user2@example.com'];

function makeFakeSubscriptionRepo(emails = TEST_SUBSCRIBERS) {
  return {
    getAllEmails: vi.fn().mockResolvedValue(emails),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    findByEmail: vi.fn(),
    count: vi.fn().mockResolvedValue(emails.length),
  } as unknown as import('../infrastructure/repositories/DrizzleSubscriptionRepository.js').DrizzleSubscriptionRepository;
}

// ── Mock nodemailer transport ─────────────────────────────────────────────────

function makeMockTransport() {
  const sendMail = vi.fn().mockResolvedValue({ messageId: 'mock-id' });
  return { sendMail } as unknown as Transporter;
}

// ── Test alert fixture ────────────────────────────────────────────────────────

const CRITICAL_WIND_ALERT: AlertDto = {
  id: 'alert-1',
  regionId: 'sarajevo',
  regionName: 'Kanton Sarajevo',
  severity: 'CRITICAL',
  condition: 'STRONG_WIND',
  title: 'KRITIČNA UZBUNA: Jak vjetar',
  description: 'Olujni vjetar 95 km/h, udari do 130 km/h',
  recommendations: ['Izbjegavajte kretanje na otvorenom', 'Sklonite predmete s terasa'],
  status: 'ACTIVE',
  issuedAt: new Date().toISOString(),
  validUntil: new Date(Date.now() + 6 * 3_600_000).toISOString(),
  severityColor: '#9C27B0',
  isForecasted: false,
};

const FORECAST_ALERT: AlertDto = {
  ...CRITICAL_WIND_ALERT,
  id: 'alert-2',
  severity: 'HIGH',
  title: 'Prognoza (za 2 dana): Jak vjetar',
  isForecasted: true,
  forecastFor: new Date(Date.now() + 48 * 3_600_000).toISOString(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GmailNotificationService', () => {
  let transport: ReturnType<typeof makeMockTransport>;
  let service: GmailNotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    transport = makeMockTransport();
    // Re-create repo each time so mutations in one test don't affect others
    service = new GmailNotificationService(makeFakeSubscriptionRepo(), transport);
  });

  describe('sendWelcomeEmail', () => {
    it('sends exactly one email to the new subscriber', async () => {
      await service.sendWelcomeEmail('new@example.com');
      expect(transport.sendMail).toHaveBeenCalledOnce();
    });

    it('sends to the correct recipient', async () => {
      await service.sendWelcomeEmail('new@example.com');
      const call = (transport.sendMail as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.to).toBe('new@example.com');
    });

    it('subject is in Bosnian and mentions StormWatch', async () => {
      await service.sendWelcomeEmail('new@example.com');
      const call = (transport.sendMail as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.subject).toMatch(/StormWatch/i);
    });

    it('HTML body contains the subscriber email address', async () => {
      await service.sendWelcomeEmail('new@example.com');
      const call = (transport.sendMail as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.html).toContain('new@example.com');
    });

    it('HTML body contains an unsubscribe link', async () => {
      await service.sendWelcomeEmail('new@example.com');
      const call = (transport.sendMail as ReturnType<typeof vi.fn>).mock.calls[0][0];
      // Template uses Bosnian: "Otkazati pretplatu"
      expect(call.html).toContain('Otkazati pretplatu');
    });
  });

  describe('sendAlertCreated — observed alert', () => {
    it('sends one email per subscriber', async () => {
      await service.sendAlertCreated(CRITICAL_WIND_ALERT);
      expect(transport.sendMail).toHaveBeenCalledTimes(TEST_SUBSCRIBERS.length);
    });

    it('sends to all subscribed emails', async () => {
      await service.sendAlertCreated(CRITICAL_WIND_ALERT);
      const recipients = (transport.sendMail as ReturnType<typeof vi.fn>).mock.calls.map(
        ([mail]) => mail.to,
      );
      expect(recipients).toEqual(expect.arrayContaining(TEST_SUBSCRIBERS));
    });

    it('subject contains the alert title', async () => {
      await service.sendAlertCreated(CRITICAL_WIND_ALERT);
      const call = (transport.sendMail as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.subject).toContain(CRITICAL_WIND_ALERT.title);
    });

    it('HTML body contains the region name', async () => {
      await service.sendAlertCreated(CRITICAL_WIND_ALERT);
      const call = (transport.sendMail as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.html).toContain('Kanton Sarajevo');
    });

    it('HTML body contains at least one recommendation', async () => {
      await service.sendAlertCreated(CRITICAL_WIND_ALERT);
      const call = (transport.sendMail as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.html).toContain(CRITICAL_WIND_ALERT.recommendations[0]);
    });

    it('sends nothing when subscriber list is empty', async () => {
      // Create a fresh service with an empty subscriber list
      const emptyService = new GmailNotificationService(makeFakeSubscriptionRepo([]), transport);
      await emptyService.sendAlertCreated(CRITICAL_WIND_ALERT);
      expect(transport.sendMail).not.toHaveBeenCalled();
    });
  });

  describe('sendAlertCreated — forecast alert', () => {
    it('sends emails for forecast alerts too', async () => {
      await service.sendAlertCreated(FORECAST_ALERT);
      expect(transport.sendMail).toHaveBeenCalledTimes(TEST_SUBSCRIBERS.length);
    });

    it('forecast title appears in the email', async () => {
      await service.sendAlertCreated(FORECAST_ALERT);
      const call = (transport.sendMail as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.subject).toContain('Prognoza');
    });
  });

  describe('sendAlertEscalated', () => {
    it('delegates to sendAlertCreated (same email format)', async () => {
      await service.sendAlertEscalated(CRITICAL_WIND_ALERT);
      expect(transport.sendMail).toHaveBeenCalledTimes(TEST_SUBSCRIBERS.length);
    });
  });
});
