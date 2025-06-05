import { DriverEvent, DriverNotification } from '../../types/driver.types';
import { RabbitMQService as BaseRabbitMQService, RabbitMQConfig } from '@shared/messaging';
import { logger } from '@shared/logger';

export class RabbitMQService extends BaseRabbitMQService {
  constructor(url: string = process.env.RABBITMQ_URL || 'amqp://localhost') {
    const config: RabbitMQConfig = {
      url,
      exchange: 'driver-events',
      queue: 'driver-notifications'
    };
    super(config, logger);
  }

  async publishDriverEvent(event: DriverEvent): Promise<void> {
    await this.publishMessage(`driver.${event.type.toLowerCase()}`, event);
  }

  async publishNotification(notification: DriverNotification): Promise<void> {
    await this.publishMessage('driver.notification', notification);
  }

  async subscribeToDriverEvents(callback: (event: DriverEvent) => Promise<void>): Promise<void> {
    await this.consumeMessages(callback);
  }
}
