export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
  PA = 'PA',
  GUARDIAN = 'GUARDIAN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
  roles: UserRole[];
}

export interface AuthenticatedRequest extends Express.Request {
  user?: UserPayload;
}

export interface DriverData {
  licenseNumber: string;
  licenseExpiry: Date;
}

export interface PAData {
  certification?: string;
}

export interface GuardianData {
  address: string;
  children?: string[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  roles: UserRole[];
  status: UserStatus;
  driverData?: DriverData;
  paData?: PAData;
  guardianData?: GuardianData;
  createdAt: Date;
  updatedAt: Date;
} 