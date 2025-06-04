import { Request, Response } from 'express';
import { StudentController } from '../../api/controllers/student.controller';
import { StudentModel } from '../../data/models/student.model';
import { RabbitMQService } from '../../infra/messaging/rabbitmq';
import { Student, StudentCreateInput } from '@send/shared';

jest.mock('../../data/models/student.model');
jest.mock('../../infra/messaging/rabbitmq');

describe('StudentController', () => {
  let studentController: StudentController;
  let studentModel: jest.Mocked<StudentModel>;
  let rabbitMQ: jest.Mocked<RabbitMQService>;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    studentModel = new StudentModel({} as any) as jest.Mocked<StudentModel>;
    rabbitMQ = new RabbitMQService() as jest.Mocked<RabbitMQService>;
    studentController = new StudentController(studentModel, rabbitMQ);

    req = {
      body: {},
      params: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
  });

  describe('createStudent', () => {
    it('should create a student and return 201', async () => {
      const now = new Date();
      const studentData: StudentCreateInput = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date(),
        grade: '5',
        school: 'Elementary School',
        parentId: 'parent-123',
        createdAt: now,
        updatedAt: now
      };

      const mockStudent: Student = {
        ...studentData,
        id: 'student-123',
      };

      req.body = studentData;
      studentModel.create.mockResolvedValue(mockStudent);
      rabbitMQ.publishStudentEvent.mockResolvedValue(undefined);

      await studentController.createStudent(req as Request, res as Response);

      expect(studentModel.create).toHaveBeenCalledWith(studentData);
      expect(rabbitMQ.publishStudentEvent).toHaveBeenCalledWith({
        type: 'STUDENT_CREATED',
        studentId: mockStudent.id,
        data: mockStudent,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ student: mockStudent });
    });

    it('should return 500 on error', async () => {
      req.body = {};
      studentModel.create.mockRejectedValue(new Error('Database error'));

      await studentController.createStudent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create student' });
    });
  });

  describe('getStudent', () => {
    it('should return student if found', async () => {
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

      req.params = { id: 'student-123' };
      studentModel.findById.mockResolvedValue(mockStudent);

      await studentController.getStudent(req as Request, res as Response);

      expect(studentModel.findById).toHaveBeenCalledWith('student-123');
      expect(res.json).toHaveBeenCalledWith({ student: mockStudent });
    });

    it('should return 404 if student not found', async () => {
      req.params = { id: 'non-existent-id' };
      studentModel.findById.mockResolvedValue(null);

      await studentController.getStudent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Student not found' });
    });

    it('should return 500 on error', async () => {
      req.params = { id: 'student-123' };
      studentModel.findById.mockRejectedValue(new Error('Database error'));

      await studentController.getStudent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get student' });
    });
  });

  describe('getStudents', () => {
    it('should return all students', async () => {
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

      studentModel.findAll.mockResolvedValue(mockStudents);

      await studentController.getStudents(req as Request, res as Response);

      expect(studentModel.findAll).toHaveBeenCalledWith(undefined);
      expect(res.json).toHaveBeenCalledWith({ students: mockStudents });
    });

    it('should filter students by parentId', async () => {
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

      req.query = { parentId: 'parent-123' };
      studentModel.findAll.mockResolvedValue(mockStudents);

      await studentController.getStudents(req as Request, res as Response);

      expect(studentModel.findAll).toHaveBeenCalledWith({ parentId: 'parent-123' });
      expect(res.json).toHaveBeenCalledWith({ students: mockStudents });
    });

    it('should return 500 on error', async () => {
      studentModel.findAll.mockRejectedValue(new Error('Database error'));

      await studentController.getStudents(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get students' });
    });
  });
}); 