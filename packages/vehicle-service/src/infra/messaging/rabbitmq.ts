import * as amqp from 'amqplib';
import { VehicleEvent } from '../../types/vehicle.types';

type AmqpConnection = {
  createChannel(): Promise<amqp.Channel>;
  close(): Promise<void>;
};

export class RabbitMQService {
  private connection: AmqpConnection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly exchange = 'vehicle-events';
  private readonly queue = 'vehicle-notifications';
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 5000; // 5 seconds

  constructor(private readonly url: string = process.env.RABBITMQ_URL || 'amqp://localhost') {}

  async connect(): Promise<void> {
    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }

    if (this.connection) {
      return;
    }

    this.isConnecting = true;

    try {
      const conn = (await amqp.connect(this.url)) as unknown as AmqpConnection;
      this.connection = conn;
      this.channel = await conn.createChannel();

      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }

      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      await this.channel.assertQueue(this.queue, { 
        durable: true,
        arguments: {
          'x-dead-letter-exchange': `${this.exchange}.dlx`,
          'x-dead-letter-routing-key': 'vehicle.dead-letter'
        }
      });
      await this.channel.bindQueue(this.queue, this.exchange, 'vehicle.*');
      
      // Set up dead letter exchange
      await this.channel.assertExchange(`${this.exchange}.dlx`, 'topic', { durable: true });
      await this.channel.assertQueue(`${this.queue}.dlq`, { durable: true });
      await this.channel.bindQueue(`${this.queue}.dlq`, `${this.exchange}.dlx`, 'vehicle.dead-letter');
      
      console.log('Connected to RabbitMQ');
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      await this.handleConnectionError(error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  private async handleConnectionError(error: unknown): Promise<void> {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
      await this.connect();
    } else {
      console.error('Max reconnection attempts reached');
      throw new Error('Failed to establish RabbitMQ connection after multiple attempts');
    }
  }

  async publishVehicleEvent(event: VehicleEvent): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    try {
      const message = Buffer.from(JSON.stringify(event));
      await this.channel.publish(
        this.exchange,
        `vehicle.${event.type.toLowerCase()}`,
        message,
        { 
          persistent: true,
          contentType: 'application/json',
          timestamp: Date.now()
        }
      );
    } catch (error) {
      console.error('Failed to publish vehicle event:', error);
      if (error instanceof Error && error.message.includes('channel closed')) {
        await this.connect();
        await this.publishVehicleEvent(event);
      } else {
        throw error;
      }
    }
  }

  async subscribeToVehicleEvents(callback: (event: VehicleEvent) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    try {
      await this.channel.consume(this.queue, async (msg) => {
        if (!msg) return;

        try {
          const event = JSON.parse(msg.content.toString()) as VehicleEvent;
          await callback(event);
          this.channel?.ack(msg);
        } catch (error) {
          console.error('Error processing vehicle event:', error);
          this.channel?.nack(msg, false, false); // Don't requeue failed messages
        }
      }, {
        noAck: false,
        consumerTag: 'vehicle-service-consumer'
      });
    } catch (error) {
      console.error('Failed to subscribe to vehicle events:', error);
      if (error instanceof Error && error.message.includes('channel closed')) {
        await this.connect();
        await this.subscribeToVehicleEvents(callback);
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
        await this.connection.close();
        this.connection = null;
      }
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
      throw error;
    }
  }
} 