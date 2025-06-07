import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { securityHeaders, rateLimit } from '@send/shared/security/middleware';
import { ipRateLimitMiddleware } from '@send/shared/security/ip-rate-limiter';
import { databaseService, LoggerService, HealthCheckService } from '@send/shared';
import { IncidentService } from './services/incident.service';
import { IncidentController } from './api/controllers/incident.controller';
import { createIncidentRoutes } from './api/routes/incident.routes';
import { RabbitMQService } from '@shared/messaging/rabbitmq.service';
import { startEscalationJob } from './jobs/escalation.job';
import { MonitoringService } from '@send/shared';

export const prisma = databaseService.getPrismaClient();
export const logger = new LoggerService({
  serviceName: 'incident-service',
  logLevel: process.env.LOG_LEVEL || 'info'
});
export const rabbitMQ = new RabbitMQService(
  {
    url: process.env.RABBITMQ_URL || 'amqp://localhost',
    exchange: 'incident-events',
    queue: 'incident-notifications'
  },
  logger.getLogger()
);

const healthCheck = new HealthCheckService(prisma, rabbitMQ.getChannel(), logger.getLogger(), 'incident-service');

export const incidentService = new IncidentService(prisma);
const incidentController = new IncidentController(incidentService);

const app = express();
app.use(securityHeaders);
app.use(ipRateLimitMiddleware());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(rateLimit('incident-service'));

app.use('/api/incidents', createIncidentRoutes(incidentController));

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
    logger.error('Failed to get metrics', { error });
    res.status(500).send('Failed to get metrics');
  }
});

startEscalationJob(incidentService, rabbitMQ);

export default app;
