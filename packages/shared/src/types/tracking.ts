export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
}

export interface Geofence {
  boundary: { latitude: number; longitude: number }[];
  id: string;
  name: string;
  type: 'PICKUP' | 'DROPOFF';
  center: Location;
  radius: number; // in meters
}

export interface GeofenceEvent {
  type: 'ENTER' | 'EXIT';
  location: 'PICKUP' | 'DROPOFF';
  runId: string;
  timestamp: Date;
}

export interface ETACalculation {
  runId: string;
  eta: Date;
  distance: number; // in meters
  duration: number; // in seconds
  traffic?: {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    delay: number; // in seconds
  };
}

export interface Journey {
  runId: string;
  startTime: Date;
  endTime?: Date;
  distance?: number; // in meters
  duration?: number; // in seconds
  path?: Location[];
}

export interface TrackingEvent {
  type: 'LOCATION_UPDATE' | 'GEOFENCE_EVENT' | 'ETA_UPDATE' | 'JOURNEY_START' | 'JOURNEY_END';
  data: Location | GeofenceEvent | ETACalculation | Journey;
  timestamp: Date;
}

export interface TrackingNotification {
  type: 'LOCATION_UPDATE' | 'GEOFENCE_EVENT' | 'ETA_UPDATE';
  data: {
    runId: string;
    message: string;
    details: any;
  };
} 