import * as amqp from 'amqplib';
import winston, { Logger } from 'winston';

export class RabbitMQService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private logger: Logger;
  private url: string;

  constructor() {
    this.url = process.env.RABBITMQ_URL || 'amqp://localhost';
    this.logger = this.createLogger();
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      
      // Declare the notifications exchange
      await this.channel.assertExchange('notifications', 'direct', { durable: true });
      
      // Declare the notifications queue
      await this.channel.assertQueue('notifications', { durable: true });
      await this.channel.bindQueue('notifications', 'notifications', 'notifications');

      this.logger.info('Connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', { error });
      throw error;
    }
  }

  async publishMessage(exchange: string, message: any): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    try {
      await this.channel.publish(
        exchange,
        'notifications',
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
      this.logger.info('Message published to RabbitMQ', { exchange, message });
    } catch (error) {
      this.logger.error('Failed to publish message to RabbitMQ', { error, exchange, message });
      throw error;
    }
  }

  async consumeMessages(queue: string, callback: (message: any) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    try {
      await this.channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            const message = JSON.parse(msg.content.toString());
            await callback(message);
            this.channel?.ack(msg);
          } catch (error) {
            this.logger.error('Error processing message', { error, message: msg.content.toString() });
            this.channel?.nack(msg);
          }
        }
      });
    } catch (error) {
      this.logger.error('Failed to consume messages from RabbitMQ', { error, queue });
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
      this.logger.info('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', { error });
      throw error;
    }
  }

  private createLogger(): Logger {
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/rabbitmq.log' }),
      ],
    });
  }
} 