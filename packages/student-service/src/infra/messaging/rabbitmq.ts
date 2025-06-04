import amqp from 'amqplib';
import { StudentEvent, StudentNotification } from '@send/shared';

type AmqpConnection = any;
type AmqpChannel = any;

export class RabbitMQService {
  private connection: AmqpConnection | null = null;
  private channel: AmqpChannel | null = null;

  async connect() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      this.channel = await this.connection.createChannel();

      // Set up exchanges
      await this.channel?.assertExchange('student_events', 'topic', { durable: true });
      await this.channel?.assertExchange('notifications', 'topic', { durable: true });

      // Set up queues
      await this.channel?.assertQueue('student_events_queue', { durable: true });
      await this.channel?.assertQueue('notifications_queue', { durable: true });

      // Bind queues to exchanges
      await this.channel?.bindQueue('student_events_queue', 'student_events', '#');
      await this.channel?.assertQueue('notifications_queue', 'notifications', '#');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async publishStudentEvent(event: StudentEvent) {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    try {
      await this.channel.publish(
        'student_events',
        event.type,
        Buffer.from(JSON.stringify(event))
      );
    } catch (error) {
      console.error('Failed to publish student event:', error);
      throw error;
    }
  }

  async publishNotification(notification: StudentNotification) {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    try {
      await this.channel.publish(
        'notifications',
        notification.type,
        Buffer.from(JSON.stringify(notification))
      );
    } catch (error) {
      console.error('Failed to publish notification:', error);
      throw error;
    }
  }

  async subscribeToStudentEvents(callback: (event: StudentEvent) => void) {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    try {
      await this.channel.consume('student_events_queue', (msg: any) => {
        if (msg) {
          const event = JSON.parse(msg.content.toString()) as StudentEvent;
          callback(event);
          this.channel?.ack(msg);
        }
      });
    } catch (error) {
      console.error('Failed to subscribe to student events:', error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      console.error('Failed to close RabbitMQ connection:', error);
      throw error;
    }
  }
} 