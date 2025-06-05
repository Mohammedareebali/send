import { TrackingService } from '../../infra/services/tracking.service';
import { RabbitMQService } from '../../infra/messaging/rabbitmq';
import { Logger } from 'winston';
import { Run, RunStatus, RunType, ScheduleType } from '@shared/types/run';
import { Location } from '@shared/types/tracking';

jest.mock('../../infra/messaging/rabbitmq');

describe('TrackingService', () => {
  let trackingService: TrackingService;
  let mockRabbitMQ: jest.Mocked<RabbitMQService>;
  let mockPrisma: any;
  let mockLogger: jest.Mocked<Logger>;
  let mockRun: Run;
  let mockGeofences: any[];

  beforeEach(() => {
    mockRabbitMQ = new RabbitMQService() as jest.Mocked<RabbitMQService>;
    mockLogger = { info: jest.fn(), error: jest.fn() } as any;
    mockGeofences = [
      {
        id: 'pickup-zone',
        name: 'Pickup Zone',
        type: 'PICKUP',
        center: {
          latitude: 51.5074,
          longitude: -0.1278,
          timestamp: new Date()
        },
        radius: 100
      },
      {
        id: 'dropoff-zone',
        name: 'Dropoff Zone',
        type: 'DROPOFF',
        center: {
          latitude: 51.5074,
          longitude: -0.1278,
          timestamp: new Date()
        },
        radius: 100
      }
    ];

    mockPrisma = {
      geofence: {
        findMany: jest.fn().mockResolvedValue(mockGeofences)
      },
      trackingEvent: {
        create: jest.fn(),
        findMany: jest.fn()
      }
    } as any;

    mockRun = {
      id: 'run-1',
      type: RunType.REGULAR,
      status: RunStatus.PENDING,
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

    trackingService = new TrackingService(mockPrisma, mockRabbitMQ, mockLogger);
  });

  describe('startTracking', () => {
    it('should start tracking a run', async () => {
      await trackingService.startTracking(mockRun);

      expect(mockRabbitMQ.publishTrackingEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'JOURNEY_START',
          data: expect.objectContaining({
            runId: mockRun.id
          })
        })
      );
    });

    it('should throw error if already tracking run', async () => {
      await trackingService.startTracking(mockRun);
      await expect(trackingService.startTracking(mockRun)).rejects.toThrow('Already tracking run');
    });
  });

  describe('updateLocation', () => {
    const mockLocation: Location = {
      latitude: 51.5074,
      longitude: -0.1278,
      timestamp: new Date()
    };

    beforeEach(async () => {
      await trackingService.startTracking(mockRun);
    });

    it('should update location and publish events', async () => {
      await trackingService.updateLocation(mockRun.id, mockLocation);

      expect(mockRabbitMQ.publishTrackingEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'LOCATION_UPDATE',
          data: mockLocation
        })
      );
    });

    it('should throw error if not tracking run', async () => {
      await expect(trackingService.updateLocation('non-existent-run', mockLocation))
        .rejects.toThrow('Not tracking run');
    });
  });

  describe('stopTracking', () => {
    beforeEach(async () => {
      await trackingService.startTracking(mockRun);
    });

    it('should stop tracking and publish journey end event', async () => {
      await trackingService.stopTracking(mockRun.id);

      expect(mockRabbitMQ.publishTrackingEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'JOURNEY_END',
          data: expect.objectContaining({
            runId: mockRun.id
          })
        })
      );
    });

    it('should throw error if not tracking run', async () => {
      await expect(trackingService.stopTracking('non-existent-run'))
        .rejects.toThrow('Not tracking run');
    });
  });

  describe('geofence detection', () => {
    const mockLocation: Location = {
      latitude: 51.5074,
      longitude: -0.1278,
      timestamp: new Date()
    };

    beforeEach(async () => {
      await trackingService.startTracking(mockRun);
      mockPrisma.geofence.findMany.mockResolvedValue(mockGeofences);
    });

    it('should detect entering geofence', async () => {
      await trackingService.updateLocation(mockRun.id, mockLocation);

      expect(mockRabbitMQ.publishTrackingEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'GEOFENCE_EVENT',
          data: expect.objectContaining({
            type: 'ENTER',
            location: 'PICKUP'
          })
        })
      );
    });
  });

  describe('ETA calculation', () => {
    const mockLocation: Location = {
      latitude: 51.5074,
      longitude: -0.1278,
      timestamp: new Date()
    };

    beforeEach(async () => {
      await trackingService.startTracking(mockRun);
    });

    it('should calculate and publish ETA', async () => {
      await trackingService.updateLocation(mockRun.id, mockLocation);

      expect(mockRabbitMQ.publishTrackingEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ETA_UPDATE',
          data: expect.objectContaining({
            runId: mockRun.id,
            distance: expect.any(Number),
            duration: expect.any(Number)
          })
        })
      );
    });
  });
}); 