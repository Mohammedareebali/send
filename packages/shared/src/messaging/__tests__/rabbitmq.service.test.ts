import { Channel } from 'amqplib';
import { RabbitMQService, RabbitMQConfig } from '../rabbitmq.service';
import { logger } from '../../logger';

jest.mock('amqplib');

describe('RabbitMQService (shared)', () => {
  let service: RabbitMQService;
  let mockConnection: jest.Mocked<any>;
  let mockChannel: jest.Mocked<Channel>;

  beforeEach(() => {
    mockChannel = {
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue({ queue: 'q' }),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue(true),
      consume: jest.fn().mockResolvedValue({ consumerTag: 't' }),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<Channel>;

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<any>;

    (require('amqplib').connect as jest.Mock).mockResolvedValue(mockConnection);

    const config: RabbitMQConfig = {
      url: 'amqp://localhost',
      exchange: 'test-exchange',
      queue: 'test-queue'
    };
    service = new RabbitMQService(config, logger);
  });

  it('publishes messages after connecting', async () => {
    await service.connect();
    await service.publishMessage('test.key', { hello: 'world' });
    expect(mockChannel.publish).toHaveBeenCalled();
  });

  it('consumes messages', async () => {
    await service.connect();
    const cb = jest.fn().mockResolvedValue(undefined);
    await service.consumeMessages(cb);
    expect(mockChannel.consume).toHaveBeenCalledWith(
      'test-queue',
      expect.any(Function),
      expect.objectContaining({ consumerTag: 'test-queue-consumer' })
    );
  });
});

