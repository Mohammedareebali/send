import * as amqp from 'amqplib';

type AmqpConnection = {
  createChannel(): Promise<amqp.Channel>;
  close(): Promise<void>;
};

export class RabbitMQService {
  private connection: AmqpConnection | null = null;
  private channel: amqp.Channel | null = null;

  constructor(private readonly url: string) {}

  async connect() {
    try {
      const conn = (await amqp.connect(this.url)) as unknown as AmqpConnection;
      this.connection = conn;
      this.channel = await conn.createChannel();
      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async publishMessage(exchange: string, message: any) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    try {
      await this.channel.assertExchange(exchange, 'fanout', { durable: true });
      await this.channel.publish(
        exchange,
        '',
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
    } catch (error) {
      console.error('Failed to publish message:', error);
      throw error;
    }
  }

  async close() {
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
      console.error('Error closing RabbitMQ connection:', error);
      throw error;
    }
  }
} 