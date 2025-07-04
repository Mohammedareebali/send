import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { rateLimit } from "@send/shared/security/middleware";
import { securityHeadersMiddleware } from "@send/shared/security/headers";
import { ipRateLimitMiddleware } from "@send/shared/security/ip-rate-limiter";
import {
  databaseService,
  LoggerService,
  HealthCheckService,
} from "@send/shared";
import { InvoiceService } from "./services/invoice.service";
import { InvoiceController } from "./api/controllers/invoice.controller";
import { createInvoiceRoutes } from "./api/routes/invoice.routes";
import { MonitoringService } from "@send/shared";
const logger = new LoggerService({ serviceName: "invoicing-service" });

const prisma = databaseService.getPrismaClient();
const healthCheck = new HealthCheckService(
  prisma,
  null,
  logger.getLogger(),
  "invoicing-service",
);
export const invoiceService = new InvoiceService(prisma);
const invoiceController = new InvoiceController(invoiceService);

const app = express();
app.use(securityHeadersMiddleware());
app.use(ipRateLimitMiddleware());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(rateLimit("invoicing-service"));

app.use("/api/invoices", createInvoiceRoutes(invoiceController));

app.get("/health", async (_req, res) => {
  const health = await healthCheck.checkHealth();
  res.status(health.status === "UP" ? 200 : 503).json(health);
});

const monitoringService = MonitoringService.getInstance();
app.get("/metrics", async (_req, res) => {
  try {
    const metrics = await monitoringService.getMetrics();
    res.set("Content-Type", "text/plain");
    res.send(metrics);
  } catch (error) {
    logger.error("Failed to get metrics:", error);
    res.status(500).send("Failed to get metrics");
  }
});

export { app, prisma, logger };
export default app;
