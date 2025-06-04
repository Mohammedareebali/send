import { PrismaClient, Prisma, Run, } from '@prisma/client';
import { Driver, DriverStatus } from '@send/shared';
import { RabbitMQService } from './messaging/rabbitmq.service';

type RunWithPerformance = Pick<Run, 'id' | 'status' | 'scheduledStartTime' | 'actualStartTime' | 'rating'>;

export class DriverService {
  constructor(
    private prisma: PrismaClient,
    private rabbitMQService: RabbitMQService
  ) {}

  async createDriver(data: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) {
    const driver = await this.prisma.driver.create({
      data: {
        ...data,
        status: DriverStatus.ACTIVE
      }
    });

    await this.rabbitMQService.publishDriverEvent({
      type: 'DRIVER_CREATED',
      data: driver,
      timestamp: new Date()
    });

    return driver;
  }

  async updateDriver(id: string, data: Partial<Driver>) {
    const driver = await this.prisma.driver.update({
      where: { id },
      data
    });

    await this.rabbitMQService.publishDriverEvent({
      type: 'DRIVER_UPDATED',
      data: driver,
      timestamp: new Date()
    });

    return driver;
  }

  async getDriver(id: string) {
    return this.prisma.driver.findUnique({
      where: { id }
    });
  }

  async getDrivers() {
    return this.prisma.driver.findMany();
  }

  async deleteDriver(id: string) {
    await this.prisma.driver.delete({
      where: { id }
    });

    await this.rabbitMQService.publishDriverEvent({
      type: 'DRIVER_DELETED',
      data: { id },
      timestamp: new Date()
    });
  }

  async updateDriverStatus(id: string, status: DriverStatus) {
    const driver = await this.prisma.driver.update({
      where: { id },
      data: { status }
    });

    await this.rabbitMQService.publishDriverEvent({
      type: 'DRIVER_STATUS_UPDATED',
      data: driver,
      timestamp: new Date()
    });

    return driver;
  }

  async assignDriverToRun(driverId: string, runId: string) {
    const driver = await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        currentRunId: runId,
        status: DriverStatus.ASSIGNED
      }
    });

    await this.rabbitMQService.publishDriverEvent({
      type: 'DRIVER_ASSIGNED',
      data: {
        driverId,
        runId
      },
      timestamp: new Date()
    });

    return driver;
  }

  async unassignDriverFromRun(driverId: string) {
    const driver = await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        currentRunId: null,
        status: DriverStatus.ACTIVE
      }
    });

    await this.rabbitMQService.publishDriverEvent({
      type: 'DRIVER_UNASSIGNED',
      data: {
        driverId
      },
      timestamp: new Date()
    });

    return driver;
  }

  async getAvailableDrivers() {
    return this.prisma.driver.findMany({
      where: {
        status: DriverStatus.ACTIVE,
        currentRunId: null
      }
    });
  }

  async getDriverPerformance(driverId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        runs: true
      }
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    const runs = driver.runs || [];
    const totalRuns = runs.length;
    const onTimeRuns = runs.filter((run) => 
      run.status === 'COMPLETED' && 
      run.actualStartTime && run.actualStartTime <= run.scheduledStartTime
    ).length;

    const lateRuns = runs.filter((run) => 
      run.status === 'COMPLETED' && 
      run.actualStartTime && run.actualStartTime > run.scheduledStartTime
    ).length;

    const totalRating = runs.reduce((sum: number, run) => sum + (run.rating || 0), 0);
    const averageRating = totalRuns > 0 ? totalRating / totalRuns : 0;

    return {
      totalRuns,
      onTimeRuns,
      lateRuns,
      averageRating
    };
  }
} 