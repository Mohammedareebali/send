import { Request, Response, NextFunction } from 'express';
import { prometheus } from '../prometheus';
import { RedisCache } from '../cache/redis';
import winston from 'winston';
import 'winston-daily-rotate-file';
import { PrismaClient } from '@prisma/client';

export interface AuditLog {
  id?: string;
  timestamp: Date;
  ip: string;
  method: string;
  path: string;
  userId?: string | null;
  statusCode: number;
  userAgent: string;
  requestBody?: any;
  responseBody?: any;
  responseTime: number;
  error?: string | null;
}

export class AuditService {
  private static instance: AuditService;
  private logger: winston.Logger;
  private cache: RedisCache;
  private prisma: PrismaClient;

  private constructor() {
    this.cache = RedisCache.getInstance();
    this.prisma = new PrismaClient();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new (require('winston-daily-rotate-file'))({
          filename: 'logs/audit-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d'
        })
      ]
    });
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  public async logRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    const originalSend = res.send;
    const auditService = this;

    res.send = function (body: any) {
      const responseTime = Date.now() - startTime;
      const auditLog: AuditLog = {
        timestamp: new Date(),
        ip: req.ip || '',
        method: req.method,
        path: req.path,
        userId: (req.user as any)?.id,
        statusCode: res.statusCode,
        userAgent: req.headers['user-agent'] || '',
        requestBody: req.body,
        responseBody: body,
        responseTime
      };

      // Log to file
      auditService.logger.info('Request completed', auditLog);

      // Store in database
      auditService.prisma.auditLog.create({
        data: {
          timestamp: auditLog.timestamp,
          ip: auditLog.ip,
          method: auditLog.method,
          path: auditLog.path,
          userId: auditLog.userId,
          statusCode: auditLog.statusCode,
          userAgent: auditLog.userAgent,
          requestBody: auditLog.requestBody,
          responseBody: auditLog.responseBody,
          responseTime: auditLog.responseTime
        }
      }).catch(error => {
        console.error('Failed to store audit log:', error);
        prometheus.httpRequestsTotal.inc({ 
          method: req.method, 
          route: req.path, 
          status_code: '500' 
        });
      });

      // Track metrics
      prometheus.httpRequestDuration.observe(
        { 
          method: req.method, 
          route: req.path, 
          status_code: res.statusCode.toString() 
        },
        responseTime / 1000
      );

      if (res.statusCode >= 400) {
        prometheus.httpRequestsTotal.inc({ 
          method: req.method, 
          route: req.path, 
          status_code: res.statusCode.toString() 
        });
      }

      return originalSend.call(this, body);
    };

    next();
  }

  public async getAuditLogs(startDate: Date, endDate: Date): Promise<AuditLog[]> {
    try {
      return await this.prisma.auditLog.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      prometheus.httpRequestsTotal.inc({ 
        method: 'GET', 
        route: '/audit/logs', 
        status_code: '500' 
      });
      return [];
    }
  }

  public async searchAuditLogs(query: Partial<AuditLog>): Promise<AuditLog[]> {
    try {
      const where: any = {};
      
      if (query.userId) where.userId = query.userId;
      if (query.method) where.method = query.method;
      if (query.path) where.path = query.path;
      if (query.statusCode) where.statusCode = query.statusCode;
      if (query.ip) where.ip = query.ip;

      return await this.prisma.auditLog.findMany({
        where,
        orderBy: {
          timestamp: 'desc'
        }
      });
    } catch (error) {
      console.error('Failed to search audit logs:', error);
      prometheus.httpRequestsTotal.inc({ 
        method: 'GET', 
        route: '/audit/search', 
        status_code: '500' 
      });
      return [];
    }
  }

  public async cleanupOldLogs(days: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      await this.prisma.auditLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });
    } catch (error) {
      console.error('Failed to cleanup old audit logs:', error);
      prometheus.httpRequestsTotal.inc({ 
        method: 'DELETE', 
        route: '/audit/cleanup', 
        status_code: '500' 
      });
    }
  }
}

// Middleware to log requests
export const auditMiddleware = () => {
  const auditService = AuditService.getInstance();
  return (req: Request, res: Response, next: NextFunction) => {
    auditService.logRequest(req, res, next);
  };
}; 