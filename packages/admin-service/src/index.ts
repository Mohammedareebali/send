import app from './app';
import { logger } from '@shared/logger';

const port = process.env.PORT || 3012;

app.listen(port, () => {
  logger.info(`Admin service running on port ${port}`);
});
