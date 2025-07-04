import express from 'express';
import { Server } from 'http';
import { databaseService, LoggerService, HealthCheckService } from '@send/shared';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { securityHeaders, rateLimit } from '@send/shared/security/middleware';
import { ipRateLimitMiddleware } from '@send/shared/security/ip-rate-limiter';
import { VehicleService } from './services/vehicle.service';
import { VehicleController } from './api/controllers/vehicle.controller';
import { createVehicleRoutes } from './api/routes/vehicle.routes';
import { RabbitMQService } from './infra/messaging/rabbitmq';

import { MonitoringService } from '@send/shared';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerConfig } from '@send/shared/swagger';

const app = express();
const server = new Server(app);
const prisma = databaseService.getPrismaClient();
const { rabbitMQUrl, port } = getServiceConfig();
const rabbitMQService = new RabbitMQService(rabbitMQUrl);
const logger = new LoggerService({ serviceName: 'vehicle-service' });
const healthCheck = new HealthCheckService(prisma, rabbitMQService.getChannel(), logger.getLogger(), 'vehicle-service');

// Create services and controllers
const vehicleService = new VehicleService(rabbitMQService);
const vehicleController = new VehicleController(vehicleService);

// Middleware
app.use(securityHeaders);
app.use(ipRateLimitMiddleware());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(rateLimit('vehicle-service'));
app.use('/api', createVehicleRoutes(vehicleController));

const swaggerSpec = swaggerJsdoc({ definition: swaggerConfig, apis: [] });
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

// Start the service
async function start() {
  try {
    await rabbitMQService.connect();
    server.listen(port, () => {
      logger.info(`Vehicle service listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start vehicle service:', error);
    process.exit(1);
  }
}

start();

async function shutdown() {
  logger.info('Shutting down gracefully...');
  await rabbitMQService.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
