import * as amqp from 'amqplib';
import { config } from '../config';
import { LoggerService } from '@send/shared';

const logger = new LoggerService({ serviceName: 'user-service' });

let channel: amqp.Channel | null = null;
let connection: amqp.Connection | null = null;

export const setupEventBus = async () => {
  try {
    connection = await amqp.connect(config.rabbitMQ.url);
    channel = await connection.createChannel();

    // Declare the exchange
    await channel.assertExchange(config.rabbitMQ.exchange, 'topic', {
      durable: true,
    });

    // Declare queues for user events
    const queues = [
      'user.created',
      'user.updated',
      'user.deleted',
      'user.status.changed',
      'user.login',
    ];

    for (const queue of queues) {
      await channel.assertQueue(queue, { durable: true });
      await channel.bindQueue(queue, config.rabbitMQ.exchange, queue);
    }

    logger.info('Event bus setup completed');
    return { connection, channel };
  } catch (error) {
    logger.error('Failed to setup event bus:', error);
    throw error;
  }
};

export const publishEvent = async (
  routingKey: string,
  message: any
) => {
  try {
    if (!channel) {
      throw new Error('Event bus not initialized');
    }
    await channel.publish(
      config.rabbitMQ.exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  } catch (error) {
    logger.error('Failed to publish event:', error);
    throw error;
  }
};

export const getChannel = () => channel;
