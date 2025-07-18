import { Request, Response } from 'express';
import { DriverService } from '../../infra/services/driver.service';
import { Driver, DriverStatus } from '@shared/types/driver';
import { LoggerService, createSuccessResponse } from '@send/shared';
import { createErrorResponse, AppError } from '@send/shared';

const logger = new LoggerService({ serviceName: 'driver-service' });

export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  async createDriver(req: Request, res: Response): Promise<void> {
    try {
      const driver = req.body as Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>;
      const createdDriver = await this.driverService.createDriver(driver);
      res.status(201).json(createSuccessResponse(createdDriver));
    } catch (error) {
      logger.error('Failed to create driver:', error);
      res.status(500).json(createErrorResponse(new AppError('Failed to create driver', 500)));
    }
  }

  async updateDriver(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const driver = req.body as Partial<Driver>;
      const updatedDriver = await this.driverService.updateDriver(id, driver);
      res.status(200).json(createSuccessResponse(updatedDriver));
    } catch (error) {
      logger.error('Failed to update driver:', error);
      res.status(500).json(createErrorResponse(new AppError('Failed to update driver', 500)));
    }
  }

  async getDriver(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const driver = await this.driverService.getDriver(id);
      if (!driver) {
        res.status(404).json(createErrorResponse(new AppError('Driver not found', 404)));
        return;
      }
      res.status(200).json(createSuccessResponse(driver));
    } catch (error) {
      logger.error('Failed to get driver:', error);
      res.status(500).json(createErrorResponse(new AppError('Failed to get driver', 500)));
    }
  }

  async getDrivers(req: Request, res: Response): Promise<void> {
    try {
      const drivers = await this.driverService.getDrivers();
      res.status(200).json(createSuccessResponse(drivers));
    } catch (error) {
      logger.error('Failed to get drivers:', error);
      res.status(500).json(createErrorResponse(new AppError('Failed to get drivers', 500)));
    }
  }

  async deleteDriver(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.driverService.deleteDriver(id);
      res.status(204).send();
    } catch (error) {
      logger.error('Failed to delete driver:', error);
      res.status(500).json(createErrorResponse(new AppError('Failed to delete driver', 500)));
    }
  }

  async updateDriverStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: DriverStatus };
      const updatedDriver = await this.driverService.updateDriverStatus(id, status);
      res.status(200).json(createSuccessResponse(updatedDriver));
    } catch (error) {
      logger.error('Failed to update driver status:', error);
      res.status(500).json(createErrorResponse(new AppError('Failed to update driver status', 500)));
    }
  }

  async assignDriverToRun(req: Request, res: Response): Promise<void> {
    try {
      const { driverId } = req.params;
      const { runId } = req.body as { runId: string };
      const updatedDriver = await this.driverService.assignDriverToRun(driverId, runId);
      res.status(200).json(createSuccessResponse(updatedDriver));
    } catch (error) {
      logger.error('Failed to assign driver to run:', error);
      res.status(500).json(createErrorResponse(new AppError('Failed to assign driver to run', 500)));
    }
  }

  async unassignDriverFromRun(req: Request, res: Response): Promise<void> {
    try {
      const { driverId } = req.params;
      const updatedDriver = await this.driverService.unassignDriverFromRun(driverId);
      res.status(200).json(createSuccessResponse(updatedDriver));
    } catch (error) {
      logger.error('Failed to unassign driver from run:', error);
      res.status(500).json(createErrorResponse(new AppError('Failed to unassign driver from run', 500)));
    }
  }

  async getDriverAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const availability = await this.driverService.getDriverAvailability(id);
      res.status(200).json(createSuccessResponse(availability));
    } catch (error) {
      logger.error('Failed to get driver availability:', error);
      res.status(500).json(createErrorResponse(new AppError('Failed to get driver availability', 500)));
    }
  }

  async updateDriverAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const slots = req.body as { startTime: Date; endTime: Date }[];
      const availability = await this.driverService.updateDriverAvailability(id, slots);
      res.status(200).json(createSuccessResponse(availability));
    } catch (error) {
      logger.error('Failed to update driver availability:', error);
      res.status(500).json(createErrorResponse(new AppError('Failed to update driver availability', 500)));
    }
  }

  async getAvailableDrivers(req: Request, res: Response): Promise<void> {
    try {
      const drivers = await this.driverService.getAvailableDrivers();
      res.status(200).json(createSuccessResponse(drivers));
    } catch (error) {
      logger.error('Failed to get available drivers:', error);
      res.status(500).json(createErrorResponse(new AppError('Failed to get available drivers', 500)));
    }
  }

  async getDriverPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { driverId } = req.params;
      const performance = await this.driverService.getDriverPerformance(driverId);
      res.status(200).json(createSuccessResponse(performance));
    } catch (error) {
      logger.error('Failed to get driver performance:', error);
      res.status(500).json(createErrorResponse(new AppError('Failed to get driver performance', 500)));
    }
  }
}
