import { Request, Response } from 'express';
import { TrackingService } from '../../infra/services/tracking.service';
import { Run } from '@shared/types/run';
import { Location } from '@shared/types/tracking';

export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  async startTracking(req: Request, res: Response): Promise<void> {
    try {
      const run = req.body as Run;
      await this.trackingService.startTracking(run);
      res.status(200).json({ message: 'Tracking started' });
    } catch (error) {
      console.error('Failed to start tracking:', error);
      res.status(500).json({ error: 'Failed to start tracking' });
    }
  }

  async updateLocation(req: Request, res: Response): Promise<void> {
    try {
      const { runId } = req.params;
      const location = req.body as Location;
      await this.trackingService.updateLocation(runId, location);
      res.status(200).json({ message: 'Location updated' });
    } catch (error) {
      console.error('Failed to update location:', error);
      res.status(500).json({ error: 'Failed to update location' });
    }
  }

  async stopTracking(req: Request, res: Response): Promise<void> {
    try {
      const { runId } = req.params;
      await this.trackingService.stopTracking(runId);
      res.status(200).json({ message: 'Tracking stopped' });
    } catch (error) {
      console.error('Failed to stop tracking:', error);
      res.status(500).json({ error: 'Failed to stop tracking' });
    }
  }

  async getTrackingStatus(req: Request, res: Response): Promise<void> {
    try {
      const { runId } = req.params;
      // Implementation depends on how we store tracking status
      res.status(200).json({ message: 'Tracking status retrieved' });
    } catch (error) {
      console.error('Failed to get tracking status:', error);
      res.status(500).json({ error: 'Failed to get tracking status' });
    }
  }
} 