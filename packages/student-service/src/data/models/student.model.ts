import { PrismaClient } from '@prisma/client';
import {
  Student,
  StudentCreateInput,
  StudentUpdateInput,
  StudentWhereInput,
  Guardian,
  GuardianCreateInput,
  Attendance,
  AttendanceCreateInput
} from '@send/shared';

export class StudentModel {
  private static instance: StudentModel;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): StudentModel {
    if (!StudentModel.instance) {
      StudentModel.instance = new StudentModel();
    }
    return StudentModel.instance;
  }

  async create(data: StudentCreateInput): Promise<Student> {
    return this.prisma.student.create({ data });
  }

  async update(id: string, data: StudentUpdateInput): Promise<Student> {
    return this.prisma.student.update({
      where: { id },
      data,
    });
  }

  async findById(id: string): Promise<Student | null> {
    return this.prisma.student.findUnique({
      where: { id },
    });
  }

  async findAll(where?: StudentWhereInput): Promise<Student[]> {
    return this.prisma.student.findMany({
      where,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.student.delete({
      where: { id },
    });
  }

  async addGuardian(studentId: string, data: GuardianCreateInput): Promise<Guardian> {
    const guardian = await this.prisma.guardian.create({ data });
    await this.prisma.studentGuardian.create({
      data: { studentId, guardianId: guardian.id }
    });
    return guardian as unknown as Guardian;
  }

  async removeGuardian(studentId: string, guardianId: string): Promise<void> {
    await this.prisma.studentGuardian.deleteMany({
      where: { studentId, guardianId }
    });
  }

  async recordAttendance(studentId: string, data: AttendanceCreateInput): Promise<Attendance> {
    return this.prisma.attendance.create({
      data: { ...data, studentId }
    }) as unknown as Attendance;
  }
}
