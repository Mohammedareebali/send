import { prometheus } from '../prometheus';

// Initialize metrics
const databaseConnections = new prometheus.Counter({
  name: 'database_connections_total',
  help: 'Total number of database connections',
  registers: [prometheus.registry],
});

const databaseDisconnections = new prometheus.Counter({
  name: 'database_disconnections_total',
  help: 'Total number of database disconnections',
  registers: [prometheus.registry],
});

const databaseErrors = new prometheus.Counter({
  name: 'database_errors_total',
  help: 'Total number of database errors',
  registers: [prometheus.registry],
});

const queryDuration = new prometheus.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [prometheus.registry],
});

const connectionPoolSize = new prometheus.Gauge({
  name: 'database_connection_pool_size',
  help: 'Size of the database connection pool',
  registers: [prometheus.registry],
});

export const initializeMetrics = () => {
  // Initialize metrics
  databaseConnections;
  databaseDisconnections;
  databaseErrors;
  queryDuration;
  connectionPoolSize;
};

export const trackQueryDuration = (operation: string, duration: number) => {
  queryDuration.observe({ operation }, duration);
};

export const setConnectionPoolSize = (size: number) => {
  connectionPoolSize.set(size);
};

export const incrementConnections = () => {
  databaseConnections.inc();
};

export const incrementDisconnections = () => {
  databaseDisconnections.inc();
};

export const incrementErrors = () => {
  databaseErrors.inc();
}; 