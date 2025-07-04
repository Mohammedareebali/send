import { Request, Response } from 'express';
import { VehicleService } from '../../services/vehicle.service';
import { CreateVehicleDto, UpdateVehicleDto, TelemetryRecordDto } from '../dto/vehicle.dto';
import { VehicleStatus } from '@shared/types/vehicle';
import { createErrorResponse, AppError } from '@send/shared';

export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  async createVehicle(req: Request, res: Response): Promise<void> {
    try {
      const vehicle = await this.vehicleService.createVehicle(req.body as CreateVehicleDto);
      res.status(201).json(vehicle);
    } catch (error) {
      res
        .status(500)
        .json(createErrorResponse(new AppError('Error creating vehicle', 500)));
    }
  }

  async updateVehicle(req: Request, res: Response): Promise<void> {
    try {
      const vehicle = await this.vehicleService.updateVehicle(req.params.id, req.body as UpdateVehicleDto);
      if (!vehicle) {
        res
          .status(404)
          .json(createErrorResponse(new AppError('Vehicle not found', 404)));
        return;
      }
      res.json(vehicle);
    } catch (error) {
      res
        .status(500)
        .json(createErrorResponse(new AppError('Error updating vehicle', 500)));
    }
  }

  async getVehicle(req: Request, res: Response): Promise<void> {
    try {
      const vehicle = await this.vehicleService.getVehicleById(req.params.id);
      if (!vehicle) {
        res
          .status(404)
          .json(createErrorResponse(new AppError('Vehicle not found', 404)));
        return;
      }
      res.json(vehicle);
    } catch (error) {
      res
        .status(500)
        .json(createErrorResponse(new AppError('Error getting vehicle', 500)));
    }
  }

  async getVehicles(req: Request, res: Response): Promise<void> {
    try {
      const { vehicles, total } = await this.vehicleService.getAllVehicles(req.query);
      res.json({ vehicles, total });
    } catch (error) {
      res
        .status(500)
        .json(createErrorResponse(new AppError('Error getting vehicles', 500)));
    }
  }

  async deleteVehicle(req: Request, res: Response): Promise<void> {
    try {
      const success = await this.vehicleService.deleteVehicle(req.params.id);
      if (!success) {
        res
          .status(404)
          .json(createErrorResponse(new AppError('Vehicle not found', 404)));
        return;
      }
      res.status(204).send();
    } catch (error) {
      res
        .status(500)
        .json(createErrorResponse(new AppError('Error deleting vehicle', 500)));
    }
  }

  async updateVehicleStatus(req: Request, res: Response): Promise<void> {
    try {
      const vehicle = await this.vehicleService.updateVehicle(req.params.id, { status: req.body.status });
      res.json(vehicle);
    } catch (error) {
      res
        .status(500)
        .json(
          createErrorResponse(new AppError('Error updating vehicle status', 500))
        );
    }
  }

  async assignVehicleToRun(req: Request, res: Response): Promise<void> {
    try {
      const vehicle = await this.vehicleService.assignVehicleToRun(req.params.id, req.body.runId);
      res.json(vehicle);
    } catch (error) {
      res
        .status(500)
        .json(
          createErrorResponse(new AppError('Error assigning vehicle to run', 500))
        );
    }
  }

  async unassignVehicleFromRun(req: Request, res: Response): Promise<void> {
    try {
      const vehicle = await this.vehicleService.unassignVehicleFromRun(req.params.id);
      res.json(vehicle);
    } catch (error) {
      res
        .status(500)
        .json(
          createErrorResponse(
            new AppError('Error unassigning vehicle from run', 500)
          )
        );
    }
  }

  async getAvailableVehicles(req: Request, res: Response): Promise<void> {
    try {
      const vehicles = await this.vehicleService.getAvailableVehicles();
      res.json(vehicles);
    } catch (error) {
      res
        .status(500)
        .json(
          createErrorResponse(new AppError('Error getting available vehicles', 500))
        );
    }
  }

  async addMaintenanceRecord(req: Request, res: Response): Promise<void> {
    try {
      await this.vehicleService.addMaintenanceRecord(req.params.id, req.body);
      res.status(201).send();
    } catch (error) {
      res
        .status(500)
        .json(
          createErrorResponse(new AppError('Error adding maintenance record', 500))
        );
    }
  }

  async getMaintenanceHistory(req: Request, res: Response): Promise<void> {
    try {
      const history = await this.vehicleService.getMaintenanceHistory(req.params.id);
      res.json(history);
    } catch (error) {
      res
        .status(500)
        .json(
          createErrorResponse(new AppError('Error getting maintenance history', 500))
        );
    }
  }

  async addTelemetryRecord(req: Request, res: Response): Promise<void> {
    try {
      const record = await this.vehicleService.addTelemetryRecord(
        req.params.id,
        req.body as TelemetryRecordDto
      );
      res.status(201).json(record);
    } catch (error) {
      res
        .status(500)
        .json(
          createErrorResponse(new AppError('Error adding telemetry record', 500))
        );
    }
  }

  async getLatestTelemetry(req: Request, res: Response): Promise<void> {
    try {
      const record = await this.vehicleService.getLatestTelemetry(req.params.id);
      if (!record) {
        res
          .status(404)
          .json(createErrorResponse(new AppError('Telemetry not found', 404)));
        return;
      }
      res.json(record);
    } catch (error) {
      res
        .status(500)
        .json(
          createErrorResponse(new AppError('Error getting latest telemetry', 500))
        );
    }
  }
}
