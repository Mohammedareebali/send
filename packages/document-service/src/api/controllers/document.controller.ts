import { Request, Response } from 'express';
import { DocumentService } from '../../services/document.service';
import { Document } from '@shared/types/document';

export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const { userId, type, metadata } = req.body;
      const file = req.file as Express.Multer.File;
      if (!file) {
        res.status(400).json({ error: 'File is required' });
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
      console.error('Failed to upload document:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }

  async getDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const doc = await this.documentService.getDocumentById(id);
      if (!doc) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      res.json(doc);
    } catch (error) {
      console.error('Failed to get document:', error);
      res.status(500).json({ error: 'Failed to get document' });
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
      console.error('Failed to list documents:', error);
      res.status(500).json({ error: 'Failed to list documents' });
    }
  }

  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.documentService.deleteDocument(id);
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  }
}
