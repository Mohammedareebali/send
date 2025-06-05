import { ReportService } from '../../services/report.service';
import { MetricsService } from '../../services/metrics.service';

describe('ReportService', () => {
  it('generates and retrieves reports', async () => {
    const metricsService = { getMetrics: jest.fn().mockResolvedValue({ a: 1 }) } as any as jest.Mocked<MetricsService>;
    const service = new ReportService(metricsService);

    const reports = await service.getReports();
    expect(reports.length).toBe(1);
    expect(reports[0]).toHaveProperty('generatedAt');
    expect(reports[0].metrics).toEqual({ a: 1 });

    metricsService.getMetrics.mockResolvedValue({ a: 2 } as any);
    await service.generateReport();
    const updated = await service.getReports();
    expect(updated.length).toBe(2);
    expect(updated[1].metrics).toEqual({ a: 2 });
  });
});
