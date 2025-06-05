import { StudentEvent, StudentNotification } from '@send/shared';
import { RabbitMQService as BaseRabbitMQService, RabbitMQConfig } from '@shared/messaging';
import { logger } from '@shared/logger';

export class RabbitMQService extends BaseRabbitMQService {
  
  constructor(url: string = process.env.RABBITMQ_URL || 'amqp://localhost') {
    const config: RabbitMQConfig = {
      url,
      exchange: 'student_events',
      queue: 'student_events_queue'
    };
    super(config, logger);
  }

  async publishStudentEvent(event: StudentEvent) {
    await this.publishMessage(`student_events.${event.type}`, event);
  }

  async publishNotification(notification: StudentNotification) {
    await this.publishMessage(`notifications.${notification.type}`, notification);
  }

  async subscribeToStudentEvents(callback: (event: StudentEvent) => void) {
    await this.consumeMessages(async (msg) => callback(msg as StudentEvent));
  }
}
