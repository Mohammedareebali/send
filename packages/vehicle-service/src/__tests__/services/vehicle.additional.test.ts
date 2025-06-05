import { VehicleService } from '../../services/vehicle.service';
import { VehicleStatus } from '../../types/vehicle';

describe('VehicleService additional methods', () => {
  let service: VehicleService;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn() } as any;
    service = new VehicleService();
    (service as any).prisma = prisma;
    (service as any).redis = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
  });

  it('assignVehicleToRun should update run and status', async () => {
    const expected = {
      id: '1',
      type: 'SEDAN',
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      licensePlate: 'ABC',
      status: VehicleStatus.IN_USE,
      currentRunId: 'run1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.$queryRaw.mockResolvedValue([expected]);
    const result = await service.assignVehicleToRun('1', 'run1');
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('unassignVehicleFromRun should clear run', async () => {
    const expected = {
      id: '1',
      type: 'SEDAN',
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      licensePlate: 'ABC',
      status: VehicleStatus.AVAILABLE,
      currentRunId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.$queryRaw.mockResolvedValue([expected]);
    const result = await service.unassignVehicleFromRun('1');
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('getAvailableVehicles should return vehicles', async () => {
    const vehicles = [{ id: '1' } as any];
    prisma.$queryRaw.mockResolvedValue(vehicles);
    const result = await service.getAvailableVehicles();
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual(vehicles);
  });

  it('addMaintenanceRecord should insert record', async () => {
    const record = {
      id: 'm1',
      vehicleId: '1',
      type: 'OIL',
      description: 'desc',
      cost: 10,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.$queryRaw.mockResolvedValue([record]);
    const result = await service.addMaintenanceRecord('1', {
      type: record.type,
      description: record.description,
      cost: record.cost,
      date: record.date,
    });
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual(record);
  });

  it('getMaintenanceHistory should query records', async () => {
    const records = [{ id: 'm1' }];
    prisma.$queryRaw.mockResolvedValue(records);
    const result = await service.getMaintenanceHistory('1');
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual(records);
  });
});
