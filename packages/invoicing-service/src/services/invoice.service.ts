import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import {
  Invoice,
  InvoiceLineItem,
  InvoiceStatus,
  InvoiceCreateInput
} from '@shared/types/invoice';

export class InvoiceService {
  constructor(private readonly prisma: PrismaClient) {}

  async createInvoice(data: InvoiceCreateInput): Promise<Invoice> {
    const invoice = await this.prisma.invoice.create({
      include: { lineItems: true },
      data: {
        routeId: data.routeId,
        amount: data.amount,
        dueAt: data.dueAt,
        status: data.status ?? InvoiceStatus.PENDING,
        lineItems: data.lineItems
          ? {
              create: data.lineItems.map((li) => ({
                description: li.description,
                quantity: li.quantity,
                unitPrice: li.unitPrice,
                total: li.total
              }))
            }
          : undefined
      }
    });
    return invoice as unknown as Invoice;
  }

  async listInvoices(): Promise<Invoice[]> {
    return (await this.prisma.invoice.findMany({ include: { lineItems: true } })) as unknown as Invoice[];
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    return (await this.prisma.invoice.findUnique({
      where: { id },
      include: { lineItems: true }
    })) as unknown as Invoice | null;
  }

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice | null> {
    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: { status }
    });
    return { ...(invoice as any) } as Invoice;
  }

  private async getSageToken(): Promise<string> {
    const response = await axios.post(
      process.env.SAGE_TOKEN_URL || '',
      'grant_type=client_credentials',
      {
        auth: {
          username: process.env.SAGE_CLIENT_ID || '',
          password: process.env.SAGE_CLIENT_SECRET || ''
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data.access_token;
  }

  async sendInvoiceToSage(id: string): Promise<Invoice | null> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return null;

    const token = await this.getSageToken();
    const response = await axios.post(
      `${process.env.SAGE_API_URL}/invoices`,
      { invoice },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { sageInvoiceId: response.data.id, status: InvoiceStatus.SENT }
    });

    return updated as unknown as Invoice;
  }
}
