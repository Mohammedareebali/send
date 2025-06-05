import { app, prisma } from './app';

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
  console.log(`Invoicing service running on port ${port}`);
});
