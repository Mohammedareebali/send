import express from 'express';
import cors from 'cors';
import studentRoutes from './api/routes/student.routes';
import { errorHandler } from '@shared/errors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/students', studentRoutes);

// Error handling middleware
app.use(errorHandler);

export default app; 