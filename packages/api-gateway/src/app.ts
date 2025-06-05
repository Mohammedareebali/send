import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticate } from '@send/shared';
import { securityHeaders, rateLimit } from '@send/shared/security/middleware';
import { serviceConfig } from './config';
import { LoggerService } from '@shared/logging/logger.service';
import { CircuitBreakerService } from '@shared/circuit-breaker';

const logger = new LoggerService({
  serviceName: 'api-gateway',
  logLevel: process.env.LOG_LEVEL || 'info'
});

const retryAttempts = parseInt(process.env.PROXY_RETRY_ATTEMPTS || '3', 10);
const retryDelay = parseInt(process.env.PROXY_RETRY_DELAY_MS || '100', 10);

function createResilientProxy(target: string, serviceName: string) {
  const breaker = new CircuitBreakerService(serviceName);
  const proxy = createProxyMiddleware({ target, changeOrigin: true });

  return async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      try {
        await breaker.execute(
          () =>
            new Promise<void>((resolve, reject) => {
              proxy(req, res, err => {
                if (err) reject(err);
                else resolve();
              });
            })
        );
        return;
      } catch (error) {
        logger.warn(`Proxy attempt ${attempt + 1} failed for ${serviceName}`, {
          error
        });
        if (attempt < retryAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          logger.error(`Proxy failed for ${serviceName}`, { error });
          return res.status(502).json({ error: 'Bad gateway' });
        }
      }
    }
    next();
  };
}

const app = express();

app.use(express.json());
app.use(securityHeaders);
app.use(rateLimit('api-gateway'));

// Request/response logging
app.use((req, res, next) => {
  res.on('finish', () => {
    logger.info('Request handled', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      userId: (req as any).user?.id || null
    });
  });
  next();
});

// Apply authentication to all API routes
app.use('/api', authenticate());

// Proxy rules

app.use('/api/auth', createResilientProxy(serviceConfig.userService, 'user-service'));
app.use('/api/users', createResilientProxy(serviceConfig.userService, 'user-service'));
app.use('/api/runs', createResilientProxy(serviceConfig.runService, 'run-service'));
app.use('/api/students', createResilientProxy(serviceConfig.studentService, 'student-service'));
app.use('/api/drivers', createResilientProxy(serviceConfig.driverService, 'driver-service'));
app.use('/api/vehicles', createResilientProxy(serviceConfig.vehicleService, 'vehicle-service'));
app.use('/api/documents', createResilientProxy(serviceConfig.documentService, 'document-service'));
app.use('/api/incidents', createResilientProxy(serviceConfig.incidentService, 'incident-service'));
app.use('/api/invoices', createResilientProxy(serviceConfig.invoicingService, 'invoicing-service'));
app.use('/api/admin', createResilientProxy(serviceConfig.adminService, 'admin-service'));

// Aggregate health check
app.get('/health', async (_req, res) => {
  const services = {
    userService: serviceConfig.userService,
    runService: serviceConfig.runService,
    studentService: serviceConfig.studentService,
    driverService: serviceConfig.driverService,
    vehicleService: serviceConfig.vehicleService,
    documentService: serviceConfig.documentService,
    incidentService: serviceConfig.incidentService,
    invoicingService: serviceConfig.invoicingService,
    adminService: serviceConfig.adminService
  } as const;

  const results: Record<string, any> = {};
  await Promise.all(
    Object.entries(services).map(async ([name, url]) => {
      try {
        const resp = await fetch(`${url}/health`, {
          signal: AbortSignal.timeout(3000)
        });
        results[name] = await resp.json();
      } catch (err) {
        results[name] = { status: 'DOWN' };
      }
    })
  );

  res.status(200).json(results);
});

export default app;
