import { PrismaClient } from '@prisma/client';
import { RabbitMQService } from '@shared/messaging/rabbitmq.service';
import { Logger } from 'winston';

export class DocumentExpiryWorker {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly rabbit: RabbitMQService,
    private readonly logger: Logger
  ) {}

  async run(): Promise<void> {
    const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const documents = await (this.prisma as any).document.findMany();
    for (const doc of documents) {
      const exp = doc.metadata?.expiryDate ? new Date(doc.metadata.expiryDate) : null;
      if (exp && exp <= soon) {
        await this.rabbit.publishMessage('document.expiring', {
          documentId: doc.id,
          userId: doc.userId,
          expiryDate: exp
        });
        this.logger.info('Document expiring soon', { documentId: doc.id });
      }
    }
  }
}
