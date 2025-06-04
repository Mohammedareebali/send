import request from 'supertest';
import express from 'express';
import { VehicleController } from '../../api/controllers/vehicle.controller';
import { VehicleService } from '../../services/vehicle.service';
import { VehicleStatus } from '@prisma/client';

describe('VehicleController', () => {
  let app: express.Application;
  let vehicleService: jest.Mocked<VehicleService>;
  let vehicleController: VehicleController;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    vehicleService = {
      createVehicle: jest.fn(),
      getVehicle: jest.fn(),
      updateVehicle: jest.fn(),
      deleteVehicle: jest.fn(),
      listVehicles: jest.fn(),
      addMaintenanceRecord: jest.fn(),
      updateVehicleStatus: jest.fn(),
      assignToRun: jest.fn(),
      releaseFromRun: jest.fn()
    } as any;

    vehicleController = new VehicleController(vehicleService);

    app.post('/vehicles', (req, res) => vehicleController.createVehicle(req, res));
    app.get('/vehicles/:id', (req, res) => vehicleController.getVehicle(req, res));
    app.put('/vehicles/:id', (req, res) => vehicleController.updateVehicle(req, res));
    app.delete('/vehicles/:id', (req, res) => vehicleController.deleteVehicle(req, res));
    app.get('/vehicles', (req, res) => vehicleController.listVehicles(req, res));
    app.post('/vehicles/:id/maintenance', (req, res) => vehicleController.addMaintenanceRecord(req, res));
    app.put('/vehicles/:id/status', (req, res) => vehicleController.updateVehicleStatus(req, res));
    app.post('/vehicles/:id/assign', (req, res) => vehicleController.assignToRun(req, res));
    app.post('/vehicles/:id/release', (req, res) => vehicleController.releaseFromRun(req, res));
  });

  describe('POST /vehicles', () => {
    it('should create a vehicle', async () => {
      const vehicleData = {
        type: 'SEDAN',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123'
      };

      const mockVehicle = {
        id: '1',
        ...vehicleData,
        status: VehicleStatus.AVAILABLE
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
      expect(response.body).toEqual({ error: 'Failed to create vehicle' });
    });
  });

  describe('GET /vehicles/:id', () => {
    it('should get a vehicle', async () => {
      const mockVehicle = {
        id: '1',
        type: 'SEDAN',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        status: VehicleStatus.AVAILABLE
      };

      vehicleService.getVehicle.mockResolvedValue(mockVehicle);

      const response = await request(app).get('/vehicles/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVehicle);
      expect(vehicleService.getVehicle).toHaveBeenCalledWith('1');
    });

    it('should return 404 if vehicle not found', async () => {
      vehicleService.getVehicle.mockResolvedValue(null);

      const response = await request(app).get('/vehicles/1');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Vehicle not found' });
    });

    it('should handle errors', async () => {
      vehicleService.getVehicle.mockRejectedValue(new Error('Test error'));

      const response = await request(app).get('/vehicles/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to get vehicle' });
    });
  });

  describe('PUT /vehicles/:id', () => {
    it('should update a vehicle', async () => {
      const updateData = {
        make: 'Honda'
      };

      const mockVehicle = {
        id: '1',
        type: 'SEDAN',
        make: 'Honda',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        status: VehicleStatus.AVAILABLE
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
      expect(response.body).toEqual({ error: 'Vehicle not found' });
    });

    it('should handle errors', async () => {
      vehicleService.updateVehicle.mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .put('/vehicles/1')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to update vehicle' });
    });
  });

  describe('DELETE /vehicles/:id', () => {
    it('should delete a vehicle', async () => {
      vehicleService.deleteVehicle.mockResolvedValue();

      const response = await request(app).delete('/vehicles/1');

      expect(response.status).toBe(204);
      expect(vehicleService.deleteVehicle).toHaveBeenCalledWith('1');
    });

    it('should handle errors', async () => {
      vehicleService.deleteVehicle.mockRejectedValue(new Error('Test error'));

      const response = await request(app).delete('/vehicles/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to delete vehicle' });
    });
  });

  describe('GET /vehicles', () => {
    it('should list vehicles', async () => {
      const mockVehicles = [
        {
          id: '1',
          type: 'SEDAN',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          licensePlate: 'ABC123',
          status: VehicleStatus.AVAILABLE
        }
      ];

      vehicleService.listVehicles.mockResolvedValue(mockVehicles);

      const response = await request(app).get('/vehicles');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVehicles);
      expect(vehicleService.listVehicles).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      vehicleService.listVehicles.mockRejectedValue(new Error('Test error'));

      const response = await request(app).get('/vehicles');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to list vehicles' });
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
        type: 'SEDAN',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        status: VehicleStatus.AVAILABLE
      };

      vehicleService.addMaintenanceRecord.mockResolvedValue(mockVehicle);

      const response = await request(app)
        .post('/vehicles/1/maintenance')
        .send(maintenanceData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockVehicle);
      expect(vehicleService.addMaintenanceRecord).toHaveBeenCalledWith('1', maintenanceData);
    });

    it('should return 404 if vehicle not found', async () => {
      vehicleService.addMaintenanceRecord.mockResolvedValue(null);

      const response = await request(app)
        .post('/vehicles/1/maintenance')
        .send({});

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Vehicle not found' });
    });

    it('should handle errors', async () => {
      vehicleService.addMaintenanceRecord.mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .post('/vehicles/1/maintenance')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to add maintenance record' });
    });
  });

  describe('PUT /vehicles/:id/status', () => {
    it('should update vehicle status', async () => {
      const status = VehicleStatus.MAINTENANCE;

      const mockVehicle = {
        id: '1',
        type: 'SEDAN',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        status: VehicleStatus.MAINTENANCE
      };

      vehicleService.updateVehicleStatus.mockResolvedValue(mockVehicle);

      const response = await request(app)
        .put('/vehicles/1/status')
        .send({ status });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVehicle);
      expect(vehicleService.updateVehicleStatus).toHaveBeenCalledWith('1', status);
    });

    it('should return 404 if vehicle not found', async () => {
      vehicleService.updateVehicleStatus.mockResolvedValue(null);

      const response = await request(app)
        .put('/vehicles/1/status')
        .send({ status: VehicleStatus.MAINTENANCE });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Vehicle not found' });
    });

    it('should handle errors', async () => {
      vehicleService.updateVehicleStatus.mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .put('/vehicles/1/status')
        .send({ status: VehicleStatus.MAINTENANCE });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to update vehicle status' });
    });
  });

  describe('POST /vehicles/:id/assign', () => {
    it('should assign vehicle to run', async () => {
      const runId = 'run1';

      const mockVehicle = {
        id: '1',
        type: 'SEDAN',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        status: VehicleStatus.IN_USE,
        currentRunId: runId
      };

      vehicleService.assignToRun.mockResolvedValue(mockVehicle);

      const response = await request(app)
        .post('/vehicles/1/assign')
        .send({ runId });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVehicle);
      expect(vehicleService.assignToRun).toHaveBeenCalledWith('1', runId);
    });

    it('should return 404 if vehicle not found', async () => {
      vehicleService.assignToRun.mockResolvedValue(null);

      const response = await request(app)
        .post('/vehicles/1/assign')
        .send({ runId: 'run1' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Vehicle not found' });
    });

    it('should handle errors', async () => {
      vehicleService.assignToRun.mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .post('/vehicles/1/assign')
        .send({ runId: 'run1' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to assign vehicle to run' });
    });
  });

  describe('POST /vehicles/:id/release', () => {
    it('should release vehicle from run', async () => {
      const mockVehicle = {
        id: '1',
        type: 'SEDAN',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        status: VehicleStatus.AVAILABLE,
        currentRunId: null
      };

      vehicleService.releaseFromRun.mockResolvedValue(mockVehicle);

      const response = await request(app).post('/vehicles/1/release');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVehicle);
      expect(vehicleService.releaseFromRun).toHaveBeenCalledWith('1');
    });

    it('should return 404 if vehicle not found', async () => {
      vehicleService.releaseFromRun.mockResolvedValue(null);

      const response = await request(app).post('/vehicles/1/release');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Vehicle not found' });
    });

    it('should handle errors', async () => {
      vehicleService.releaseFromRun.mockRejectedValue(new Error('Test error'));

      const response = await request(app).post('/vehicles/1/release');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to release vehicle from run' });
    });
  });
}); 