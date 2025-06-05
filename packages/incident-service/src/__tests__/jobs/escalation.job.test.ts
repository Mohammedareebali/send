import { startEscalationJob } from '../../jobs/escalation.job';
import { IncidentService } from '../../services/incident.service';
import { RabbitMQService } from '@shared/messaging/rabbitmq.service';
import cron from 'node-cron';

jest.mock('node-cron');

const scheduleMock = cron.schedule as jest.Mock;

describe('startEscalationJob', () => {
  it('schedules escalation checks', () => {
    const service = {
      findUnescalatedHighSeverity: jest.fn().mockResolvedValue([]),
      markEscalated: jest.fn()
    } as unknown as IncidentService;
    const rabbit = { publishMessage: jest.fn() } as unknown as RabbitMQService;

    startEscalationJob(service, rabbit);

    expect(scheduleMock).toHaveBeenCalled();
  });
});
