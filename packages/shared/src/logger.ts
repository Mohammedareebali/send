import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const logOutput = process.env.LOG_OUTPUT || 'console';

const transports: winston.transport[] = [];

if (logOutput === 'file') {
  const logFile = process.env.LOG_FILE || 'app.log';
  transports.push(new winston.transports.File({ filename: logFile }));
} else {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports
});

export { logger };
