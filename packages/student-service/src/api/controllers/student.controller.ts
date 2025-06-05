import { Request, Response } from 'express';
import { StudentModel } from '../../data/models/student.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { RabbitMQService } from '../../infra/messaging/rabbitmq';
import { Student, StudentEvent, StudentNotification, StudentCreateInput, StudentUpdateInput } from '@send/shared';

const rabbitMQ = new RabbitMQService();

export class StudentController {
  constructor(
    private studentModel: StudentModel,
    private rabbitMQ: RabbitMQService
  ) {}

  async createStudent(req: Request, res: Response) {
    try {
      const data = req.body as StudentCreateInput;
      const student = await this.studentModel.create(data);

      // Publish student created event
      await this.rabbitMQ.publishStudentEvent({
        type: 'STUDENT_CREATED',
        studentId: student.id,
        data: student
      });

      res.status(201).json({ student });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create student' });
    }
  }

  async updateStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body as StudentUpdateInput;
      const student = await this.studentModel.update(id, data);

      // Publish student updated event
      await this.rabbitMQ.publishStudentEvent({
        type: 'STUDENT_UPDATED',
        studentId: student.id,
        data: student
      });

      res.json({ student });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update student' });
    }
  }

  async getStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const student = await this.studentModel.findById(id);

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      res.json({ student });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get student' });
    }
  }

  async getStudents(req: Request, res: Response) {
    try {
      const { parentId } = req.query;
      const students = await this.studentModel.findAll(
        parentId ? { parentId: parentId as string } : undefined
      );

      res.json({ students });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get students' });
    }
  }

  async deleteStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.studentModel.delete(id);

      // Publish student deleted event
      await this.rabbitMQ.publishStudentEvent({
        type: 'STUDENT_DELETED',
        studentId: id,
        data: null
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete student' });
    }
  }

  async addGuardian(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const guardianData = req.body;
      const guardian = await this.studentModel.addGuardian(id, guardianData);

      await this.rabbitMQ.publishStudentEvent({
        type: 'StudentGuardianAdded',
        studentId: id,
        data: guardian
      });

      res.status(201).json({ guardian });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add guardian' });
    }
  }

  async removeGuardian(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { guardianId } = req.body as { guardianId: string };
      await this.studentModel.removeGuardian(id, guardianId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove guardian' });
    }
  }

  async recordAttendance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const attendanceData = req.body;
      const attendance = await this.studentModel.recordAttendance(id, attendanceData);

      await this.rabbitMQ.publishStudentEvent({
        type: 'StudentAttendanceRecorded',
        studentId: id,
        data: attendance
      });

      res.status(201).json({ attendance });
    } catch (error) {
      res.status(500).json({ error: 'Failed to record attendance' });
    }
  }
}
