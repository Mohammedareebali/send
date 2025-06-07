import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { securityHeaders, rateLimit } from '@send/shared/security/middleware';
import { ipRateLimitMiddleware } from '@send/shared/security/ip-rate-limiter';
import { PrismaClient } from '@prisma/client';
import { RunModel } from './data/models/run.model';
import { RunController } from './api/controllers/run.controller';
import { RabbitMQService } from './infra/messaging/rabbitmq';
import { RouteService } from './infra/services/route.service';
import { ScheduleService } from './infra/services/schedule.service';
import { createRunRoutes } from './api/routes/run.routes';
import { errorHandler } from '@shared/errors';

const app = express();
const prisma = new PrismaClient();
const runModel = new RunModel(prisma);
const rabbitMQ = new RabbitMQService();
const routeService = new RouteService();
const scheduleService = new ScheduleService();

// Initialize RabbitMQ connection
rabbitMQ.connect().catch(console.error);

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

// Error handling middleware
app.use(errorHandler as ErrorRequestHandler);

export default app; 
