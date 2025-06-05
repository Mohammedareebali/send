import request from 'supertest';
import express from 'express';
import { AdminController } from '../../api/controllers/admin.controller';
import { MetricsService } from '../../services/metrics.service';
import { ConfigService } from '../../services/config.service';
import { ReportService } from '../../services/report.service';

describe('AdminController', () => {
  let app: express.Application;
  let metricsService: jest.Mocked<MetricsService>;
  let configService: jest.Mocked<ConfigService>;
  let reportService: jest.Mocked<ReportService>;
  let controller: AdminController;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    metricsService = { getMetrics: jest.fn() } as any;
    configService = {
      getConfig: jest.fn(),
      updateConfig: jest.fn()
    } as any;
    reportService = { getReports: jest.fn() } as any;

    controller = new AdminController(metricsService, configService, reportService);

    app.get('/admin/metrics', (req, res) => controller.metrics(req, res));
    app.get('/admin/reports', (req, res) => controller.reports(req, res));
    app.get('/admin/config', (req, res) => controller.getConfig(req, res));
    app.put('/admin/config', (req, res) => controller.updateConfig(req, res));
  });

  it('returns metrics', async () => {
    metricsService.getMetrics.mockResolvedValue({
      totalRunsToday: 5,
      onTimePercentage: 100,
      openIncidents: 0,
      expiringDocuments: 1
    } as any);

    const res = await request(app).get('/admin/metrics');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalRunsToday: 5,
      onTimePercentage: 100,
      openIncidents: 0,
      expiringDocuments: 1
    });
  });

  it('returns reports', async () => {
    reportService.getReports.mockResolvedValue([{ generatedAt: 'now', metrics: { a: 1 } }] as any);

    const res = await request(app).get('/admin/reports');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ generatedAt: 'now', metrics: { a: 1 } }]);
  });

  it('gets config', async () => {
    configService.getConfig.mockResolvedValue({ key: 'value' });

    const res = await request(app).get('/admin/config');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ key: 'value' });
  });

  it('updates config', async () => {
    configService.updateConfig.mockResolvedValue({ foo: 'bar' });

    const res = await request(app).put('/admin/config').send({ foo: 'bar' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ foo: 'bar' });
    expect(configService.updateConfig).toHaveBeenCalledWith({ foo: 'bar' });
  });
});
