import { connect, Channel, Connection } from 'amqplib';
import { Logger } from 'winston';

export interface RabbitMQConfig {
  url: string;
  exchange: string;
  queue: string;
  retryAttempts?: number;
  retryDelay?: number;
}

export class RabbitMQService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly config: Required<RabbitMQConfig>;
  private readonly logger: Logger;

  constructor(config: RabbitMQConfig, logger: Logger) {
    this.config = {
      retryAttempts: 5,
      retryDelay: 5000,
      ...config
    };
    this.logger = logger;
  }

  async connect(): Promise<void> {
    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }

    if (this.connection) {
      return;
    }

    this.isConnecting = true;

    try {
      const conn = await connect(this.config.url);
      this.connection = conn as unknown as Connection;
      const ch = await conn.createChannel();
      this.channel = ch;

      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }

      // Set up main exchange and queue
      await this.channel.assertExchange(this.config.exchange, 'topic', { durable: true });
      await this.channel.assertQueue(this.config.queue, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': `${this.config.exchange}.dlx`,
          'x-dead-letter-routing-key': `${this.config.queue}.dead-letter`
        }
      });
      await this.channel.bindQueue(this.config.queue, this.config.exchange, `${this.config.queue}.*`);

      // Set up dead letter exchange and queue
      await this.channel.assertExchange(`${this.config.exchange}.dlx`, 'topic', { durable: true });
      await this.channel.assertQueue(`${this.config.queue}.dlq`, { durable: true });
      await this.channel.bindQueue(
        `${this.config.queue}.dlq`,
        `${this.config.exchange}.dlx`,
        `${this.config.queue}.dead-letter`
      );

      this.logger.info('Connected to RabbitMQ', {
        exchange: this.config.exchange,
        queue: this.config.queue
      });

      this.reconnectAttempts = 0;
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', { error });
      await this.handleConnectionError(error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  getChannel(): Channel | null {
    return this.channel;
  }

  async publishMessage(routingKey: string, message: any): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      await this.channel.publish(
        this.config.exchange,
        routingKey,
        messageBuffer,
        {
          persistent: true,
          contentType: 'application/json',
          timestamp: Date.now()
        }
      );
      this.logger.debug('Message published', { routingKey, message });
    } catch (error) {
      this.logger.error('Failed to publish message', { error, routingKey, message });
      if (error instanceof Error && error.message.includes('channel closed')) {
        await this.handleConnectionError(error);
        await this.publishMessage(routingKey, message);
      } else {
        throw error;
      }
    }
  }

  async consumeMessages(callback: (message: any) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    try {
      await this.channel.consume(this.config.queue, async (msg) => {
        if (!msg) return;

        try {
          const message = JSON.parse(msg.content.toString());
          await callback(message);
          this.channel?.ack(msg);
        } catch (error) {
          this.logger.error('Error processing message', { error, message: msg.content.toString() });
          this.channel?.nack(msg, false, false); // Don't requeue failed messages
        }
      }, {
        noAck: false,
        consumerTag: `${this.config.queue}-consumer`
      });

      this.logger.info('Started consuming messages', { queue: this.config.queue });
    } catch (error) {
      this.logger.error('Failed to consume messages', { error });
      if (error instanceof Error && error.message.includes('channel closed')) {
        await this.handleConnectionError(error);
        await this.consumeMessages(callback);
      } else {
        throw error;
      }
    }
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await (this.connection as any).close();
        this.connection = null;
      }
      this.logger.info('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', { error });
      throw error;
    }
  }

  private async handleConnectionError(error: any): Promise<void> {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts >= this.config.retryAttempts) {
      this.logger.error('Max reconnection attempts reached', { error });
      throw new Error('Max reconnection attempts reached');
    }

    this.logger.warn('Attempting to reconnect to RabbitMQ', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.config.retryAttempts
    });

    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
    await this.connect();
  }
} 