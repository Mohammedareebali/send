import app from './app';
import { RabbitMQService } from './infra/messaging/rabbitmq';

import { databaseService, LoggerService, HealthCheckService } from '@send/shared';
import { getServiceConfig } from './config';

const prisma = databaseService.getPrismaClient();
const { rabbitMQUrl, port } = getServiceConfig();
const logger = new LoggerService({ serviceName: 'run-service' });
const rabbitMQ = new RabbitMQService(rabbitMQUrl);
const healthCheck = new HealthCheckService(prisma, rabbitMQ.getChannel(), logger, 'run-service');

// Connect to RabbitMQ
rabbitMQ.connect().catch((err) => logger.error('RabbitMQ connection error:', err));

async function shutdown() {
  logger.info('Shutting down gracefully...');
  await rabbitMQ.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

app.listen(port, () => {
  logger.info(`Run Service running on port ${port}`);
});
