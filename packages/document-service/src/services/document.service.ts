import { PrismaClient, Prisma } from '@prisma/client';

import { S3 } from 'aws-sdk';
import { createWorker, Worker } from 'tesseract.js';
import { RabbitMQService } from '@shared/messaging/rabbitmq.service';
import { Logger } from 'winston';
import { Document, DocumentVersion, DocumentAccess, OCRResult } from '@shared/types/document';

interface MulterFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

interface OCRResultData {
  id: string;
  documentId: string;
  text: string;
  confidence: number;
  status: string;
}

interface RecognizeResult {
  data: {
    text: string;
    confidence: number;
  };
}

export class DocumentService {
  private ocrWorker: Worker | null = null;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly rabbitMQ: RabbitMQService,
    private readonly logger: Logger,
    private readonly s3: S3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    })
  ) {}

  async initialize(): Promise<void> {
    this.ocrWorker = await createWorker();
    await this.ocrWorker.load();
    await this.ocrWorker.loadLanguage('eng');
  }

  async cleanup(): Promise<void> {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
  }

  async uploadDocument(
    userId: string,
    file: MulterFile,
    type: string,
    metadata: Record<string, any>
  ): Promise<Document> {
    try {
      this.logger.info('Uploading document', { userId, type, filename: file.originalname });

      // Upload to S3
      const storagePath = `${userId}/${Date.now()}-${file.originalname}`;
      await this.s3
        .putObject({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: storagePath,
          Body: file.buffer,
          ContentType: file.mimetype
        })
        .promise();

      // Create document record
      const document = await this.prisma.$transaction(async (tx) => {
        const doc = await (tx as any).document.create({
          data: {
            userId,
            type,
            filename: file.originalname,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            status: 'UPLOADED',
            complianceStatus: 'PENDING',
            metadata: metadata as Prisma.JsonObject,
            storagePath
          }
        });

        // Create initial version
        await (tx as any).documentVersion.create({
          data: {
            documentId: doc.id,
            version: 1,
            filename: file.originalname,
            storagePath,
            changes: ['Initial version'],
            uploadedBy: userId
          }
        });

        return doc;
      });

      // Publish document uploaded event
      await this.rabbitMQ.publishMessage('document.uploaded', {
        documentId: document.id,
        userId,
        type,
        timestamp: new Date()
      });

      this.logger.info('Document uploaded successfully', { documentId: document.id });

      return this.mapToSharedDocument(document);
    } catch (error) {
      this.logger.error('Failed to upload document', { error, userId, type });
      throw error;
    }
  }

  async getDocumentById(id: string): Promise<Document | null> {
    try {
      this.logger.debug('Getting document by ID', { documentId: id });

      const document = await (this.prisma as any).document.findUnique({
        where: { id },
        include: {
          versions: true,
          ocrResults: true
        }
      });

      if (!document) {
        this.logger.warn('Document not found', { documentId: id });
        return null;
      }

      return this.mapToSharedDocument(document);
    } catch (error) {
      this.logger.error('Failed to get document', { error, documentId: id });
      throw error;
    }
  }

  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    const versions = await (this.prisma as any).documentVersion.findMany({
      where: { documentId }
    });
    return versions.map(this.mapToSharedDocumentVersion);
  }

  async updateDocumentAccess(
    documentId: string,
    userId: string,
    permission: string,
    grantedBy: string,
    expiresAt?: Date
  ): Promise<DocumentAccess> {
    try {
      this.logger.info('Updating document access', { documentId, userId, permission });

      const access = await (this.prisma as any).documentAccess.create({
        data: {
          documentId,
          userId,
          permission,
          grantedBy,
          expiresAt
        }
      });

      // Publish access updated event
      await this.rabbitMQ.publishMessage('document.access.updated', {
        documentId,
        userId,
        permission,
        timestamp: new Date()
      });

      return this.mapToSharedDocumentAccess(access);
    } catch (error) {
      this.logger.error('Failed to update document access', { error, documentId, userId });
      throw error;
    }
  }

  async performOCR(documentId: string): Promise<OCRResultData> {
    if (!this.ocrWorker) {
      throw new Error('OCR worker not initialized');
    }

    // Get document from S3
    const document = await (this.prisma as any).document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Perform OCR
    const result = await this.ocrWorker.recognize(
      await this.s3.getObject({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: document.storagePath
      }).promise()
    ) as RecognizeResult;

    if (!result?.data) {
      throw new Error('OCR failed to produce results');
    }

    const { text, confidence } = result.data;

    // Save OCR result
    const ocrResult = await (this.prisma as any).oCRResult.create({
      data: {
        documentId,
        text,
        confidence,
        status: 'COMPLETED'
      }
    });

    return {
      id: ocrResult.id,
      documentId: ocrResult.documentId,
      text: ocrResult.text,
      confidence: ocrResult.confidence,
      status: ocrResult.status
    };
  }

  private async processDocument(documentId: string): Promise<void> {
    const document = await (this.prisma as any).document.findUnique({
      where: { id: documentId }
    });

    if (!document) return;

    // Perform OCR
    await this.ocrWorker?.load();
    await this.ocrWorker?.loadLanguage('eng');
    const result = await this.ocrWorker?.recognize(
      await this.s3.getObject({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: document.storagePath
      }).promise()
    ) as RecognizeResult;

    if (!result?.data) {
      throw new Error('OCR failed to produce results');
    }

    const { text, confidence } = result.data;

    await (this.prisma as any).oCRResult.create({
      data: {
        documentId,
        rawText: text,
        structuredData: {} as Prisma.JsonObject,
        confidence,
        processingTime: 0
      }
    });

    // Check compliance
    await this.checkCompliance(documentId);
  }

  private async checkCompliance(documentId: string): Promise<void> {
    const document = await (this.prisma as any).document.findUnique({
      where: { id: documentId },
      include: {
        ocrResults: true
      }
    });

    if (!document) return;

    const rules = await (this.prisma as any).complianceRule.findMany({
      where: { documentType: document.type }
    });

    let isCompliant = true;
    for (const rule of rules) {
      const ruleCompliant = await this.evaluateComplianceRule(document, rule);
      if (!ruleCompliant) {
        isCompliant = false;
        break;
      }
    }

    await (this.prisma as any).document.update({
      where: { id: documentId },
      data: {
        complianceStatus: isCompliant ? 'COMPLIANT' : 'NON_COMPLIANT'
      }
    });
  }

  private async evaluateComplianceRule(document: any, rule: any): Promise<boolean> {
    const conditions = (rule.conditions || []) as {
      field: string;
      operator: string;
      value: any;
    }[];

    for (const condition of conditions) {
      const { field, operator, value } = condition;
      const actual = field.split('.').reduce((obj: any, key: string) => obj?.[key], document);

      switch (operator) {
        case 'eq':
          if (actual !== value) return false;
          break;
        case 'neq':
          if (actual === value) return false;
          break;
        case 'gt':
          if (!(actual > value)) return false;
          break;
        case 'gte':
          if (!(actual >= value)) return false;
          break;
        case 'lt':
          if (!(actual < value)) return false;
          break;
        case 'lte':
          if (!(actual <= value)) return false;
          break;
        case 'contains':
          if (typeof actual === 'string' && typeof value === 'string') {
            if (!actual.includes(value)) return false;
          } else if (Array.isArray(actual)) {
            if (!actual.includes(value)) return false;
          } else {
            return false;
          }
          break;
        case 'exists':
          if (actual === undefined || actual === null) return false;
          break;
        default:
          return false;
      }
    }

    return true;
  }

  private mapToSharedDocument(document: any): Document {
    return {
      id: document.id,
      userId: document.userId,
      type: document.type,
      fileName: document.filename,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size,
      status: document.status,
      complianceStatus: document.complianceStatus,
      metadata: document.metadata,
      storagePath: document.storagePath,
      ocrText: document.ocrResults?.[0]?.rawText,
      ocrConfidence: document.ocrResults?.[0]?.confidence,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    };
  }

  private mapToSharedDocumentVersion(version: any): DocumentVersion {
    return {
      id: version.id,
      documentId: version.documentId,
      version: version.version,
      fileName: version.filename,
      storagePath: version.storagePath,
      changes: version.changes,
      uploadedBy: version.uploadedBy,
      createdAt: version.createdAt
    };
  }

  private mapToSharedDocumentAccess(access: any): DocumentAccess {
    return {
      id: access.id,
      documentId: access.documentId,
      userId: access.userId,
      permission: access.permission,
      grantedBy: access.grantedBy,
      grantedAt: access.grantedAt,
      expiresAt: access.expiresAt
    };
  }
} 