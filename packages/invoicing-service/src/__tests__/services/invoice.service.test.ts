import { InvoiceService } from '../../services/invoice.service';

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(() => {
    service = new InvoiceService();
  });

  it('creates an invoice and updates status', async () => {
    const invoice = await service.createInvoice({
      routeId: 'r1',
      amount: 20,
      status: 'Issued',
      dueAt: new Date()
    });

    const updated = await service.updateInvoiceStatus(invoice.id, 'Paid');
    expect(updated?.status).toBe('Paid');
  });
});
