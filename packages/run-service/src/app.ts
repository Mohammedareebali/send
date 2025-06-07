import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { PrismaClient } from '@prisma/client';
import { RunModel } from './data/models/run.model';
import { RunController } from './api/controllers/run.controller';
import { RabbitMQService } from './infra/messaging/rabbitmq';
import { RouteService } from './infra/services/route.service';
import { ScheduleService } from './infra/services/schedule.service';
import { createRunRoutes } from './api/routes/run.routes';
import { logger } from '@shared/logger';

const app = express();
const prisma = new PrismaClient();
const runModel = new RunModel(prisma);
const rabbitMQ = new RabbitMQService();
const routeService = new RouteService();
const scheduleService = new ScheduleService();

// Initialize RabbitMQ connection
rabbitMQ.connect().catch(logger.error);

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Initialize controller with all services
const runController = new RunController(
  runModel,
  rabbitMQ,
  routeService,
  scheduleService
);

// Routes
app.use('/api/runs', createRunRoutes(runController));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app; 
