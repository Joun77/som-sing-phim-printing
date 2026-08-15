export interface OrderLotUsed {
  lotId: string;
  qty: number;
  cost: number;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  lotsUsed?: OrderLotUsed[];
}

export interface OrderPreflightVersion {
  url: string;
  version: number;
  uploadedAt: string;
}

export interface OrderPreflight {
  cmyk: string;
  bleed: string;
  resolution: string;
  approvedTimestamp: string | null;
  versions: OrderPreflightVersion[];
}

export interface ActivityLogEntry {
  timestamp: string;
  description: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  date: string;
  items: OrderItem[];
  totalPriceCharged: number;
  depositAmountPaid: number;
  remainingUnpaidBalance: number;
  paymentMethod: string;
  bankName?: string;
  paymentStatus: string;
  paidDateTime: string | null;
  paymentSlipNote?: string;
  paymentSlipUrl?: string;
  status: string;
  artworkLink?: string;
  deliveryMethod?: string;
  notes?: string;
  createdTime: string;
  productionStartTime: string | null;
  productionEndTime: string | null;
  promisedDeliveryDate: string;
  actualDeliveryTime: string | null;
  onTimeStatus: string | null;
  preflight?: OrderPreflight;
  activityLog?: ActivityLogEntry[];
  productionStepsCompleted?: Record<string, boolean>;
  sourceQuotationId?: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  customerName: string;
  courier: string;
  trackingNumber: string;
  dispatchedAt: string;
  status: string;
  deliveredAt?: string;
  podSignature?: string;
  podPhoto?: string;
  notes?: string;
}

export interface PrinterAllocation {
  printer_id: string;
  printer_name: string;
  allocated_pages: number;
  cost_per_page: number; // Depreciation + Ink + Electricity rate per page
  subtotal_cost: number;
}

export interface FinishingItem {
  id: string;
  name: string;
  cost_per_unit: number;
  unit_type: 'sheet' | 'sqm' | 'job';
  selected: boolean;
  total_cost: number;
}

export interface QuotationFormState {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;

  // 1. Quantity First
  target_quantity: number;
  target_width_mm: number;
  target_height_mm: number;

  // 2. Paper Selection from Inventory
  inventory_material_id: string;
  parent_sheet_width_mm: number;
  parent_sheet_height_mm: number;
  cuts_per_parent_sheet: number;
  required_parent_sheets: number;
  paper_spoilage_percent: number;
  total_parent_sheets_fifo: number;

  // 3. Multi-Printer Allocation
  printer_allocations: PrinterAllocation[];

  // 4. Finishing
  finishing_addons: FinishingItem[];

  // 5. Commercials
  markup_margin_percent: number;
  tax_rate_percent: number;
  currency: 'LAK' | 'THB' | 'USD';
}

