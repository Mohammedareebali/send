import request from 'supertest';
import express from 'express';
import { IncidentController } from '../../api/controllers/incident.controller';
import { IncidentService } from '../../services/incident.service';

describe('IncidentController', () => {
  let app: express.Application;
  let service: jest.Mocked<IncidentService>;
  let controller: IncidentController;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    service = {
      createIncident: jest.fn(),
      listIncidents: jest.fn(),
      getIncident: jest.fn(),
      updateIncident: jest.fn(),
      deleteIncident: jest.fn(),
      findUnescalatedHighSeverity: jest.fn(),
      markEscalated: jest.fn()
    } as unknown as jest.Mocked<IncidentService>;

    controller = new IncidentController(service);
    app.post('/incidents', (req, res) => controller.create(req, res));
    app.put('/incidents/:id', (req, res) => controller.update(req, res));
  });

  it('should create an incident', async () => {
    const incident = { id: '1', userId: 'u1', routeId: 'r1', type: 'TYPE', severity: 'LOW', notes: '', timestamp: new Date(), status: 'OPEN', escalated: false };
    service.createIncident.mockResolvedValue(incident);

    const res = await request(app).post('/incidents').send({ userId: 'u1', routeId: 'r1', type: 'TYPE', severity: 'LOW', notes: '', status: 'OPEN' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: '1',
      userId: 'u1',
      routeId: 'r1',
      type: 'TYPE',
      severity: 'LOW',
      notes: '',
      status: 'OPEN',
      escalated: false
    });
    expect(res.body).toHaveProperty('timestamp');
    expect(service.createIncident).toHaveBeenCalled();
  });

  it('should update an incident', async () => {
    const updated = { id: '1', userId: 'u1', routeId: 'r1', type: 'TYPE', severity: 'LOW', notes: 'n', timestamp: new Date(), status: 'OPEN', escalated: false };
    service.updateIncident.mockResolvedValue(updated);

    const res = await request(app).put('/incidents/1').send({ notes: 'n' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: '1',
      notes: 'n'
    });
    expect(service.updateIncident).toHaveBeenCalledWith('1', { notes: 'n' });
  });
});
