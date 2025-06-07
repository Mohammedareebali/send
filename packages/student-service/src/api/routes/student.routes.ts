import { Router, Request, Response, RequestHandler } from 'express';
import { StudentModel } from '../../data/models/student.model';
import { StudentCreateInput, StudentUpdateInput } from '@send/shared';
import { authenticate } from '@send/shared/security/auth';

const router = Router();
const studentModel = StudentModel.getInstance();

// Create a new student
router.post('/', authenticate(), (async (req: Request, res: Response) => {
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
router.get('/', authenticate(), (async (req: Request, res: Response) => {
  try {
    const students = await studentModel.findAll({ parentId: req.user?.id });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get students' });
  }
}) as RequestHandler);

// Get a specific student
router.get('/:id', authenticate(), (async (req: Request, res: Response) => {
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
router.put('/:id', authenticate(), (async (req: Request, res: Response) => {
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
router.delete('/:id', authenticate(), (async (req: Request, res: Response) => {
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

// Add a guardian to a student
router.post('/:id/add-guardian', authenticate(), (async (req: Request, res: Response) => {
  try {
    const guardian = await studentModel.addGuardian(req.params.id, req.body);
    res.status(201).json(guardian);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add guardian' });
  }
}) as RequestHandler);

// Remove a guardian from a student
router.delete('/:id/remove-guardian', authenticate(), (async (req: Request, res: Response) => {
  try {
    await studentModel.removeGuardian(req.params.id, req.body.guardianId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove guardian' });
  }
}) as RequestHandler);

// Record attendance for a student
router.post('/:id/attendance', authenticate(), (async (req: Request, res: Response) => {
  try {
    const attendance = await studentModel.recordAttendance(req.params.id, req.body);
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record attendance' });
  }
}) as RequestHandler);

export default router; 