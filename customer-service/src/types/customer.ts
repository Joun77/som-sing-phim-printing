export interface CustomerVIPTier {
  id: string;
  name_lo: string;
  name_en: string;
  discount_percent: number;
  min_spend_lak: number;
  min_orders: number;
  badge_color: string;
  perks: string[];
  sort_order?: number;
  is_active?: boolean;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  province?: string;
  district?: string;
  village?: string;
  branchCode?: string;
  preferredCourier?: string;
  tier?: string;
  tierNameLo?: string;
  discountPercent?: number;
  totalSpentLAK?: number;
  totalOrdersCount?: number;
  perks?: string[];
}

export interface CustomerOrderItem {
  id?: string;
  job_name: string;
  item_name?: string;
  quantity: number;
  paper_size?: string;
  binding_type?: string;
  unit_price_lak?: number;
  total_price_lak?: number;
  specs?: Record<string, unknown>;
}

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  trackingCode: string;
  courierName: string;
  totalAmountLAK: number;
  depositLAK: number;
  status: string;
  createdAt: string;
  items: CustomerOrderItem[];
}
