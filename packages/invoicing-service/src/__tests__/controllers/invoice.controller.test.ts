import request from 'supertest';
import express from 'express';
import { InvoiceController } from '../../api/controllers/invoice.controller';
import { InvoiceService } from '../../services/invoice.service';

describe('InvoiceController', () => {
  let app: express.Application;
  let service: jest.Mocked<InvoiceService>;
  let controller: InvoiceController;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    service = {
      createInvoice: jest.fn(),
      listInvoices: jest.fn(),
      getInvoice: jest.fn(),
      updateInvoiceStatus: jest.fn(),
      sendInvoiceToSage: jest.fn()
    } as any;

    controller = new InvoiceController(service);

    app.post('/invoices', (req, res) => controller.create(req, res));
    app.get('/invoices/:id', (req, res) => controller.getById(req, res));
  });

  it('creates an invoice', async () => {
    const invoice = { id: '1' } as any;
    service.createInvoice.mockResolvedValue(invoice);

    const res = await request(app).post('/invoices').send({});

    expect(res.status).toBe(201);
    expect(res.body).toEqual(invoice);
    expect(service.createInvoice).toHaveBeenCalled();
  });

  it('returns 404 when invoice missing', async () => {
    service.getInvoice.mockResolvedValue(null);

    const res = await request(app).get('/invoices/1');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'AppError', message: 'Invoice not found' }
    });
  });
});
