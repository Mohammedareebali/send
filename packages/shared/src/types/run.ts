export enum RunStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum RunType {
  REGULAR = 'REGULAR',
  SPECIAL = 'SPECIAL',
  EMERGENCY = 'EMERGENCY'
}

export enum ScheduleType {
  ONE_TIME = 'ONE_TIME',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  CUSTOM = 'CUSTOM'
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  postcode?: string;
}

export interface Run {
  id: string;
  type: RunType;
  status: RunStatus;
  startTime: Date;
  endTime?: Date;
  pickupLocation: Location;
  dropoffLocation: Location;
  driverId?: string;
  paId?: string;
  studentIds: string[];
  routeId?: string;
  notes?: string;
  scheduledStartTime?: Date;
  actualStartTime?: Date;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;

  // Route Planning
  estimatedDistance?: number;
  estimatedDuration?: number;
  optimizedRoute?: any;
  trafficConditions?: any;

  // Schedule Management
  scheduleType: ScheduleType;
  recurrenceRule?: string;
  endDate?: Date;
  lastOccurrence?: Date;
  nextOccurrence?: Date;
}

export interface RunEvent {
  type: string;
  data: Run;
}

export interface RunNotification {
  type: 'ASSIGNMENT' | 'UPDATE' | 'CANCELLATION';
  data: {
    runId: string;
    message: string;
  };
} 