import { Request, Response } from 'express';
import { TrackingController } from '../../api/controllers/tracking.controller';
import { TrackingService } from '../../infra/services/tracking.service';

describe('TrackingController - getTrackingStatus', () => {
  let controller: TrackingController;
  let service: jest.Mocked<TrackingService>;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    service = {
      startTracking: jest.fn(),
      updateLocation: jest.fn(),
      stopTracking: jest.fn(),
      getLatestLocation: jest.fn(),
      addClient: jest.fn(),
      removeClient: jest.fn(),
      trackLocation: jest.fn(),
      getTrackingStatus: jest.fn(),
    } as unknown as jest.Mocked<TrackingService>;

    controller = new TrackingController(service);

    req = { params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Partial<Response>;
  });

  it('returns status when run is tracked', async () => {
    req.params = { runId: 'run1' };
    service.getTrackingStatus.mockReturnValue('IN_PROGRESS' as any);

    await controller.getTrackingStatus(req as Request, res as Response);

    expect(service.getTrackingStatus).toHaveBeenCalledWith('run1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'IN_PROGRESS' });
  });

  it('returns 404 when run not found', async () => {
    req.params = { runId: 'missing' };
    service.getTrackingStatus.mockReturnValue(undefined);

    await controller.getTrackingStatus(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'AppError', message: 'Run not found' }
    });
  });

  it('handles errors from service', async () => {
    req.params = { runId: 'run1' };
    (service.getTrackingStatus as jest.Mock).mockImplementation(() => {
      throw new Error('bad');
    });

    await controller.getTrackingStatus(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'AppError', message: 'Failed to get tracking status' }
    });
  });
});
