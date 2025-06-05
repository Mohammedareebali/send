import { IncidentService } from '../../services/incident.service';

describe('IncidentService', () => {
  let service: IncidentService;

  beforeEach(() => {
    service = new IncidentService();
  });

  it('creates and retrieves an incident', async () => {
    const incident = await service.createIncident({
      userId: 'u1',
      routeId: 'r1',
      type: 'Medical',
      severity: 'High',
      notes: 'test',
      status: 'Open'
    });

    const fetched = await service.getIncident(incident.id);
    expect(fetched?.id).toBe(incident.id);
  });

  it('updates an incident', async () => {
    const incident = await service.createIncident({
      userId: 'u1',
      routeId: 'r1',
      type: 'Behaviour',
      severity: 'Low',
      notes: 'test',
      status: 'Open'
    });

    const updated = await service.updateIncident(incident.id, { status: 'Resolved' });
    expect(updated?.status).toBe('Resolved');
  });
});
