import { UserRole as PrismaUserRole, UserStatus as PrismaUserStatus } from '@prisma/client';
import { UserRole as SharedUserRole, UserStatus as SharedUserStatus } from '@shared/types';

export const mapPrismaRoleToShared = (role: PrismaUserRole): SharedUserRole => {
  switch (role) {
    case PrismaUserRole.ADMIN:
      return SharedUserRole.ADMIN;
    case PrismaUserRole.DRIVER:
      return SharedUserRole.DRIVER;
    case PrismaUserRole.PA:
      return SharedUserRole.PA;
    case PrismaUserRole.GUARDIAN:
      return SharedUserRole.GUARDIAN;
    default:
      return SharedUserRole.GUARDIAN;
  }
};

export const mapSharedRoleToPrisma = (role: SharedUserRole): PrismaUserRole => {
  switch (role) {
    case SharedUserRole.ADMIN:
      return PrismaUserRole.ADMIN;
    case SharedUserRole.DRIVER:
      return PrismaUserRole.DRIVER;
    case SharedUserRole.PA:
      return PrismaUserRole.PA;
    case SharedUserRole.GUARDIAN:
      return PrismaUserRole.GUARDIAN;
    default:
      return PrismaUserRole.GUARDIAN;
  }
};

export const mapPrismaStatusToShared = (status: PrismaUserStatus): SharedUserStatus => {
  switch (status) {
    case PrismaUserStatus.ACTIVE:
      return SharedUserStatus.ACTIVE;
    case PrismaUserStatus.INACTIVE:
      return SharedUserStatus.INACTIVE;
    case PrismaUserStatus.SUSPENDED:
      return SharedUserStatus.SUSPENDED;
    default:
      return SharedUserStatus.ACTIVE;
  }
};

export const mapSharedStatusToPrisma = (status: SharedUserStatus): PrismaUserStatus => {
  switch (status) {
    case SharedUserStatus.ACTIVE:
      return PrismaUserStatus.ACTIVE;
    case SharedUserStatus.INACTIVE:
      return PrismaUserStatus.INACTIVE;
    case SharedUserStatus.SUSPENDED:
      return PrismaUserStatus.SUSPENDED;
    default:
      return PrismaUserStatus.ACTIVE;
  }
}; 