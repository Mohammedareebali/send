import { SecurityConfigService } from '@shared/security/config';

export const getServiceConfig = () => {
  const securityConfig = SecurityConfigService.getInstance().getConfig();
  return {
    port: parseInt(process.env.PORT || '3005'),
    databaseUrl: process.env.DATABASE_URL ?? '',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      cacheTTL: parseInt(process.env.CACHE_TTL || '300')
    },
    rabbitMQUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
    security: securityConfig
  };
};
