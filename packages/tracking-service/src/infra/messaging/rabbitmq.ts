import { TrackingEvent, TrackingNotification } from '@shared/types/tracking';
import { RabbitMQService as BaseRabbitMQService, RabbitMQConfig } from '@shared/messaging';
import { logger } from '@shared/logger';

export class RabbitMQService extends BaseRabbitMQService {
  constructor(url: string = process.env.RABBITMQ_URL || 'amqp://localhost') {
    const config: RabbitMQConfig = {
      url,
      exchange: 'tracking-events',
      queue: 'tracking-notifications'
    };
    super(config, logger);
  }

  async publishTrackingEvent(event: TrackingEvent): Promise<void> {
    await this.publishMessage(`tracking.${event.type.toLowerCase()}`, event);
  }

  async publishNotification(notification: TrackingNotification): Promise<void> {
    await this.publishMessage('tracking.notification', notification);
  }

  async subscribeToTrackingEvents(callback: (event: TrackingEvent) => Promise<void>): Promise<void> {
    await this.consumeMessages(callback);
  }
}
