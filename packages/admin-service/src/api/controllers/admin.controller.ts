import { Request, Response } from 'express';
import { MetricsService } from '../../services/metrics.service';
import { ConfigService } from '../../services/config.service';
import { ReportService } from '../../services/report.service';
import { createSuccessResponse } from '@send/shared';

export class AdminController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly configService: ConfigService,
    private readonly reportService: ReportService
  ) {}

  async metrics(req: Request, res: Response): Promise<void> {
    const metrics = await this.metricsService.getMetrics();
    res.json(createSuccessResponse(metrics));
  }

  async reports(req: Request, res: Response): Promise<void> {
    const reports = await this.reportService.getReports();
    res.json(createSuccessResponse(reports));
  }

  async getConfig(req: Request, res: Response): Promise<void> {
    const config = await this.configService.getConfig();
    res.json(createSuccessResponse(config));
  }

  async updateConfig(req: Request, res: Response): Promise<void> {
    const config = await this.configService.updateConfig(req.body);
    res.json(createSuccessResponse(config));
  }
}
