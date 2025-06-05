import { PrismaClient } from '@send/shared';

const prisma = new PrismaClient();
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/test';

beforeAll(async () => {
  try {
    await prisma.$connect();
  } catch (e) {
    // ignore database connection errors in tests
  }
});

afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch (e) {
    // ignore
  }
});

beforeEach(async () => {
  // Clean up the database before each test
  try {
    await prisma.run.deleteMany();
  } catch (e) {
    // ignore
  }
});

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.RABBITMQ_URL = 'amqp://localhost';
process.env.RABBITMQ_EXCHANGE = 'test_exchange';
process.env.RABBITMQ_QUEUE = 'test_queue';

test('setup initialized', () => {
  expect(true).toBe(true);
});
