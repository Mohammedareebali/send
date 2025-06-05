import { PrismaClient } from '@prisma/client';
import { RabbitMQService } from 'shared/src/messaging/rabbitmq.service';
import { LoggingService } from 'shared/src/services/logging.service';

interface Metrics {
  totalRunsToday: number;
  onTimePercentage: number;
  openIncidents: number;
  expiringDocuments: number;
}

export class MetricsService {
  private runDb: PrismaClient;
  private documentDb: PrismaClient;
  private openIncidents = 0;
  private rabbit: RabbitMQService;
  private logger = new LoggingService('admin-service');

  constructor() {
    this.runDb = new PrismaClient({
      datasources: { db: { url: process.env.RUN_DATABASE_URL! } }
    });
    this.documentDb = new PrismaClient({
      datasources: { db: { url: process.env.DOCUMENT_DATABASE_URL! } }
    });

    this.rabbit = new RabbitMQService(
      {
        url: process.env.RABBITMQ_URL || 'amqp://localhost',
        exchange: 'incidents',
        queue: 'admin-metrics'
      },
      this.logger
    );

    this.rabbit.connect().then(() => {
      this.rabbit.consumeMessages(async (msg: any) => {
        if (msg.type === 'INCIDENT_CREATED') this.openIncidents++;
        if (msg.type === 'INCIDENT_CLOSED') this.openIncidents--;
      });
    }).catch((err) => {
      this.logger.error('Failed to connect to RabbitMQ', { error: err });
    });
  }

  async getMetrics(): Promise<Metrics> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const runsResult: any = await this.runDb.$queryRaw`SELECT COUNT(*)::int as count FROM "Run" WHERE "startTime" >= ${startOfDay}`;
    const onTimeResult: any = await this.runDb.$queryRaw`SELECT COUNT(*)::int as count FROM "Run" WHERE "startTime" >= ${startOfDay} AND "actualStartTime" <= "scheduledStartTime"`;
    const expDocsResult: any = await this.documentDb.$queryRaw`SELECT COUNT(*)::int as count FROM "Document" WHERE (metadata->>'expiryDate')::timestamptz < NOW() + interval '30 day' AND status != 'EXPIRED'`;

    const totalRuns = runsResult[0]?.count || 0;
    const onTime = onTimeResult[0]?.count || 0;
    const expiringDocuments = expDocsResult[0]?.count || 0;

    const onTimePercentage = totalRuns ? Math.round((onTime / totalRuns) * 100) : 0;

    return {
      totalRunsToday: totalRuns,
      onTimePercentage,
      openIncidents: this.openIncidents,
      expiringDocuments
    };
  }
}
