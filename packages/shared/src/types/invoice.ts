export enum InvoiceStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  routeId: string;
  amount: number;
  status: InvoiceStatus;
  issuedAt: Date;
  dueAt: Date;
  sageInvoiceId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lineItems?: InvoiceLineItem[];
}

export interface InvoiceCreateInput {
  routeId: string;
  amount: number;
  dueAt: Date;
  status?: InvoiceStatus;
  lineItems?: Omit<InvoiceLineItem, 'id' | 'invoiceId' | 'createdAt' | 'updatedAt'>[];
}
