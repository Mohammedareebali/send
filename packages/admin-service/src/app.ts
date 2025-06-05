import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { AdminController } from './api/controllers/admin.controller';
import { createAdminRoutes } from './api/routes/admin.routes';
import { MetricsService } from './services/metrics.service';
import { ConfigService } from './services/config.service';
import { ReportService } from './services/report.service';

const metricsService = new MetricsService();
const configService = new ConfigService();
const reportService = new ReportService(metricsService);
const controller = new AdminController(metricsService, configService, reportService);

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(compression());

app.use('/api', createAdminRoutes(controller));

export default app;
