import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';

export function createAdminRoutes(controller: AdminController): Router {
  const router = Router();

  router.get('/admin/metrics', controller.metrics.bind(controller));
  router.get('/admin/reports', controller.reports.bind(controller));
  router.get('/admin/config', controller.getConfig.bind(controller));
  router.put('/admin/config', controller.updateConfig.bind(controller));

  return router;
}
