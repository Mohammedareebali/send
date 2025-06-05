import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingService } from 'shared/src/services/logging.service';
import { TracingService } from 'shared/src/services/tracing.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Initialize logging
  const logger = new LoggingService('user-service');
  
  // Initialize tracing
  const tracing = new TracingService('user-service');
  await tracing.start();
  
  // Add request logging middleware
  app.use((req, res, next) => {
    logger.info('Incoming request', {
      method: req.method,
      url: req.url,
      ip: req.ip
    });
    next();
  });

  // Add error handling middleware
  app.use((err, req, res, next) => {
    logger.error('Error occurred', {
      error: err.message,
      stack: err.stack
    });
    next(err);
  });

  await app.listen(3000);
  
  // Handle shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    await tracing.shutdown();
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap(); 