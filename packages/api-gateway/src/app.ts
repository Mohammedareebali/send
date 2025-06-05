import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticate } from '@send/shared';
import { securityHeaders, rateLimit } from '@send/shared/security/middleware';
import { serviceConfig } from './config';

const app = express();

app.use(express.json());
app.use(securityHeaders);
app.use(rateLimit('api-gateway'));

// Apply authentication to all API routes
app.use('/api', authenticate());

// Proxy rules
app.use('/api/auth', createProxyMiddleware({ target: serviceConfig.userService, changeOrigin: true }));
app.use('/api/users', createProxyMiddleware({ target: serviceConfig.userService, changeOrigin: true }));
app.use('/api/runs', createProxyMiddleware({ target: serviceConfig.runService, changeOrigin: true }));
app.use('/api/students', createProxyMiddleware({ target: serviceConfig.studentService, changeOrigin: true }));
app.use('/api/drivers', createProxyMiddleware({ target: serviceConfig.driverService, changeOrigin: true }));
app.use('/api/vehicles', createProxyMiddleware({ target: serviceConfig.vehicleService, changeOrigin: true }));
app.use('/api/documents', createProxyMiddleware({ target: serviceConfig.documentService, changeOrigin: true }));
app.use('/api/incidents', createProxyMiddleware({ target: serviceConfig.incidentService, changeOrigin: true }));
app.use('/api/invoices', createProxyMiddleware({ target: serviceConfig.invoicingService, changeOrigin: true }));
app.use('/api/admin', createProxyMiddleware({ target: serviceConfig.adminService, changeOrigin: true }));

export default app;
