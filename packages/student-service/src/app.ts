import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { securityHeaders, rateLimit } from '@send/shared/security/middleware';
import studentRoutes from './api/routes/student.routes';
import { errorHandler } from '@shared/errors';

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

// Error handling middleware
app.use(errorHandler);

export default app; 
