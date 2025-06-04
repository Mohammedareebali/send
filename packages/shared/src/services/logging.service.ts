import winston from 'winston';
import 'winston-daily-rotate-file';
import { Socket } from 'net';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export class LoggingService {
  private logstashSocket: Socket;

  constructor(private serviceName: string) {
    // Connect to Logstash
    this.logstashSocket = new Socket();
    this.logstashSocket.connect(5000, 'logstash', () => {
      logger.info('Connected to Logstash');
    });

    this.logstashSocket.on('error', (error) => {
      logger.error('Logstash connection error:', error);
    });
  }

  info(message: string, meta?: any) {
    const logData = { message, ...meta, service: this.serviceName };
    logger.info(message, meta);
    this.logstashSocket.write(JSON.stringify(logData) + '\n');
  }

  error(message: string, meta?: any) {
    const logData = { message, ...meta, service: this.serviceName };
    logger.error(message, meta);
    this.logstashSocket.write(JSON.stringify(logData) + '\n');
  }

  warn(message: string, meta?: any) {
    const logData = { message, ...meta, service: this.serviceName };
    logger.warn(message, meta);
    this.logstashSocket.write(JSON.stringify(logData) + '\n');
  }

  debug(message: string, meta?: any) {
    const logData = { message, ...meta, service: this.serviceName };
    logger.debug(message, meta);
    this.logstashSocket.write(JSON.stringify(logData) + '\n');
  }
}

export { logger }; 