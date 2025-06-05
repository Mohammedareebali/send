import { PrismaClient } from '@prisma/client';
import { StudentModel } from '../../data/models/student.model';
import { Student, StudentCreateInput, StudentUpdateInput } from '@send/shared';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    student: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    guardian: {
      create: jest.fn(),
    },
    studentGuardian: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    attendance: {
      create: jest.fn(),
    }
  })),
}));

describe('StudentModel', () => {
  let prisma: any;
  let studentModel: StudentModel;

  beforeEach(() => {
    prisma = new PrismaClient();
    studentModel = StudentModel.getInstance();
    (studentModel as any).prisma = prisma;
  });

  afterEach(() => {
    (StudentModel as any).instance = undefined;
  });

  describe('create', () => {
    it('should create a new student', async () => {
      const studentData: StudentCreateInput = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date(),
        grade: '5',
        school: 'Elementary School',
        parentId: 'parent-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockStudent: Student = {
        ...studentData,
        id: 'student-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.student.create as jest.Mock).mockResolvedValue(mockStudent);

      const result = await studentModel.create(studentData);

      expect(prisma.student.create).toHaveBeenCalledWith({ data: studentData });
      expect(result).toEqual(mockStudent);
    });
  });

  describe('findById', () => {
    it('should find a student by id', async () => {
      const mockStudent: Student = {
        id: 'student-123',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date(),
        grade: '5',
        school: 'Elementary School',
        parentId: 'parent-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      const result = await studentModel.findById('student-123');

      expect(prisma.student.findUnique).toHaveBeenCalledWith({
        where: { id: 'student-123' },
      });
      expect(result).toEqual(mockStudent);
    });

    it('should return null if student not found', async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await studentModel.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all students', async () => {
      const mockStudents: Student[] = [
        {
          id: 'student-123',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date(),
          grade: '5',
          school: 'Elementary School',
          parentId: 'parent-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.student.findMany as jest.Mock).mockResolvedValue(mockStudents);

      const result = await studentModel.findAll();

      expect(prisma.student.findMany).toHaveBeenCalledWith({ where: undefined });
      expect(result).toEqual(mockStudents);
    });

    it('should find students by parentId', async () => {
      const mockStudents: Student[] = [
        {
          id: 'student-123',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date(),
          grade: '5',
          school: 'Elementary School',
          parentId: 'parent-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.student.findMany as jest.Mock).mockResolvedValue(mockStudents);

      const result = await studentModel.findAll({ parentId: 'parent-123' });

      expect(prisma.student.findMany).toHaveBeenCalledWith({
        where: { parentId: 'parent-123' },
      });
      expect(result).toEqual(mockStudents);
    });
  });

  describe('update', () => {
    it('should update a student', async () => {
      const updateData: StudentUpdateInput = {
        firstName: 'Jane',
        grade: '6',
        updatedAt: new Date()
      };

      const mockUpdatedStudent: Student = {
        id: 'student-123',
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: new Date(),
        grade: '6',
        school: 'Elementary School',
        parentId: 'parent-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.student.update as jest.Mock).mockResolvedValue(mockUpdatedStudent);

      const result = await studentModel.update('student-123', updateData);

      expect(prisma.student.update).toHaveBeenCalledWith({
        where: { id: 'student-123' },
        data: updateData,
      });
      expect(result).toEqual(mockUpdatedStudent);
    });
  });

  describe('delete', () => {
    it('should delete a student', async () => {
      (prisma.student.delete as jest.Mock).mockResolvedValue(null);

      await studentModel.delete('student-123');

      expect(prisma.student.delete).toHaveBeenCalledWith({
        where: { id: 'student-123' },
      });
    });
  });

  describe('addGuardian', () => {
    it('should create guardian and link to student', async () => {
      const guardianData = { firstName: 'Jane', lastName: 'Doe' };
      const guardian = { id: 'g1', ...guardianData };
      (prisma.guardian.create as jest.Mock).mockResolvedValue(guardian);
      (prisma.studentGuardian.create as jest.Mock).mockResolvedValue({});

      const result = await studentModel.addGuardian('s1', guardianData as any);

      expect(prisma.guardian.create).toHaveBeenCalledWith({ data: guardianData });
      expect(prisma.studentGuardian.create).toHaveBeenCalledWith({ data: { studentId: 's1', guardianId: guardian.id } });
      expect(result).toEqual(guardian);
    });
  });

  describe('removeGuardian', () => {
    it('should delete relation', async () => {
      (prisma.studentGuardian.deleteMany as jest.Mock).mockResolvedValue({});

      await studentModel.removeGuardian('s1', 'g1');

      expect(prisma.studentGuardian.deleteMany).toHaveBeenCalledWith({ where: { studentId: 's1', guardianId: 'g1' } });
    });
  });

  describe('recordAttendance', () => {
    it('should create attendance record', async () => {
      const attendanceData = { status: 'PRESENT', date: new Date() };
      const attendance = { id: 'a1', studentId: 's1', ...attendanceData };
      (prisma.attendance.create as jest.Mock).mockResolvedValue(attendance);

      const result = await studentModel.recordAttendance('s1', attendanceData as any);

      expect(prisma.attendance.create).toHaveBeenCalledWith({ data: { ...attendanceData, studentId: 's1' } });
      expect(result).toEqual(attendance);
    });
  });
});
