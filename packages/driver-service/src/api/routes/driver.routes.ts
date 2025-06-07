import { Router } from 'express';
import { DriverController } from '../controllers/driver.controller';
import { authenticate, requireRole } from '@send/shared/src/security/auth';
import {
  validateCreateDriver,
  validateUpdateDriver
} from '../middleware/validation.middleware';

export function createDriverRoutes(controller: DriverController): Router {
  const router = Router();

  // Create a new driver (admin only)
  router.post('/drivers',
    authenticate(),
    requireRole(['ADMIN']),
    validateCreateDriver,
    controller.createDriver.bind(controller)
  );

  // Get all drivers (admin and coordinator)
  router.get('/drivers', 
    authenticate(),
    requireRole(['ADMIN', 'COORDINATOR']),
    controller.getDrivers.bind(controller)
  );

  // Get a specific driver (admin, coordinator, and the driver themselves)
  router.get('/drivers/:id', 
    authenticate(),
    requireRole(['ADMIN', 'COORDINATOR', 'DRIVER']),
    controller.getDriver.bind(controller)
  );

  // Update a driver (admin and the driver themselves)
  router.put('/drivers/:id',
    authenticate(),
    requireRole(['ADMIN', 'DRIVER']),
    validateUpdateDriver,
    controller.updateDriver.bind(controller)
  );

  // Delete a driver (admin only)
  router.delete('/drivers/:id', 
    authenticate(),
    requireRole(['ADMIN']),
    controller.deleteDriver.bind(controller)
  );

  // Update driver status (admin and coordinator)
  router.patch('/drivers/:id/status', 
    authenticate(),
    requireRole(['ADMIN', 'COORDINATOR']),
    controller.updateDriverStatus.bind(controller)
  );

  // Assign driver to run (admin and coordinator)
  router.post('/drivers/:driverId/assign', 
    authenticate(),
    requireRole(['ADMIN', 'COORDINATOR']),
    controller.assignDriverToRun.bind(controller)
  );

  // Unassign driver from run (admin and coordinator)
  router.post('/drivers/:driverId/unassign',
    authenticate(),
    requireRole(['ADMIN', 'COORDINATOR']),
    controller.unassignDriverFromRun.bind(controller)
  );

  router.get('/drivers/:id/availability',
    authenticate(),
    requireRole(['ADMIN', 'COORDINATOR', 'DRIVER']),
    controller.getDriverAvailability.bind(controller)
  );

  router.put('/drivers/:id/availability',
    authenticate(),
    requireRole(['ADMIN', 'DRIVER']),
    controller.updateDriverAvailability.bind(controller)
  );

  // Get available drivers (admin and coordinator)
  router.get('/drivers/available', 
    authenticate(),
    requireRole(['ADMIN', 'COORDINATOR']),
    controller.getAvailableDrivers.bind(controller)
  );

  // Get driver performance (admin, coordinator, and the driver themselves)
  router.get('/drivers/:driverId/performance', 
    authenticate(),
    requireRole(['ADMIN', 'COORDINATOR', 'DRIVER']),
    controller.getDriverPerformance.bind(controller)
  );

  return router;
} 