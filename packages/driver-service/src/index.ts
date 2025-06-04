import express from 'express';
import { PrismaClient } from '@prisma/client';
import { RabbitMQService } from './infra/messaging/rabbitmq';
import { DriverService } from './infra/services/driver.service';
import { DriverController } from './api/controllers/driver.controller';
import { createDriverRoutes } from './api/routes/driver.routes';

const app = express();
const prisma = new PrismaClient();
const rabbitMQ = new RabbitMQService();

const driverService = new DriverService(prisma, rabbitMQ);
const driverController = new DriverController(driverService);

// Set up routes
app.use(express.json());
app.use('/api', createDriverRoutes(driverController));

// Connect to RabbitMQ and start listening for events
async function start() {
  try {
    await rabbitMQ.connect();
    await rabbitMQ.subscribeToDriverEvents(async (event) => {
      console.log('Received driver event:', event);
      // Handle driver events as needed
    });

    const port = process.env.PORT || 3004;
    app.listen(port, () => {
      console.log(`Driver service listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start driver service:', error);
    process.exit(1);
  }
}

start();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await rabbitMQ.close();
  await prisma.$disconnect();
  process.exit(0);
}); 