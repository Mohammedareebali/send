import { connect, Channel, Connection } from 'amqplib';
import { TrackingEvent, TrackingNotification } from '@shared/types/tracking';

export class RabbitMQService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly exchange = 'tracking-events';
  private readonly queue = 'tracking-notifications';

  async connect(url: string = process.env.RABBITMQ_URL || 'amqp://localhost'): Promise<void> {
    try {
      this.connection = await connect(url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      await this.channel.assertQueue(this.queue, { durable: true });
      await this.channel.bindQueue(this.queue, this.exchange, 'tracking.*');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async publishTrackingEvent(event: TrackingEvent): Promise<void> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    try {
      const message = Buffer.from(JSON.stringify(event));
      await this.channel.publish(
        this.exchange,
        `tracking.${event.type.toLowerCase()}`,
        message,
        { persistent: true }
      );
    } catch (error) {
      console.error('Failed to publish tracking event:', error);
      throw error;
    }
  }

  async publishNotification(notification: TrackingNotification): Promise<void> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    try {
      const message = Buffer.from(JSON.stringify(notification));
      await this.channel.publish(
        this.exchange,
        'tracking.notification',
        message,
        { persistent: true }
      );
    } catch (error) {
      console.error('Failed to publish notification:', error);
      throw error;
    }
  }

  async subscribeToTrackingEvents(callback: (event: TrackingEvent) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    try {
      await this.channel.consume(this.queue, async (msg) => {
        if (msg) {
          try {
            const event = JSON.parse(msg.content.toString()) as TrackingEvent;
            await callback(event);
            this.channel?.ack(msg);
          } catch (error) {
            console.error('Error processing tracking event:', error);
            this.channel?.nack(msg);
          }
        }
      });
    } catch (error) {
      console.error('Failed to subscribe to tracking events:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
    } catch (error) {
      console.error('Failed to close RabbitMQ connection:', error);
      throw error;
    }
  }
} 