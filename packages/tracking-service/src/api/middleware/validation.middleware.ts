import { Request, Response, NextFunction } from 'express';
import { Location } from '@shared/types/tracking';

export function validateLocation(req: Request, res: Response, next: NextFunction): void {
  const location = req.body as Location;

  if (!location || typeof location !== 'object') {
    res.status(400).json({ error: 'Invalid location data' });
    return;
  }

  if (typeof location.latitude !== 'number' || location.latitude < -90 || location.latitude > 90) {
    res.status(400).json({ error: 'Invalid latitude' });
    return;
  }

  if (typeof location.longitude !== 'number' || location.longitude < -180 || location.longitude > 180) {
    res.status(400).json({ error: 'Invalid longitude' });
    return;
  }

  if (location.accuracy !== undefined && (typeof location.accuracy !== 'number' || location.accuracy < 0)) {
    res.status(400).json({ error: 'Invalid accuracy' });
    return;
  }

  if (location.speed !== undefined && (typeof location.speed !== 'number' || location.speed < 0)) {
    res.status(400).json({ error: 'Invalid speed' });
    return;
  }

  if (location.heading !== undefined && (typeof location.heading !== 'number' || location.heading < 0 || location.heading > 360)) {
    res.status(400).json({ error: 'Invalid heading' });
    return;
  }

  if (!(location.timestamp instanceof Date) && isNaN(Date.parse(location.timestamp as string))) {
    res.status(400).json({ error: 'Invalid timestamp' });
    return;
  }

  next();
} 