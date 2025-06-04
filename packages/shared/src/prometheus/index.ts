import { Counter, Histogram, Gauge, Summary } from 'prom-client';
import { Request, Response } from 'express';
import { collectDefaultMetrics } from 'prom-client';
import { registry } from '../prometheus';
collectDefaultMetrics(); 



// HTTP request duration histogram
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['service', 'route', 'method', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});
// HTTP request size summary
export const httpRequestSize = new Summary({
  name: 'http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['service', 'route', 'method']
});

// HTTP response size summary
export const httpResponseSize = new Summary({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['service', 'route', 'method', 'status_code']
});

// Active connections gauge
export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Error counter
export const errorCounter = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'code']
});

// Custom metrics middleware
export const metricsMiddleware = (req: Request, res: Response, next: Function) => {
  const start = Date.now();
  const service = req.path.split('/')[1] || 'unknown';
  const route = req.path;

  // Increment active connections
  activeConnections.inc();

  // Track request size
  if (req.headers['content-length']) {
    httpRequestSize
      .labels(service, route, req.method)
      .observe(Number(req.headers['content-length']));
  }

  // Track response size and duration on finish
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    // Track duration
    httpRequestDuration
      .labels(service, route, req.method, res.statusCode.toString())
      .observe(duration);

    // Track response size if available
    const contentLength = res.getHeader('content-length');
    if (contentLength) {
      httpResponseSize
        .labels(service, route, req.method, res.statusCode.toString())
        .observe(Number(contentLength));
    }

    // Decrement active connections
    activeConnections.dec();
  });

  // Track errors
  res.on('error', (err) => {
    errorCounter
      .labels('http', res.statusCode.toString())
      .inc();
  });

  next();
};

// Collect default metrics
export const prometheus = {
  httpRequestsTotal,
  Counter,
  Histogram,
  Gauge,
  Summary
};