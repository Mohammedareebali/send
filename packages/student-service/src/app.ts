import express from 'express';
import cors from 'cors';
import studentRoutes from './api/routes/student.routes';
import { logger } from '@shared/logger';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/students', studentRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app; 