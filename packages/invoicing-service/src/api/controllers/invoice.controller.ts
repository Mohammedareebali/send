import { Request, Response } from 'express';
import { InvoiceService } from '../../services/invoice.service';
import { InvoiceStatus } from '@shared/types/invoice';
import { createErrorResponse, AppError } from '@send/shared';

export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const invoice = await this.invoiceService.createInvoice(req.body);
      res.status(201).json(invoice);
    } catch (err) {
      res
        .status(500)
        .json(createErrorResponse(new AppError('Failed to create invoice', 500)));
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    res.json(await this.invoiceService.listInvoices());
  }

  async getById(req: Request, res: Response): Promise<void> {
    const invoice = await this.invoiceService.getInvoice(req.params.id);
    if (!invoice) {
      res
        .status(404)
        .json(createErrorResponse(new AppError('Invoice not found', 404)));
      return;
    }
    res.json(invoice);
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    const invoice = await this.invoiceService.updateInvoiceStatus(
      req.params.id,
      req.body.status as InvoiceStatus
    );
    if (!invoice) {
      res
        .status(404)
        .json(createErrorResponse(new AppError('Invoice not found', 404)));
      return;
    }
    res.json(invoice);
  }

  async send(req: Request, res: Response): Promise<void> {
    const invoice = await this.invoiceService.sendInvoiceToSage(req.params.id);
    if (!invoice) {
      res
        .status(404)
        .json(createErrorResponse(new AppError('Invoice not found', 404)));
      return;
    }
    res.json(invoice);
  }
}
