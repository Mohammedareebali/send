import { Router } from 'express';
import { VehicleController } from '../controllers/vehicle.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateCreateVehicle, validateUpdateVehicle } from '../middleware/validation.middleware';

export function createVehicleRoutes(controller: VehicleController): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  // Vehicle CRUD routes
  router.post('/', validateCreateVehicle, controller.createVehicle.bind(controller));
  router.get('/', controller.getVehicles.bind(controller));
  router.get('/:id', controller.getVehicle.bind(controller));
  router.put('/:id', validateUpdateVehicle, controller.updateVehicle.bind(controller));
  router.delete('/:id', controller.deleteVehicle.bind(controller));

  // Vehicle maintenance routes
  router.post('/:id/maintenance', controller.addMaintenanceRecord.bind(controller));
  router.put('/:id/status', controller.updateVehicleStatus.bind(controller));

  // Vehicle assignment routes
  router.post('/:id/assign', controller.assignVehicleToRun.bind(controller));
  router.post('/:id/release', controller.unassignVehicleFromRun.bind(controller));

  // Vehicle alerts route
  router.get('/:id/maintenance/history', controller.getMaintenanceHistory.bind(controller));

  router.post('/:id/telemetry', controller.addTelemetryRecord.bind(controller));
  router.get('/:id/telemetry/latest', controller.getLatestTelemetry.bind(controller));

  return router;
} 