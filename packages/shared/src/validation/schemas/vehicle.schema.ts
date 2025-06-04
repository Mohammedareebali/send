import { z } from 'zod';
import { VehicleStatus, VehicleType } from '../types/vehicle';

export const createVehicleSchema = z.object({
  type: z.nativeEnum(VehicleType),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(1900).max(new Date().getFullYear()),
  licensePlate: z.string().min(3).max(10).regex(/^[A-Z0-9-]+$/),
  capacity: z.number().int().min(1).max(50),
  status: z.nativeEnum(VehicleStatus).default(VehicleStatus.AVAILABLE)
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const vehicleIdSchema = z.object({
  id: z.string().uuid()
});

export const vehicleQuerySchema = z.object({
  status: z.nativeEnum(VehicleStatus).optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional()
}); 