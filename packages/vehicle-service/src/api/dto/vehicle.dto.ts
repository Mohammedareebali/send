import { VehicleType, VehicleStatus } from '@shared/types/vehicle';

export interface CreateVehicleDto {
  type: VehicleType;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  capacity: number;
  status: VehicleStatus;
}

export interface UpdateVehicleDto {
  type?: VehicleType;
  make?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  status?: VehicleStatus;
  currentRunId?: string | null;
}

export interface MaintenanceRecordDto {
  type: string;
  description: string;
  cost: number;
  date?: Date;
} 