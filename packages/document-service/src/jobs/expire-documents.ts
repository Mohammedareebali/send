import cron from 'node-cron';
import { DocumentService } from '../services/document.service';

export function startExpirationJob(documentService: DocumentService): void {
  // run every hour
  cron.schedule('0 * * * *', async () => {
    await documentService.expireOutdatedDocuments();
  });
}
