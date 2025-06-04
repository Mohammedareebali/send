import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import promBundle from 'express-prom-bundle';
import { MonitoringService } from './infra/monitoring/monitoring.service';
import { logger } from '@send/shared';
import userRoutes from './api/routes/user.routes';
import { errorHandler } from './api/middleware/error.middleware';

const app: express.Application = express();

// Initialize monitoring
const monitoringService = MonitoringService.getInstance();
const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
    customLabels: { service: 'user-service' },
    promRegistry: monitoringService.getRegistry(),
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression() as unknown as express.RequestHandler);
app.use(express.json());

// Monitoring middleware
app.use(metricsMiddleware);

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