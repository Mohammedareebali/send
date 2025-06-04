import * as promClient from 'prom-client';

// Create a Registry
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'send-transport'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Define custom metrics
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['service', 'method', 'status_code'],
  registers: [register]
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['service', 'method', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const circuitBreakerState = new promClient.Gauge({
  name: 'circuit_breaker_state',
  help: 'Current state of the circuit breaker (0: closed, 1: open, 2: half-open)',
  labelNames: ['service'],
  registers: [register]
});

const serviceHealthStatus = new promClient.Gauge({
  name: 'service_health_status',
  help: 'Health status of the service (0: unhealthy, 1: healthy)',
  labelNames: ['service'],
  registers: [register]
});

const serviceRequestDuration = new promClient.Histogram({
  name: 'service_request_duration_seconds',
  help: 'Duration of service requests in seconds',
  labelNames: ['service'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const serviceRequestsTotal = new promClient.Counter({
  name: 'service_requests_total',
  help: 'Total number of service requests',
  labelNames: ['service', 'status'],
  registers: [register]
});

const circuitBreakerFailures = new promClient.Counter({
  name: 'circuit_breaker_failures_total',
  help: 'Total number of circuit breaker failures',
  labelNames: ['service'],
  registers: [register]
});

const rateLimitHitsTotal = new promClient.Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['service'],
  registers: [register]
});

const rateLimitRemaining = new promClient.Gauge({
  name: 'rate_limit_remaining',
  help: 'Number of remaining requests',
  labelNames: ['service'],
  registers: [register]
});

export const prometheus = {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  circuitBreakerState,
  serviceHealthStatus,
  serviceRequestDuration,
  serviceRequestsTotal,
  circuitBreakerFailures,
  rateLimitHitsTotal,
  rateLimitRemaining
}; 