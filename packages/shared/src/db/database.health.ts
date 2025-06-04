import { databaseService } from './database.service';
import { trackQueryDuration } from './database.metrics';

export class DatabaseHealth {
  private static instance: DatabaseHealth;
  private prisma = databaseService.getPrismaClient();

  private constructor() {}

  public static getInstance(): DatabaseHealth {
    if (!DatabaseHealth.instance) {
      DatabaseHealth.instance = new DatabaseHealth();
    }
    return DatabaseHealth.instance;
  }

  public async checkHealth(): Promise<{
    status: 'ok' | 'error';
    details: {
      connected: boolean;
      responseTime: number;
      timestamp: string;
    };
  }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const duration = (Date.now() - start) / 1000;
      trackQueryDuration('health_check', duration);

      return {
        status: 'ok',
        details: {
          connected: true,
          responseTime: duration,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'error',
        details: {
          connected: false,
          responseTime: (Date.now() - start) / 1000,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  public async getPerformanceMetrics(): Promise<{
    queryCount: number;
    averageQueryTime: number;
    errorRate: number;
  }> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          COUNT(*) as query_count,
          AVG(EXTRACT(EPOCH FROM (now() - query_start))) as avg_query_time,
          (SUM(CASE WHEN state = 'error' THEN 1 ELSE 0 END)::float / COUNT(*)) as error_rate
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      const metrics = result as Array<{
        query_count: number;
        avg_query_time: number;
        error_rate: number;
      }>;

      return {
        queryCount: metrics[0].query_count,
        averageQueryTime: metrics[0].avg_query_time,
        errorRate: metrics[0].error_rate
      };
    } catch (error) {
      return {
        queryCount: 0,
        averageQueryTime: 0,
        errorRate: 0
      };
    }
  }
}

export const databaseHealth = DatabaseHealth.getInstance(); 