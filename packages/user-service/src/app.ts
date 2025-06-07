import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { securityHeaders, rateLimit } from '@send/shared/security/middleware';

import { ipRateLimitMiddleware } from '@send/shared/security/ip-rate-limiter';

import promBundle from 'express-prom-bundle';
import { MonitoringService } from './infra/monitoring/monitoring.service';
import { LoggerService } from '@send/shared';


import userRoutes from './api/routes/user.routes';
import { errorHandler } from '@shared/errors';

const app: express.Application = express();
const logger = new LoggerService({ serviceName: 'user-service' });

// Initialize monitoring
const monitoringService = MonitoringService.getInstance();

// Middleware
app.use(securityHeaders);
app.use(ipRateLimitMiddleware());
app.use(cors());
app.use(helmet());
app.use(compression() as unknown as express.RequestHandler);
app.use(express.json());
app.use(rateLimit('user-service'));
app.use((req, res, next) => {
  logger.info('Incoming request', { method: req.method, url: req.url, ip: req.ip });
  next();
});

// Routes
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        const metrics = await monitoringService.getMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
    } catch (error) {
        logger.error('Failed to get metrics:', error);
        res.status(500).send('Failed to get metrics');
    }
});

// Error handling
app.use(errorHandler);

export default app; 