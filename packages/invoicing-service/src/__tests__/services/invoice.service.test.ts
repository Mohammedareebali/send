import { InvoiceService } from '../../services/invoice.service';
import { InvoiceStatus } from '@shared/types/invoice';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({}))
}));

describe('InvoiceService', () => {
  let prisma: any;
  let service: InvoiceService;

  beforeEach(() => {
    prisma = {
      invoice: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn()
      }
    };

    service = new InvoiceService(prisma);
  });

  it('creates an invoice', async () => {
    const input = { routeId: 'r1', amount: 100, dueAt: new Date() };
    const invoice = { id: '1', ...input, status: InvoiceStatus.PENDING } as any;
    prisma.invoice.create.mockResolvedValue(invoice);

    const result = await service.createInvoice(input);

    expect(prisma.invoice.create).toHaveBeenCalled();
    expect(result).toEqual(invoice);
  });

  it('updates invoice status', async () => {
    const invoice = { id: '1', status: InvoiceStatus.PAID } as any;
    prisma.invoice.update.mockResolvedValue(invoice);

    const result = await service.updateInvoiceStatus('1', InvoiceStatus.PAID);

    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { status: InvoiceStatus.PAID }
    });
    expect(result).toEqual(invoice);
  });
});
