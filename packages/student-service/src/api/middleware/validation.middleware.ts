import { Request, Response, NextFunction } from 'express';
import { StudentCreateInput, StudentUpdateInput } from '@send/shared';

export const validateCreateStudent = (req: Request, res: Response, next: NextFunction) => {
  const data = req.body as StudentCreateInput;
  
  if (!data.firstName || !data.lastName || !data.dateOfBirth || !data.grade || !data.school || !data.parentId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (typeof data.firstName !== 'string' || data.firstName.length < 2) {
    return res.status(400).json({ error: 'Invalid first name' });
  }

  if (typeof data.lastName !== 'string' || data.lastName.length < 2) {
    return res.status(400).json({ error: 'Invalid last name' });
  }

  if (isNaN(new Date(data.dateOfBirth).getTime())) {
    return res.status(400).json({ error: 'Invalid date of birth' });
  }

  next();
};

export const validateUpdateStudent = (req: Request, res: Response, next: NextFunction) => {
  const data = req.body as StudentUpdateInput;
  
  if (data.firstName && (typeof data.firstName !== 'string' || data.firstName.length < 2)) {
    return res.status(400).json({ error: 'Invalid first name' });
  }

  if (data.lastName && (typeof data.lastName !== 'string' || data.lastName.length < 2)) {
    return res.status(400).json({ error: 'Invalid last name' });
  }

  if (data.dateOfBirth && isNaN(new Date(data.dateOfBirth).getTime())) {
    return res.status(400).json({ error: 'Invalid date of birth' });
  }

  next();
}; 