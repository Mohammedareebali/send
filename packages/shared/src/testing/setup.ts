import { PrismaClient } from '@prisma/client';
import { app } from '../app';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export class TestSetup {
  private static instance: TestSetup;
  private prisma: PrismaClient;
  private server!: Server;
  private baseUrl!: string;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): TestSetup {
    if (!TestSetup.instance) {
      TestSetup.instance = new TestSetup();
    }
    return TestSetup.instance;
  }

  public async setupDatabase() {
    // Reset database
    await this.prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
    await this.prisma.$executeRaw`TRUNCATE TABLE "Vehicle" CASCADE`;
    await this.prisma.$executeRaw`TRUNCATE TABLE "Driver" CASCADE`;
    // Add more tables as needed

    // Seed test data
    await this.prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'ADMIN',
        firstName: 'Test',
        lastName: 'User'
      }
    });
  }

  public async startServer() {
    return new Promise<void>((resolve) => {
      this.server = app.listen(0, () => {
        const address = this.server.address() as AddressInfo;
        this.baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getPrisma(): PrismaClient {
    return this.prisma;
  }

  public async cleanup() {
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server.close(() => resolve());
      });
    }
    await this.prisma.$disconnect();
  }
}

export const setupTestEnvironment = async () => {
  const testSetup = TestSetup.getInstance();
  await testSetup.setupDatabase();
  await testSetup.startServer();
  return testSetup;
};

export const cleanupTestEnvironment = async () => {
  const testSetup = TestSetup.getInstance();
  await testSetup.cleanup();
}; 