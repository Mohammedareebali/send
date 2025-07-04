import { prometheus } from '../prometheus';
import { RedisCache } from '../cache/redis';
import { EnvLoader } from '../config/env';

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  apiKeyHeader: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  rateLimitBlockDuration: number;
  corsOrigins: string[];
  allowedMethods: string[];
  maxRequestSize: string;
  enableCompression: boolean;
  enableCaching: boolean;
  cacheDuration: number;
  enableLogging: boolean;
  logLevel: string;
  enableMetrics: boolean;
  metricsPort: number;
  enableTracing: boolean;
  tracingSampleRate: number;
}

export class SecurityConfigService {
  private static instance: SecurityConfigService;
  private cache: RedisCache;
  private config: SecurityConfig;

  private constructor() {
    EnvLoader.load();
    this.cache = RedisCache.getInstance();
    this.config = this.loadConfig();
  }

  public static getInstance(): SecurityConfigService {
    if (!SecurityConfigService.instance) {
      SecurityConfigService.instance = new SecurityConfigService();
    }
    return SecurityConfigService.instance;
  }

  private loadConfig(): SecurityConfig {
    return {
      jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
      apiKeyHeader: process.env.API_KEY_HEADER || 'x-api-key',
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      rateLimitBlockDuration: parseInt(process.env.RATE_LIMIT_BLOCK_DURATION || '3600000'),
      corsOrigins: (process.env.CORS_ORIGINS || '*').split(','),
      allowedMethods: (process.env.ALLOWED_METHODS || 'GET,POST,PUT,DELETE').split(','),
      maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
      enableCompression: process.env.ENABLE_COMPRESSION === 'true',
      enableCaching: process.env.ENABLE_CACHING === 'true',
      cacheDuration: parseInt(process.env.CACHE_DURATION || '3600'),
      enableLogging: process.env.ENABLE_LOGGING === 'true',
      logLevel: process.env.LOG_LEVEL || 'info',
      enableMetrics: process.env.ENABLE_METRICS === 'true',
      metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
      enableTracing: process.env.ENABLE_TRACING === 'true',
      tracingSampleRate: parseFloat(process.env.TRACING_SAMPLE_RATE || '0.1')
    };
  }

  public getConfig(): SecurityConfig {
    return this.config;
  }

  public async updateConfig(newConfig: Partial<SecurityConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.cache.set('security_config', JSON.stringify(this.config), 3600);

    // Export metrics
    const configUpdateCounter = new prometheus.Counter({
      name: 'security_config_updates_total',
      help: 'Total number of security configuration updates'
    });

    configUpdateCounter.inc();
  }

  public async validateConfig(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!this.config.jwtSecret || this.config.jwtSecret === 'your-secret-key') {
      errors.push('JWT secret is not set or is using default value');
    }

    if (this.config.rateLimitMaxRequests <= 0) {
      errors.push('Rate limit max requests must be greater than 0');
    }

    if (this.config.rateLimitWindowMs <= 0) {
      errors.push('Rate limit window must be greater than 0');
    }

    if (this.config.corsOrigins.length === 0) {
      errors.push('CORS origins must not be empty');
    }

    if (this.config.allowedMethods.length === 0) {
      errors.push('Allowed methods must not be empty');
    }

    if (this.config.tracingSampleRate < 0 || this.config.tracingSampleRate > 1) {
      errors.push('Tracing sample rate must be between 0 and 1');
    }

    // Export metrics
    const configValidationCounter = new prometheus.Counter({
      name: 'security_config_validations_total',
      help: 'Total number of security configuration validations',
      labelNames: ['valid']
    });

    configValidationCounter.inc({ valid: errors.length === 0 ? 'true' : 'false' });

    return {
      valid: errors.length === 0,
      errors
    };
  }
} 