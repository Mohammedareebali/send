import { Channel, Connection } from 'amqplib';
import { RabbitMQService } from '../../../infra/messaging/rabbitmq';
import { Run, RunStatus, RunType } from '@shared/types/run';

jest.mock('amqplib');

describe('RabbitMQService', () => {
  let rabbitMQ: RabbitMQService;
  let mockConnection: jest.Mocked<Connection>;
  let mockChannel: jest.Mocked<Channel>;

  beforeEach(() => {
    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<Connection>;

    mockChannel = {
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue({ queue: 'test-queue' }),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue(true),
      consume: jest.fn().mockResolvedValue({ consumerTag: 'test-consumer' }),
      close: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<Channel>;

    (require('amqplib').connect as jest.Mock).mockResolvedValue(mockConnection);
    rabbitMQ = new RabbitMQService();
  });

  describe('connect', () => {
    it('should establish connection and set up exchanges and queues', async () => {
      await rabbitMQ.connect();

      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        'run-events',
        'topic',
        { durable: true }
      );
      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        'run-notifications',
        { durable: true }
      );
      expect(mockChannel.bindQueue).toHaveBeenCalledWith(
        'run-notifications',
        'run-events',
        'run.*'
      );
    });
  });

  describe('publishRunEvent', () => {
    it('should publish a run event', async () => {
      await rabbitMQ.connect();

      const run: Run = {
        id: 'run-1',
        type: RunType.REGULAR,
        status: RunStatus.PENDING,
        startTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        pickupLocation: { latitude: 0, longitude: 0, address: 'Test Address' },
        dropoffLocation: { latitude: 0, longitude: 0, address: 'Test Address' },
        driverId: 'driver-1',
        paId: 'pa-1',
        studentIds: ['student-1'],
        endTime: undefined,
        routeId: undefined,
        notes: undefined
      };

      await rabbitMQ.publishRunEvent('RUN_CREATED', run);

      expect(mockChannel.publish).toHaveBeenCalledWith(
        'run-events',
        'RUN_CREATED',
        expect.any(Buffer),
        { persistent: true }
      );
    });

    it('should throw error if not connected', async () => {
      const run: Run = {
        id: 'run-1',
        type: RunType.REGULAR,
        status: RunStatus.PENDING,
        startTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        pickupLocation: { latitude: 0, longitude: 0, address: 'Test Address' },
        dropoffLocation: { latitude: 0, longitude: 0, address: 'Test Address' },
        driverId: 'driver-1',
        paId: 'pa-1',
        studentIds: ['student-1'],
        endTime: undefined,
        routeId: undefined,
        notes: undefined
      };

      await expect(rabbitMQ.publishRunEvent('RUN_CREATED', run)).rejects.toThrow(
        'Not connected to RabbitMQ'
      );
    });
  });

  describe('publishNotification', () => {
    it('should publish a notification', async () => {
      await rabbitMQ.connect();

      const notification = {
        type: 'RUN_CREATED',
        userId: 'user-1',
        message: 'New run created',
        data: { runId: 'run-1' }
      };

      await rabbitMQ.publishNotification(notification);

      expect(mockChannel.publish).toHaveBeenCalledWith(
        'run-events',
        'notification',
        expect.any(Buffer),
        { persistent: true }
      );
    });

    it('should throw error if not connected', async () => {
      const notification = {
        type: 'RUN_CREATED',
        userId: 'user-1',
        message: 'New run created',
        data: { runId: 'run-1' }
      };

      await expect(rabbitMQ.publishNotification(notification)).rejects.toThrow(
        'Not connected to RabbitMQ'
      );
    });
  });

  describe('subscribeToRunEvents', () => {
    it('should subscribe to run events', async () => {
      await rabbitMQ.connect();

      const callback = jest.fn();
      await rabbitMQ.subscribeToRunEvents(callback);

      expect(mockChannel.consume).toHaveBeenCalledWith(
        'run-notifications',
        expect.any(Function)
      );
    });

    it('should throw error if not connected', async () => {
      const callback = jest.fn();

      await expect(rabbitMQ.subscribeToRunEvents(callback)).rejects.toThrow(
        'Not connected to RabbitMQ'
      );
    });
  });

  describe('close', () => {
    it('should close connection and channel', async () => {
      await rabbitMQ.connect();
      await rabbitMQ.close();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle errors during closure', async () => {
      await rabbitMQ.connect();
      mockChannel.close.mockRejectedValue(new Error('Channel close error'));

      await expect(rabbitMQ.close()).rejects.toThrow('Channel close error');
    });
  });
}); 