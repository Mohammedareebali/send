import app from './app';
import { PrismaClient } from '@prisma/client';
import { RabbitMQService } from './infra/messaging/rabbitmq';

const prisma = new PrismaClient();
const rabbitMQ = new RabbitMQService();
const port = process.env.PORT || 3002;

// Connect to RabbitMQ
rabbitMQ.connect().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await rabbitMQ.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await rabbitMQ.close();
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Run Service running on port ${port}`);
}); 