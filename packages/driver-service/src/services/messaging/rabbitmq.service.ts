import { Channel, Connection, connect } from 'amqplib';

export class RabbitMQService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  constructor(private readonly url: string) {}

  async connect(): Promise<void> {
    this.connection = await connect(this.url);
    this.channel = await this.connection.createChannel();
  }

  async publishMessage(queue: string, message: any): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    await this.channel.assertQueue(queue, { durable: true });
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
  }

  async publishDriverEvent(event: { type: string; data: any; timestamp: Date }): Promise<void> {
    await this.publishMessage('driver-events', event);
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
} 