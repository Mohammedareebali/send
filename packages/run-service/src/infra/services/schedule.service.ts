import { ScheduleType, Run } from '@shared/types/run';
import { addDays, addWeeks, isBefore, parseISO } from 'date-fns';
import { RRule } from 'rrule';

export class ScheduleService {
  async calculateNextOccurrence(run: Run): Promise<Date | null> {
    if (run.scheduleType === 'ONE_TIME') {
      return null;
    }

    const now = new Date();
    const startTime = parseISO(run.startTime.toString());

    switch (run.scheduleType) {
      case 'DAILY':
        return this.calculateDailyOccurrence(startTime, now);
      case 'WEEKLY':
        return this.calculateWeeklyOccurrence(startTime, now);
      case 'CUSTOM':
        return this.calculateCustomOccurrence(run, now);
      default:
        return null;
    }
  }

  private calculateDailyOccurrence(startTime: Date, now: Date): Date {
    const nextOccurrence = new Date(startTime);
    while (isBefore(nextOccurrence, now)) {
      nextOccurrence.setDate(nextOccurrence.getDate() + 1);
    }
    return nextOccurrence;
  }

  private calculateWeeklyOccurrence(startTime: Date, now: Date): Date {
    const nextOccurrence = new Date(startTime);
    while (isBefore(nextOccurrence, now)) {
      nextOccurrence.setDate(nextOccurrence.getDate() + 7);
    }
    return nextOccurrence;
  }

  private calculateCustomOccurrence(run: Run, now: Date): Date | null {
    if (!run.recurrenceRule) {
      return null;
    }

    try {
      const rule = RRule.fromString(run.recurrenceRule);
      const nextDate = rule.after(now);
      return nextDate;
    } catch (error) {
      console.error('Failed to parse recurrence rule:', error);
      return null;
    }
  }

  async checkForConflicts(run: Run, existingRuns: Run[]): Promise<boolean> {
    const startTime = parseISO(run.startTime.toString());
    const endTime = run.endTime ? parseISO(run.endTime.toString()) : null;

    return existingRuns.some(existingRun => {
      const existingStart = parseISO(existingRun.startTime.toString());
      const existingEnd = existingRun.endTime ? parseISO(existingRun.endTime.toString()) : null;

      // Check for time overlap
      if (endTime && existingEnd) {
        return (
          (startTime >= existingStart && startTime < existingEnd) ||
          (endTime > existingStart && endTime <= existingEnd) ||
          (startTime <= existingStart && endTime >= existingEnd)
        );
      }

      return false;
    });
  }

  generateRecurrenceRule(
    scheduleType: ScheduleType,
    startTime: Date,
    endDate?: Date,
    customRule?: string
  ): string | null {
    if (scheduleType === 'ONE_TIME') {
      return null;
    }

    if (scheduleType === 'CUSTOM' && customRule) {
      return customRule;
    }

    const rule = new RRule({
      freq: scheduleType === 'DAILY' ? RRule.DAILY : RRule.WEEKLY,
      dtstart: startTime,
      until: endDate,
      byweekday: scheduleType === 'WEEKLY' ? [startTime.getDay()] : undefined
    });

    return rule.toString();
  }
} 