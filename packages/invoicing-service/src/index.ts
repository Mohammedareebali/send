import { app, prisma } from './app';
import { logger } from '@shared/logger';

const port = process.env.PORT || 3011;

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, () => {
  logger.info(`Invoicing service running on port ${port}`);
});
