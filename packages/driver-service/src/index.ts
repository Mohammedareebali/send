import express from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '@shared/logger';
import { securityHeaders, rateLimit } from '@send/shared/security/middleware';
import { ipRateLimitMiddleware } from '@send/shared/security/ip-rate-limiter';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { RabbitMQService } from './infra/messaging/rabbitmq';
import { DriverService } from './infra/services/driver.service';
import { DriverController } from './api/controllers/driver.controller';
import { createDriverRoutes } from './api/routes/driver.routes';

const app = express();
const prisma = new PrismaClient();
const rabbitMQ = new RabbitMQService();

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

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await rabbitMQ.close();
  await prisma.$disconnect();
  process.exit(0);
});
