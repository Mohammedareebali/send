import { DriverStatus } from '@shared/types/driver';

export enum DriverEventType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  ASSIGNED = 'ASSIGNED',
  UNASSIGNED = 'UNASSIGNED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  LOCATION_UPDATED = 'LOCATION_UPDATED'
}

export interface DriverEvent {
  type: DriverEventType;
  driverId: string;
  timestamp: number;
  data: {
    status?: DriverStatus;
    location?: {
      latitude: number;
      longitude: number;
    };
    runId?: string;
    previousStatus?: DriverStatus;
    newStatus?: DriverStatus;
  };
}

export interface DriverNotification {
  type: 'ASSIGNMENT' | 'UPDATE' | 'CANCELLATION' | 'ALERT';
  driverId: string;
  timestamp: number;
  data: {
    message: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    runId?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
} 