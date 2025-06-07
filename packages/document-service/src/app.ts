import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { securityHeaders, rateLimit } from '@send/shared/security/middleware';
import { ipRateLimitMiddleware } from '@send/shared/security/ip-rate-limiter';
import { PrismaClient } from '@prisma/client';
import { DocumentController } from './api/controllers/document.controller';
import { DocumentService } from './services/document.service';
import { HealthCheckService } from '@shared/health/health.check';
import { RabbitMQService } from '@shared/messaging/rabbitmq.service';
import { LoggerService } from '@shared/logging/logger.service';
import { createDocumentRoutes } from './api/routes/document.routes';

const app = express();
const prisma = new PrismaClient();

// Initialize services
const logger = new LoggerService({
  serviceName: 'document-service',
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE
});

const rabbitMQ = new RabbitMQService(
  {
    url: process.env.RABBITMQ_URL || 'amqp://localhost',
    exchange: 'document-events',
    queue: 'document-notifications'
  },
  logger.getLogger()
);

const documentService = new DocumentService(prisma, rabbitMQ, logger);
const documentController = new DocumentController(documentService);
const healthCheckService = new HealthCheckService(prisma, rabbitMQ.getChannel(), logger.getLogger(), 'document-service');

// Middleware
app.use(securityHeaders);
app.use(ipRateLimitMiddleware());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(rateLimit('document-service'));

// Routes
app.use('/api/documents', createDocumentRoutes(documentController));

// Health check
app.get('/health', async (req, res) => {
  try {
    const health = await healthCheckService.checkHealth();
    res.status(health.status === 'UP' ? 200 : 503).json(health);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'DOWN',
      error: 'Health check failed'
    });
  }
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err });
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export { app, prisma, rabbitMQ, logger, documentService };
