import { TrackingService } from './tracking.service';
import { RabbitMQService } from '@shared/messaging/rabbitmq.service';
import { LoggerService } from '@send/shared';
import { Location } from '@shared/types/tracking';

describe('TrackingService', () => {
  let trackingService: TrackingService;
  let mockPrisma: any;
  let mockRabbitMQ: jest.Mocked<RabbitMQService>;
  let mockLogger: jest.Mocked<LoggerService>;

  beforeEach(() => {
    mockPrisma = {
      trackingEvent: {
        create: jest.fn(),
        findMany: jest.fn()
      },
      geofence: {
        findMany: jest.fn()
      }
    } as any;

    mockRabbitMQ = {
      publishMessage: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    } as any;

    trackingService = new TrackingService(
      mockPrisma,
      mockRabbitMQ,
      mockLogger
    );
  });

  describe('trackLocation', () => {
    it('should track location and create event', async () => {
      const vehicleId = 'test-vehicle';
      const location: Location = {
        latitude: 40.7128,
        longitude: -74.0060,
        speed: 60,
        heading: 90,
        timestamp: new Date()
      };

      const mockEvent = {
        id: 'event-1',
        vehicleId,
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed,
        heading: location.heading,
        timestamp: new Date()
      };

      mockPrisma.trackingEvent.create.mockResolvedValue(mockEvent);
      mockPrisma.geofence.findMany.mockResolvedValue([]);

      const result = await trackingService.trackLocation(vehicleId, location);

      expect(mockPrisma.trackingEvent.create).toHaveBeenCalledWith({
        data: {
          vehicleId,
          latitude: location.latitude,
          longitude: location.longitude,
          speed: location.speed,
          heading: location.heading,
          timestamp: expect.any(Date)
        }
      });

      expect(mockRabbitMQ.publishMessage).toHaveBeenCalledWith(
        'tracking.location.updated',
        expect.objectContaining({
          vehicleId,
          location,
          timestamp: expect.any(Date)
        })
      );

      expect(result).toEqual({
        type: 'LOCATION_UPDATE',
        data: location,
        timestamp: mockEvent.timestamp
      });
    });

    it('should handle geofence events when vehicle enters a geofence', async () => {
      const vehicleId = 'test-vehicle';
      const location: Location = {
        latitude: 40.7128,
        longitude: -74.0060,
        speed: 60,
        heading: 90,
        timestamp: new Date()
      };

      const mockGeofence = {
        id: 'geofence-1',
        name: 'Test Geofence',
        boundary: [
          { latitude: 40.7127, longitude: -74.0061 },
          { latitude: 40.7127, longitude: -74.0059 },
          { latitude: 40.7129, longitude: -74.0059 },
          { latitude: 40.7129, longitude: -74.0061 }
        ],
        isActive: true
      };

      const mockEvent = {
        id: 'event-1',
        vehicleId,
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed,
        heading: location.heading,
        timestamp: new Date()
      };

      mockPrisma.trackingEvent.create.mockResolvedValue(mockEvent);
      mockPrisma.geofence.findMany.mockResolvedValue([mockGeofence]);

      await trackingService.trackLocation(vehicleId, location);

      expect(mockRabbitMQ.publishMessage).toHaveBeenCalledWith(
        'tracking.geofence.entered',
        expect.objectContaining({
          vehicleId,
          geofenceId: mockGeofence.id,
          location,
          timestamp: expect.any(Date)
        })
      );
    });

    it('should handle errors during tracking', async () => {
      const vehicleId = 'test-vehicle';
      const location: Location = {
        latitude: 40.7128,
        longitude: -74.0060,
        speed: 60,
        heading: 90,
        timestamp: new Date()
      };

      const error = new Error('Database error');
      mockPrisma.trackingEvent.create.mockRejectedValue(error);

      await expect(trackingService.trackLocation(vehicleId, location)).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to track location',
        expect.objectContaining({
          error,
          vehicleId,
          location
        })
      );
    });
  });
}); 