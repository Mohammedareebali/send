import { Request, Response, NextFunction } from 'express';
import { Driver } from '@shared/types/driver';

export function validateDriver(req: Request, res: Response, next: NextFunction): void {
  const driver = req.body as Partial<Driver>;

  // Required fields for creation
  if (req.method === 'POST') {
    if (!driver.callNumber) {
      res.status(400).json({ error: 'Call number is required' });
      return;
    }
    if (!driver.firstName) {
      res.status(400).json({ error: 'First name is required' });
      return;
    }
    if (!driver.lastName) {
      res.status(400).json({ error: 'Last name is required' });
      return;
    }
    if (!driver.gender) {
      res.status(400).json({ error: 'Gender is required' });
      return;
    }
    if (!driver.dateOfBirth) {
      res.status(400).json({ error: 'Date of birth is required' });
      return;
    }
    if (!driver.addressLine1) {
      res.status(400).json({ error: 'Address line 1 is required' });
      return;
    }
    if (!driver.postcode) {
      res.status(400).json({ error: 'Postcode is required' });
      return;
    }
    if (!driver.phoneNumber) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }
    if (!driver.email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    if (!driver.licenseNumber) {
      res.status(400).json({ error: 'License number is required' });
      return;
    }
    if (!driver.licenseExpiryDate) {
      res.status(400).json({ error: 'License expiry date is required' });
      return;
    }
    if (!driver.dbsNumber) {
      res.status(400).json({ error: 'DBS number is required' });
      return;
    }
    if (!driver.dbsExpiryDate) {
      res.status(400).json({ error: 'DBS expiry date is required' });
      return;
    }
  }

  // Validate email format
  if (driver.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(driver.email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  // Validate phone number format
  if (driver.phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(driver.phoneNumber)) {
    res.status(400).json({ error: 'Invalid phone number format' });
    return;
  }

  // Validate postcode format (UK)
  if (driver.postcode && !/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i.test(driver.postcode)) {
    res.status(400).json({ error: 'Invalid postcode format' });
    return;
  }

  // Validate dates
  if (driver.dateOfBirth && new Date(driver.dateOfBirth) > new Date()) {
    res.status(400).json({ error: 'Date of birth cannot be in the future' });
    return;
  }

  if (driver.licenseExpiryDate && new Date(driver.licenseExpiryDate) < new Date()) {
    res.status(400).json({ error: 'License expiry date cannot be in the past' });
    return;
  }

  if (driver.dbsExpiryDate && new Date(driver.dbsExpiryDate) < new Date()) {
    res.status(400).json({ error: 'DBS expiry date cannot be in the past' });
    return;
  }

  if (driver.medicalExpiryDate && new Date(driver.medicalExpiryDate) < new Date()) {
    res.status(400).json({ error: 'Medical expiry date cannot be in the past' });
    return;
  }

  if (driver.rentalExpiryDate && new Date(driver.rentalExpiryDate) < new Date()) {
    res.status(400).json({ error: 'Rental expiry date cannot be in the past' });
    return;
  }

  next();
} 