import { EmailNotification } from '../types/notification.types';
import { LoggerService } from '@send/shared';
import nodemailer from 'nodemailer';

interface SMTPConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
}

export class EmailProvider {
  private transporter: any;

  constructor(private readonly logger: LoggerService) {
    const config: SMTPConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    };

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user
        ? {
            user: config.user,
            pass: config.pass
          }
        : undefined
    });
  }

  async send(notification: EmailNotification): Promise<void> {
    this.logger.info('Sending email notification', { id: notification.id });
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: notification.email,
        subject: notification.subject,
        html: notification.htmlContent || notification.message,
        text: notification.message,
        attachments: notification.attachments
      });
      this.logger.info('Email sent', { id: notification.id });
    } catch (error) {
      this.logger.error('Failed to send email', { id: notification.id, error });
      throw error;
    }
  }
}
