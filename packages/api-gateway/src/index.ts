import app from './app';
import { LoggerService } from '@send/shared';

const logger = new LoggerService({ serviceName: 'api-gateway' });

const port = process.env.PORT || 8080;

app.listen(port, () => {
  logger.info(`API Gateway running on port ${port}`);
});
