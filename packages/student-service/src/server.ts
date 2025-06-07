import 'dotenv/config';
import app from './app';
import { databaseService, LoggerService } from '@send/shared';

const prisma = databaseService.getPrismaClient();
const logger = new LoggerService({ serviceName: 'student-service' });
const port = process.env.PORT || 3003;

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
app.listen(port, () => {
  logger.info(`Student Service listening on port ${port}`);
});
