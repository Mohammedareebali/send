export enum DocumentType {
  IDENTIFICATION = 'IDENTIFICATION',
  LICENSE = 'LICENSE',
  INSURANCE = 'INSURANCE',
  CONTRACT = 'CONTRACT',
  INVOICE = 'INVOICE',
  OTHER = 'OTHER'
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  VERIFIED = 'VERIFIED',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED'
}

export enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  PENDING_REVIEW = 'PENDING_REVIEW'
}

export interface Document {
  id: string;
  userId: string;
  type: DocumentType;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  complianceStatus: ComplianceStatus;
  metadata: {
    expiryDate?: Date;
    issueDate?: Date;
    documentNumber?: string;
    issuer?: string;
    [key: string]: any;
  };
  ocrData?: Record<string, any>;
  storagePath: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  filename: string;
  storagePath: string;
  changes: string[];
  uploadedBy: string;
  createdAt: Date;
}

export interface ComplianceRule {
  id: string;
  documentType: DocumentType;
  name: string;
  description: string;
  conditions: {
    field: string;
    operator: string;
    value: any;
  }[];
  actions: {
    type: string;
    params: Record<string, any>;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OCRResult {
  id: string;
  documentId: string;
  rawText: string;
  structuredData: Record<string, any>;
  confidence: number;
  processingTime: number;
  createdAt: Date;
}

export interface DocumentAccess {
  id: string;
  documentId: string;
  userId: string;
  permission: 'READ' | 'WRITE' | 'ADMIN';
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
} 