export interface Document {
  id: string;
  userId: string;
  type: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: string;
  complianceStatus: string;
  metadata: Record<string, any>;
  ocrText?: string;
  ocrConfidence?: number;
  storagePath: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  fileName: string;
  storagePath: string;
  changes: string[];
  uploadedBy: string;
  createdAt: Date;
}

export interface DocumentAccess {
  id: string;
  documentId: string;
  userId: string;
  permission: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface ComplianceRule {
  id: string;
  documentType: string;
  name: string;
  description: string;
  conditions: Record<string, any>;
  actions: Record<string, any>;
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