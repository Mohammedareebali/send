import { app, prisma, logger } from './app';

const port = process.env.PORT || 3011;

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

app.listen(port, () => {
  logger.info(`Invoicing service running on port ${port}`);
});
