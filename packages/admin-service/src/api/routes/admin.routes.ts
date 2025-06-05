import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';

export function createAdminRoutes(controller: AdminController): Router {
  const router = Router();

  router.get('/metrics', controller.metrics.bind(controller));
  router.get('/reports', controller.reports.bind(controller));
  router.get('/userActivity', controller.userActivity.bind(controller));

  return router;
}
