export enum VehicleType {
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  VAN = 'VAN',
  BUS = 'BUS'
}

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}

export enum AlertType {
  MAINTENANCE = 'MAINTENANCE',
  FUEL = 'FUEL',
  SAFETY = 'SAFETY',
  PERFORMANCE = 'PERFORMANCE',
  DIAGNOSTIC = 'DIAGNOSTIC',
  INSURANCE = "INSURANCE"
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
  IGNORED = 'IGNORED'
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: VehicleStatus;
  currentRunId?: string | null;
  createdAt: Date;
  updatedAt: Date;
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

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  description: string;
  cost: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
} 