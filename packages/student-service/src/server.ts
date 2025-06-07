import app from './app';
import { PrismaClient } from '@prisma/client';
import { logger } from '@shared/logger';

const prisma = new PrismaClient();
const port = process.env.PORT || 3003;

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(port, () => {
  logger.info(`Student Service listening on port ${port}`);
});
