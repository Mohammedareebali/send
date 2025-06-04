import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const registry = new Registry();

// HTTP Metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [registry],
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});

export const httpErrorsTotal = new Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});

// Service Metrics
export const serviceRequestsTotal = new Counter({
  name: 'service_requests_total',
  help: 'Total number of service requests',
  labelNames: ['service', 'status'],
  registers: [registry],
});

export const serviceRequestDuration = new Histogram({
  name: 'service_request_duration_seconds',
  help: 'Duration of service requests in seconds',
  labelNames: ['service'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [registry],
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['service'],
  registers: [registry],
});

// Circuit Breaker Metrics
export const circuitBreakerState = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Current state of the circuit breaker',
  labelNames: ['service'],
  registers: [registry],
});

export const circuitBreakerFailures = new Counter({
  name: 'circuit_breaker_failures_total',
  help: 'Total number of circuit breaker failures',
  labelNames: ['service'],
  registers: [registry],
});

export const prometheus = {
  registry,
  httpRequestDuration,
  httpRequestsTotal,
  httpErrorsTotal,
  serviceRequestsTotal,
  serviceRequestDuration,
  activeConnections,
  circuitBreakerState,
  circuitBreakerFailures,
  Counter,
  Histogram,
  Gauge
}; 