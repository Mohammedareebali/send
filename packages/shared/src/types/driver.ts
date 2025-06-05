export enum DriverStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ASSIGNED = 'ASSIGNED',
  ON_LEAVE = 'ON_LEAVE'
}

export interface Driver {
  id: string;
  callNumber: string;
  pdaPassword: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: Date;
  addressLine1: string;
  addressLine2: string | null;
  postcode: string;
  phoneNumber: string;
  email: string;
  licenseNumber: string;
  licenseExpiryDate: Date;
  dbsNumber: string;
  dbsExpiryDate: Date;
  medicalExpiryDate: Date;
  rentalExpiryDate: Date;
  status: DriverStatus;
  currentRunId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverAvailability {
  id: string;
  driverId: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
}
