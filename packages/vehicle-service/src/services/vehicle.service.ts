import { PrismaClient } from '@prisma/client';
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
  getVehicles(vehicleId: string) {
    throw new Error('Method not implemented.');
  }
  assignVehicleToRun(id: string, runId: any) {
    throw new Error('Method not implemented.');
  }
  unassignVehicleFromRun(id: string) {
    throw new Error('Method not implemented.');
  }
  getAvailableVehicles() {
    throw new Error('Method not implemented.');
  }
  addMaintenanceRecord(id: string, body: any) {
    throw new Error('Method not implemented.');
  }
  getMaintenanceHistory(id: string) {
    throw new Error('Method not implemented.');
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

      const [vehicles, total] = await Promise.all([
        this.prisma.$queryRaw<PrismaVehicle[]>`
          SELECT * FROM "vehicle"."Vehicle"
          WHERE ${Object.entries(where).map(([key, value]) => `${key} = ${value}`).join(' AND ')}
          LIMIT ${limit} OFFSET ${(page - 1) * limit}
        `,
        this.prisma.$queryRaw<[{ count: number }]>`
          SELECT COUNT(*) as count FROM "vehicle"."Vehicle"
          WHERE ${Object.entries(where).map(([key, value]) => `${key} = ${value}`).join(' AND ')}
        `
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
      
      const result = await this.prisma.$queryRaw<PrismaVehicle[]>`
        UPDATE "vehicle"."Vehicle"
        SET ${Object.entries(validatedData).map(([key, value]) => `${key} = ${value}`).join(', ')}
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