import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { IncidentService } from './services/incident.service';
import { IncidentController } from './api/controllers/incident.controller';
import { createIncidentRoutes } from './api/routes/incident.routes';

export const incidentService = new IncidentService();
const incidentController = new IncidentController(incidentService);

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(compression());

app.use('/api/incidents', createIncidentRoutes(incidentController));

export default app;
