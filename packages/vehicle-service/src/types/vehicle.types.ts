import { VehicleType, VehicleStatus, VehicleEventType } from '@shared/types/vehicle';

export enum AlertType {
  MAINTENANCE = 'MAINTENANCE',
  SAFETY = 'SAFETY',
  PERFORMANCE = 'PERFORMANCE',
  FUEL = 'FUEL',
  INSURANCE = 'INSURANCE',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
}

export interface CreateVehicleDto {
  type: VehicleType;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
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

export interface VehicleEvent {
  type: VehicleEventType;
  vehicleId: string;
  timestamp: number;
  data: {
    status?: VehicleStatus;
    maintenanceRecord?: {
      id: string;
      type: string;
      description: string;
      date: string;
    };
    telemetryRecord?: {
      id: string;
      speed?: number;
      fuelLevel?: number;
      location?: { latitude: number; longitude: number } | null;
      recordedAt: string;
    };
    runId?: string;
    previousStatus?: VehicleStatus;
    newStatus?: VehicleStatus;
  };
}
