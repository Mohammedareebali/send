import express from 'express';
import { databaseService, LoggerService, HealthCheckService } from '@send/shared';
import { securityHeaders, rateLimit } from '@send/shared/security/middleware';
import { ipRateLimitMiddleware } from '@send/shared/security/ip-rate-limiter';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { RabbitMQService } from './infra/messaging/rabbitmq';
import { DriverService } from './infra/services/driver.service';
import { DriverController } from './api/controllers/driver.controller';
import { createDriverRoutes } from './api/routes/driver.routes';
import { MonitoringService } from '@send/shared';

const app = express();
const prisma = databaseService.getPrismaClient();
const rabbitMQ = new RabbitMQService();
const logger = new LoggerService({ serviceName: 'driver-service' });
const healthCheck = new HealthCheckService(prisma, rabbitMQ.getChannel(), logger.getLogger(), 'driver-service');

const driverService = new DriverService(prisma, rabbitMQ);
const driverController = new DriverController(driverService);

// Middleware
app.use(securityHeaders);
app.use(ipRateLimitMiddleware());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(rateLimit('driver-service'));

// Set up routes
app.use('/api', createDriverRoutes(driverController));

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

// Connect to RabbitMQ and start listening for events
async function start() {
  try {
    await rabbitMQ.connect();
    await rabbitMQ.subscribeToDriverEvents(async (event) => {
      logger.info('Received driver event:', event);
      // Handle driver events as needed
    });

    const port = process.env.PORT || 3004;
    app.listen(port, () => {
      logger.info(`Driver service listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start driver service:', error);
    process.exit(1);
  }
}

start();

async function shutdown() {
  logger.info('Shutting down gracefully...');
  await rabbitMQ.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
