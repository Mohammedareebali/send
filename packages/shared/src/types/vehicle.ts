export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}

export enum VehicleType {
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  VAN = 'VAN',
  BUS = 'BUS'
}

export enum VehicleEventType {
  VEHICLE_CREATED = 'VEHICLE_CREATED',
  VEHICLE_UPDATED = 'VEHICLE_UPDATED',
  VEHICLE_DELETED = 'VEHICLE_DELETED',
  VEHICLE_STATUS_CHANGED = 'VEHICLE_STATUS_CHANGED',
  VEHICLE_ASSIGNED = 'VEHICLE_ASSIGNED',
  VEHICLE_UNASSIGNED = 'VEHICLE_UNASSIGNED',
  MAINTENANCE_RECORD_ADDED = 'MAINTENANCE_RECORD_ADDED',
  TELEMETRY_RECORDED = 'TELEMETRY_RECORDED'
}

export enum AlertType {
  MAINTENANCE = 'MAINTENANCE',
  SAFETY = 'SAFETY',
  PERFORMANCE = 'PERFORMANCE',
  FUEL = 'FUEL',
  INSURANCE = 'INSURANCE'
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  ACKNOWLEDGED = 'ACKNOWLEDGED'
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  type: VehicleType;
  status: VehicleStatus;
  capacity: number;
  currentRunId?: string;
  lastMaintenanceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  description: string;
  cost: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TelemetryRecord {
  id: string;
  vehicleId: string;
  speed?: number;
  fuelLevel?: number;
  location?: { latitude: number; longitude: number } | null;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleEvent {
  type: VehicleEventType;
  vehicleId: string;
  data: Partial<Vehicle> | MaintenanceRecord | TelemetryRecord;
  timestamp: Date;
}

export interface Alert {
  id: string;
  vehicleId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  status: AlertStatus;
  details: Record<string, any>;
} 