import { DocumentService } from '../../services/document.service';
import { PrismaClient } from '@prisma/client';
import { S3 } from 'aws-sdk';
import { createWorker } from 'tesseract.js';
import { RabbitMQService } from '@shared/messaging/rabbitmq.service';
import { Logger } from 'winston';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    $transaction: jest.fn(),
    document: {},
    documentVersion: {},
    documentAccess: {},
    oCRResult: {},
    complianceRule: {}
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    Prisma: { JsonObject: {} }
  };
});

jest.mock('aws-sdk', () => {
  const mockS3 = {
    putObject: jest.fn().mockReturnThis(),
    getObject: jest.fn().mockReturnThis(),
    promise: jest.fn()
  };
  return {
    S3: jest.fn(() => mockS3)
  };
});

jest.mock('tesseract.js', () => ({ createWorker: jest.fn() }));

jest.mock('@shared/messaging/rabbitmq.service', () => ({
  RabbitMQService: jest.fn().mockImplementation(() => ({ publishMessage: jest.fn() }))
}));

jest.mock('winston', () => ({
  Logger: jest.fn().mockImplementation(() => ({ info: jest.fn(), error: jest.fn() }))
}));

describe('evaluateComplianceRule', () => {
  let service: DocumentService;
  let mockPrisma: any;
  let mockS3: any;
  let mockRabbitMQ: any;
  let mockLogger: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    mockS3 = new S3();
    mockRabbitMQ = new RabbitMQService({ url: '', exchange: '', queue: '' }, new Logger());
    mockLogger = new Logger();
    service = new DocumentService(mockPrisma, mockRabbitMQ, mockLogger);
    (service as any).s3 = mockS3;
  });

  it('returns true when all conditions pass', async () => {
    const document = {
      metadata: { amount: 100, status: 'PAID' }
    };
    const rule = {
      conditions: [
        { field: 'metadata.status', operator: 'eq', value: 'PAID' },
        { field: 'metadata.amount', operator: 'gte', value: 50 }
      ]
    };

    const result = await (service as any).evaluateComplianceRule(document, rule);
    expect(result).toBe(true);
  });

  it('returns false when any condition fails', async () => {
    const document = {
      metadata: { amount: 30, status: 'PAID' }
    };
    const rule = {
      conditions: [
        { field: 'metadata.amount', operator: 'gte', value: 50 }
      ]
    };

    const result = await (service as any).evaluateComplianceRule(document, rule);
    expect(result).toBe(false);
  });
});
