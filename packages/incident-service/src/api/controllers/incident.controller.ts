import { Request, Response } from 'express';
import { IncidentService } from '../../services/incident.service';

export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const incident = await this.incidentService.createIncident(req.body);
      res.status(201).json(incident);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create incident' });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    const incidents = await this.incidentService.listIncidents();
    res.json(incidents);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const incident = await this.incidentService.getIncident(req.params.id);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }
    res.json(incident);
  }

  async update(req: Request, res: Response): Promise<void> {
    const incident = await this.incidentService.updateIncident(req.params.id, req.body);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }
    res.json(incident);
  }

  async remove(req: Request, res: Response): Promise<void> {
    const deleted = await this.incidentService.deleteIncident(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }
    res.status(204).send();
  }
}
