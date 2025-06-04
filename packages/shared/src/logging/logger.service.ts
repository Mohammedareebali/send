import { createLogger, format, transports, Logger } from 'winston';
import { TransformableInfo } from 'logform';

export interface LoggerConfig {
  serviceName: string;
  logLevel?: string;
  logFile?: string;
}

export class LoggerService {
  private readonly logger: Logger;

  constructor(config: LoggerConfig) {
    const { serviceName, logLevel = 'info', logFile } = config;

    this.logger = createLogger({
      level: logLevel,
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.metadata(),
        format.json()
      ),
      defaultMeta: { service: serviceName },
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(this.formatLogMessage)
          )
        }),
        ...(logFile ? [new transports.File({ filename: logFile })] : [])
      ]
    });
  }

  private formatLogMessage(info: TransformableInfo): string {
    const { timestamp, level, message, ...meta } = info;
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}] [${meta.service}]: ${message} ${metaString}`;
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  getLogger(): Logger {
    return this.logger;
  }
} 