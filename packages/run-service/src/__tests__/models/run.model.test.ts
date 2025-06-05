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

      const prismaCreatedRun = {
        ...createdRun,
        pickupLocation: JSON.stringify(runData.pickupLocation),
        dropoffLocation: JSON.stringify(runData.dropoffLocation),
        studentIds: JSON.stringify(runData.studentIds)
      };

      mockPrismaDriver.create.mockResolvedValue(prismaCreatedRun);

      const result = await model.create(runData);

      expect(mockPrismaDriver.create).toHaveBeenCalledWith({
        data: {
          ...runData,
          pickupLocation: JSON.stringify(runData.pickupLocation),
          dropoffLocation: JSON.stringify(runData.dropoffLocation),
          studentIds: JSON.stringify(runData.studentIds)
        }
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

      const prismaUpdatedRun = {
        ...updatedRun,
        pickupLocation: JSON.stringify(updatedRun.pickupLocation),
        dropoffLocation: JSON.stringify(updatedRun.dropoffLocation),
        studentIds: JSON.stringify(updatedRun.studentIds)
      };

      mockPrismaDriver.update.mockResolvedValue(prismaUpdatedRun);

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

      const prismaRun = {
        ...run,
        pickupLocation: JSON.stringify(run.pickupLocation),
        dropoffLocation: JSON.stringify(run.dropoffLocation),
        studentIds: JSON.stringify(run.studentIds)
      };

      mockPrismaDriver.findUnique.mockResolvedValue(prismaRun);

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

      const prismaRuns = runs.map(r => ({
        ...r,
        pickupLocation: JSON.stringify(r.pickupLocation),
        dropoffLocation: JSON.stringify(r.dropoffLocation),
        studentIds: JSON.stringify(r.studentIds)
      }));

      mockPrismaDriver.findMany.mockResolvedValue(prismaRuns);

      const result = await model.findAll();

      expect(mockPrismaDriver.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' }
      });
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

      const prismaRuns = runs.map(r => ({
        ...r,
        pickupLocation: JSON.stringify(r.pickupLocation),
        dropoffLocation: JSON.stringify(r.dropoffLocation),
        studentIds: JSON.stringify(r.studentIds)
      }));

      mockPrismaDriver.findMany.mockResolvedValue(prismaRuns);

      const result = await model.findAll(filters);

      expect(mockPrismaDriver.findMany).toHaveBeenCalledWith({
        where: filters,
        orderBy: { createdAt: 'desc' }
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

      const prismaDeletedRun = {
        ...deletedRun,
        pickupLocation: JSON.stringify(deletedRun.pickupLocation),
        dropoffLocation: JSON.stringify(deletedRun.dropoffLocation),
        studentIds: JSON.stringify(deletedRun.studentIds)
      };

      mockPrismaDriver.delete.mockResolvedValue(prismaDeletedRun);

      const result = await model.delete(runId);

      expect(mockPrismaDriver.delete).toHaveBeenCalledWith({
        where: { id: runId }
      });
      expect(result).toEqual(deletedRun);
    });
  });
}); 