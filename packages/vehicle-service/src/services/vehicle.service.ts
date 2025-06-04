import { PrismaClient, Prisma } from '@prisma/client';
import { Vehicle, VehicleType, VehicleStatus } from '../types/vehicle';
import { createVehicleSchema, updateVehicleSchema, vehicleQuerySchema } from '@shared/validation/schemas/vehicle.schema';
import { prometheus } from '@shared/prometheus';
import { logger } from '@shared/logger';
import { z } from 'zod';

interface PrismaVehicle {
  id: string;
  type: VehicleType;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: VehicleStatus;
  currentRunId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class VehicleService {
  async getVehicles(vehicleId: string): Promise<Vehicle | null> {
    return this.getVehicleById(vehicleId);
  }

  async assignVehicleToRun(id: string, runId: string): Promise<Vehicle | null> {
    try {
      const result = await this.prisma.$queryRaw<PrismaVehicle[]>`
        UPDATE "vehicle"."Vehicle"
        SET status = ${VehicleStatus.IN_USE}, currentRunId = ${runId}
        WHERE id = ${id}
        RETURNING *
      `;

      if (!result || result.length === 0) {
        return null;
      }

      const mappedVehicle = this.mapToVehicle(result[0]);
      this.cache.set(id, mappedVehicle);
      return mappedVehicle;
    } catch (error) {
      logger.error('Error assigning vehicle to run:', { id, runId, error });
      prometheus.serviceRequestsTotal.inc({
        service: 'vehicle-service',
        status: 'error'
      });
      throw error;
    }
  }

  async unassignVehicleFromRun(id: string): Promise<Vehicle | null> {
    try {
      const result = await this.prisma.$queryRaw<PrismaVehicle[]>`
        UPDATE "vehicle"."Vehicle"
        SET status = ${VehicleStatus.AVAILABLE}, currentRunId = NULL
        WHERE id = ${id}
        RETURNING *
      `;

      if (!result || result.length === 0) {
        return null;
      }

      const mappedVehicle = this.mapToVehicle(result[0]);
      this.cache.set(id, mappedVehicle);
      return mappedVehicle;
    } catch (error) {
      logger.error('Error unassigning vehicle from run:', { id, error });
      prometheus.serviceRequestsTotal.inc({
        service: 'vehicle-service',
        status: 'error'
      });
      throw error;
    }
  }

  async getAvailableVehicles(): Promise<Vehicle[]> {
    try {
      const result = await this.prisma.$queryRaw<PrismaVehicle[]>`
        SELECT * FROM "vehicle"."Vehicle"
        WHERE status = ${VehicleStatus.AVAILABLE} AND currentRunId IS NULL
      `;

      return result.map(this.mapToVehicle);
    } catch (error) {
      logger.error('Error getting available vehicles:', { error });
      prometheus.serviceRequestsTotal.inc({
        service: 'vehicle-service',
        status: 'error'
      });
      throw error;
    }
  }

  async addMaintenanceRecord(id: string, body: {
    type: string;
    description: string;
    cost: number;
    date?: Date;
  }): Promise<{ id: string } & typeof body> {
    try {
      const recordDate = body.date || new Date();

      const result = await this.prisma.$queryRaw<any[]>`
        INSERT INTO "vehicle"."MaintenanceRecord" (
          vehicleId, type, description, cost, date
        ) VALUES (
          ${id}, ${body.type}, ${body.description}, ${body.cost}, ${recordDate}
        ) RETURNING *
      `;

      return result[0];
    } catch (error) {
      logger.error('Error adding maintenance record:', { id, body, error });
      prometheus.serviceRequestsTotal.inc({
        service: 'vehicle-service',
        status: 'error'
      });
      throw error;
    }
  }

  async getMaintenanceHistory(id: string): Promise<any[]> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM "vehicle"."MaintenanceRecord"
        WHERE vehicleId = ${id}
        ORDER BY date DESC
      `;

      return result;
    } catch (error) {
      logger.error('Error getting maintenance history:', { id, error });
      prometheus.serviceRequestsTotal.inc({
        service: 'vehicle-service',
        status: 'error'
      });
      throw error;
    }
  }
  private prisma: PrismaClient;
  private cache: Map<string, Vehicle>;

  constructor() {
    this.prisma = new PrismaClient();
    this.cache = new Map();
  }

  private mapToVehicle(prismaVehicle: PrismaVehicle): Vehicle {
    return {
      id: prismaVehicle.id,
      type: prismaVehicle.type,
      make: prismaVehicle.make,
      model: prismaVehicle.model,
      year: prismaVehicle.year,
      licensePlate: prismaVehicle.licensePlate,
      status: prismaVehicle.status,
      currentRunId: prismaVehicle.currentRunId,
      createdAt: prismaVehicle.createdAt,
      updatedAt: prismaVehicle.updatedAt
    };
  }

  async getVehicleById(id: string): Promise<Vehicle | null> {
    try {
      const cachedVehicle = this.cache.get(id);
      if (cachedVehicle) {
        return cachedVehicle;
      }

      const result = await this.prisma.$queryRaw<PrismaVehicle[]>`
        SELECT * FROM "vehicle"."Vehicle" WHERE id = ${id}
      `;

      if (!result || result.length === 0) {
        return null;
      }

      const mappedVehicle = this.mapToVehicle(result[0]);
      this.cache.set(id, mappedVehicle);
      return mappedVehicle;
    } catch (error) {
      logger.error('Error getting vehicle by ID:', { id, error });
      prometheus.serviceRequestsTotal.inc({
        service: 'vehicle-service',
        status: 'error'
      });
      throw error;
    }
  }

  async getAllVehicles(query?: z.infer<typeof vehicleQuerySchema>): Promise<{ vehicles: Vehicle[]; total: number }> {
    try {
      const { status, make, model, year, page = 1, limit = 10 } = vehicleQuerySchema.parse(query || {});
      
      const where = {
        ...(status && { status }),
        ...(make && { make }),
        ...(model && { model }),
        ...(year && { year })
      };

      const conditions = Object.entries(where).map(([key, value]) =>
        Prisma.sql`${Prisma.raw(`"${key}"`)} = ${value}`
      );

      const whereSql =
        conditions.length > 0
          ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
          : Prisma.empty;

      const [vehicles, total] = await Promise.all([
        this.prisma.$queryRaw<PrismaVehicle[]>(
          Prisma.sql`
            SELECT * FROM "vehicle"."Vehicle"
            ${whereSql}
            LIMIT ${limit} OFFSET ${(page - 1) * limit}
          `
        ),
        this.prisma.$queryRaw<{ count: number }[]>(
          Prisma.sql`
            SELECT COUNT(*) as count FROM "vehicle"."Vehicle"
            ${whereSql}
          `
        )
      ]);

      return {
        vehicles: vehicles.map(this.mapToVehicle),
        total: total[0].count
      };
    } catch (error) {
      logger.error('Error getting vehicles:', { error });
      prometheus.serviceRequestsTotal.inc({
        service: 'vehicle-service',
        status: 'error'
      });
      throw error;
    }
  }

  async createVehicle(vehicleData: z.infer<typeof createVehicleSchema>): Promise<Vehicle> {
    try {
      const validatedData = createVehicleSchema.parse(vehicleData);
      
      const result = await this.prisma.$queryRaw<PrismaVehicle[]>`
        INSERT INTO "vehicle"."Vehicle" (
          type, make, model, year, licensePlate, status
        ) VALUES (
          ${validatedData.type}, ${validatedData.make}, ${validatedData.model},
          ${validatedData.year}, ${validatedData.licensePlate}, ${validatedData.status}
        ) RETURNING *
      `;

      const mappedVehicle = this.mapToVehicle(result[0]);
      this.cache.set(mappedVehicle.id, mappedVehicle);
      return mappedVehicle;
    } catch (error) {
      logger.error('Error creating vehicle:', { vehicleData, error });
      prometheus.serviceRequestsTotal.inc({
        service: 'vehicle-service',
        status: 'error'
      });
      throw error;
    }
  }

  async updateVehicle(id: string, vehicleData: z.infer<typeof updateVehicleSchema>): Promise<Vehicle | null> {
    try {
      const validatedData = updateVehicleSchema.parse(vehicleData);
      
      const updates = Object.entries(validatedData).map(([key, value]) =>
        Prisma.sql`${Prisma.raw(`"${key}"`)} = ${value}`
      );

      const updateQuery = Prisma.sql`
        UPDATE "vehicle"."Vehicle"
        SET ${Prisma.join(updates, ', ')}
        WHERE id = ${id}
        RETURNING *
      `;

      const result = await this.prisma.$queryRaw<PrismaVehicle[]>(updateQuery);

      if (!result || result.length === 0) {
        return null;
      }

      const mappedVehicle = this.mapToVehicle(result[0]);
      this.cache.set(id, mappedVehicle);
      return mappedVehicle;
    } catch (error) {
      logger.error('Error updating vehicle:', { id, vehicleData, error });
      prometheus.serviceRequestsTotal.inc({
        service: 'vehicle-service',
        status: 'error'
      });
      throw error;
    }
  }

  async deleteVehicle(id: string): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`
        DELETE FROM "vehicle"."Vehicle" WHERE id = ${id}
      `;
      this.cache.delete(id);
      return true;
    } catch (error) {
      logger.error('Error deleting vehicle:', { id, error });
      prometheus.serviceRequestsTotal.inc({
        service: 'vehicle-service',
        status: 'error'
      });
      return false;
    }
  }
} 