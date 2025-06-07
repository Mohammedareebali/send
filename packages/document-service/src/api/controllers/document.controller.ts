import { Request, Response } from 'express';
import { DocumentService } from '../../services/document.service';
import { Document } from '@shared/types/document';
import { logger } from '@shared/logger';
import { AppError } from '@shared/errors';
import { createErrorResponse } from '@shared/responses';

export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const { userId, type, metadata } = req.body;
      const file = req.file as Express.Multer.File;
      if (!file) {
        res
          .status(400)
          .json(createErrorResponse(new AppError('File is required', 400)));
        return;
      }
      const document = await this.documentService.uploadDocument(userId, {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      }, type, metadata || {});
      res.status(201).json(document);
    } catch (error) {
      logger.error('Failed to upload document:', error);
      res.status(500).json(createErrorResponse(error as Error));
    }
  }

  async getDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const doc = await this.documentService.getDocumentById(id);
      if (!doc) {
        res
          .status(404)
          .json(createErrorResponse(new AppError('Document not found', 404)));
        return;
      }
      res.json(doc);
    } catch (error) {
      logger.error('Failed to get document:', error);
      res.status(500).json(createErrorResponse(error as Error));
    }
  }

  async listDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { userId, type } = req.query;
      const docs = await this.documentService.listDocuments({
        userId: userId as string | undefined,
        type: type as string | undefined,
      });
      res.json(docs);
    } catch (error) {
      logger.error('Failed to list documents:', error);
      res.status(500).json(createErrorResponse(error as Error));
    }
  }

  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.documentService.deleteDocument(id);
      res.status(204).send();
    } catch (error) {
      logger.error('Failed to delete document:', error);
      res.status(500).json(createErrorResponse(error as Error));
    }
  }

  async updateDocumentAccess(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, permission, grantedBy, expiresAt } = req.body;
      const access = await this.documentService.updateDocumentAccess(
        id,
        userId,
        permission,
        grantedBy,
        expiresAt ? new Date(expiresAt) : undefined
      );
      res.json(access);
    } catch (error) {
      logger.error('Failed to update document access:', error);
      res.status(500).json(createErrorResponse(error as Error));
    }
  }

  async updateDocumentMetadata(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const metadata = req.body.metadata;
      const doc = await this.documentService.updateDocumentMetadata(id, metadata);
      res.json(doc);
    } catch (error) {
      logger.error('Failed to update document metadata:', error);
      res.status(500).json(createErrorResponse(error as Error));
    }
  }
}
