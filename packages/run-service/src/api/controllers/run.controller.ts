import { Request, Response, NextFunction } from 'express';
import { RunModel } from '../../data/models/run.model';
import { Run, RunEvent, RunNotification, RunStatus, RunType } from '@shared/types/run';
import { RabbitMQService } from '../../infra/messaging/rabbitmq';
import { RouteService } from '../../infra/services/route.service';
import { ScheduleService } from '../../infra/services/schedule.service';
import { AppError } from '@shared/errors';
import { createSuccessResponse } from '@send/shared';


export class RunController {
  constructor(
    private readonly runModel: RunModel,
    private readonly rabbitMQ: RabbitMQService,
    private readonly routeService: RouteService,
    private readonly scheduleService: ScheduleService
  ) {}

  async createRun(req: Request, res: Response, next: NextFunction) {
    try {
      const runData = req.body;

      // Check for schedule conflicts
      const existingRuns = await this.runModel.findAll({
        driverId: runData.driverId,
        status: RunStatus.PENDING
      });

      const hasConflict = await this.scheduleService.checkForConflicts(runData, existingRuns);
      if (hasConflict) {
        throw new AppError('Schedule conflict detected', 400);
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

      res.status(201).json({ run });
    } catch (error) {
      next(error);
    }
  }

  async updateRun(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // If locations are updated, re-optimize route
      if (updates.pickupLocation || updates.dropoffLocation) {
        const existingRun = await this.runModel.findById(id);
        if (!existingRun) {
          throw new AppError('Run not found', 404);
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
      next(error);
    }
  }

  async cancelRun(req: Request, res: Response, next: NextFunction) {
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
      next(error);
    }
  }

  async completeRun(req: Request, res: Response, next: NextFunction) {
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
      next(error);
    }
  }

  async getRun(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const run = await this.runModel.findById(id);
      if (!run) {
        throw new AppError('Run not found', 404);
      }
      res.json(createSuccessResponse({ run }));
    } catch (error) {
      next(error);
    }
  }

  async getAllRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, type, driverId } = req.query;
      const runs = await this.runModel.findAll({
        status: status as RunStatus,
        type: type as RunType,
        driverId: driverId as string
      });
      res.json(createSuccessResponse({ runs }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /dashboard-runs
   * Returns runs with computed fields and expanded details (mocked for now)
   */
  async getDashboardRuns(req: Request, res: Response, next: NextFunction) {
    try {
      // For now, fetch all runs (optionally filter by status/type in future)
      const runs = await this.runModel.findAll();
      // TODO: Fetch driver/PA/student details from other services
      // TODO: Fetch progress/eta/currentLocation from tracking-service
      const dashboardRuns = runs.map(run => ({
        ...run,
        isUnassigned: !run.driverId && !run.paId && run.status === 'PENDING',
        // Mocked tracking fields for now
        progress: Math.floor(Math.random() * 100),
        eta: new Date(Date.now() + 30 * 60000).toISOString(),
        currentLocation: {
          lat: 51.5074,
          lng: -0.1278,
          address: 'Mocked Location'
        },
        // Mocked expanded details
        driver: run.driverId ? { id: run.driverId, name: 'Driver Name' } : null,
        pa: run.paId ? { id: run.paId, name: 'PA Name' } : null,
        students: Array.isArray(run.studentIds) ? run.studentIds.map(id => ({ id, name: 'Student Name' })) : []
      }));
      res.json(createSuccessResponse({ runs: dashboardRuns }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /runs/bulk
   * Accepts an array of run objects and creates them in bulk
   */
  async bulkCreateRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const runsData = req.body;
      if (!Array.isArray(runsData)) {
        return res.status(400).json({ error: 'Request body must be an array of runs' });
      }
      // TODO: Validate each run object
      const createdRuns = [];
      for (const runData of runsData) {
        // You may want to add validation and error handling per run
        const run = await this.runModel.create(runData);
        createdRuns.push(run);
      }
      res.status(201).json(createSuccessResponse({ runs: createdRuns }));
    } catch (error) {
      next(error);
    }
  }
}
