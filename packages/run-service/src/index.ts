import app from './app';
import { PrismaClient } from '@prisma/client';
import { RabbitMQService } from './infra/messaging/rabbitmq';
import { logger } from '@shared/logger';

const prisma = new PrismaClient();
const rabbitMQ = new RabbitMQService();
const port = process.env.PORT || 3002;

// Connect to RabbitMQ
rabbitMQ.connect().catch(logger.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await rabbitMQ.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await rabbitMQ.close();
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, () => {
  logger.info(`Run Service running on port ${port}`);
});
