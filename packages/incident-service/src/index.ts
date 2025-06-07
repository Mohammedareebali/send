import { app, rabbitMQ, prisma, logger as loggerService } from './app';
import { logger } from '@shared/logger';

const port = process.env.PORT || 3010;

async function start() {
  try {
    await rabbitMQ.connect();
    app.listen(port, () => {
      logger.info(`Incident service running on port ${port}`);
    });
  } catch (err) {
    loggerService.error('Failed to start incident service', { error: err });
    process.exit(1);
  }
}

start();

process.on('SIGTERM', async () => {
  await rabbitMQ.close();
  await prisma.$disconnect();
  process.exit(0);
});
