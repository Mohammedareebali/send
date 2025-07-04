import { PrismaClient } from '@prisma/client';
import { Channel } from 'amqplib';
import { LoggerService } from '../logging/logger.service';

export interface HealthCheckResult {
  status: 'UP' | 'DOWN';
  checks: {
    database: {
      status: 'UP' | 'DOWN';
      responseTime: number;
    };
    rabbitmq: {
      status: 'UP' | 'DOWN';
      responseTime: number;
    };
    [key: string]: {
      status: 'UP' | 'DOWN';
      responseTime: number;
    };
  };
}

export class HealthCheckService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly rabbitMQChannel: Channel | null,
    private readonly logger: LoggerService,
    private readonly serviceName: string
  ) {}

  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks: HealthCheckResult['checks'] = {
      database: await this.checkDatabase(),
      rabbitmq: await this.checkRabbitMQ()
    };

    return {
      status: Object.values(checks).every(check => check.status === 'UP') ? 'UP' : 'DOWN',
      checks
    };
  }

  private async checkDatabase(): Promise<{ status: 'UP' | 'DOWN'; responseTime: number }> {
    const startTime = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'UP',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      this.logger.error('Database health check failed', { error });
      return {
        status: 'DOWN',
        responseTime: Date.now() - startTime
      };
    }
  }

  private async checkRabbitMQ(): Promise<{ status: 'UP' | 'DOWN'; responseTime: number }> {
    const startTime = Date.now();
    try {
      if (!this.rabbitMQChannel) {
        throw new Error('RabbitMQ channel not initialized');
      }
      await this.rabbitMQChannel.checkQueue('health-check');
      return {
        status: 'UP',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      this.logger.error('RabbitMQ health check failed', { error });
      return {
        status: 'DOWN',
        responseTime: Date.now() - startTime
      };
    }
  }
} 