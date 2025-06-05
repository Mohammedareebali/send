import { DriverService } from '../../services/driver.service';
import { RabbitMQService } from '../../services/messaging/rabbitmq.service';
import { PrismaClient } from '@prisma/client';
import { Driver, DriverStatus } from '@shared/types/driver';

jest.mock('../../services/messaging/rabbitmq.service');

const mockPrismaDriver = {
  create: jest.fn(),
  update: jest.fn(),
  findUnique: jest.fn(),
  findMany: jest.fn(),
  delete: jest.fn()
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    driver: mockPrismaDriver
  }))
}));

describe('DriverService', () => {
  let driverService: DriverService;
  let mockRabbitMQ: jest.Mocked<RabbitMQService>;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockDriver: Driver;

  beforeEach(() => {
    mockRabbitMQ = new RabbitMQService('amqp://localhost') as jest.Mocked<RabbitMQService>;
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    Object.assign((mockPrisma as any).driver, mockPrismaDriver);

    mockDriver = {
      id: 'driver-1',
      callNumber: 'DRV001',
      pdaPassword: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      gender: 'MALE',
      dateOfBirth: new Date('1990-01-01'),
      addressLine1: '123 Main St',
      addressLine2: null,
      postcode: 'SW1A 1AA',
      phoneNumber: '+441234567890',
      email: 'john.doe@example.com',
      licenseNumber: 'DRV123456',
      licenseExpiryDate: new Date('2025-01-01'),
      dbsNumber: 'DBS123456',
      dbsExpiryDate: new Date('2025-01-01'),
      medicalExpiryDate: new Date('2025-01-01'),
      rentalExpiryDate: new Date('2025-01-01'),
      status: DriverStatus.ACTIVE,
      currentRunId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    driverService = new DriverService(mockPrisma, mockRabbitMQ);
  });

  describe('createDriver', () => {
    it('should create a new driver', async () => {
      mockPrismaDriver.create.mockResolvedValue(mockDriver);

      const result = await driverService.createDriver(mockDriver);

      expect(mockPrismaDriver.create).toHaveBeenCalledWith({
        data: {
          ...mockDriver,
          status: DriverStatus.ACTIVE
        }
      });

      expect(mockRabbitMQ.publishDriverEvent).toHaveBeenCalledWith({
        type: 'DRIVER_CREATED',
        data: mockDriver,
        timestamp: expect.any(Date)
      });

      expect(result).toEqual(mockDriver);
    });
  });

  describe('updateDriver', () => {
    it('should update a driver', async () => {
      const updatedDriver = { ...mockDriver, firstName: 'Jane' };
      mockPrismaDriver.update.mockResolvedValue(updatedDriver);

      const result = await driverService.updateDriver(mockDriver.id, { firstName: 'Jane' });

      expect(mockPrismaDriver.update).toHaveBeenCalledWith({
        where: { id: mockDriver.id },
        data: { firstName: 'Jane' }
      });

      expect(mockRabbitMQ.publishDriverEvent).toHaveBeenCalledWith({
        type: 'DRIVER_UPDATED',
        data: updatedDriver,
        timestamp: expect.any(Date)
      });

      expect(result).toEqual(updatedDriver);
    });
  });

  describe('getDriver', () => {
    it('should get a driver by id', async () => {
      mockPrismaDriver.findUnique.mockResolvedValue(mockDriver);

      const result = await driverService.getDriver(mockDriver.id);

      expect(mockPrismaDriver.findUnique).toHaveBeenCalledWith({
        where: { id: mockDriver.id }
      });

      expect(result).toEqual(mockDriver);
    });

    it('should return null if driver not found', async () => {
      mockPrismaDriver.findUnique.mockResolvedValue(null);

      const result = await driverService.getDriver('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('getDrivers', () => {
    it('should get all drivers', async () => {
      mockPrismaDriver.findMany.mockResolvedValue([mockDriver]);

      const result = await driverService.getDrivers();

      expect(mockPrismaDriver.findMany).toHaveBeenCalled();
      expect(result).toEqual([mockDriver]);
    });
  });

  describe('deleteDriver', () => {
    it('should delete a driver', async () => {
      mockPrismaDriver.delete.mockResolvedValue(mockDriver);

      await driverService.deleteDriver(mockDriver.id);

      expect(mockPrismaDriver.delete).toHaveBeenCalledWith({
        where: { id: mockDriver.id }
      });

      expect(mockRabbitMQ.publishDriverEvent).toHaveBeenCalledWith({
        type: 'DRIVER_DELETED',
        data: { id: mockDriver.id },
        timestamp: expect.any(Date)
      });
    });
  });

  describe('updateDriverStatus', () => {
    it('should update driver status', async () => {
      const updatedDriver = { ...mockDriver, status: DriverStatus.ASSIGNED };
      mockPrismaDriver.update.mockResolvedValue(updatedDriver);

      const result = await driverService.updateDriverStatus(mockDriver.id, DriverStatus.ASSIGNED);

      expect(mockPrismaDriver.update).toHaveBeenCalledWith({
        where: { id: mockDriver.id },
        data: { status: DriverStatus.ASSIGNED }
      });

      expect(mockRabbitMQ.publishDriverEvent).toHaveBeenCalledWith({
        type: 'DRIVER_STATUS_UPDATED',
        data: updatedDriver,
        timestamp: expect.any(Date)
      });

      expect(result).toEqual(updatedDriver);
    });
  });

  describe('assignDriverToRun', () => {
    it('should assign driver to run', async () => {
      const updatedDriver = { ...mockDriver, currentRunId: 'run-1', status: DriverStatus.ASSIGNED };
      mockPrismaDriver.update.mockResolvedValue(updatedDriver);

      const result = await driverService.assignDriverToRun(mockDriver.id, 'run-1');

      expect(mockPrismaDriver.update).toHaveBeenCalledWith({
        where: { id: mockDriver.id },
        data: {
          currentRunId: 'run-1',
          status: DriverStatus.ASSIGNED
        }
      });

      expect(mockRabbitMQ.publishDriverEvent).toHaveBeenCalledWith({
        type: 'DRIVER_ASSIGNED',
        data: {
          driverId: mockDriver.id,
          runId: 'run-1'
        },
        timestamp: expect.any(Date)
      });

      expect(result).toEqual(updatedDriver);
    });
  });

  describe('unassignDriverFromRun', () => {
    it('should unassign driver from run', async () => {
      const updatedDriver = { ...mockDriver, currentRunId: null, status: DriverStatus.ACTIVE };
      mockPrismaDriver.update.mockResolvedValue(updatedDriver);

      const result = await driverService.unassignDriverFromRun(mockDriver.id);

      expect(mockPrismaDriver.update).toHaveBeenCalledWith({
        where: { id: mockDriver.id },
        data: {
          currentRunId: null,
          status: DriverStatus.ACTIVE
        }
      });

      expect(mockRabbitMQ.publishDriverEvent).toHaveBeenCalledWith({
        type: 'DRIVER_UNASSIGNED',
        data: {
          driverId: mockDriver.id
        },
        timestamp: expect.any(Date)
      });

      expect(result).toEqual(updatedDriver);
    });
  });

  describe('getAvailableDrivers', () => {
    it('should get available drivers', async () => {
      mockPrismaDriver.findMany.mockResolvedValue([mockDriver]);

      const result = await driverService.getAvailableDrivers();

      expect(mockPrismaDriver.findMany).toHaveBeenCalledWith({
        where: {
          status: DriverStatus.ACTIVE,
          currentRunId: null
        }
      });

      expect(result).toEqual([mockDriver]);
    });
  });

  describe('getDriverPerformance', () => {
    it('should get driver performance', async () => {
      const driverWithRuns = {
        ...mockDriver,
        runs: [
          {
            id: 'run-1',
            status: 'COMPLETED',
            scheduledStartTime: new Date('2023-01-01T08:00:00Z'),
            actualStartTime: new Date('2023-01-01T08:00:00Z'),
            rating: 5
          },
          {
            id: 'run-2',
            status: 'COMPLETED',
            scheduledStartTime: new Date('2023-01-01T09:00:00Z'),
            actualStartTime: new Date('2023-01-01T09:30:00Z'),
            rating: 4
          }
        ]
      };

      mockPrismaDriver.findUnique.mockResolvedValue(driverWithRuns as any);

      const result = await driverService.getDriverPerformance(mockDriver.id);

      expect(result).toEqual({
        totalRuns: 2,
        onTimeRuns: 1,
        lateRuns: 1,
        averageRating: 4.5
      });
    });

    it('should throw error if driver not found', async () => {
      mockPrismaDriver.findUnique.mockResolvedValue(null);

      await expect(driverService.getDriverPerformance('non-existent-id'))
        .rejects.toThrow('Driver not found');
    });
  });
}); 