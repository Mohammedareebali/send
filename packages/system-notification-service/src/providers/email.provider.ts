import { EmailNotification } from '../types/notification.types';
import { Logger } from 'winston';

export class EmailProvider {
  constructor(private readonly logger: Logger) {}

  async send(notification: EmailNotification): Promise<void> {
    this.logger.info('Sending email notification', { notification });
    // Placeholder for Nodemailer or other email service
  }
}
