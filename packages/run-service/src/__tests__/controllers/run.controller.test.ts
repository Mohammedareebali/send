import { Request, Response } from 'express';
import { RunController } from '../../api/controllers/run.controller';
import { RunModel } from '../../data/models/run.model';
import { RabbitMQService } from '../../infra/messaging/rabbitmq';
import { RouteService } from '../../infra/services/route.service';
import { ScheduleService } from '../../infra/services/schedule.service';
import { Run, RunStatus, RunType, ScheduleType } from '@shared/types/run';
import { PrismaClient } from '@prisma/client';

// Event type constants
const RUN_CREATED = 'RUN_CREATED';
const RUN_UPDATED = 'RUN_UPDATED';
const RUN_CANCELLED = 'RUN_CANCELLED';
const RUN_COMPLETED = 'RUN_COMPLETED';

jest.mock('../../data/models/run.model');
jest.mock('../../infra/messaging/rabbitmq');
jest.mock('../../infra/services/route.service');
jest.mock('../../infra/services/schedule.service');

const mockPublishRunEvent = jest.fn().mockResolvedValue(undefined);
const mockPublishNotification = jest.fn().mockResolvedValue(undefined);
const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockClose = jest.fn().mockResolvedValue(undefined);
const mockSubscribeToRunEvents = jest.fn().mockResolvedValue(undefined);

(RabbitMQService as jest.Mock).mockImplementation(() => ({
  publishRunEvent: mockPublishRunEvent,
  publishNotification: mockPublishNotification,
  connect: mockConnect,
  close: mockClose,
  subscribeToRunEvents: mockSubscribeToRunEvents
}));

describe('RunController', () => {
  let controller: RunController;
  let mockRunModel: jest.Mocked<RunModel>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRunModel = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      prisma: {} as PrismaClient,
      mapPrismaRunToRun: jest.fn()
    } as unknown as jest.Mocked<RunModel>;

    mockReq = {
      body: {},
      params: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
    controller = new RunController(
      mockRunModel,
      new RabbitMQService(),
      {} as RouteService,
      {} as ScheduleService
    );
  });

  describe('createRun', () => {
    it('should create a run and send notifications', async () => {
      const runData = {
        type: RunType.REGULAR,
        startTime: new Date(),
        pickupLocation: {
          latitude: 51.5074,
          longitude: -0.1278,
          address: 'London, UK'
        },
        dropoffLocation: {
          latitude: 51.5074,
          longitude: -0.1278,
          address: 'London, UK'
        },
        studentIds: ['student1'],
        scheduleType: ScheduleType.ONE_TIME
      };

      const createdRun = {
        id: 'run1',
        ...runData,
        status: RunStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReq.body = runData;
      mockRunModel.create.mockResolvedValue(createdRun);

      await controller.createRun(mockReq as Request, mockRes as Response);

      expect(mockRunModel.create).toHaveBeenCalledWith(runData);
      expect(mockPublishRunEvent).toHaveBeenCalledWith(RUN_CREATED, createdRun);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdRun);
    });
  });

  describe('updateRun', () => {
    it('should update a run and send notifications', async () => {
      const runId = 'run-1';
      const updateData = {
        status: RunStatus.IN_PROGRESS,
        startTime: new Date()
      };

      const updatedRun = {
        id: runId,
        type: RunType.REGULAR,
        status: RunStatus.IN_PROGRESS,
        startTime: updateData.startTime,
        pickupLocation: {
          latitude: 51.5074,
          longitude: -0.1278,
          address: 'London, UK'
        },
        dropoffLocation: {
          latitude: 51.5074,
          longitude: -0.1278,
          address: 'London, UK'
        },
        studentIds: ['student1'],
        scheduleType: ScheduleType.ONE_TIME,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReq.params = { id: runId };
      mockReq.body = updateData;
      mockRunModel.update.mockResolvedValue(updatedRun);

      await controller.updateRun(mockReq as Request, mockRes as Response);

      expect(mockRunModel.update).toHaveBeenCalledWith(runId, updateData);
      expect(mockPublishRunEvent).toHaveBeenCalledWith(RUN_UPDATED, updatedRun);
      expect(mockRes.json).toHaveBeenCalledWith(updatedRun);
    });
  });

  describe('cancelRun', () => {
    it('should cancel a run and send notifications', async () => {
      const runId = 'run-1';
      const cancelledRun = {
        id: runId,
        type: RunType.REGULAR,
        status: RunStatus.CANCELLED,
        startTime: new Date(),
        pickupLocation: {
          latitude: 51.5074,
          longitude: -0.1278,
          address: 'London, UK'
        },
        dropoffLocation: {
          latitude: 51.5074,
          longitude: -0.1278,
          address: 'London, UK'
        },
        studentIds: ['student1'],
        scheduleType: ScheduleType.ONE_TIME,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReq.params = { id: runId };
      mockRunModel.update.mockResolvedValue(cancelledRun);

      await controller.cancelRun(mockReq as Request, mockRes as Response);

      expect(mockRunModel.update).toHaveBeenCalledWith(runId, { status: RunStatus.CANCELLED });
      expect(mockPublishRunEvent).toHaveBeenCalledWith(RUN_CANCELLED, cancelledRun);
      expect(mockRes.json).toHaveBeenCalledWith(cancelledRun);
    });
  });

  describe('completeRun', () => {
    it('should complete a run and send an event', async () => {
      const runId = 'run-1';
      const completedRun = {
        id: runId,
        type: RunType.REGULAR,
        status: RunStatus.COMPLETED,
        startTime: new Date(),
        endTime: new Date(),
        pickupLocation: {
          latitude: 51.5074,
          longitude: -0.1278,
          address: 'London, UK'
        },
        dropoffLocation: {
          latitude: 51.5074,
          longitude: -0.1278,
          address: 'London, UK'
        },
        studentIds: ['student1'],
        scheduleType: ScheduleType.ONE_TIME,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReq.params = { id: runId };
      mockRunModel.update.mockResolvedValue(completedRun);

      await controller.completeRun(mockReq as Request, mockRes as Response);

      expect(mockRunModel.update).toHaveBeenCalledWith(runId, { 
        status: RunStatus.COMPLETED,
        endTime: expect.any(Date)
      });
      expect(mockPublishRunEvent).toHaveBeenCalledWith(RUN_COMPLETED, completedRun);
      expect(mockRes.json).toHaveBeenCalledWith(completedRun);
    });
  });
}); 