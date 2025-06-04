import { ScheduleService } from '../../../infra/services/schedule.service';
import { Run, ScheduleType, RunType, RunStatus } from '@shared/types/run';
import { parseISO } from 'date-fns';

describe('ScheduleService', () => {
  let service: ScheduleService;
  const mockRun: Run = {
    id: '1',
    type: RunType.REGULAR,
    status: RunStatus.PENDING,
    startTime: new Date('2024-03-20T10:00:00Z'),
    pickupLocation: { latitude: 0, longitude: 0, address: 'Test' },
    dropoffLocation: { latitude: 0, longitude: 0, address: 'Test' },
    studentIds: ['1'],
    createdAt: new Date(),
    updatedAt: new Date(),
    scheduleType: ScheduleType.ONE_TIME
  };

  beforeEach(() => {
    service = new ScheduleService();
    jest.useFakeTimers().setSystemTime(new Date('2024-03-19T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('calculateNextOccurrence', () => {
    it('should return null for one-time runs', async () => {
      const result = await service.calculateNextOccurrence(mockRun);
      expect(result).toBeNull();
    });

    it('should calculate next daily occurrence', async () => {
      const dailyRun = { ...mockRun, scheduleType: ScheduleType.DAILY };
      const result = await service.calculateNextOccurrence(dailyRun);
      expect(result).toEqual(new Date('2024-03-20T10:00:00Z'));
    });

    it('should calculate next weekly occurrence', async () => {
      const weeklyRun = { ...mockRun, scheduleType: ScheduleType.WEEKLY };
      const result = await service.calculateNextOccurrence(weeklyRun);
      expect(result).toEqual(new Date('2024-03-20T10:00:00Z'));
    });

    it('should calculate next custom occurrence', async () => {
      const customRun = {
        ...mockRun,
        scheduleType: ScheduleType.CUSTOM,
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=10'
      };
      const result = await service.calculateNextOccurrence(customRun);
      expect(result).toEqual(new Date('2024-03-20T10:00:00Z'));
    });
  });

  describe('checkForConflicts', () => {
    it('should detect time conflicts', async () => {
      const existingRuns: Run[] = [
        {
          ...mockRun,
          id: '2',
          startTime: new Date('2024-03-20T09:00:00Z'),
          endTime: new Date('2024-03-20T11:00:00Z')
        }
      ];

      const newRun = {
        ...mockRun,
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T12:00:00Z')
      };

      const result = await service.checkForConflicts(newRun, existingRuns);
      expect(result).toBe(true);
    });

    it('should not detect conflicts for non-overlapping times', async () => {
      const existingRuns: Run[] = [
        {
          ...mockRun,
          id: '2',
          startTime: new Date('2024-03-20T08:00:00Z'),
          endTime: new Date('2024-03-20T09:00:00Z')
        }
      ];

      const newRun = {
        ...mockRun,
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T12:00:00Z')
      };

      const result = await service.checkForConflicts(newRun, existingRuns);
      expect(result).toBe(false);
    });
  });

  describe('generateRecurrenceRule', () => {
    it('should return null for one-time runs', () => {
      const result = service.generateRecurrenceRule(
        ScheduleType.ONE_TIME,
        new Date('2024-03-20T10:00:00Z')
      );
      expect(result).toBeNull();
    });

    it('should generate daily recurrence rule', () => {
      const result = service.generateRecurrenceRule(
        ScheduleType.DAILY,
        new Date('2024-03-20T10:00:00Z'),
        new Date('2024-03-27T10:00:00Z')
      );
      expect(result).toContain('FREQ=DAILY');
    });

    it('should generate weekly recurrence rule', () => {
      const result = service.generateRecurrenceRule(
        ScheduleType.WEEKLY,
        new Date('2024-03-20T10:00:00Z'),
        new Date('2024-04-20T10:00:00Z')
      );
      expect(result).toContain('FREQ=WEEKLY');
    });

    it('should use custom rule when provided', () => {
      const customRule = 'FREQ=WEEKLY;BYDAY=WE,FR;BYHOUR=10';
      const result = service.generateRecurrenceRule(
        ScheduleType.CUSTOM,
        new Date('2024-03-20T10:00:00Z'),
        undefined,
        customRule
      );
      expect(result).toBe(customRule);
    });
  });
}); 