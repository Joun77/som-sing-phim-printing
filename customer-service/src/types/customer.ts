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

export interface CustomerAddress {
  id: string;
  label: string; // 'ເຮືອນ', 'ຮ້ານຄ້າ', 'ສາງສິນຄ້າ', etc.
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  village: string;
  addressDetail: string;
  branchCode?: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  avatar_url?: string;
  address?: string;
  province?: string;
  district?: string;
  village?: string;
  branchCode?: string;
  branch_code?: string;
  preferredCourier?: string;
  preferred_courier?: string;
  tier?: string;
  tierNameLo?: string;
  discountPercent?: number;
  discount_percent?: number;
  totalSpentLAK?: number;
  total_spent_lak?: number;
  totalOrdersCount?: number;
  total_orders_count?: number;
  perks?: string[];
  addresses?: CustomerAddress[];
}

export interface CustomerOrderItem {
  id?: string;
  order_id?: string;
  job_name: string;
  item_name?: string;
  quantity: number;
  paper_size?: string;
  binding_type?: string;
  unit_price_lak?: number;
  total_price_lak?: number;
  specs?: Record<string, any>;
  specifications?: Record<string, any>;
}

export interface CustomerOrderSummary {
  id: string;
  orderNo?: string;
  order_no?: string;
  orderNumber?: string;
  order_number?: string;
  trackingCode?: string;
  tracking_code?: string;
  courierName?: string;
  courier_name?: string;
  courierBranch?: string;
  courier_branch?: string;
  totalAmountLAK?: number;
  total_amount_lak?: number;
  total_price?: number;
  depositLAK?: number;
  deposit_lak?: number;
  deposit_amount?: number;
  status: string;
  overall_status?: string;
  createdAt?: string;
  created_at?: string;
  items: CustomerOrderItem[];
}
