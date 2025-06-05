import { Request, Response } from 'express';

export class AdminController {
  async metrics(req: Request, res: Response): Promise<void> {
    res.json({
      totalRunsToday: 0,
      onTimePercentage: 0,
      openIncidents: 0,
      expiringDocuments: 0
    });
  }

  async reports(req: Request, res: Response): Promise<void> {
    res.json([]);
  }

  async userActivity(req: Request, res: Response): Promise<void> {
    res.json([]);
  }
}
