import { Router } from 'express';
import { TrackingController } from '../controllers/tracking.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateLocation } from '../middleware/validation.middleware';

export function createTrackingRoutes(controller: TrackingController): Router {
  const router = Router();

  // Start tracking a run
  router.post('/tracking/start', authMiddleware, controller.startTracking.bind(controller));

  // Update location for a run
  router.post('/tracking/:runId/location', 
    authMiddleware,
    validateLocation,
    controller.updateLocation.bind(controller)
  );

  // Stop tracking a run
  router.post('/tracking/:runId/stop', authMiddleware, controller.stopTracking.bind(controller));

  // Get tracking status for a run
  router.get('/tracking/:runId/status', authMiddleware, controller.getTrackingStatus.bind(controller));

  // Get latest location for a run
  router.get('/locations/:routeId/latest', authMiddleware, controller.getLatestLocation.bind(controller));

  return router;
} 
