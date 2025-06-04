import { connect, Channel, Options } from 'amqplib';
import { Run, RunNotification } from '@shared/types/run';

type RabbitMQConnection = {
  createChannel(): Promise<Channel>;
  close(): Promise<void>;
};

export class RabbitMQService {
  private connection: RabbitMQConnection | null = null;
  private channel: Channel | null = null;
  private readonly exchange = 'run-events';
  private readonly queue = 'run-notifications';

  async connect(url: string = process.env.RABBITMQ_URL || 'amqp://localhost'): Promise<void> {
    try {
      const conn = await connect(url, {} as Options.Connect);
      this.connection = conn as unknown as RabbitMQConnection;
      const ch = await conn.createChannel();
      this.channel = ch;

      if (!this.channel) {
        throw new Error('Failed to create channel');
      }

      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      await this.channel.assertQueue(this.queue, { durable: true });
      await this.channel.bindQueue(this.queue, this.exchange, 'run.*');
    } catch (error: unknown) {
      this.connection = null;
      this.channel = null;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to connect to RabbitMQ: ${errorMessage}`);
    }
  }

  async publishRunEvent(routingKey: string, run: Run): Promise<void> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    try {
      const message = Buffer.from(JSON.stringify(run));
      this.channel.publish(this.exchange, routingKey, message, { persistent: true });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to publish run event: ${errorMessage}`);
    }
  }

  async publishNotification(notification: RunNotification): Promise<void> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    try {
      const message = Buffer.from(JSON.stringify(notification));
      this.channel.publish(this.exchange, 'notification', message, { persistent: true });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to publish notification: ${errorMessage}`);
    }
  }

  async subscribeToRunEvents(callback: (message: Run) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    try {
      await this.channel.consume(this.queue, async (msg) => {
        if (msg && this.channel) {
          try {
            const run = JSON.parse(msg.content.toString()) as Run;
            await callback(run);
            this.channel.ack(msg);
          } catch (error: unknown) {
            console.error('Error processing message:', error);
            this.channel.nack(msg);
          }
        }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to subscribe to run events: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to close RabbitMQ connection: ${errorMessage}`);
    }
  }
} 