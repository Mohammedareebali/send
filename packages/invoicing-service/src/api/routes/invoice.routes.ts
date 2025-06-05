import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';

export function createInvoiceRoutes(controller: InvoiceController): Router {
  const router = Router();

  router.post('/', controller.create.bind(controller));
  router.get('/', controller.list.bind(controller));
  router.get('/:id', controller.getById.bind(controller));
  router.put('/:id/status', controller.updateStatus.bind(controller));

  return router;
}
