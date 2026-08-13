export interface QuotationItem {
  name: string;
  quantity: number;
  unitPrice: number;
  id?: string;
}

export interface QuotationVersion {
  version: number;
  date: string;
  total: number;
  note: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerName: string;
  phone?: string;
  status: string;
  version: number;
  versions: QuotationVersion[];
  items: QuotationItem[];
  subtotal: number;
  discountPercent: number;
  taxEnabled: boolean;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  expiresAt?: string;
  paymentTerms?: string;
  createdAt: string;
  convertedOrderId: string | null;
  notes?: string;
  artworkLink?: string;
}
