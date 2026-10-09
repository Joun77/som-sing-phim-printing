export interface QuotationItem {
  name: string;
  quantity: number;
  unitPrice: number;
  id?: string;
  manualSheetCount?: number;
  manual_sheet_count?: number;
  [key: string]: any;
}

export interface QuotationVersion {
  version: number;
  date: string;
  total: number;
  note: string;
}

export interface Quotation {
  updated_at?: string;
  price_correction_source?: { target_order_id: string; customer_id: string; order_work_fingerprint: string };
  price_correction_target_order_id?: string;
  expected_order_updated_at?: string;
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
  pendingConversionOrderId?: string;
  pendingConversionStatus?: 'AWAITING_MANAGER_APPROVAL' | 'RECONCILIATION_REQUIRED';
  notes?: string;
  artworkLink?: string;
}

export type DimensionUnit = 'inch' | 'cm' | 'mm';

export interface DimensionPreset {
  id: string;
  name: string;
  category: string;
  unit: DimensionUnit;
  width: number;
  height: number;
  width_mm: number;
  height_mm: number;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ShopDefaults {
  default_paper_id?: string;
  default_dimension_unit?: DimensionUnit;
  default_color_mode?: string;
  [key: string]: any;
}
