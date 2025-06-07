import { Request, Response } from 'express';
import { RunModel } from '../../data/models/run.model';
import { Run, RunEvent, RunNotification, RunStatus, RunType } from '@shared/types/run';
import { RabbitMQService } from '../../infra/messaging/rabbitmq';
import { RouteService } from '../../infra/services/route.service';
import { ScheduleService } from '../../infra/services/schedule.service';
import { createSuccessResponse, createErrorResponse } from '@shared/responses';
import { AppError } from '@shared/errors';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export class RunController {
  constructor(
    private readonly runModel: RunModel,
    private readonly rabbitMQ: RabbitMQService,
    private readonly routeService: RouteService,
    private readonly scheduleService: ScheduleService
  ) {}

  async createRun(req: Request, res: Response) {
    try {
      const runData = req.body;

      // Check for schedule conflicts
      const existingRuns = await this.runModel.findAll({
        driverId: runData.driverId,
        status: RunStatus.PENDING
      });

      const hasConflict = await this.scheduleService.checkForConflicts(runData, existingRuns);
      if (hasConflict) {
        return res.status(400).json(createErrorResponse(new AppError('Schedule conflict detected', 400)));
      }

      // Optimize route
      const routeInfo = await this.routeService.optimizeRoute(
        runData.pickupLocation,
        runData.dropoffLocation
      );

      // Calculate next occurrence for recurring runs
      const nextOccurrence = await this.scheduleService.calculateNextOccurrence(runData);

      const run = await this.runModel.create({
        ...runData,
        estimatedDistance: routeInfo.distance,
        estimatedDuration: routeInfo.duration,
        optimizedRoute: routeInfo.route,
        trafficConditions: routeInfo.traffic,
        nextOccurrence
      });

      // Publish run created event
      await this.rabbitMQ.publishRunEvent('RUN_CREATED', run);

      // Send notifications
      if (run.driverId) {
        const notification: RunNotification = {
          type: 'ASSIGNMENT',
          data: {
            runId: run.id,
            message: `You have been assigned to a new run starting at ${run.startTime}`
          }
        };
        await this.rabbitMQ.publishNotification(notification);
      }

      res.status(201).json(createSuccessResponse({ run }));
    } catch (error) {
      res.status(500).json(createErrorResponse(error as Error));
    }
  }

  async updateRun(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // If locations are updated, re-optimize route
      if (updates.pickupLocation || updates.dropoffLocation) {
        const existingRun = await this.runModel.findById(id);
        if (!existingRun) {
          return res.status(404).json(createErrorResponse(new AppError('Run not found', 404)));
        }

        const routeInfo = await this.routeService.optimizeRoute(
          updates.pickupLocation || existingRun.pickupLocation,
          updates.dropoffLocation || existingRun.dropoffLocation
        );

        updates.estimatedDistance = routeInfo.distance;
        updates.estimatedDuration = routeInfo.duration;
        updates.optimizedRoute = routeInfo.route;
        updates.trafficConditions = routeInfo.traffic;
      }

      const run = await this.runModel.update(id, updates);

      // Publish run updated event
      await this.rabbitMQ.publishRunEvent('RUN_UPDATED', run);

      // Send notifications
      if (updates.driverId) {
        const notification: RunNotification = {
          type: 'UPDATE',
          data: {
            runId: run.id,
            message: 'Your run assignment has been updated'
          }
        };
        await this.rabbitMQ.publishNotification(notification);
      }

      res.json(createSuccessResponse({ run }));
    } catch (error) {
      res.status(500).json(createErrorResponse(error as Error));
    }
  }

  async cancelRun(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const run = await this.runModel.update(id, { status: RunStatus.CANCELLED });

      // Publish run cancelled event
      await this.rabbitMQ.publishRunEvent('RUN_CANCELLED', run);

      // Send cancellation notifications
      if (run.driverId) {
        const notification: RunNotification = {
          type: 'CANCELLATION',
          data: {
            runId: run.id,
            message: 'Your run has been cancelled'
          }
        };
        await this.rabbitMQ.publishNotification(notification);
      }

      res.json(createSuccessResponse({ run }));
    } catch (error) {
      res.status(500).json(createErrorResponse(error as Error));
    }
  }

  async completeRun(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const run = await this.runModel.update(id, {
        status: RunStatus.COMPLETED,
        endTime: new Date()
      });

      // Publish run completed event
      await this.rabbitMQ.publishRunEvent('RUN_COMPLETED', run);

      res.json(createSuccessResponse({ run }));
    } catch (error) {
      res.status(500).json(createErrorResponse(error as Error));
    }
  }

  async getRun(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const run = await this.runModel.findById(id);
      if (!run) {
        return res.status(404).json(createErrorResponse(new AppError('Run not found', 404)));
      }
      res.json(createSuccessResponse({ run }));
    } catch (error) {
      res.status(500).json(createErrorResponse(error as Error));
    }
  }

  async getAllRuns(req: Request, res: Response) {
    try {
      const { status, type, driverId } = req.query;
      const runs = await this.runModel.findAll({
        status: status as RunStatus,
        type: type as RunType,
        driverId: driverId as string
      });
      res.json(createSuccessResponse({ runs }));
    } catch (error) {
      res.status(500).json(createErrorResponse(error as Error));
    }
  }
}
