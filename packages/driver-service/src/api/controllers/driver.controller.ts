import { Request, Response } from 'express';
import { DriverService } from '../../infra/services/driver.service';
import { Driver, DriverStatus } from '@shared/types/driver';

export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  async createDriver(req: Request, res: Response): Promise<void> {
    try {
      const driver = req.body as Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>;
      const createdDriver = await this.driverService.createDriver(driver);
      res.status(201).json(createdDriver);
    } catch (error) {
      console.error('Failed to create driver:', error);
      res.status(500).json({ error: 'Failed to create driver' });
    }
  }

  async updateDriver(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const driver = req.body as Partial<Driver>;
      const updatedDriver = await this.driverService.updateDriver(id, driver);
      res.status(200).json(updatedDriver);
    } catch (error) {
      console.error('Failed to update driver:', error);
      res.status(500).json({ error: 'Failed to update driver' });
    }
  }

  async getDriver(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const driver = await this.driverService.getDriver(id);
      if (!driver) {
        res.status(404).json({ error: 'Driver not found' });
        return;
      }
      res.status(200).json(driver);
    } catch (error) {
      console.error('Failed to get driver:', error);
      res.status(500).json({ error: 'Failed to get driver' });
    }
  }

  async getDrivers(req: Request, res: Response): Promise<void> {
    try {
      const drivers = await this.driverService.getDrivers();
      res.status(200).json(drivers);
    } catch (error) {
      console.error('Failed to get drivers:', error);
      res.status(500).json({ error: 'Failed to get drivers' });
    }
  }

  async deleteDriver(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.driverService.deleteDriver(id);
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete driver:', error);
      res.status(500).json({ error: 'Failed to delete driver' });
    }
  }

  async updateDriverStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: DriverStatus };
      const updatedDriver = await this.driverService.updateDriverStatus(id, status);
      res.status(200).json(updatedDriver);
    } catch (error) {
      console.error('Failed to update driver status:', error);
      res.status(500).json({ error: 'Failed to update driver status' });
    }
  }

  async assignDriverToRun(req: Request, res: Response): Promise<void> {
    try {
      const { driverId } = req.params;
      const { runId } = req.body as { runId: string };
      const updatedDriver = await this.driverService.assignDriverToRun(driverId, runId);
      res.status(200).json(updatedDriver);
    } catch (error) {
      console.error('Failed to assign driver to run:', error);
      res.status(500).json({ error: 'Failed to assign driver to run' });
    }
  }

  async unassignDriverFromRun(req: Request, res: Response): Promise<void> {
    try {
      const { driverId } = req.params;
      const updatedDriver = await this.driverService.unassignDriverFromRun(driverId);
      res.status(200).json(updatedDriver);
    } catch (error) {
      console.error('Failed to unassign driver from run:', error);
      res.status(500).json({ error: 'Failed to unassign driver from run' });
    }
  }

  async getAvailableDrivers(req: Request, res: Response): Promise<void> {
    try {
      const drivers = await this.driverService.getAvailableDrivers();
      res.status(200).json(drivers);
    } catch (error) {
      console.error('Failed to get available drivers:', error);
      res.status(500).json({ error: 'Failed to get available drivers' });
    }
  }

  async getDriverPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { driverId } = req.params;
      const performance = await this.driverService.getDriverPerformance(driverId);
      res.status(200).json(performance);
    } catch (error) {
      console.error('Failed to get driver performance:', error);
      res.status(500).json({ error: 'Failed to get driver performance' });
    }
  }
} 