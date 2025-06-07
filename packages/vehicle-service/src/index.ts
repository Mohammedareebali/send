import express from 'express';
import { Server } from 'http';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { securityHeaders, rateLimit } from '@send/shared/security/middleware';
import { ipRateLimitMiddleware } from '@send/shared/security/ip-rate-limiter';
import { VehicleService } from './services/vehicle.service';
import { VehicleController } from './api/controllers/vehicle.controller';
import { createVehicleRoutes } from './api/routes/vehicle.routes';
import { RabbitMQService } from './infra/messaging/rabbitmq';

import { logger } from '@shared/logger';
import { MonitoringService } from '@send/shared';

const app = express();
const server = new Server(app);
const prisma = new PrismaClient();
const { rabbitMQUrl, port } = getServiceConfig();
const rabbitMQService = new RabbitMQService(rabbitMQUrl);

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

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await rabbitMQService.close();
  await prisma.$disconnect();
  process.exit(0);
});
