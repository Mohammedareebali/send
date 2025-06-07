import { Router } from 'express';
import { TrackingController } from '../controllers/tracking.controller';
import { authenticate } from '@send/shared/security/auth';
import { validateLocation } from '../middleware/validation.middleware';

export function createTrackingRoutes(controller: TrackingController): Router {
  const router = Router();

  // Start tracking a run
  router.post('/tracking/start', authenticate(), controller.startTracking.bind(controller));

  // Update location for a run
  router.post('/tracking/:runId/location', 
    authenticate(),
    validateLocation,
    controller.updateLocation.bind(controller)
  );

  // Stop tracking a run
  router.post('/tracking/:runId/stop', authenticate(), controller.stopTracking.bind(controller));

  // Get tracking status for a run
  router.get('/tracking/:runId/status', authenticate(), controller.getTrackingStatus.bind(controller));

  // Get latest location for a run
  router.get('/locations/:routeId/latest', authenticate(), controller.getLatestLocation.bind(controller));

  return router;
} 
