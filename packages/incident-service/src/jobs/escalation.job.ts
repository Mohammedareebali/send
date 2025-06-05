import cron from 'node-cron';
import { IncidentService } from '../services/incident.service';
import { RabbitMQService } from '@shared/messaging/rabbitmq.service';

export function startEscalationJob(service: IncidentService, rabbit: RabbitMQService): void {
  cron.schedule('*/5 * * * *', async () => {
    const incidents = await service.findUnescalatedHighSeverity();
    for (const incident of incidents) {
      await rabbit.publishMessage('IncidentEscalation', incident);
      await service.markEscalated(incident.id);
    }
  });
}
