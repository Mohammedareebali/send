import { Location, Geofence, GeofenceEvent, ETACalculation, Journey, TrackingEvent, TrackingNotification } from '@shared/types/tracking';
import { Run } from '@shared/types/run';
import { RabbitMQService } from '@shared/messaging/rabbitmq.service';
import { PrismaClient } from '@prisma/client';
import { getDistance, isPointInPolygon } from 'geolib';
import { Socket } from 'socket.io';
import { LoggerService } from '@send/shared';
import { Location as SharedLocation } from '@shared/types/tracking';

interface GeolibCoordinates {
  latitude: number;
  longitude: number;
}

interface GeofenceBoundary {
  boundary: GeolibCoordinates[];
}

interface TrackingEventData {
  id: string;
  vehicleId: string;
  location: SharedLocation;
  timestamp: Date;
}

export class TrackingService {
  private activeRuns: Map<string, {
    run: Run;
    lastLocation?: Location;
    geofenceEvents: GeofenceEvent[];
    etaCalculations: ETACalculation[];
    journey?: Journey;
    sockets: Set<Socket>;
  }> = new Map();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly rabbitMQ: RabbitMQService,
    private readonly logger: LoggerService
  ) {}

  async startTracking(run: Run): Promise<void> {
    if (this.activeRuns.has(run.id)) {
      throw new Error(`Already tracking run ${run.id}`);
    }

    this.activeRuns.set(run.id, {
      run,
      geofenceEvents: [],
      etaCalculations: [],
      sockets: new Set()
    });

    // Start journey recording
    const journey: Journey = {
      runId: run.id,
      startTime: new Date(),
      path: []
    };

    this.activeRuns.get(run.id)!.journey = journey;

    // Publish journey start event
    await this.rabbitMQ.publishMessage('tracking.journey.started', {
      type: 'JOURNEY_START',
      data: journey,
      timestamp: new Date()
    });
  }

  async updateLocation(runId: string, location: Location): Promise<void> {
    const tracking = this.activeRuns.get(runId);
    if (!tracking) {
      throw new Error(`Not tracking run ${runId}`);
    }

    // Update last location
    tracking.lastLocation = location;

    // Add to journey path
    if (tracking.journey) {
      tracking.journey.path = tracking.journey.path || [];
      tracking.journey.path.push(location);
    }

    // Check geofences
    await this.checkGeofences(location);

    // Calculate ETA
    await this.calculateETA(runId, location);

    // Publish location update
    await this.rabbitMQ.publishMessage('tracking.location.updated', {
      type: 'LOCATION_UPDATE',
      data: location,
      timestamp: new Date()
    });

    // Notify connected clients
    this.notifyClients(runId, {
      type: 'LOCATION_UPDATE',
      data: {
        runId,
        message: 'Location updated',
        details: location
      }
    });
  }

  getLatestLocation(runId: string): Location | undefined {
    return this.activeRuns.get(runId)?.lastLocation;
  }

  getTrackingStatus(runId: string): Run['status'] | undefined {
    return this.activeRuns.get(runId)?.run.status;
  }

  private async checkGeofences(location: Location): Promise<Geofence[]> {
    const point: GeolibCoordinates = {
      latitude: location.latitude,
      longitude: location.longitude
    };

    const geofences = await (this.prisma as any).geofence.findMany({
      where: {
        isActive: true
      }
    });

    return geofences.filter((geofence: any) => {
      const boundary = geofence.boundary.map((coord: any) => ({
        latitude: coord.latitude,
        longitude: coord.longitude
      })) as GeolibCoordinates[];
      
      return isPointInPolygon(point, boundary);
    });
  }

  private async calculateETA(runId: string, location: Location): Promise<void> {
    const tracking = this.activeRuns.get(runId);
    if (!tracking) return;

    const run = tracking.run;
    const distance = getDistance(
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: run.dropoffLocation.latitude, longitude: run.dropoffLocation.longitude }
    );

    // Simple ETA calculation (can be enhanced with traffic data)
    const averageSpeed = 30; // km/h
    const duration = (distance / 1000) / averageSpeed * 3600; // in seconds

    const eta = new Date(Date.now() + duration * 1000);

    const calculation: ETACalculation = {
      runId,
      eta,
      distance,
      duration,
      traffic: {
        level: 'MEDIUM',
        delay: 0
      }
    };

    tracking.etaCalculations.push(calculation);

    // Publish ETA update
    await this.rabbitMQ.publishMessage('tracking.eta.updated', {
      type: 'ETA_UPDATE',
      data: calculation,
      timestamp: new Date()
    });

    // Notify connected clients
    this.notifyClients(runId, {
      type: 'ETA_UPDATE',
      data: {
        runId,
        message: `ETA updated: ${eta.toLocaleTimeString()}`,
        details: calculation
      }
    });
  }

  async stopTracking(runId: string): Promise<void> {
    const tracking = this.activeRuns.get(runId);
    if (!tracking) {
      throw new Error(`Not tracking run ${runId}`);
    }

    if (tracking.journey) {
      tracking.journey.endTime = new Date();
      tracking.journey.duration = (tracking.journey.endTime.getTime() - tracking.journey.startTime.getTime()) / 1000;

      // Calculate total distance
      if (tracking.journey.path && tracking.journey.path.length > 1) {
        let totalDistance = 0;
        for (let i = 1; i < tracking.journey.path.length; i++) {
          totalDistance += getDistance(
            { latitude: tracking.journey.path[i-1].latitude, longitude: tracking.journey.path[i-1].longitude },
            { latitude: tracking.journey.path[i].latitude, longitude: tracking.journey.path[i].longitude }
          );
        }
        tracking.journey.distance = totalDistance;
      }

      // Publish journey end event
      await this.rabbitMQ.publishMessage('tracking.journey.ended', {
        type: 'JOURNEY_END',
        data: tracking.journey,
        timestamp: new Date()
      });
    }

    this.activeRuns.delete(runId);
  }

  addClient(runId: string, socket: Socket): void {
    const tracking = this.activeRuns.get(runId);
    if (tracking) {
      tracking.sockets.add(socket);
    }
  }

  removeClient(runId: string, socket: Socket): void {
    const tracking = this.activeRuns.get(runId);
    if (tracking) {
      tracking.sockets.delete(socket);
    }
  }

  private notifyClients(runId: string, notification: TrackingNotification): void {
    const tracking = this.activeRuns.get(runId);
    if (tracking) {
      tracking.sockets.forEach(socket => {
        socket.emit('tracking-update', notification);
      });
    }
  }

  async trackLocation(vehicleId: string, location: SharedLocation): Promise<TrackingEvent> {
    try {
      this.logger.info('Tracking location', { vehicleId, location });

      // Create tracking event
      const event = await (this.prisma as any).trackingEvent.create({
        data: {
          vehicleId,
          latitude: location.latitude,
          longitude: location.longitude,
          speed: location.speed,
          heading: location.heading,
          timestamp: location.timestamp
        }
      });

      // Check geofences
      const geofences = await this.checkGeofences(location);
      if (geofences && geofences.length > 0) {
        await this.handleGeofenceEvents(vehicleId, location, geofences);
      }

      // Publish tracking event
      await this.rabbitMQ.publishMessage('tracking.location.updated', {
        vehicleId,
        location,
        timestamp: location.timestamp
      });

      return {
        type: 'LOCATION_UPDATE',
        data: location,
        timestamp: location.timestamp
      };
    } catch (error) {
      this.logger.error('Failed to track location', { error, vehicleId, location });
      throw error;
    }
  }

  private async handleGeofenceEvents(
    vehicleId: string,
    location: SharedLocation,
    geofences: Geofence[]
  ): Promise<void> {
    for (const geofence of geofences) {
      await this.rabbitMQ.publishMessage('tracking.geofence.entered', {
        vehicleId,
        geofenceId: geofence.id,
        location,
        timestamp: location.timestamp
      });
    }
  }
} 