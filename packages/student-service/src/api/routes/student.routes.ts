import { Router, Request, Response, RequestHandler } from 'express';
import { StudentModel } from '../../data/models/student.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { StudentCreateInput, StudentUpdateInput } from '@send/shared';

const router = Router();
const studentModel = StudentModel.getInstance();

// Create a new student
router.post('/', (async (req: AuthRequest, res: Response) => {
  try {
    const studentData: StudentCreateInput = {
      ...req.body,
      parentId: req.user?.id || ''
    };
    const student = await studentModel.create(studentData);
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create student' });
  }
}) as RequestHandler);

// Get all students for the authenticated parent
router.get('/', (async (req: AuthRequest, res: Response) => {
  try {
    const students = await studentModel.findAll({ parentId: req.user?.id });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get students' });
  }
}) as RequestHandler);

// Get a specific student
router.get('/:id', (async (req: AuthRequest, res: Response) => {
  try {
    const student = await studentModel.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get student' });
  }
}) as RequestHandler);

// Update a student
router.put('/:id', (async (req: AuthRequest, res: Response) => {
  try {
    const student = await studentModel.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    if (student.parentId !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized to update this student' });
    }
    const updatedStudent = await studentModel.update(req.params.id, req.body as StudentUpdateInput);
    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update student' });
  }
}) as RequestHandler);

// Delete a student
router.delete('/:id', (async (req: AuthRequest, res: Response) => {
  try {
    const student = await studentModel.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    if (student.parentId !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized to delete this student' });
    }
    await studentModel.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
}) as RequestHandler);

export default router; 