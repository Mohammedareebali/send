import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { securityHeaders, rateLimit } from '@send/shared/security/middleware';
import { ipRateLimitMiddleware } from '@send/shared/security/ip-rate-limiter';
import { PrismaClient } from '@prisma/client';
import { InvoiceService } from './services/invoice.service';
import { InvoiceController } from './api/controllers/invoice.controller';
import { createInvoiceRoutes } from './api/routes/invoice.routes';
import { MonitoringService } from '@send/shared';
import { logger } from '@shared/logger';

const prisma = new PrismaClient();
export const invoiceService = new InvoiceService(prisma);
const invoiceController = new InvoiceController(invoiceService);

const app = express();
app.use(securityHeaders);
app.use(ipRateLimitMiddleware());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(rateLimit('invoicing-service'));

app.use('/api/invoices', createInvoiceRoutes(invoiceController));

const monitoringService = MonitoringService.getInstance();
app.get('/metrics', async (_req, res) => {
  try {
    const metrics = await monitoringService.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('Failed to get metrics:', error);
    res.status(500).send('Failed to get metrics');
  }
});

export { app, prisma };
export default app;
