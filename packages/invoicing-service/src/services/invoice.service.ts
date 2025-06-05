import { v4 as uuidv4 } from 'uuid';

export interface Invoice {
  id: string;
  routeId: string;
  amount: number;
  status: string;
  issuedAt: Date;
  dueAt: Date;
}

export class InvoiceService {
  private invoices: Invoice[] = [];

  async createInvoice(data: Omit<Invoice, 'id' | 'issuedAt'>): Promise<Invoice> {
    const invoice: Invoice = {
      ...data,
      id: uuidv4(),
      issuedAt: new Date(),
    };
    this.invoices.push(invoice);
    return invoice;
  }

  async listInvoices(): Promise<Invoice[]> {
    return this.invoices;
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.find((i) => i.id === id);
  }

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;
    invoice.status = status;
    return invoice;
  }
}
