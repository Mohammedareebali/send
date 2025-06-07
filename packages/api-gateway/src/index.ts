import app from './app';
import { logger } from '@shared/logger';

const port = process.env.PORT || 8080;

app.listen(port, () => {
  logger.info(`API Gateway running on port ${port}`);
});
