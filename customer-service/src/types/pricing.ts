// Customer-facing Dynamic Pricing & File Ingestion Types
// Strict absence of raw CMYK/TAC percentages to protect telemetry integrity

export type FileScanStatus =
  | 'QUEUED_SCAN'
  | 'PROCESSING'
  | 'AUTO_VERIFIED'
  | 'PENDING_MANUAL_VERIFICATION'
  | 'FAILED';

export type CalculationBadgeType =
  | 'AUTO_VERIFIED'
  | 'PENDING_VERIFICATION'
  | 'MONO_BLACK'
  | 'STANDARD_CMYK'
  | 'HEAVY_CMYK'
  | 'FALLBACK_TAC'
  | 'MANUAL_OVERRIDE';

export interface ProductOption {
  id: string;
  name: string;
  type: 'paper' | 'binding' | 'finishing';
  pricePerUnit: number;
  description?: string;
  weightGsm?: number;
  disabled?: boolean;
}

export interface CustomerPriceQuote {
  unitPricePerPage: number;
  totalUnitPrice: number;
  quantity: number;
  subtotal: number;
  badge: 'AUTO_VERIFIED' | 'PENDING_VERIFICATION' | CalculationBadgeType;
  pageCount: number;
}

export interface PricingQuoteResponse {
  success: boolean;
  quote?: CustomerPriceQuote;
  error?: string;
}

export interface FileScanJobResponse {
  id: string;
  orderItemId: string;
  driveUrl: string;
  status: FileScanStatus;
  fileSizeBytes?: number;
  pageCount?: number;
  errorMessage?: string;
}

export interface PrintOrderFormValues {
  productId: string;
  paperType: string;
  bindingType: string;
  finishingType: string;
  pageCount: number;
  isDoubleSided: boolean;
  quantity: number;
  driveUrl: string;
}
