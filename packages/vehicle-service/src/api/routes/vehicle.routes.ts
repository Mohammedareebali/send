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
  router.get('/', controller.listVehicles.bind(controller));
  router.get('/:id', controller.getVehicle.bind(controller));
  router.put('/:id', validateUpdateVehicle, controller.updateVehicle.bind(controller));
  router.delete('/:id', controller.deleteVehicle.bind(controller));

  // Vehicle maintenance routes
  router.post('/:id/maintenance', controller.addMaintenanceRecord.bind(controller));
  router.put('/:id/status', controller.updateVehicleStatus.bind(controller));

  // Vehicle assignment routes
  router.post('/:id/assign', controller.assignToRun.bind(controller));
  router.post('/:id/release', controller.releaseFromRun.bind(controller));

  // Vehicle alerts route
  router.get('/:vehicleId/alerts', controller.getVehicleAlerts.bind(controller));

  return router;
} 