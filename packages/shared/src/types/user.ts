export enum UserRole {
  ADMIN = 'ADMIN',
  COORDINATOR = 'COORDINATOR',
  MANAGER = 'MANAGER',
  CONTROLLER = 'CONTROLLER',
  DRIVER = 'DRIVER',
  PA = 'PA',
  GUARDIAN = 'GUARDIAN',
  PARENT = 'PARENT'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver extends User {
  callNumber: string;
  pdaPassword: string;
  nationalInsurance: string;
  dbsNumber: string;
  dbsIssueDate: Date;
  dbsExpiryDate: Date;
  driverLicenseNumber: string;
  driverLicenseIssueDate: Date;
  driverLicenseExpiryDate: Date;
  pcoLicenseNumber?: string;
  pcoLicenseIssueDate?: Date;
  pcoLicenseExpiryDate?: Date;
}

export interface PassengerAssistant extends User {
  nationalInsurance: string;
  dbsNumber: string;
  dbsIssueDate: Date;
  dbsExpiryDate: Date;
}

export interface Parent extends User {
  address: string;
  postcode: string;
  emergencyContact?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
} 