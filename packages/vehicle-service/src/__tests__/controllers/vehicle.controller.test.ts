import request from 'supertest';
import express from 'express';
import { VehicleController } from '../../api/controllers/vehicle.controller';
import { VehicleService } from '../../services/vehicle.service';
import { VehicleStatus, VehicleType } from '../../types/vehicle';

describe('VehicleController', () => {
  let app: express.Application;
  let vehicleService: jest.Mocked<VehicleService>;
  let vehicleController: VehicleController;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    vehicleService = {
      createVehicle: jest.fn(),
      getVehicleById: jest.fn(),
      updateVehicle: jest.fn(),
      deleteVehicle: jest.fn(),
      getAllVehicles: jest.fn(),
      addMaintenanceRecord: jest.fn(),
      assignVehicleToRun: jest.fn(),
      unassignVehicleFromRun: jest.fn()
    } as unknown as jest.Mocked<VehicleService>;

    vehicleController = new VehicleController(vehicleService);

    app.post('/vehicles', (req, res) => vehicleController.createVehicle(req, res));
    app.get('/vehicles/:id', (req, res) => vehicleController.getVehicle(req, res));
    app.put('/vehicles/:id', (req, res) => vehicleController.updateVehicle(req, res));
    app.delete('/vehicles/:id', (req, res) => vehicleController.deleteVehicle(req, res));
    app.get('/vehicles', (req, res) => vehicleController.getVehicles(req, res));
    app.post('/vehicles/:id/maintenance', (req, res) => vehicleController.addMaintenanceRecord(req, res));
    app.put('/vehicles/:id/status', (req, res) => vehicleController.updateVehicleStatus(req, res));
    app.post('/vehicles/:id/assign', (req, res) => vehicleController.assignVehicleToRun(req, res));
    app.post('/vehicles/:id/release', (req, res) => vehicleController.unassignVehicleFromRun(req, res));
  });

  describe('POST /vehicles', () => {
    it('should create a vehicle', async () => {
      const vehicleData = {
        type: VehicleType.SEDAN,
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        capacity: 4
      };

      const mockVehicle = {
        id: '1',
        ...vehicleData,
        status: VehicleStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vehicleService.createVehicle.mockResolvedValue(mockVehicle);

      const response = await request(app)
        .post('/vehicles')
        .send(vehicleData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockVehicle);
      expect(vehicleService.createVehicle).toHaveBeenCalledWith(vehicleData);
    });

    it('should handle errors', async () => {
      vehicleService.createVehicle.mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .post('/vehicles')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'AppError', message: 'Failed to create vehicle' }
      });
    });
  });

  describe('GET /vehicles/:id', () => {
    it('should get a vehicle', async () => {
      const mockVehicle = {
        id: '1',
        type: VehicleType.SEDAN,
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        capacity: 4,
        status: VehicleStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vehicleService.getVehicleById.mockResolvedValue(mockVehicle);

      const response = await request(app).get('/vehicles/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVehicle);
      expect(vehicleService.getVehicleById).toHaveBeenCalledWith('1');
    });

    it('should return 404 if vehicle not found', async () => {
      vehicleService.getVehicleById.mockResolvedValue(null);

      const response = await request(app).get('/vehicles/1');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'AppError', message: 'Vehicle not found' }
      });
    });

    it('should handle errors', async () => {
      vehicleService.getVehicleById.mockRejectedValue(new Error('Test error'));

      const response = await request(app).get('/vehicles/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'AppError', message: 'Failed to get vehicle' }
      });
    });
  });

  describe('PUT /vehicles/:id', () => {
    it('should update a vehicle', async () => {
      const updateData = {
        make: 'Honda'
      };

      const mockVehicle = {
        id: '1',
        type: VehicleType.SEDAN,
        make: 'Honda',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        capacity: 4,
        status: VehicleStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vehicleService.updateVehicle.mockResolvedValue(mockVehicle);

      const response = await request(app)
        .put('/vehicles/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVehicle);
      expect(vehicleService.updateVehicle).toHaveBeenCalledWith('1', updateData);
    });

    it('should return 404 if vehicle not found', async () => {
      vehicleService.updateVehicle.mockResolvedValue(null);

      const response = await request(app)
        .put('/vehicles/1')
        .send({});

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'AppError', message: 'Vehicle not found' }
      });
    });

    it('should handle errors', async () => {
      vehicleService.updateVehicle.mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .put('/vehicles/1')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'AppError', message: 'Failed to update vehicle' }
      });
    });
  });

  describe('DELETE /vehicles/:id', () => {
    it('should delete a vehicle', async () => {
      vehicleService.deleteVehicle.mockResolvedValue(true);

      const response = await request(app).delete('/vehicles/1');

      expect(response.status).toBe(204);
      expect(vehicleService.deleteVehicle).toHaveBeenCalledWith('1');
    });

    it('should handle errors', async () => {
      vehicleService.deleteVehicle.mockRejectedValue(new Error('Test error'));

      const response = await request(app).delete('/vehicles/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'AppError', message: 'Failed to delete vehicle' }
      });
    });
  });

  describe('GET /vehicles', () => {
    it('should list vehicles', async () => {
      const mockVehicles = [
        {
          id: '1',
          type: VehicleType.SEDAN,
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          licensePlate: 'ABC123',
          status: VehicleStatus.AVAILABLE,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      vehicleService.getAllVehicles.mockResolvedValue({ vehicles: mockVehicles, total: mockVehicles.length });

      const response = await request(app).get('/vehicles');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ vehicles: mockVehicles, total: mockVehicles.length });
      expect(vehicleService.getAllVehicles).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      vehicleService.getAllVehicles.mockRejectedValue(new Error('Test error'));

      const response = await request(app).get('/vehicles');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'AppError', message: 'Failed to list vehicles' }
      });
    });
  });

  describe('POST /vehicles/:id/maintenance', () => {
    it('should add a maintenance record', async () => {
      const maintenanceData = {
        description: 'Oil change',
        cost: 50
      };

      const mockVehicle = {
        id: '1',
        type: VehicleType.SEDAN,
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        status: VehicleStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vehicleService.addMaintenanceRecord.mockResolvedValue(mockVehicle as any);

      const response = await request(app)
        .post('/vehicles/1/maintenance')
        .send(maintenanceData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockVehicle);
      expect(vehicleService.addMaintenanceRecord).toHaveBeenCalledWith('1', maintenanceData);
    });

    it('should return 404 if vehicle not found', async () => {
      vehicleService.addMaintenanceRecord.mockResolvedValue(null as any);

      const response = await request(app)
        .post('/vehicles/1/maintenance')
        .send({});

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'AppError', message: 'Vehicle not found' }
      });
    });

    it('should handle errors', async () => {
      vehicleService.addMaintenanceRecord.mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .post('/vehicles/1/maintenance')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'AppError', message: 'Failed to add maintenance record' }
      });
    });
  });

  describe('PUT /vehicles/:id/status', () => {
    it('should update vehicle status', async () => {
      const status = VehicleStatus.MAINTENANCE;

      const mockVehicle = {
        id: '1',
        type: VehicleType.SEDAN,
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        status: VehicleStatus.MAINTENANCE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vehicleService.updateVehicle.mockResolvedValue(mockVehicle);

      const response = await request(app)
        .put('/vehicles/1/status')
        .send({ status });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVehicle);
      expect(vehicleService.updateVehicle).toHaveBeenCalledWith('1', { status });
    });

    it('should return 404 if vehicle not found', async () => {
      vehicleService.updateVehicle.mockResolvedValue(null);

      const response = await request(app)
        .put('/vehicles/1/status')
        .send({ status: VehicleStatus.MAINTENANCE });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'AppError', message: 'Vehicle not found' }
      });
    });

    it('should handle errors', async () => {
      vehicleService.updateVehicle.mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .put('/vehicles/1/status')
        .send({ status: VehicleStatus.MAINTENANCE });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'AppError', message: 'Failed to update vehicle status' }
      });
    });
  });

  describe('POST /vehicles/:id/assign', () => {
    it('should assign vehicle to run', async () => {
      const runId = 'run1';

      const mockVehicle = {
        id: '1',
        type: VehicleType.SEDAN,
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        capacity: 4,
        status: VehicleStatus.IN_USE,
        currentRunId: runId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vehicleService.assignVehicleToRun.mockResolvedValue(mockVehicle);

      const response = await request(app)
        .post('/vehicles/1/assign')
        .send({ runId });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVehicle);
      expect(vehicleService.assignVehicleToRun).toHaveBeenCalledWith('1', runId);
    });

    it('should return 404 if vehicle not found', async () => {
      vehicleService.assignVehicleToRun.mockResolvedValue(null);

      const response = await request(app)
        .post('/vehicles/1/assign')
        .send({ runId: 'run1' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'AppError', message: 'Vehicle not found' }
      });
    });

    it('should handle errors', async () => {
      vehicleService.assignVehicleToRun.mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .post('/vehicles/1/assign')
        .send({ runId: 'run1' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'AppError', message: 'Failed to assign vehicle to run' }
      });
    });
  });

  describe('POST /vehicles/:id/release', () => {
    it('should release vehicle from run', async () => {
      const mockVehicle = {
        id: '1',
        type: VehicleType.SEDAN,
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        capacity: 4,
        status: VehicleStatus.AVAILABLE,
        currentRunId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vehicleService.unassignVehicleFromRun.mockResolvedValue(mockVehicle);

      const response = await request(app).post('/vehicles/1/release');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVehicle);
      expect(vehicleService.unassignVehicleFromRun).toHaveBeenCalledWith('1');
    });

    it('should return 404 if vehicle not found', async () => {
      vehicleService.unassignVehicleFromRun.mockResolvedValue(null);

      const response = await request(app).post('/vehicles/1/release');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'AppError', message: 'Vehicle not found' }
      });
    });

    it('should handle errors', async () => {
      vehicleService.unassignVehicleFromRun.mockRejectedValue(new Error('Test error'));

      const response = await request(app).post('/vehicles/1/release');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'AppError', message: 'Failed to release vehicle from run' }
      });
    });
  });
}); 