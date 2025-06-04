import { PrismaClient } from '@send/shared';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to the test database
  await prisma.$connect();
});

afterAll(async () => {
  // Disconnect from the test database
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up the database before each test
  await prisma.run.deleteMany();
});

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.RABBITMQ_URL = 'amqp://localhost';
process.env.RABBITMQ_EXCHANGE = 'test_exchange';
process.env.RABBITMQ_QUEUE = 'test_queue'; 