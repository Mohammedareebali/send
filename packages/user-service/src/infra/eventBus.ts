import * as amqp from 'amqplib';
import { config } from '../config';

export const setupEventBus = async () => {
  try {
    const connection = await amqp.connect(config.rabbitMQ.url);
    const channel = await connection.createChannel();

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
    ];

    for (const queue of queues) {
      await channel.assertQueue(queue, { durable: true });
      await channel.bindQueue(queue, config.rabbitMQ.exchange, queue);
    }

    console.log('Event bus setup completed');
    return { connection, channel };
  } catch (error) {
    console.error('Failed to setup event bus:', error);
    throw error;
  }
};

export const publishEvent = async (
  channel: amqp.Channel,
  routingKey: string,
  message: any
) => {
  try {
    await channel.publish(
      config.rabbitMQ.exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  } catch (error) {
    console.error('Failed to publish event:', error);
    throw error;
  }
}; 