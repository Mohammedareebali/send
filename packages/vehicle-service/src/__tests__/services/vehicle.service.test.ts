import { VehicleService } from '../../services/vehicle.service';
import { PrismaClient } from '@prisma/client';
import { RabbitMQService } from '../../infra/messaging/rabbitmq.service';
import { VehicleType, VehicleStatus, AlertType, AlertSeverity, AlertStatus } from '../../types/vehicle';

jest.mock('@prisma/client');
jest.mock('../../infra/messaging/rabbitmq.service');

class MockRabbitMQService {
  url = 'amqp://localhost';
  connect = jest.fn();
  publishMessage = jest.fn();
  close = jest.fn();
}

type MockPrismaClient = {
  $queryRaw: jest.Mock;
  vehicle: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findMany: jest.Mock;
  };
  maintenanceRecord: {
    create: jest.Mock;
    findMany: jest.Mock;
  };
  alert: {
    findMany: jest.Mock;
  };
  maintenanceSchedule: {
    findMany: jest.Mock;
  };
  insurance: {
    findFirst: jest.Mock;
  };
  locationHistory: {
    findMany: jest.Mock;
  };
  fuelRecord: {
    findMany: jest.Mock;
  };
  accident: {
    findMany: jest.Mock;
  };
  mileageRecord: {
    findMany: jest.Mock;
  };
  run: {
    findMany: jest.Mock;
  };
};

describe('VehicleService', () => {
  let service: VehicleService;
  let mockPrisma: MockPrismaClient;
  let mockRabbitMQ: MockRabbitMQService;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: jest.fn(),
      vehicle: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn()
      },
      maintenanceRecord: {
        create: jest.fn(),
        findMany: jest.fn()
      },
      alert: {
        findMany: jest.fn()
      },
      maintenanceSchedule: {
        findMany: jest.fn()
      },
      insurance: {
        findFirst: jest.fn()
      },
      locationHistory: {
        findMany: jest.fn()
      },
      fuelRecord: {
        findMany: jest.fn()
      },
      accident: {
        findMany: jest.fn()
      },
      mileageRecord: {
        findMany: jest.fn()
      },
      run: {
        findMany: jest.fn()
      }
    };

    mockRabbitMQ = new MockRabbitMQService();

    // Mock the Prisma client in the service
    service = new VehicleService();
    (service as any).prisma = mockPrisma;
    (service as any).redis = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
    (service as any).rabbitMQ = mockRabbitMQ;
  });

  describe('createVehicle', () => {
    it('should create a vehicle', async () => {
      const vehicleData = {
        licensePlate: 'ABC123',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        type: VehicleType.SEDAN,
        capacity: 4,
        status: VehicleStatus.AVAILABLE,
      };

      const createdVehicle = {
        id: '1',
        ...vehicleData,
        status: VehicleStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.$queryRaw.mockResolvedValue([createdVehicle]);

      const result = await service.createVehicle(vehicleData);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(createdVehicle);
    });
  });

  describe('getVehicle', () => {
    it('should return a vehicle by id', async () => {
      const vehicleId = '1';
      const vehicle = {
        id: vehicleId,
        licensePlate: 'ABC123',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        type: VehicleType.SEDAN,
        status: VehicleStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.$queryRaw.mockResolvedValue([vehicle]);

      const result = service.getVehicles(vehicleId);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(vehicle);
    });

    it('should return null if vehicle not found', async () => {
      const vehicleId = '1';
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = service.getVehicles(vehicleId);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('updateVehicle', () => {
    it('should update a vehicle', async () => {
      const vehicleId = '1';
      const updateData = {
        status: VehicleStatus.MAINTENANCE,
      };

      const updatedVehicle = {
        id: vehicleId,
        licensePlate: 'ABC123',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        type: VehicleType.SEDAN,
        status: VehicleStatus.MAINTENANCE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.$queryRaw.mockResolvedValue([updatedVehicle]);

      const result = await service.updateVehicle(vehicleId, updateData);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(updatedVehicle);
    });
  });

  describe('deleteVehicle', () => {
    it('should delete a vehicle', async () => {
      const vehicleId = '1';
      const deletedVehicle = {
        id: vehicleId,
        licensePlate: 'ABC123',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        type: VehicleType.SEDAN,
        status: VehicleStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.$queryRaw.mockResolvedValue([deletedVehicle]);

      await service.deleteVehicle(vehicleId);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });
  });

  describe('getVehicles', () => {
    it('should return a list of vehicles', async () => {
      const vehicles = [
        {
          id: '1',
          licensePlate: 'ABC123',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          type: VehicleType.SEDAN,
          status: VehicleStatus.AVAILABLE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(vehicles)
        .mockResolvedValueOnce([{ count: vehicles.length }]);

      const result = service.getAllVehicles();

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual({ vehicles, total: vehicles.length });
    });
  });

  describe('addMaintenanceRecord', () => {
    it('should add a maintenance record to a vehicle', async () => {
      const vehicleId = '1';
      const maintenanceData = {
        type: 'OIL_CHANGE',
        description: 'Oil change',
        cost: 50.00,
        date: new Date(),
      };

      const maintenanceRecord = {
        id: '1',
        vehicleId,
        ...maintenanceData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.$queryRaw.mockResolvedValue([maintenanceRecord]);

      const result = service.addMaintenanceRecord(vehicleId, maintenanceData);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(maintenanceRecord);
    });
  });

  describe('updateVehicleStatus', () => {
    it('should update vehicle status', async () => {
      const vehicleId = '1';
      const status = VehicleStatus.MAINTENANCE;
      const updatedVehicle = {
        id: vehicleId,
        licensePlate: 'ABC123',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        type: VehicleType.SEDAN,
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.$queryRaw.mockResolvedValue([updatedVehicle]);

      const result = await service.updateVehicle(vehicleId, { status });

      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: vehicleId },
        data: { status },
      });
      expect(result).toEqual(updatedVehicle);
    });
  });

  describe('assignVehicleToRun', () => {
    it('should assign a vehicle to a run', async () => {
      const vehicleId = '1';
      const runId = 'run1';
      const updatedVehicle = {
        id: vehicleId,
        licensePlate: 'ABC123',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        type: VehicleType.SEDAN,
        status: VehicleStatus.IN_USE,
        currentRunId: runId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.$queryRaw.mockResolvedValue([updatedVehicle]);

      const result = service.assignVehicleToRun(vehicleId, runId);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(updatedVehicle);
    });
  });

  describe('unassignVehicleFromRun', () => {
    it('should unassign a vehicle from a run', async () => {
      const vehicleId = '1';
      const updatedVehicle = {
        id: vehicleId,
        licensePlate: 'ABC123',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        type: VehicleType.SEDAN,
        status: VehicleStatus.AVAILABLE,
        currentRunId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.vehicle.update.mockResolvedValue(updatedVehicle);

      const result = service.unassignVehicleFromRun(vehicleId);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(updatedVehicle);
    });
  });

  describe('getMaintenanceHistory', () => {
    it('should return maintenance history for a vehicle', async () => {
      const vehicleId = '1';
      const maintenanceRecords = [
        {
          id: '1',
          vehicleId,
          type: 'OIL_CHANGE',
          description: 'Oil change',
          cost: 50.00,
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValue(maintenanceRecords);

      const result = service.getMaintenanceHistory(vehicleId);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(maintenanceRecords);
    });
  });
}); 