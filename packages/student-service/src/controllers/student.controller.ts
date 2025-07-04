import { Request, Response } from 'express';
import { StudentModel } from '../data/models/student.model';
import {
  Student,
  StudentCreateInput,
  StudentUpdateInput,
  StudentWhereInput
} from '@shared/types/student';
import { createSuccessResponse } from '@send/shared';


export class StudentController {
  private model: StudentModel;

  constructor(model: StudentModel) {
    this.model = model;
  }

  async createStudent(req: Request, res: Response) {
    try {
      const studentData = req.body as StudentCreateInput;
      const student = await this.model.create(studentData);
      res.status(201).json(createSuccessResponse(student));
    } catch (error) {
      res
        .status(500)
        .json(createErrorResponse(new AppError('Failed to create student', 500)));
    }
  }

  async updateStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentData = req.body as StudentUpdateInput;
      const student = await this.model.update(id, studentData);
      if (!student) {
        return res
          .status(404)
          .json(createErrorResponse(new AppError('Student not found', 404)));
      }
      res.json(createSuccessResponse(student));
    } catch (error) {
      res
        .status(500)
        .json(createErrorResponse(new AppError('Failed to update student', 500)));
    }
  }

  async getStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const student = await this.model.findById(id);
      if (!student) {
        return res
          .status(404)
          .json(createErrorResponse(new AppError('Student not found', 404)));
      }
      res.json(createSuccessResponse(student));
    } catch (error) {
      res
        .status(500)
        .json(createErrorResponse(new AppError('Failed to get student', 500)));
    }
  }

  async getStudentsByParent(req: Request, res: Response) {
    try {
      const { parentId } = req.params;
      const where: StudentWhereInput = { parentId };
      const students = await this.model.findAll(where);
      res.json(createSuccessResponse(students));
    } catch (error) {
      res
        .status(500)
        .json(createErrorResponse(new AppError('Failed to get students', 500)));
    }
  }

  async getAllStudents(req: Request, res: Response) {
    try {
      const students = await this.model.findAll();
      res.json(createSuccessResponse(students));
    } catch (error) {
      res
        .status(500)
        .json(createErrorResponse(new AppError('Failed to get students', 500)));
    }
  }

  async deleteStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.model.delete(id);
      res.status(204).send();
    } catch (error) {
      res
        .status(500)
        .json(createErrorResponse(new AppError('Failed to delete student', 500)));
    }
  }
} 