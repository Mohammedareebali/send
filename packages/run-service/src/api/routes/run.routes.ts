import { Router } from 'express';
import { RunController } from '../controllers/run.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { UserRole } from '@shared/types/user';

export function createRunRoutes(controller: RunController): Router {
  const router = Router();

  // Create a new run
  router.post(
    '/',
    authMiddleware,
    roleMiddleware([UserRole.ADMIN, UserRole.COORDINATOR]),
    controller.createRun.bind(controller)
  );

  // Update a run
  router.put(
    '/:id',
    authMiddleware,
    roleMiddleware([UserRole.ADMIN, UserRole.COORDINATOR]),
    controller.updateRun.bind(controller)
  );

  // Cancel a run
  router.post(
    '/:id/cancel',
    authMiddleware,
    roleMiddleware([UserRole.ADMIN, UserRole.COORDINATOR]),
    controller.cancelRun.bind(controller)
  );

  // Complete a run
  router.post(
    '/:id/complete',
    authMiddleware,
    roleMiddleware([UserRole.ADMIN, UserRole.DRIVER]),
    controller.completeRun.bind(controller)
  );

  // Get a run by ID
  router.get(
    '/:id',
    authMiddleware,
    controller.getRun.bind(controller)
  );

  // Get all runs with optional filters
  router.get(
    '/',
    authMiddleware,
    controller.getAllRuns.bind(controller)
  );

  return router;
} 