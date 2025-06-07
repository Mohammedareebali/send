import express from 'express';
import { Server } from 'http';
import { PrismaClient } from '@prisma/client';
import { VehicleService } from './services/vehicle.service';
import { VehicleController } from './api/controllers/vehicle.controller';
import { createVehicleRoutes } from './api/routes/vehicle.routes';
import { RabbitMQService } from './infra/messaging/rabbitmq';
import { getServiceConfig } from './config';

const app = express();
const server = new Server(app);
const prisma = new PrismaClient();
const { rabbitMQUrl, port } = getServiceConfig();
const rabbitMQService = new RabbitMQService(rabbitMQUrl);

// Create services and controllers
const vehicleService = new VehicleService(rabbitMQService);
const vehicleController = new VehicleController(vehicleService);

// Middleware
app.use(express.json());
app.use('/api', createVehicleRoutes(vehicleController));

// Start the service
async function start() {
  try {
    await rabbitMQService.connect();
    server.listen(port, () => {
      console.log(`Vehicle service listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start vehicle service:', error);
    process.exit(1);
  }
}

start();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await rabbitMQService.close();
  await prisma.$disconnect();
  process.exit(0);
}); 