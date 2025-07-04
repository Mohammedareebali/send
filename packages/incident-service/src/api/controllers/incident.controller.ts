import { Request, Response } from 'express';
import { IncidentService } from '../../services/incident.service';
import {
  LoggerService,
  createErrorResponse,
  createSuccessResponse,
  AppError
} from '@send/shared';

const logger = new LoggerService({ serviceName: 'incident-service' });

export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const incident = await this.incidentService.createIncident(req.body);
      res.status(201).json(createSuccessResponse(incident));
    } catch (err) {
      logger.error('Failed to create incident', { error: err });
      res.status(500).json(createErrorResponse(new AppError('Failed to create incident', 500)));
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    const incidents = await this.incidentService.listIncidents();
    res.json(createSuccessResponse(incidents));
  }

  async getById(req: Request, res: Response): Promise<void> {
    const incident = await this.incidentService.getIncident(req.params.id);
    if (!incident) {
      res.status(404).json(createErrorResponse(new AppError('Incident not found', 404)));
      return;
    }
    res.json(createSuccessResponse(incident));
  }

  async update(req: Request, res: Response): Promise<void> {
    const incident = await this.incidentService.updateIncident(req.params.id, req.body);
    if (!incident) {
      res.status(404).json(createErrorResponse(new AppError('Incident not found', 404)));
      return;
    }
    res.json(createSuccessResponse(incident));
  }

  async remove(req: Request, res: Response): Promise<void> {
    const deleted = await this.incidentService.deleteIncident(req.params.id);
    if (!deleted) {
      res.status(404).json(createErrorResponse(new AppError('Incident not found', 404)));
      return;
    }
    res.status(204).send();
  }
}
