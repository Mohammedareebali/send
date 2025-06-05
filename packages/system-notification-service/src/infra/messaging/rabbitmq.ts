import { RabbitMQService as BaseRabbitMQService, RabbitMQConfig } from '@shared/messaging';
import { logger } from '@shared/logger';

export class RabbitMQService extends BaseRabbitMQService {
  constructor(url: string = process.env.RABBITMQ_URL || 'amqp://localhost') {
    const config: RabbitMQConfig = {
      url,
      exchange: 'notifications',
      queue: 'notifications'
    };
    super(config, logger);
  }
}
