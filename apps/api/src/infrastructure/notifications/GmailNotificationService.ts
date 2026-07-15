import nodemailer from 'nodemailer';
import type { INotificationService } from '@stormwatch/application';
import type { AlertDto } from '@stormwatch/application';
import { buildAlertEmailHtml, buildAlertEmailSubject, buildWelcomeEmailHtml, buildWelcomeEmailSubject } from '../email/alertEmailTemplate.js';
import type { DrizzleSubscriptionRepository } from '../repositories/DrizzleSubscriptionRepository.js';
import { logger } from '../logger.js';

export class GmailNotificationService implements INotificationService {
  private readonly transporter: nodemailer.Transporter | null;

  constructor(
    private readonly subscriptionRepository: DrizzleSubscriptionRepository,
    /** Optional: inject a custom transporter (used in tests to mock sending). */
    transporter?: nodemailer.Transporter,
  ) {
    if (transporter) {
      this.transporter = transporter;
    } else {
      const user = process.env['GMAIL_USER'];
      const pass = process.env['GMAIL_APP_PASSWORD'];
      if (user && pass) {
        this.transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
        logger.info({ user }, 'Gmail notification service initialized');
      } else {
        this.transporter = null;
        logger.warn('GMAIL credentials not set — email notifications disabled');
      }
    }
  }

  async sendAlertCreated(alert: AlertDto): Promise<void> {
    const emails = await this.subscriptionRepository.getAllEmails();
    if (emails.length === 0) return;

    if (!this.transporter) {
      logger.warn({ alertId: alert.id, count: emails.length }, '[DRY RUN] Would send alert emails');
      return;
    }

    const subject = buildAlertEmailSubject(alert);
    const results = await Promise.allSettled(
      emails.map(async (email) => {
        const html = buildAlertEmailHtml(alert, email);
        await this.transporter!.sendMail({
          from: `"StormWatch BH" <${process.env['GMAIL_USER']}>`,
          to: email,
          subject,
          html,
        });
        logger.info({ email, alertId: alert.id }, 'Alert email sent');
      }),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) logger.error({ failed, total: emails.length }, 'Some alert emails failed');
  }

  async sendAlertEscalated(alert: AlertDto): Promise<void> {
    await this.sendAlertCreated(alert);
  }

  async sendAlertResolved(_alertId: string, _regionId: string): Promise<void> {
    // no-op for now
  }

  async sendWelcomeEmail(email: string): Promise<void> {
    if (!this.transporter) {
      logger.warn({ email }, '[DRY RUN] Would send welcome email');
      return;
    }
    try {
      await this.transporter.sendMail({
        from: `"StormWatch BH" <${process.env['GMAIL_USER']}>`,
        to: email,
        subject: buildWelcomeEmailSubject(),
        html: buildWelcomeEmailHtml(email),
      });
      logger.info({ email }, 'Welcome email sent');
    } catch (err) {
      logger.error({ email, err }, 'Failed to send welcome email');
    }
  }
}
