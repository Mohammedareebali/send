import { PrismaClient } from '@prisma/client';
import { logger } from '../services/logging.service';
import { incrementConnections, incrementDisconnections, incrementErrors } from './database.metrics';

export class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
    this.setupEventHandlers();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private setupEventHandlers() {
    this.prisma.$connect().then(() => {
      incrementConnections();
      logger.info('Database connected successfully');
    }).catch((error: unknown) => {
      incrementErrors();
      logger.error('Failed to connect to database:', error);
    });

    this.prisma.$disconnect().then(() => {
      incrementDisconnections();
      logger.info('Database disconnected successfully');
    }).catch((error: unknown) => {
      incrementErrors();
      logger.error('Failed to disconnect from database:', error);
    });

    process.on('SIGINT', async () => {
      try {
        await this.prisma.$disconnect();
        incrementDisconnections();
        logger.info('Database disconnected on SIGINT');
      } catch (error) {
        incrementErrors();
        logger.error('Failed to disconnect database on SIGINT:', error);
      }
      process.exit(0);
    });
  }

  public getPrismaClient(): PrismaClient {
    return this.prisma;
  }
}

export const databaseService = DatabaseService.getInstance(); 