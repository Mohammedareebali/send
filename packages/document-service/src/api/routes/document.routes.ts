import { Router } from 'express';
import multer from 'multer';
import { DocumentController } from '../controllers/document.controller';

export function createDocumentRoutes(controller: DocumentController): Router {
  const router = Router();
  const upload = multer();

  router.post('/', upload.single('file'), controller.uploadDocument.bind(controller));
  router.get('/', controller.listDocuments.bind(controller));
  router.get('/:id', controller.getDocumentById.bind(controller));
  router.delete('/:id', controller.deleteDocument.bind(controller));
  router.patch('/:id/access', controller.updateDocumentAccess.bind(controller));
  router.patch('/:id/metadata', controller.updateDocumentMetadata.bind(controller));

  return router;
}
