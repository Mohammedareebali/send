import { PrismaClient } from '@prisma/client';
import { Run, RunStatus, RunType, ScheduleType } from '@shared/types/run';
import { RunModel } from '../../data/models/run.model';

const mockPrismaDriver = {
  create: jest.fn(),
  update: jest.fn(),
  findUnique: jest.fn(),
  findMany: jest.fn(),
  delete: jest.fn()
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    run: mockPrismaDriver
  }))
}));

describe('RunModel', () => {
  let model: RunModel;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    Object.assign(mockPrisma, { run: mockPrismaDriver });
    model = new RunModel(mockPrisma);
  });

  describe('create', () => {
    it('should create a new run', async () => {
      const runData = {
        type: RunType.REGULAR,
        status: RunStatus.PENDING,
        startTime: new Date(),
        pickupLocation: { latitude: 0, longitude: 0, address: 'Test Address' },
        dropoffLocation: { latitude: 0, longitude: 0, address: 'Test Address' },
        driverId: 'driver-1',
        paId: 'pa-1',
        studentIds: ['student-1'],
        scheduleType: ScheduleType.ONE_TIME
      };

      const createdRun: Run = {
        id: 'run-1',
        ...runData,
        createdAt: new Date(),
        updatedAt: new Date(),
        endTime: undefined,
        routeId: undefined,
        notes: undefined
      };

      mockPrismaDriver.create.mockResolvedValue(createdRun);

      const result = await model.create(runData);

      expect(mockPrismaDriver.create).toHaveBeenCalledWith({
        data: runData
      });
      expect(result).toEqual(createdRun);
    });
  });

  describe('update', () => {
    it('should update an existing run', async () => {
      const runId = 'run-1';
      const updateData = {
        status: RunStatus.IN_PROGRESS,
        startTime: new Date()
      };

      const updatedRun: Run = {
        id: runId,
        type: RunType.REGULAR,
        status: RunStatus.IN_PROGRESS,
        startTime: updateData.startTime,
        createdAt: new Date(),
        updatedAt: new Date(),
        pickupLocation: { latitude: 0, longitude: 0, address: 'Test Address' },
        dropoffLocation: { latitude: 0, longitude: 0, address: 'Test Address' },
        driverId: 'driver-1',
        paId: 'pa-1',
        studentIds: ['student-1'],
        endTime: undefined,
        routeId: undefined,
        notes: undefined,
        scheduleType: ScheduleType.ONE_TIME
      };

      mockPrismaDriver.update.mockResolvedValue(updatedRun);

      const result = await model.update(runId, updateData);

      expect(mockPrismaDriver.update).toHaveBeenCalledWith({
        where: { id: runId },
        data: updateData
      });
      expect(result).toEqual(updatedRun);
    });
  });

  describe('findById', () => {
    it('should find a run by id', async () => {
      const runId = 'run-1';
      const run: Run = {
        id: runId,
        type: RunType.REGULAR,
        status: RunStatus.PENDING,
        startTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        pickupLocation: { latitude: 0, longitude: 0, address: 'Test Address' },
        dropoffLocation: { latitude: 0, longitude: 0, address: 'Test Address' },
        driverId: 'driver-1',
        paId: 'pa-1',
        studentIds: ['student-1'],
        endTime: undefined,
        routeId: undefined,
        notes: undefined,
        scheduleType: ScheduleType.ONE_TIME
      };

      mockPrismaDriver.findUnique.mockResolvedValue(run);

      const result = await model.findById(runId);

      expect(mockPrismaDriver.findUnique).toHaveBeenCalledWith({
        where: { id: runId }
      });
      expect(result).toEqual(run);
    });

    it('should return null if run not found', async () => {
      const runId = 'non-existent-run';
      mockPrismaDriver.findUnique.mockResolvedValue(null);

      const result = await model.findById(runId);

      expect(mockPrismaDriver.findUnique).toHaveBeenCalledWith({
        where: { id: runId }
      });
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all runs', async () => {
      const runs: Run[] = [
        {
          id: 'run-1',
          type: RunType.REGULAR,
          status: RunStatus.PENDING,
          startTime: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          pickupLocation: { latitude: 0, longitude: 0, address: 'Test Address' },
          dropoffLocation: { latitude: 0, longitude: 0, address: 'Test Address' },
          driverId: 'driver-1',
          paId: 'pa-1',
          studentIds: ['student-1'],
          endTime: undefined,
          routeId: undefined,
          notes: undefined,
          scheduleType: ScheduleType.ONE_TIME
        }
      ];

      mockPrismaDriver.findMany.mockResolvedValue(runs);

      const result = await model.findAll();

      expect(mockPrismaDriver.findMany).toHaveBeenCalledWith();
      expect(result).toEqual(runs);
    });

    it('should find runs with filters', async () => {
      const filters = {
        status: RunStatus.PENDING,
        driverId: 'driver-1'
      };

      const runs: Run[] = [
        {
          id: 'run-1',
          type: RunType.REGULAR,
          status: RunStatus.PENDING,
          startTime: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          pickupLocation: { latitude: 0, longitude: 0, address: 'Test Address' },
          dropoffLocation: { latitude: 0, longitude: 0, address: 'Test Address' },
          driverId: 'driver-1',
          paId: 'pa-1',
          studentIds: ['student-1'],
          endTime: undefined,
          routeId: undefined,
          notes: undefined,
          scheduleType: ScheduleType.ONE_TIME
        }
      ];

      mockPrismaDriver.findMany.mockResolvedValue(runs);

      const result = await model.findAll(filters);

      expect(mockPrismaDriver.findMany).toHaveBeenCalledWith({
        where: filters
      });
      expect(result).toEqual(runs);
    });
  });

  describe('delete', () => {
    it('should delete a run', async () => {
      const runId = 'run-1';
      const deletedRun: Run = {
        id: runId,
        type: RunType.REGULAR,
        status: RunStatus.PENDING,
        startTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        pickupLocation: { latitude: 0, longitude: 0, address: 'Test Address' },
        dropoffLocation: { latitude: 0, longitude: 0, address: 'Test Address' },
        driverId: 'driver-1',
        paId: 'pa-1',
        studentIds: ['student-1'],
        endTime: undefined,
        routeId: undefined,
        notes: undefined,
        scheduleType: ScheduleType.ONE_TIME
      };

      mockPrismaDriver.delete.mockResolvedValue(deletedRun);

      const result = await model.delete(runId);

      expect(mockPrismaDriver.delete).toHaveBeenCalledWith({
        where: { id: runId }
      });
      expect(result).toEqual(deletedRun);
    });
  });
}); 