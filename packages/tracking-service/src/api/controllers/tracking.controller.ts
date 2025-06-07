import { Request, Response } from 'express';
import { TrackingService } from '../../infra/services/tracking.service';
import { Run } from '@shared/types/run';
import { Location } from '@shared/types/tracking';
import { createSuccessResponse, createErrorResponse } from '@shared/responses';
import { AppError } from '@shared/errors';

export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  async startTracking(req: Request, res: Response): Promise<void> {
    try {
      const run = req.body as Run;
      await this.trackingService.startTracking(run);
      res.status(200).json(createSuccessResponse({ message: 'Tracking started' }));
    } catch (error) {
      console.error('Failed to start tracking:', error);
      res.status(500).json(createErrorResponse(error as Error));
    }
  }

  async updateLocation(req: Request, res: Response): Promise<void> {
    try {
      const { runId } = req.params;
      const location = req.body as Location;
      await this.trackingService.updateLocation(runId, location);
      res.status(200).json(createSuccessResponse({ message: 'Location updated' }));
    } catch (error) {
      console.error('Failed to update location:', error);
      res.status(500).json(createErrorResponse(error as Error));
    }
  }

  async stopTracking(req: Request, res: Response): Promise<void> {
    try {
      const { runId } = req.params;
      await this.trackingService.stopTracking(runId);
      res.status(200).json(createSuccessResponse({ message: 'Tracking stopped' }));
    } catch (error) {
      console.error('Failed to stop tracking:', error);
      res.status(500).json(createErrorResponse(error as Error));
    }
  }

  async getTrackingStatus(req: Request, res: Response): Promise<void> {
    try {
      const { runId } = req.params;
      const status = this.trackingService.getTrackingStatus(runId);
      if (!status) {
        res.status(404).json(createErrorResponse(new AppError('Run not found', 404)));
        return;
      }
      res.status(200).json(createSuccessResponse({ status }));
    } catch (error) {
      console.error('Failed to get tracking status:', error);
      res.status(500).json(createErrorResponse(error as Error));
    }
  }

  async getLatestLocation(req: Request, res: Response): Promise<void> {
    try {
      const { routeId } = req.params;
      const location = this.trackingService.getLatestLocation(routeId);
      if (!location) {
        res.status(404).json(createErrorResponse(new AppError('Location not found', 404)));
        return;
      }
      res.status(200).json(
        createSuccessResponse({
          lat: location.latitude,
          lng: location.longitude,
          timestamp: location.timestamp,
        })
      );
    } catch (error) {
      console.error('Failed to get latest location:', error);
      res.status(500).json(createErrorResponse(error as Error));
    }
  }
}
