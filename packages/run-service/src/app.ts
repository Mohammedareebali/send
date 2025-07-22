import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { rateLimit } from "@send/shared/security/middleware";
import { securityHeadersMiddleware } from "@send/shared/security/headers";
import { ipRateLimitMiddleware } from "@send/shared/security/ip-rate-limiter";
import {
  databaseService,
  LoggerService,
  HealthCheckService,
} from "@send/shared";
import { RunModel } from "./data/models/run.model";
import { RunController } from "./api/controllers/run.controller";
import { RabbitMQService } from "./infra/messaging/rabbitmq";
import { RouteService } from "./infra/services/route.service";
import { ScheduleService } from "./infra/services/schedule.service";
import { createRunRoutes } from "./api/routes/run.routes";
import { errorHandler } from "@shared/errors";
import { MonitoringService } from "@send/shared";
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerConfig } from '@send/shared/swagger';
const logger = new LoggerService({ serviceName: "run-service" });


const app = express();
const prisma = databaseService.getPrismaClient();
const runModel = new RunModel(prisma);
const rabbitMQ = new RabbitMQService();
// Pass null for the channel initially; will set after connect
const healthCheck = new HealthCheckService(
  prisma,
  null,
  logger, // Use LoggerService instance directly
  "run-service",
);
const routeService = new RouteService();
const scheduleService = new ScheduleService();

// Initialize RabbitMQ connection
rabbitMQ.connect().then(() => {
  // After connection, set the channel on healthCheck if needed
  // (You may need to add a setter or refactor HealthCheckService for dynamic channel assignment)
  // Example if setter exists:
  // healthCheck.setRabbitMQChannel(rabbitMQ.getChannel());
}).catch(error => logger.error('RabbitMQ connection error', error));

// Middleware
app.use(securityHeadersMiddleware);
app.use(ipRateLimitMiddleware);
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(rateLimit); // Fix: pass the middleware function, not a string

// Initialize controller with all services
const runController = new RunController(
  runModel,
  rabbitMQ,
  routeService,
  scheduleService,
);

// Routes
app.use("/api/runs", createRunRoutes(runController));

const swaggerSpec = swaggerJsdoc({ definition: swaggerConfig, apis: [] });
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.get("/health", async (_req, res) => {
  const health = await healthCheck.checkHealth();
  res.status(health.status === "UP" ? 200 : 503).json(health);
});

const monitoringService = MonitoringService.getInstance();
app.get("/metrics", async (_req, res) => {
  try {
    const metrics = await monitoringService.getMetrics();
    res.set("Content-Type", "text/plain");
    res.send(metrics);
  } catch (error) {
    logger.error("Failed to get metrics:", error);
    res.status(500).send("Failed to get metrics");
  }
});

// Error handling middleware
app.use(errorHandler);

export default app;
