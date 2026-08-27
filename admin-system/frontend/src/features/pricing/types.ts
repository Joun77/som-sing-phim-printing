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
  title?: string;
  customerName: string;
  phone?: string;
  status: string;
  version: number;
  versions: QuotationVersion[];
  items: QuotationItem[];
  rawItems?: any[];
  subtotal: number;
  discountPercent: number;
  grossProfitMargin?: number;
  taxEnabled: boolean;
  taxRate: number;
  taxMode?: string;
  taxOverrideAmount?: number;
  taxAmount: number;
  shippingFee?: number;
  shippingMethod?: string;
  grandTotal: number;
  expiresAt?: string;
  paymentTerms?: string;
  createdAt: string;
  convertedOrderId: string | null;
  notes?: string;
  artworkLink?: string;
}
