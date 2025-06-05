import { PrismaClient } from '@prisma/client';
import { RabbitMQService } from '../messaging/rabbitmq';
import { Driver, DriverStatus } from '@shared/types/driver';
import { DriverEventType } from '../../types/driver.types';

export class DriverService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly rabbitMQ: RabbitMQService
  ) {}

  async createDriver(driver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Driver> {
    const createdDriver = await (this.prisma as any).driver.create({
      data: {
        ...driver,
        status: DriverStatus.ACTIVE
      }
    });

    await this.rabbitMQ.publishDriverEvent({
      type: DriverEventType.CREATED,
      driverId: createdDriver.id,
      timestamp: Date.now(),
      data: {}
    });

    return this.mapPrismaDriverToDriver(createdDriver);
  }

  async updateDriver(id: string, driver: Partial<Driver>): Promise<Driver> {
    const updatedDriver = await (this.prisma as any).driver.update({
      where: { id },
      data: driver
    });

    await this.rabbitMQ.publishDriverEvent({
      type: DriverEventType.UPDATED,
      driverId: updatedDriver.id,
      timestamp: Date.now(),
      data: {}
    });

    return this.mapPrismaDriverToDriver(updatedDriver);
  }

  async getDriver(id: string): Promise<Driver | null> {
    const driver = await (this.prisma as any).driver.findUnique({
      where: { id }
    });
    return driver ? this.mapPrismaDriverToDriver(driver) : null;
  }

  async getDrivers(): Promise<Driver[]> {
    const drivers = await (this.prisma as any).driver.findMany();
    return drivers.map(this.mapPrismaDriverToDriver);
  }

  async deleteDriver(id: string): Promise<void> {
    await (this.prisma as any).driver.delete({
      where: { id }
    });

    await this.rabbitMQ.publishDriverEvent({
      type: DriverEventType.UPDATED,
      driverId: id,
      timestamp: Date.now(),
      data: {}
    });
  }

  async updateDriverStatus(id: string, status: DriverStatus): Promise<Driver> {
    const driver = await (this.prisma as any).driver.findUnique({ where: { id } });
    if (!driver) {
      throw new Error('Driver not found');
    }

    const updatedDriver = await (this.prisma as any).driver.update({
      where: { id },
      data: { status }
    });

    await this.rabbitMQ.publishDriverEvent({
      type: DriverEventType.STATUS_CHANGED,
      driverId: id,
      timestamp: Date.now(),
      data: {
        previousStatus: driver.status,
        newStatus: status
      }
    });

    return this.mapPrismaDriverToDriver(updatedDriver);
  }

  async assignDriverToRun(driverId: string, runId: string): Promise<Driver> {
    const driver = await (this.prisma as any).driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      throw new Error('Driver not found');
    }

    const run = await (this.prisma as any).run.findUnique({ where: { id: runId } });
    if (!run) {
      throw new Error('Run not found');
    }

    const availability = await (this.prisma as any).driverAvailability.findFirst({
      where: {
        driverId,
        startTime: { lte: run.startTime },
        endTime: { gte: run.endTime ?? run.startTime }
      }
    });
    if (!availability) {
      throw new Error('Driver not available for this run');
    }

    const updatedDriver = await (this.prisma as any).driver.update({
      where: { id: driverId },
      data: {
        currentRunId: runId,
        status: DriverStatus.ASSIGNED
      }
    });

    await this.rabbitMQ.publishDriverEvent({
      type: DriverEventType.ASSIGNED,
      driverId: driverId,
      timestamp: Date.now(),
      data: {
        runId,
        previousStatus: driver.status,
        newStatus: DriverStatus.ASSIGNED
      }
    });

    return this.mapPrismaDriverToDriver(updatedDriver);
  }

  async unassignDriverFromRun(driverId: string): Promise<Driver> {
    const driver = await (this.prisma as any).driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      throw new Error('Driver not found');
    }

    const updatedDriver = await (this.prisma as any).driver.update({
      where: { id: driverId },
      data: {
        currentRunId: null,
        status: DriverStatus.ACTIVE
      }
    });

    await this.rabbitMQ.publishDriverEvent({
      type: DriverEventType.UNASSIGNED,
      driverId: driverId,
      timestamp: Date.now(),
      data: {
        previousStatus: driver.status,
        newStatus: DriverStatus.ACTIVE
      }
    });

    return this.mapPrismaDriverToDriver(updatedDriver);
  }

  async getDriverAvailability(driverId: string) {
    return (this.prisma as any).driverAvailability.findMany({
      where: { driverId },
      orderBy: { startTime: 'asc' }
    });
  }

  async updateDriverAvailability(driverId: string, slots: { startTime: Date; endTime: Date }[]) {
    await (this.prisma as any).driverAvailability.deleteMany({ where: { driverId } });
    if (slots.length) {
      await (this.prisma as any).driverAvailability.createMany({
        data: slots.map(s => ({ ...s, driverId }))
      });
    }
    return this.getDriverAvailability(driverId);
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    const drivers = await (this.prisma as any).driver.findMany({
      where: {
        status: DriverStatus.ACTIVE,
        currentRunId: null
      }
    });
    return drivers.map(this.mapPrismaDriverToDriver);
  }

  async getDriverPerformance(driverId: string): Promise<{
    totalRuns: number;
    onTimeRuns: number;
    lateRuns: number;
    averageRating: number;
  }> {
    const driver = await (this.prisma as any).driver.findUnique({
      where: { id: driverId },
      include: {
        runs: {
          where: {
            status: 'COMPLETED'
          }
        }
      }
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    const runs = driver.runs || [];
    const totalRuns = runs.length;
    const onTimeRuns = runs.filter((run: any) => run.actualStartTime && run.actualStartTime <= run.scheduledStartTime).length;
    const lateRuns = totalRuns - onTimeRuns;
    const averageRating = runs.reduce((sum: number, run: any) => sum + (run.rating || 0), 0) / totalRuns;

    return {
      totalRuns,
      onTimeRuns,
      lateRuns,
      averageRating
    };
  }

  private mapPrismaDriverToDriver(prismaDriver: any): Driver {
    return {
      ...prismaDriver,
      status: prismaDriver.status as DriverStatus
    };
  }
} 