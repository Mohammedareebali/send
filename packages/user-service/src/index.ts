import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createConnection } from 'typeorm';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './api/routes/auth.routes';
import userRoutes from './api/routes/user.routes';
import { setupEventBus } from './infra/eventBus';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Error handling
app.use(errorHandler);

// Initialize database connection and start server
const startServer = async () => {
  try {
    await createConnection();
    await setupEventBus();
    
    app.listen(config.port, () => {
      console.log(`User Service running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 