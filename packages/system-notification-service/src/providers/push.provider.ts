import { PushNotification } from '../types/notification.types';
import { Logger } from 'winston';

export class PushProvider {
  constructor(private readonly logger: Logger) {}

  async send(notification: PushNotification): Promise<void> {
    this.logger.info('Sending push notification', { notification });
    // Placeholder for actual Firebase or other push notification service
  }
}
