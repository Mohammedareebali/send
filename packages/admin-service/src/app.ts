import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { securityHeaders, rateLimit } from '@send/shared/security/middleware';
import { ipRateLimitMiddleware } from '@send/shared/security/ip-rate-limiter';
import { AdminController } from './api/controllers/admin.controller';
import { createAdminRoutes } from './api/routes/admin.routes';
import { MetricsService } from './services/metrics.service';
import { ConfigService } from './services/config.service';
import { ReportService } from './services/report.service';
import { MonitoringService } from '@send/shared';
import { logger } from '@shared/logger';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerConfig } from '@send/shared/swagger';

const metricsService = new MetricsService();
const configService = new ConfigService();
const reportService = new ReportService(metricsService);
const controller = new AdminController(metricsService, configService, reportService);

const app = express();
app.use(securityHeaders);
app.use(ipRateLimitMiddleware());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(rateLimit('admin-service'));

app.use('/api', createAdminRoutes(controller));

const swaggerSpec = swaggerJsdoc({ definition: swaggerConfig, apis: [] });
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const monitoringService = MonitoringService.getInstance();
app.get('/metrics', async (_req, res) => {
  try {
    const metrics = await monitoringService.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('Failed to get metrics:', error);
    res.status(500).send('Failed to get metrics');
  }
});

export default app;
