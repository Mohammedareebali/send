import { SMSNotification } from '../types/notification.types';
import { Logger } from 'winston';

export class SMSProvider {
  constructor(private readonly logger: Logger) {}

  async send(notification: SMSNotification): Promise<void> {
    this.logger.info('Sending SMS notification', { notification });
    // Placeholder for Twilio or other SMS provider
  }
}
