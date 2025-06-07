import { app, rabbitMQ, prisma, logger } from './app';

const port = process.env.PORT || 3010;

async function start() {
  try {
    await rabbitMQ.connect();
    app.listen(port, () => {
      logger.info(`Incident service running on port ${port}`);
    });
  } catch (err) {
    logger.error('Failed to start incident service', { error: err });
    process.exit(1);
  }
}

start();

async function shutdown() {
  await rabbitMQ.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
