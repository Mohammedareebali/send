export class PrismaClient {
  [key: string]: any
}

// Enum stubs used in tests
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


export function Prisma() {}



export namespace Prisma {
  // Original exports
  export type RunGetPayload<T> = any
  export interface RunWhereInput {
    status?: any
    type?: any
    driverId?: string
    paId?: string
  }
  export const sql: any = undefined
  export const join: any = undefined
  export const empty: any = undefined
  export const raw: any = undefined

  // Newly added exports
  export type JsonObject = any
  export type TransactionClient = PrismaClient
}
