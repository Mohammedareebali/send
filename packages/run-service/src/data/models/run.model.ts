import { PrismaClient, Prisma } from "@prisma/client";
import { Run, RunStatus, RunType, ScheduleType } from "@shared/types/run";

type PrismaRun = Prisma.RunGetPayload<{}>;

export class RunModel {
  constructor(private prisma: PrismaClient) {}

  async create(
    data: Omit<Run, "id" | "createdAt" | "updatedAt">,
  ): Promise<Run> {
    const run = await this.prisma.run.create({
      data: {
        ...data,
        pickupLocation: JSON.stringify(data.pickupLocation),
        dropoffLocation: JSON.stringify(data.dropoffLocation),
        studentIds: JSON.stringify(data.studentIds),
      },
    });

    return this.mapPrismaRunToRun(run);
  }

  async update(id: string, data: Partial<Run>): Promise<Run> {
    const updateData: any = { ...data };

    if (data.pickupLocation) {
      updateData.pickupLocation = JSON.stringify(data.pickupLocation);
    }
    if (data.dropoffLocation) {
      updateData.dropoffLocation = JSON.stringify(data.dropoffLocation);
    }
    if (data.studentIds) {
      updateData.studentIds = JSON.stringify(data.studentIds);
    }

    const run = await this.prisma.run.update({
      where: { id },
      data: updateData,
    });

    return this.mapPrismaRunToRun(run);
  }

  async findById(id: string): Promise<Run | null> {
    const run = await this.prisma.run.findUnique({
      where: { id },
    });

    if (!run) {
      return null;
    }

    return this.mapPrismaRunToRun(run);
  }

  async findAll(filters?: Partial<Run>): Promise<Run[]> {
    const where: Prisma.RunWhereInput = {};

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.type) where.type = filters.type;
      if (filters.driverId) where.driverId = filters.driverId;
      if (filters.paId) where.paId = filters.paId;
    }

    const runs = await this.prisma.run.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return runs.map((run: PrismaRun) => this.mapPrismaRunToRun(run));
  }

  async delete(id: string): Promise<Run> {
    const run = await this.prisma.run.delete({
      where: { id },
    });

    return this.mapPrismaRunToRun(run);
  }

  private mapPrismaRunToRun(prismaRun: PrismaRun): Run {
    return {
      ...prismaRun,
      type: prismaRun.type as unknown as RunType,
      status: prismaRun.status as unknown as RunStatus,
      scheduleType: prismaRun.scheduleType as unknown as ScheduleType,
      driverId: prismaRun.driverId ?? undefined,
      paId: prismaRun.paId ?? undefined,
      routeId: prismaRun.routeId ?? undefined,
      notes: prismaRun.notes ?? undefined,
      endTime: prismaRun.endTime ?? undefined,
      scheduledStartTime: prismaRun.scheduledStartTime ?? undefined,
      actualStartTime: prismaRun.actualStartTime ?? undefined,
      recurrenceRule: prismaRun.recurrenceRule ?? undefined,
      endDate: prismaRun.endDate ?? undefined,
      lastOccurrence: prismaRun.lastOccurrence ?? undefined,
      nextOccurrence: prismaRun.nextOccurrence ?? undefined,
      pickupLocation: JSON.parse(prismaRun.pickupLocation as string),
      dropoffLocation: JSON.parse(prismaRun.dropoffLocation as string),
      studentIds: JSON.parse(prismaRun.studentIds as string),
    };
  }
}
