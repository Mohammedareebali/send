import { SecurityConfigService } from '@shared/security/config';

export const getServiceConfig = () => {
  const securityConfig = SecurityConfigService.getInstance().getConfig();
  return {
    port: parseInt(process.env.PORT || '3002'),
    databaseUrl: process.env.DATABASE_URL ?? '',
    rabbitMQUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
    rabbitMQExchange: process.env.RABBITMQ_EXCHANGE || 'run-events',
    rabbitMQQueue: process.env.RABBITMQ_QUEUE || 'run-notifications',
    mapsApiKey: process.env.MAPS_API_KEY || '',
    security: securityConfig
  };
};
