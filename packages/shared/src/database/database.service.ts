import { PrismaClient } from '@prisma/client';

export class DatabaseService extends PrismaClient {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async init(): Promise<void> {
    await this.$connect();
  }

  async cleanup(): Promise<void> {
    await this.$disconnect();
  }

  get users() {
    return this.user;
  }

  get apiKeys() {
    return this.apiKey;
  }

  get auditLogs() {
    return this.auditLog;
  }
} 