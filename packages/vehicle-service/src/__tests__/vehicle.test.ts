import { setupTestEnvironment, cleanupTestEnvironment } from '@send/shared/src/testing/setup';
import { VehicleService } from '../services/vehicle.service';
import { PrismaClient } from '@prisma/client';
import { VehicleStatus, VehicleType } from '@send/shared/src/types/vehicle';

describe('Vehicle Service', () => {
  let testSetup: any;
  let prisma: PrismaClient;
  let vehicleService: VehicleService;

  beforeAll(async () => {
    testSetup = await setupTestEnvironment();
    prisma = testSetup.getPrisma();
    vehicleService = new VehicleService();
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  beforeEach(async () => {
    await prisma.$executeRaw`DELETE FROM "Vehicle"`;
  });

  describe('createVehicle', () => {
    it('should create a new vehicle', async () => {
      const vehicleData = {
        type: VehicleType.SEDAN,
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        licensePlate: 'ABC123',
        status: VehicleStatus.AVAILABLE,
        capacity: 4
      };

      const vehicle = await vehicleService.createVehicle(vehicleData);
      
      expect(vehicle).toBeDefined();
      expect(vehicle.make).toBe(vehicleData.make);
      expect(vehicle.model).toBe(vehicleData.model);
      expect(vehicle.licensePlate).toBe(vehicleData.licensePlate);
    });

    it('should throw error for duplicate license plate', async () => {
      const vehicleData = {
        type: VehicleType.SEDAN,
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        licensePlate: 'ABC123',
        status: VehicleStatus.AVAILABLE,
        capacity: 4
      };

      await vehicleService.createVehicle(vehicleData);
      
      await expect(vehicleService.createVehicle(vehicleData))
        .rejects
        .toThrow('Vehicle with this license plate already exists');
    });
  });

  describe('updateVehicle', () => {
    it('should update vehicle details', async () => {
      const vehicle = await vehicleService.createVehicle({
        type: VehicleType.SEDAN,
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        licensePlate: 'ABC123',
        status: VehicleStatus.AVAILABLE,
        capacity: 4
      });

      const updatedVehicle = await vehicleService.updateVehicle(vehicle.id, {
        status: VehicleStatus.MAINTENANCE
      });

      expect(updatedVehicle?.status).toBe(VehicleStatus.MAINTENANCE);
    });

    it('should throw error for non-existent vehicle', async () => {
      await expect(vehicleService.updateVehicle('non-existent-id', {
        status: VehicleStatus.MAINTENANCE
      })).rejects.toThrow('Vehicle not found');
    });
  });

  describe('getVehicleById', () => {
    it('should return vehicle by id', async () => {
      const vehicle = await vehicleService.createVehicle({
        type: VehicleType.SEDAN,
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        licensePlate: 'ABC123',
        status: VehicleStatus.AVAILABLE,
        capacity: 4
      });

      const foundVehicle = await vehicleService.getVehicleById(vehicle.id);
      expect(foundVehicle).toBeDefined();
      expect(foundVehicle?.id).toBe(vehicle.id);
    });

    it('should throw error for non-existent vehicle', async () => {
      await expect(vehicleService.getVehicleById('non-existent-id'))
        .resolves
        .toBeNull();
    });
  });

  describe('getAllVehicles', () => {
    it('should return all vehicles', async () => {
      await vehicleService.createVehicle({
        type: VehicleType.SEDAN,
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        licensePlate: 'ABC123',
        status: VehicleStatus.AVAILABLE,
        capacity: 4
      });

      await vehicleService.createVehicle({
        type: VehicleType.SUV,
        make: 'Honda',
        model: 'CRV',
        year: 2021,
        licensePlate: 'XYZ789',
        status: VehicleStatus.AVAILABLE,
        capacity: 5
      });

      const { vehicles } = await vehicleService.getAllVehicles();
      expect(vehicles).toHaveLength(2);
    });

    it('should filter vehicles by status', async () => {
      await vehicleService.createVehicle({
        type: VehicleType.SEDAN,
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        licensePlate: 'ABC123',
        status: VehicleStatus.AVAILABLE,
        capacity: 4
      });

      await vehicleService.createVehicle({
        type: VehicleType.SUV,
        make: 'Honda',
        model: 'CRV',
        year: 2021,
        licensePlate: 'XYZ789',
        status: VehicleStatus.MAINTENANCE,
        capacity: 5
      });

      const { vehicles } = await vehicleService.getAllVehicles({ status: VehicleStatus.AVAILABLE });
      expect(vehicles).toHaveLength(1);
      expect(vehicles[0].status).toBe(VehicleStatus.AVAILABLE);
    });
  });

  describe('deleteVehicle', () => {
    it('should delete vehicle', async () => {
      const vehicle = await vehicleService.createVehicle({
        type: VehicleType.SEDAN,
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        licensePlate: 'ABC123',
        status: VehicleStatus.AVAILABLE,
        capacity: 4
      });

      await vehicleService.deleteVehicle(vehicle.id);
      
      const foundVehicle = await vehicleService.getVehicleById(vehicle.id);
      expect(foundVehicle).toBeNull();
    });

    it('should return false for non-existent vehicle', async () => {
      const result = await vehicleService.deleteVehicle('non-existent-id');
      expect(result).toBe(false);
    });
  });
}); 