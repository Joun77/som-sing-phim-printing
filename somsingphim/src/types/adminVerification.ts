// Admin Pre-flight Verification & Override Management Types

export type VerificationStatus =
  | 'AUTO_VERIFIED'
  | 'PENDING_MANUAL_VERIFICATION'
  | 'ADMIN_OVERRIDDEN'
  | 'FAILED';

export interface RawChannelCoverage {
  c: number;        // Cyan % (0 - 100)
  m: number;        // Magenta % (0 - 100)
  y: number;        // Yellow % (0 - 100)
  k: number;        // Black/Key % (0 - 100)
  tac: number;      // Total Area Coverage % (C+M+Y+K, 0 - 400)
  colorSum: number; // C + M + Y %
}

export interface InternalCostAudit {
  paperCost: number;
  inkCost: number;
  bindingCost: number;
  finishingCost: number;
  setupCost: number;
  unitPrice: number;
  totalPrice: number;
  rawC: number;
  rawM: number;
  rawY: number;
  rawK: number;
  rawTAC: number;
  appliedTAC: number;
  isManualOverride: boolean;
  formulaAuditLog: string[];
}

export interface OverrideHistoryLog {
  id: string;
  orderId: string;
  overriddenBy: string;
  overriddenAt: string;
  previousPageCount: number;
  newPageCount: number;
  previousTAC: number;
  newTAC: number;
  previousUnitPrice: number;
  newUnitPrice: number;
  reason: string;
}

export interface OrderDetailVerification {
  id: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  paperType: string;
  bindingType: string;
  quantity: number;
  pageCount: number;
  isDoubleSided: boolean;
  driveUrl: string;
  fileSizeBytes?: number;
  status: VerificationStatus;
  coverage: RawChannelCoverage;
  costAudit: InternalCostAudit;
  overrideHistory: OverrideHistoryLog[];
  scanLogMessage?: string;
}

export interface OverridePricingPayload {
  pageCount: number;
  overrideTAC?: number;
  overrideUnitPrice?: number;
  reason: string;
  approvedBy: string;
}
