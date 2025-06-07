import { Run, RunNotification } from '@shared/types/run';
import { RabbitMQService as BaseRabbitMQService, RabbitMQConfig } from '@shared/messaging';
import { logger } from '@shared/logger';
import { getServiceConfig } from '../../config';

export class RabbitMQService extends BaseRabbitMQService {
  constructor(url: string = getServiceConfig().rabbitMQUrl) {
    const config: RabbitMQConfig = {
      url,
      exchange: 'run-events',
      queue: 'run-notifications'
    };
    super(config, logger);
  }

  async publishRunEvent(routingKey: string, run: Run): Promise<void> {
    await this.publishMessage(routingKey, run);
  }

  async publishNotification(notification: RunNotification): Promise<void> {
    await this.publishMessage('notification', notification);
  }

  async subscribeToRunEvents(callback: (message: Run) => Promise<void>): Promise<void> {
    await this.consumeMessages(callback);
  }
}
