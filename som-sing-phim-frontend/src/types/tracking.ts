// Public Customer-Facing Order Tracking Domain Types
// Strictly masks all internal costs (ink margins, operational overhead)

export type OrderLifecycleStatus =
  | 'QUOTATION'
  | 'PENDING_PAYMENT'
  | 'PENDING_SLIP_CHECK'
  | 'PAID_PREPRESS'
  | 'ORDER_CREATED'
  | 'PREPRESS_CHECK'
  | 'WAITING_APPROVAL'
  | 'PROOF_REJECTED'
  | 'FILE_CONFIRMED'
  | 'READY_TO_PRINT'
  | 'IN_PRODUCTION'
  | 'POST_PRESS'
  | 'FINISHING'
  | 'SHIPPED'
  | 'READY_FOR_DELIVERY'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REQUIRES_MANAGER_APPROVAL';

export type LanguageToken = 'lo' | 'th' | 'en';

export interface TimelineStepItem {
  status: OrderLifecycleStatus;
  labelLao: string;
  labelThai: string;
  labelEn: string;
  descLao: string;
  descThai: string;
  descEn: string;
  timestamp?: number;
}

export interface PublicPrintSpecs {
  size: string;
  paper: string;
  finishing: string;
  lamination?: string;
  binding?: string;
  width_mm?: number;
  height_mm?: number;
  width_cm?: number;
  height_cm?: number;
  pages?: number;
  grommets_count?: number;
  edge_folding?: boolean;
  color_mode?: string;
  additional_notes?: string;
}

export interface PublicOrderItem {
  id: string;
  job_name: string;
  item_name: string;
  quantity: number;
  page_count: number;
  paper_size: string;
  binding_type: string;
  current_step: string;
  specs: PublicPrintSpecs;
  unit_price_lak: number;
  total_price_lak: number;
}

export interface TimelineEntry {
  status: string;
  label: string;
  timestamp: number;
}

export interface CustomerTrackingOrder {
  order_id: string;
  order_no: string;
  tracking_code: string;
  customer_name: string;
  customer_phone?: string;
  overall_status: OrderLifecycleStatus;
  status_text: string;
  total_amount_lak: number;
  deposit_lak: number;
  remaining_lak: number;
  currency: string;
  courier_name?: string;
  shipping_tracking_number?: string;
  proof_url?: string;
  proof_approved_at?: string | null;
  proof_rejected_at?: string | null;
  proof_rejection_reason?: string;
  google_drive_link?: string;
  timeline: TimelineEntry[];
  items: PublicOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface TrackingApiResponse {
  status: 'success' | 'error';
  message?: string;
  data?: CustomerTrackingOrder;
}
