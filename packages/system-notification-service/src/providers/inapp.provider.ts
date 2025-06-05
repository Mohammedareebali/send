import { InAppNotification } from '../types/notification.types';
import { Logger } from 'winston';

export class InAppProvider {
  constructor(private readonly logger: Logger) {}

  async send(notification: InAppNotification): Promise<void> {
    this.logger.info('Sending in-app notification', { notification });
    // Placeholder for real-time in-app notification delivery
  }
}
