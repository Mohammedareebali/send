import app from './app';
import { LoggerService } from '@send/shared';

const logger = new LoggerService({ serviceName: 'admin-service' });

const port = process.env.PORT || 3012;

app.listen(port, () => {
  logger.info(`Admin service running on port ${port}`);
});
