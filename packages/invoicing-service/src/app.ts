import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { PrismaClient } from '@prisma/client';
import { InvoiceService } from './services/invoice.service';
import { InvoiceController } from './api/controllers/invoice.controller';
import { createInvoiceRoutes } from './api/routes/invoice.routes';

const prisma = new PrismaClient();
export const invoiceService = new InvoiceService(prisma);
const invoiceController = new InvoiceController(invoiceService);

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(compression());

app.use('/api/invoices', createInvoiceRoutes(invoiceController));

export { app, prisma };
export default app;
