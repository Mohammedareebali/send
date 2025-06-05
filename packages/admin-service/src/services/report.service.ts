import { MetricsService } from './metrics.service';

export interface Report {
  generatedAt: Date;
  metrics: Awaited<ReturnType<MetricsService['getMetrics']>>;
}

export class ReportService {
  private reports: Report[] = [];

  constructor(private readonly metricsService: MetricsService) {}

  async generateReport(): Promise<Report> {
    const metrics = await this.metricsService.getMetrics();
    const report: Report = { generatedAt: new Date(), metrics };
    this.reports.push(report);
    return report;
  }

  async getReports(): Promise<Report[]> {
    if (this.reports.length === 0) {
      await this.generateReport();
    }
    return this.reports;
  }
}
