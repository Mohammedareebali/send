import { DocumentService } from '../../services/document.service';
import { PrismaClient } from '@prisma/client';
import { S3 } from 'aws-sdk';
import { createWorker } from 'tesseract.js';
import { RabbitMQService } from '@shared/messaging/rabbitmq.service';
import { Logger } from 'winston';

// Mock Prisma client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    $transaction: jest.fn(),
    document: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn()
    },
    documentVersion: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    documentAccess: {
      create: jest.fn()
    },
    oCRResult: {
      create: jest.fn()
    },
    complianceRule: {
      findMany: jest.fn()
    }
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    Prisma: {
      JsonObject: {}
    }
  };
});

// Mock AWS S3
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

// Mock Tesseract.js
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn()
}));

// Mock RabbitMQ service
jest.mock('@shared/messaging/rabbitmq.service', () => ({
  RabbitMQService: jest.fn().mockImplementation(() => ({
    publishMessage: jest.fn()
  }))
}));

// Mock Logger
jest.mock('winston', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }))
}));

describe('DocumentService', () => {
  let documentService: DocumentService;
  let mockPrisma: any;
  let mockS3: any;
  let mockOcrWorker: any;
  let mockRabbitMQ: any;
  let mockLogger: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    mockS3 = new S3();
    mockRabbitMQ = new RabbitMQService({ url: 'amqp://localhost', exchange: 'test', queue: 'test' }, new Logger());
    mockLogger = new Logger();
    mockOcrWorker = {
      load: jest.fn().mockResolvedValue(undefined),
      loadLanguage: jest.fn().mockResolvedValue(undefined),
      recognize: jest.fn().mockResolvedValue({
        data: {
          text: 'Sample OCR text',
          confidence: 0.95
        }
      })
    };
    (createWorker as jest.Mock).mockReturnValue(mockOcrWorker);

    documentService = new DocumentService(mockPrisma, mockRabbitMQ, mockLogger);
    (documentService as any).s3 = mockS3;
    (documentService as any).ocrWorker = mockOcrWorker;
  });

  describe('uploadDocument', () => {
    it('should upload a document and create initial version', async () => {
      const mockFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test')
      };

      const mockDocument = {
        id: '1',
        userId: 'user1',
        type: 'invoice',
        filename: 'test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        status: 'UPLOADED',
        complianceStatus: 'PENDING',
        metadata: {},
        storagePath: 'user1/123-test.pdf',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.$transaction.mockImplementation(async (callback: (tx: any) => Promise<any>) => {
        return callback(mockPrisma);
      });

      mockPrisma.document.create.mockResolvedValue(mockDocument);
      mockPrisma.documentVersion.create.mockResolvedValue({
        id: 'v1',
        documentId: '1',
        version: 1,
        filename: 'test.pdf',
        storagePath: 'user1/123-test.pdf',
        changes: ['Initial version'],
        uploadedBy: 'user1',
        createdAt: new Date()
      });

      mockS3.promise.mockResolvedValue({});

      const result = await documentService.uploadDocument(
        'user1',
        mockFile,
        'invoice',
        {}
      );

      expect(result).toEqual({
        id: '1',
        userId: 'user1',
        type: 'invoice',
        fileName: 'test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        status: 'UPLOADED',
        complianceStatus: 'PENDING',
        metadata: {},
        storagePath: 'user1/123-test.pdf',
        createdAt: mockDocument.createdAt,
        updatedAt: mockDocument.updatedAt
      });

      expect(mockS3.putObject).toHaveBeenCalledWith({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: expect.any(String),
        Body: mockFile.buffer,
        ContentType: mockFile.mimetype
      });

      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          type: 'invoice',
          filename: 'test.pdf',
          originalName: 'test.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          status: 'UPLOADED',
          complianceStatus: 'PENDING',
          metadata: {},
          storagePath: expect.any(String)
        }
      });
    });
  });

  describe('getDocumentById', () => {
    it('should return a document with its versions and OCR results', async () => {
      const mockDocument = {
        id: '1',
        userId: 'user1',
        type: 'invoice',
        filename: 'test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        status: 'UPLOADED',
        complianceStatus: 'COMPLIANT',
        metadata: {},
        storagePath: 'user1/123-test.pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [{
          id: 'v1',
          documentId: '1',
          version: 1,
          filename: 'test.pdf',
          storagePath: 'user1/123-test.pdf',
          changes: ['Initial version'],
          uploadedBy: 'user1',
          createdAt: new Date()
        }],
        ocrResults: [{
          id: 'ocr1',
          documentId: '1',
          rawText: 'Sample OCR text',
          structuredData: {},
          confidence: 0.95,
          processingTime: 100,
          createdAt: new Date()
        }]
      };

      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);

      const result = await documentService.getDocumentById('1');

      expect(result).toEqual({
        id: '1',
        userId: 'user1',
        type: 'invoice',
        fileName: 'test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        status: 'UPLOADED',
        complianceStatus: 'COMPLIANT',
        metadata: {},
        storagePath: 'user1/123-test.pdf',
        ocrText: 'Sample OCR text',
        ocrConfidence: 0.95,
        createdAt: mockDocument.createdAt,
        updatedAt: mockDocument.updatedAt
      });

      expect(mockPrisma.document.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          versions: true,
          ocrResults: true
        }
      });
    });

    it('should return null if document not found', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);

      const result = await documentService.getDocumentById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateDocumentAccess', () => {
    it('should create document access record', async () => {
      const mockAccess = {
        id: 'access1',
        documentId: '1',
        userId: 'user2',
        permission: 'READ',
        grantedBy: 'user1',
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000) // 1 day from now
      };

      mockPrisma.documentAccess.create.mockResolvedValue(mockAccess);

      const result = await documentService.updateDocumentAccess(
        '1',
        'user2',
        'READ',
        'user1',
        new Date(Date.now() + 86400000)
      );

      expect(result).toEqual({
        id: 'access1',
        documentId: '1',
        userId: 'user2',
        permission: 'READ',
        grantedBy: 'user1',
        grantedAt: mockAccess.grantedAt,
        expiresAt: mockAccess.expiresAt
      });

      expect(mockPrisma.documentAccess.create).toHaveBeenCalledWith({
        data: {
          documentId: '1',
          userId: 'user2',
          permission: 'READ',
          grantedBy: 'user1',
          expiresAt: expect.any(Date)
        }
      });
    });
  });

  describe('listDocuments', () => {
    it('should return documents filtered by userId and type', async () => {
      const docs = [
        { id: '1', userId: 'u1', type: 'LICENSE' },
        { id: '2', userId: 'u1', type: 'DBS' },
      ];
      mockPrisma.document.findMany.mockResolvedValue(docs);

      const result = await documentService.listDocuments({ userId: 'u1', type: 'LICENSE' });

      expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1', type: 'LICENSE' },
      });
      expect(result[0].id).toBe('1');
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document by id', async () => {
      mockPrisma.document.delete.mockResolvedValue({});

      await documentService.deleteDocument('doc1');

      expect(mockPrisma.document.delete).toHaveBeenCalledWith({ where: { id: 'doc1' } });
    });
  });

  describe('updateDocumentMetadata', () => {
    it('should update metadata and publish event', async () => {
      const mockDoc = { id: '1', userId: 'u1', metadata: { expiryDate: new Date() } };
      mockPrisma.document.update.mockResolvedValue(mockDoc);

      const result = await documentService.updateDocumentMetadata('1', { foo: 'bar' });

      expect(result).toEqual(expect.objectContaining({ id: '1' }));
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { metadata: expect.any(Object) }
      });
      expect(mockRabbitMQ.publishMessage).toHaveBeenCalledWith('document.metadata.updated', expect.any(Object));
    });
  });

  describe('expireOutdatedDocuments', () => {
    it('should mark expired documents and publish event', async () => {
      const past = new Date(Date.now() - 1000);
      const doc = { id: '1', userId: 'u1', metadata: { expiryDate: past }, status: 'UPLOADED' };
      mockPrisma.document.findMany.mockResolvedValue([doc]);
      mockPrisma.document.update.mockResolvedValue({});

      await documentService.expireOutdatedDocuments();

      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'EXPIRED' }
      });
      expect(mockRabbitMQ.publishMessage).toHaveBeenCalledWith('document.expired', expect.any(Object));
    });
  });
});
