import { PrismaClient, Incident as PrismaIncident } from '@prisma/client';

export type Incident = PrismaIncident;

export class IncidentService {
  constructor(private readonly prisma: PrismaClient) {}

  async createIncident(data: Omit<Incident, 'id' | 'timestamp' | 'escalated'>): Promise<Incident> {
    return this.prisma.incident.create({
      data: { ...data, timestamp: new Date() }
    });
  }

  async getIncident(id: string): Promise<Incident | undefined> {
    return this.prisma.incident.findUnique({ where: { id } }) ?? undefined;
  }

  async listIncidents(): Promise<Incident[]> {
    return this.prisma.incident.findMany();
  }

  async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | undefined> {
    try {
      return await this.prisma.incident.update({
        where: { id },
        data: updates
      });
    } catch {
      return undefined;
    }
  }

  async deleteIncident(id: string): Promise<boolean> {
    try {
      await this.prisma.incident.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async findUnescalatedHighSeverity(): Promise<Incident[]> {
    return this.prisma.incident.findMany({
      where: { severity: 'HIGH', escalated: false }
    });
  }

  async markEscalated(id: string): Promise<void> {
    await this.prisma.incident.update({ where: { id }, data: { escalated: true } });
  }
}
