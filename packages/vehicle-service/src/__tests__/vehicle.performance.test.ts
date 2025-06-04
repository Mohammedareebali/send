import { setupTestEnvironment, cleanupTestEnvironment } from '@shared/testing/setup';
import { VehicleService } from '../services/vehicle.service';
import { PrismaClient } from '@prisma/client';
import { VehicleStatus } from '@shared/types';
import { performance } from 'perf_hooks';

describe('Vehicle Service Performance', () => {
  let testSetup: any;
  let prisma: PrismaClient;
  let vehicleService: VehicleService;
  const NUM_VEHICLES = 1000;

  beforeAll(async () => {
    testSetup = await setupTestEnvironment();
    prisma = testSetup.getPrisma();
    vehicleService = new VehicleService(prisma);

    // Create test vehicles
    const vehicles = Array.from({ length: NUM_VEHICLES }, (_, i) => ({
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      licensePlate: `ABC${i.toString().padStart(3, '0')}`,
      status: VehicleStatus.AVAILABLE,
      capacity: 4
    }));

    for (const vehicle of vehicles) {
      await vehicleService.createVehicle(vehicle);
    }
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  it('should handle concurrent requests efficiently', async () => {
    const startTime = performance.now();
    const requests = Array.from({ length: 100 }, () => 
      vehicleService.listVehicles()
    );
    await Promise.all(requests);
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Concurrent requests duration: ${duration}ms`);
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
  });

  it('should cache frequently accessed data', async () => {
    // First request (cache miss)
    const startTime1 = performance.now();
    await vehicleService.listVehicles();
    const duration1 = performance.now() - startTime1;

    // Second request (cache hit)
    const startTime2 = performance.now();
    await vehicleService.listVehicles();
    const duration2 = performance.now() - startTime2;

    console.log(`First request duration: ${duration1}ms`);
    console.log(`Second request duration: ${duration2}ms`);
    
    expect(duration2).toBeLessThan(duration1);
    expect(duration2).toBeLessThan(100); // Should be very fast with cache
  });

  it('should handle bulk operations efficiently', async () => {
    const startTime = performance.now();
    const vehicles = await vehicleService.listVehicles();
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Bulk operation duration: ${duration}ms`);
    expect(duration).toBeLessThan(500); // Should complete within 500ms
    expect(vehicles.length).toBe(NUM_VEHICLES);
  });

  it('should maintain performance under load', async () => {
    const iterations = 10;
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await vehicleService.listVehicles();
      const duration = performance.now() - startTime;
      durations.push(duration);
    }

    const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
    const maxDuration = Math.max(...durations);

    console.log(`Average duration: ${avgDuration}ms`);
    console.log(`Max duration: ${maxDuration}ms`);

    expect(avgDuration).toBeLessThan(200); // Average should be under 200ms
    expect(maxDuration).toBeLessThan(500); // No single request should exceed 500ms
  });
}); 