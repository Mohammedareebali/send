import { Request, Response, NextFunction } from 'express';
import { VehicleType, VehicleStatus } from '@prisma/client';

export const validateCreateVehicle = (req: Request, res: Response, next: NextFunction) => {
  const { type, make, model, year, licensePlate, status } = req.body;

  if (!type || !Object.values(VehicleType).includes(type)) {
    return res.status(400).json({ error: 'Invalid vehicle type' });
  }

  if (!make || typeof make !== 'string') {
    return res.status(400).json({ error: 'Make is required and must be a string' });
  }

  if (!model || typeof model !== 'string') {
    return res.status(400).json({ error: 'Model is required and must be a string' });
  }

  if (!year || typeof year !== 'number' || year < 1900 || year > new Date().getFullYear()) {
    return res.status(400).json({ error: 'Year is required and must be a valid year' });
  }

  if (!licensePlate || typeof licensePlate !== 'string') {
    return res.status(400).json({ error: 'License plate is required and must be a string' });
  }

  if (status && !Object.values(VehicleStatus).includes(status)) {
    return res.status(400).json({ error: 'Invalid vehicle status' });
  }

  next();
};

export const validateUpdateVehicle = (req: Request, res: Response, next: NextFunction) => {
  const { type, make, model, year, licensePlate, status } = req.body;

  if (type && !Object.values(VehicleType).includes(type)) {
    return res.status(400).json({ error: 'Invalid vehicle type' });
  }

  if (make && typeof make !== 'string') {
    return res.status(400).json({ error: 'Make must be a string' });
  }

  if (model && typeof model !== 'string') {
    return res.status(400).json({ error: 'Model must be a string' });
  }

  if (year && (typeof year !== 'number' || year < 1900 || year > new Date().getFullYear())) {
    return res.status(400).json({ error: 'Year must be a valid year' });
  }

  if (licensePlate && typeof licensePlate !== 'string') {
    return res.status(400).json({ error: 'License plate must be a string' });
  }

  if (status && !Object.values(VehicleStatus).includes(status)) {
    return res.status(400).json({ error: 'Invalid vehicle status' });
  }

  next();
}; 