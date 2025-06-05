import { app, prisma, rabbitMQ, logger, documentService } from './app';
import { startExpirationJob } from './jobs/expire-documents';

const port = process.env.PORT || 3006;

async function start() {
  try {
    await rabbitMQ.connect();
    startExpirationJob(documentService);
    app.listen(port, () => {
      console.log(`Document service running on port ${port}`);
    });
  } catch (err) {
    logger.error('Failed to start document service', { error: err });
    process.exit(1);
  }
}

start();

process.on('SIGTERM', async () => {
  await rabbitMQ.close();
  await prisma.$disconnect();
  process.exit(0);
});
