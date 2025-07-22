import { Router } from 'express';
import { RunController } from '../controllers/run.controller';
import { authenticate, requireRole } from '@send/shared/security/auth';
import { UserRole } from '@shared/types/user';

export function createRunRoutes(controller: RunController): Router {
  const router = Router();

  // Create a new run
  router.post(
    '/',
    authenticate(),
    requireRole([UserRole.ADMIN, UserRole.COORDINATOR]),
    controller.createRun.bind(controller)
  );

  // Update a run
  router.put(
    '/:id',
    authenticate(),
    requireRole([UserRole.ADMIN, UserRole.COORDINATOR]),
    controller.updateRun.bind(controller)
  );

  // Cancel a run
  router.post(
    '/:id/cancel',
    authenticate(),
    requireRole([UserRole.ADMIN, UserRole.COORDINATOR]),
    controller.cancelRun.bind(controller)
  );

  // Complete a run
  router.post(
    '/:id/complete',
    authenticate(),
    requireRole([UserRole.ADMIN, UserRole.DRIVER]),
    controller.completeRun.bind(controller)
  );

  // Get a run by ID
  router.get(
    '/:id',
    authenticate(),
    controller.getRun.bind(controller)
  );

  // Get all runs with optional filters
  router.get(
    '/',
    authenticate(),
    controller.getAllRuns.bind(controller)
  );

  // Dashboard runs endpoint
  router.get(
    '/dashboard-runs',
    authenticate(),
    controller.getDashboardRuns.bind(controller)
  );

  // Bulk run creation endpoint
  router.post(
    '/bulk',
    authenticate(),
    requireRole([UserRole.ADMIN, UserRole.COORDINATOR]),
    controller.bulkCreateRuns.bind(controller)
  );

  return router;
} 