import { ConnectionOptions } from 'typeorm';
import { EnvLoader } from '@send/shared';

EnvLoader.load();

interface Config {
  port: number;
  database: ConnectionOptions;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  rabbitMQ: {
    url: string;
    exchange: string;
  };
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'send_transport',
    entities: ['src/data/entities/**/*.ts'],
    migrations: ['src/data/migrations/**/*.ts'],
    synchronize: process.env.NODE_ENV !== 'production',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  rabbitMQ: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost',
    exchange: process.env.RABBITMQ_EXCHANGE || 'send_transport',
  },
}; 