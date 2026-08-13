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
