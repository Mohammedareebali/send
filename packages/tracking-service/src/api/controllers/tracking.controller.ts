import { Request, Response } from 'express';
import { TrackingService } from '../../infra/services/tracking.service';
import { Run } from '@shared/types/run';
import { Location } from '@shared/types/tracking';
import { logger } from '@shared/logger';
import { createSuccessResponse } from '@send/shared';

export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  async startTracking(req: Request, res: Response): Promise<void> {
    try {
      const run = req.body as Run;
      await this.trackingService.startTracking(run);
      res.status(200).json(createSuccessResponse({ message: 'Tracking started' }));
    } catch (error) {
      logger.error('Failed to start tracking:', error);
      res
        .status(500)
        .json(createErrorResponse(new AppError('Failed to start tracking', 500)));
    }
  }

  async updateLocation(req: Request, res: Response): Promise<void> {
    try {
      const { runId } = req.params;
      const location = req.body as Location;
      await this.trackingService.updateLocation(runId, location);
      res.status(200).json(createSuccessResponse({ message: 'Location updated' }));
    } catch (error) {
      logger.error('Failed to update location:', error);
      res
        .status(500)
        .json(createErrorResponse(new AppError('Failed to update location', 500)));
    }
  }

  async stopTracking(req: Request, res: Response): Promise<void> {
    try {
      const { runId } = req.params;
      await this.trackingService.stopTracking(runId);
      res.status(200).json(createSuccessResponse({ message: 'Tracking stopped' }));
    } catch (error) {
      logger.error('Failed to stop tracking:', error);
      res
        .status(500)
        .json(createErrorResponse(new AppError('Failed to stop tracking', 500)));
    }
  }

  async getTrackingStatus(req: Request, res: Response): Promise<void> {
    try {
      const { runId } = req.params;
      const status = this.trackingService.getTrackingStatus(runId);
      if (!status) {
        res
          .status(404)
          .json(createErrorResponse(new AppError('Run not found', 404)));
        return;
      }
      res.status(200).json(createSuccessResponse({ status }));
    } catch (error) {
      logger.error('Failed to get tracking status:', error);
      res
        .status(500)
        .json(createErrorResponse(new AppError('Failed to get tracking status', 500)));
    }
  }

  async getLatestLocation(req: Request, res: Response): Promise<void> {
    try {
      const { routeId } = req.params;
      const location = this.trackingService.getLatestLocation(routeId);
      if (!location) {
        res
          .status(404)
          .json(createErrorResponse(new AppError('Location not found', 404)));
        return;
      }
      res.status(200).json(
        createSuccessResponse({
          lat: location.latitude,
          lng: location.longitude,
          timestamp: location.timestamp
        })
      );
    } catch (error) {
      logger.error('Failed to get latest location:', error);
      res
        .status(500)
        .json(createErrorResponse(new AppError('Failed to get latest location', 500)));
    }
  }
}
