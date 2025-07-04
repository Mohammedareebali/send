import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { securityHeaders, rateLimit } from '@send/shared/security/middleware';
import { ipRateLimitMiddleware } from '@send/shared/security/ip-rate-limiter';
import { databaseService, LoggerService, HealthCheckService } from '@send/shared';
import { RunModel } from './data/models/run.model';
import { RunController } from './api/controllers/run.controller';
import { RabbitMQService } from './infra/messaging/rabbitmq';
import { RouteService } from './infra/services/route.service';
import { ScheduleService } from './infra/services/schedule.service';
import { createRunRoutes } from './api/routes/run.routes';
import { errorHandler } from '@shared/errors';
import { MonitoringService } from '@send/shared';
const logger = new LoggerService({ serviceName: 'run-service' });

const app = express();
const prisma = databaseService.getPrismaClient();
const runModel = new RunModel(prisma);
const rabbitMQ = new RabbitMQService();
const healthCheck = new HealthCheckService(prisma, rabbitMQ.getChannel(), logger.getLogger(), 'run-service');
const routeService = new RouteService();
const scheduleService = new ScheduleService();

// Initialize RabbitMQ connection
rabbitMQ.connect().catch(error => logger.error('RabbitMQ connection error', error));

// Middleware
app.use(securityHeaders);
app.use(ipRateLimitMiddleware());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(rateLimit('run-service'));

// Initialize controller with all services
const runController = new RunController(
  runModel,
  rabbitMQ,
  routeService,
  scheduleService
);

// Routes
app.use('/api/runs', createRunRoutes(runController));

app.get('/health', async (_req, res) => {
  const health = await healthCheck.checkHealth();
  res.status(health.status === 'UP' ? 200 : 503).json(health);
});

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

// Error handling middleware
app.use(errorHandler as ErrorRequestHandler);

export default app; 
