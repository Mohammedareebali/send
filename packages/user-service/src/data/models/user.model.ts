import { PrismaClient } from '../../../prisma/generated/client';
import bcrypt from 'bcryptjs';
import { DriverData, PAData, GuardianData, UserRole, UserStatus } from 'shared';

const prisma = new PrismaClient();

export const UserModel = {
  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status?: UserStatus;
    phoneNumber?: string;
    driverData?: DriverData;
    paData?: PAData;
    guardianData?: GuardianData;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        status: data.status || UserStatus.ACTIVE,
        phoneNumber: data.phoneNumber,
        driver: data.driverData ? {
          create: {
            licenseNumber: data.driverData.licenseNumber,
            licenseExpiry: data.driverData.licenseExpiry,
          }
        } : undefined,
        pa: data.paData ? {
          create: {
            certification: data.paData.certification,
          }
        } : undefined,
        guardian: data.guardianData ? {
          create: {
            address: data.guardianData.address,
          }
        } : undefined,
      },
      include: {
        driver: true,
        pa: true,
        guardian: {
          include: {
            children: true,
          },
        },
      },
    });
  },

  async createDriver(userId: string, data: { licenseNumber: string; licenseExpiry: Date }) {
    return prisma.driver.create({
      data: {
        ...data,
        userId,
      },
    });
  },

  async createPA(userId: string, data: { certification?: string }) {
    return prisma.pa.create({
      data: {
        ...data,
        userId,
      },
    });
  },

  async createGuardian(userId: string, data: { address: string }) {
    return prisma.guardian.create({
      data: {
        ...data,
        userId,
      },
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        driver: true,
        pa: true,
        guardian: {
          include: {
            children: true,
          },
        },
      },
    });
  },

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        driver: true,
        pa: true,
        guardian: {
          include: {
            children: true,
          },
        },
      },
    });
  },

  async getDriverData(userId: string) {
    return prisma.driver.findUnique({
      where: { userId },
    });
  },

  async getPAData(userId: string) {
    return prisma.pa.findUnique({
      where: { userId },
    });
  },

  async getGuardianData(userId: string) {
    return prisma.guardian.findUnique({
      where: { userId },
      include: {
        children: true,
      },
    });
  },

  async update(id: string, data: {
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    status?: UserStatus;
    phoneNumber?: string;
    password?: string;
    lastLoginAt?: Date;
    loginCount?: number;
    driverData?: Partial<DriverData>;
    paData?: Partial<PAData>;
    guardianData?: Partial<GuardianData>;
  }) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        status: data.status,
        phoneNumber: data.phoneNumber,
        password: data.password,
        lastLoginAt: data.lastLoginAt,
        loginCount: data.loginCount,
        driver: data.driverData ? {
          update: {
            licenseNumber: data.driverData.licenseNumber,
            licenseExpiry: data.driverData.licenseExpiry,
          }
        } : undefined,
        pa: data.paData ? {
          update: {
            certification: data.paData.certification,
          }
        } : undefined,
        guardian: data.guardianData ? {
          update: {
            address: data.guardianData.address,
          }
        } : undefined,
      },
      include: {
        driver: true,
        pa: true,
        guardian: {
          include: {
            children: true,
          },
        },
      },
    });
  },

  async updateDriver(userId: string, data: { licenseNumber?: string; licenseExpiry?: Date }) {
    return prisma.driver.update({
      where: { userId },
      data,
    });
  },

  async updatePA(userId: string, data: { certification?: string }) {
    return prisma.pa.update({
      where: { userId },
      data,
    });
  },

  async updateGuardian(userId: string, data: { address?: string }) {
    return prisma.guardian.update({
      where: { userId },
      data,
    });
  },

  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  },

  async getAllUsers() {
    return prisma.user.findMany({
      include: {
        driver: true,
        pa: true,
        guardian: {
          include: {
            children: true,
          },
        },
      },
    });
  },
}; 