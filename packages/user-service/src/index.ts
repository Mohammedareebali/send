import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { errorHandler } from '@shared/errors';
import { authRoutes } from './api/routes/auth.routes';
import userRoutes from './api/routes/user.routes';
import { setupEventBus } from './infra/eventBus';
import { LoggerService } from '@send/shared';
import { createConnection } from 'mongoose';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerConfig } from '@send/shared/swagger';

const app = express();
const logger = new LoggerService({ serviceName: 'user-service' });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  logger.info('Incoming request', { method: req.method, url: req.url, ip: req.ip });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const swaggerSpec = swaggerJsdoc({ definition: swaggerConfig, apis: [] });
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error handling
app.use(errorHandler);

// Initialize database connection and start server
const startServer = async () => {
  try {
    await createConnection();
    await setupEventBus();
    app.listen(config.port, () => {
      logger.info(`User Service running on port ${config.port}`);
    });

    const shutdown = () => {
      logger.info('Shutting down...');
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 
