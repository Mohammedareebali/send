import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { AdminController } from './api/controllers/admin.controller';
import { createAdminRoutes } from './api/routes/admin.routes';

const controller = new AdminController();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(compression());

app.use('/api', createAdminRoutes(controller));

export default app;
