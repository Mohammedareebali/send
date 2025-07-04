import { Request, Response } from 'express';
import { VehicleService } from '../../services/vehicle.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  TelemetryRecordDto
} from '../dto/vehicle.dto';
import { VehicleStatus } from '@shared/types/vehicle';
import {
  createSuccessResponse,
  createPaginatedResponse
} from '@send/shared';
import {
  createSuccessResponse,
  createPaginatedResponse
} from '@send/shared';

export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  async createVehicle(req: Request, res: Response): Promise<void> {
    try {
      const vehicle = await this.vehicleService.createVehicle(
        req.body as CreateVehicleDto
      );
      res.status(201).json(createSuccessResponse(vehicle));
    } catch (error) {
      res.status(500).json({ message: 'Error creating vehicle', error });
    }
  }

  async updateVehicle(req: Request, res: Response): Promise<void> {
    try {
      const vehicle = await this.vehicleService.updateVehicle(
        req.params.id,
        req.body as UpdateVehicleDto
      );
      if (!vehicle) {
        res.status(404).json({ message: 'Vehicle not found' });
        return;
      }
      res.json(createSuccessResponse(vehicle));
    } catch (error) {
      res.status(500).json({ message: 'Error updating vehicle', error });
    }
  }

  async getVehicle(req: Request, res: Response): Promise<void> {
    try {
      const vehicle = await this.vehicleService.getVehicleById(req.params.id);
      if (!vehicle) {
        res.status(404).json({ message: 'Vehicle not found' });
        return;
      }
      res.json(createSuccessResponse(vehicle));
    } catch (error) {
      res.status(500).json({ message: 'Error getting vehicle', error });
    }
  }

  async getVehicles(req: Request, res: Response): Promise<void> {
    try {
      const { vehicles, total } = await this.vehicleService.getAllVehicles(req.query);
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      res.json(createPaginatedResponse(vehicles, total, page, limit));
    } catch (error) {
      res.status(500).json({ message: 'Error getting vehicles', error });
    }
  }

  async deleteVehicle(req: Request, res: Response): Promise<void> {
    try {
      const success = await this.vehicleService.deleteVehicle(req.params.id);
      if (!success) {
        res.status(404).json({ message: 'Vehicle not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting vehicle', error });
    }
  }

  async updateVehicleStatus(req: Request, res: Response): Promise<void> {
    try {
      const vehicle = await this.vehicleService.updateVehicle(req.params.id, {
        status: req.body.status
      });
      res.json(createSuccessResponse(vehicle));
    } catch (error) {
      res.status(500).json({ message: 'Error updating vehicle status', error });
    }
  }

  async assignVehicleToRun(req: Request, res: Response): Promise<void> {
    try {
      const vehicle = await this.vehicleService.assignVehicleToRun(
        req.params.id,
        req.body.runId
      );
      res.json(createSuccessResponse(vehicle));
    } catch (error) {
      res.status(500).json({ message: 'Error assigning vehicle to run', error });
    }
  }

  async unassignVehicleFromRun(req: Request, res: Response): Promise<void> {
    try {
      const vehicle = await this.vehicleService.unassignVehicleFromRun(req.params.id);
      res.json(createSuccessResponse(vehicle));
    } catch (error) {
      res.status(500).json({ message: 'Error unassigning vehicle from run', error });
    }
  }

  async getAvailableVehicles(req: Request, res: Response): Promise<void> {
    try {
      const vehicles = await this.vehicleService.getAvailableVehicles();
      res.json(createSuccessResponse(vehicles));
    } catch (error) {
      res.status(500).json({ message: 'Error getting available vehicles', error });
    }
  }

  async addMaintenanceRecord(req: Request, res: Response): Promise<void> {
    try {
      await this.vehicleService.addMaintenanceRecord(req.params.id, req.body);
      res.status(201).send();
    } catch (error) {
      res.status(500).json({ message: 'Error adding maintenance record', error });
    }
  }

  async getMaintenanceHistory(req: Request, res: Response): Promise<void> {
    try {
      const history = await this.vehicleService.getMaintenanceHistory(req.params.id);
      res.json(createSuccessResponse(history));
    } catch (error) {
      res.status(500).json({ message: 'Error getting maintenance history', error });
    }
  }

  async addTelemetryRecord(req: Request, res: Response): Promise<void> {
    try {
      const record = await this.vehicleService.addTelemetryRecord(
        req.params.id,
        req.body as TelemetryRecordDto
      );
      res.status(201).json(createSuccessResponse(record));
    } catch (error) {
      res.status(500).json({ message: 'Error adding telemetry record', error });
    }
  }

  async getLatestTelemetry(req: Request, res: Response): Promise<void> {
    try {
      const record = await this.vehicleService.getLatestTelemetry(req.params.id);
      if (!record) {
        res.status(404).json({ message: 'Telemetry not found' });
        return;
      }
      res.json(createSuccessResponse(record));
    } catch (error) {
      res.status(500).json({ message: 'Error getting latest telemetry', error });
    }
  }
}
