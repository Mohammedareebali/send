import 'dotenv/config';
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { securityHeaders, rateLimit } from '@send/shared/security/middleware';
import { ipRateLimitMiddleware } from '@send/shared/security/ip-rate-limiter';
import { logger } from '@shared/logger';
import { PrismaClient } from '@prisma/client';
import { RabbitMQService } from './infra/messaging/rabbitmq';
import { TrackingService } from './infra/services/tracking.service';
import { TrackingController } from './api/controllers/tracking.controller';
import { createTrackingRoutes } from './api/routes/tracking.routes';
import { Geofence } from '@shared/types/tracking';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const prisma = new PrismaClient();
const rabbitMQ = new RabbitMQService();

// Define geofences for pickup and dropoff locations
const geofences: Geofence[] = [
  {
    id: 'pickup-zone',
    name: 'Pickup Zone',
    type: 'PICKUP',
    center: {
      latitude: 51.5074,
      longitude: -0.1278,
      timestamp: new Date()
    },
    radius: 100 // meters
  },
  {
    id: 'dropoff-zone',
    name: 'Dropoff Zone',
    type: 'DROPOFF',
    center: {
      latitude: 51.5074,
      longitude: -0.1278,
      timestamp: new Date()
    },
    radius: 100 // meters
  }
];

const trackingService = new TrackingService(prisma, rabbitMQ, geofences);
const trackingController = new TrackingController(trackingService);

// Middleware
app.use(securityHeaders);
app.use(ipRateLimitMiddleware());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(rateLimit('tracking-service'));

// Set up routes
app.use('/api', createTrackingRoutes(trackingController));

// Set up WebSocket connections
io.on('connection', (socket) => {
  logger.info('Client connected');

  socket.on('join-run', (runId: string) => {
    trackingService.addClient(runId, socket);
    logger.info(`Client joined run ${runId}`);
  });

  socket.on('disconnect', () => {
    // Find and remove the socket from all runs
    for (const [runId, tracking] of trackingService['activeRuns']) {
      tracking.sockets.delete(socket);
    }
    logger.info('Client disconnected');
  });
});

// Connect to RabbitMQ and start listening for events
async function start() {
  try {
    await rabbitMQ.connect();
    await rabbitMQ.subscribeToTrackingEvents(async (event) => {
      logger.info('Received tracking event:', event);
      // Handle tracking events as needed
    });

    const port = process.env.PORT || 3007;
    httpServer.listen(port, () => {
      logger.info(`Tracking service listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start tracking service:', error);
    process.exit(1);
  }
}

start();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await rabbitMQ.close();
  await prisma.$disconnect();
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
