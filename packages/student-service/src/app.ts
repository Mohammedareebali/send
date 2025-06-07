import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { securityHeaders, rateLimit } from '@send/shared/security/middleware';
import studentRoutes from './api/routes/student.routes';
import { errorHandler } from '@shared/errors';
import { MonitoringService } from '@send/shared';
import { logger } from '@shared/logger';

const app = express();

// Middleware
app.use(securityHeaders);
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(rateLimit('student-service'));

// Routes
app.use('/api/students', studentRoutes);

const monitoringService = MonitoringService.getInstance();
app.get('/metrics', async (_req, res) => {
  try {
    const metrics = await monitoringService.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('Failed to get metrics:', error);
    res.status(500).send('Failed to get metrics');
  }
});

// Error handling middleware
app.use(errorHandler);

export default app; 
