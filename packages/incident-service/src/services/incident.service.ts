import { v4 as uuidv4 } from 'uuid';

export interface Incident {
  id: string;
  userId: string;
  routeId: string;
  type: string;
  severity: string;
  notes: string;
  timestamp: Date;
  status: string;
}

export class IncidentService {
  private incidents: Incident[] = [];

  async createIncident(data: Omit<Incident, 'id' | 'timestamp'>): Promise<Incident> {
    const incident: Incident = {
      ...data,
      id: uuidv4(),
      timestamp: new Date(),
    };
    this.incidents.push(incident);
    return incident;
  }

  async getIncident(id: string): Promise<Incident | undefined> {
    return this.incidents.find((i) => i.id === id);
  }

  async listIncidents(): Promise<Incident[]> {
    return this.incidents;
  }

  async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | undefined> {
    const incident = await this.getIncident(id);
    if (!incident) return undefined;
    Object.assign(incident, updates);
    return incident;
  }

  async deleteIncident(id: string): Promise<boolean> {
    const index = this.incidents.findIndex((i) => i.id === id);
    if (index === -1) return false;
    this.incidents.splice(index, 1);
    return true;
  }
}
