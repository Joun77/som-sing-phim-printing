// Domain TypeScript Contracts aligned strictly with Go Backend Domain Models

export type OrderStatus =
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

export type BindingType =
  | 'NONE'
  | 'PERFECT_HOT_GLUE'
  | 'SADDLE_STITCH'
  | 'WIRE_O'
  | 'PLASTIC_COMB'
  | 'CALENDAR';

export type ProductionStep =
  | 'PENDING'
  | 'PREPRESS_CHECK'
  | 'INNER_PRINTED'
  | 'COVER_PRINTED'
  | 'COVER_LAMINATED'
  | 'PAPER_TRIMMED'
  | 'BOUND'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED';

export interface CustomPrintSpecs {
  size: string;
  paper: string;
  finishing: string;
  lamination?: string;
  binding?: string;
  width_mm?: number;
  height_mm?: number;
  pages?: number;
  grommets_count?: number;
  edge_folding?: boolean;
  ink_coverage_percent?: number;
  ink_coverage_c?: number;
  ink_coverage_m?: number;
  ink_coverage_y?: number;
  ink_coverage_k?: number;
  color_mode?: string;
  additional_notes?: string;
}

export interface CostBreakdown {
  base_material_cost_lak: number;
  ink_usage_cost_lak: number;
  plate_cost_lak: number;
  machine_depreciation_lak: number;
  labor_finishing_cost_lak: number;
  waste_spoilage_cost_lak: number;
  net_internal_cost_lak: number;
  markup_amount_lak: number;
  tax_amount_lak: number;
  total_price_lak: number;
  unit_price_lak: number;
  genuine_ink_baseline_lak?: number;
  compatible_ink_cost_lak?: number;
  ink_savings_lak?: number;
  ink_savings_percent?: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  job_name: string;
  item_name: string;
  quantity: number;
  page_count: number;
  paper_size: string;
  cover_paper_id?: string;
  inner_paper_id?: string;
  cover_file_url?: string;
  inner_file_url?: string;
  binding_type: BindingType;
  spine_width_mm: number;
  current_step: ProductionStep;
  specs: CustomPrintSpecs;
  unit_cost_lak: number;
  unit_price_lak: number;
  total_price_lak: number;
  cost_breakdown?: CostBreakdown;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_no: string;
  tracking_code: string;
  internal_tracking_code?: string;
  courier_name?: string;
  courier_id?: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  total_amount_lak: number;
  deposit_lak: number;
  remaining_lak: number;
  overall_status: OrderStatus;
  delivery_date?: string;
  google_drive_link?: string;
  proof_url?: string;
  proof_approved_at?: string | null;
  proof_rejected_at?: string | null;
  proof_signature_ip?: string;
  proof_rejection_reason?: string;
  stock_deducted_at?: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItemInput {
  job_name: string;
  item_name?: string;
  quantity: number;
  page_count?: number;
  paper_sku?: string;
  paper_cost_per_unit_lak?: number;
  paper_format?: 'sheet' | 'roll';
  sheets_per_pack?: number;
  cuts_per_sheet?: number;
  unfolded_width_mm?: number;
  unfolded_height_mm?: number;
  ink_coverage_percent?: number;
  ink_cost_per_ml_lak?: number;
  use_compatible_ink?: boolean;
  compatible_ink_cost_per_ml_lak?: number;
  lamination_type?: string;
  lamination_cost_lak?: number;
  binding_type?: BindingType;
  binding_cost_lak?: number;
  grommets_count?: number;
  grommet_cost_lak?: number;
  edge_folding?: boolean;
  folding_cost_lak?: number;
  labor_hours?: number;
  labor_rate_per_hour_lak?: number;
  markup_margin_percent?: number;
  tax_rate_percent?: number;
  min_total_price_lak?: number;
  specs?: CustomPrintSpecs;
}

export interface CreateOrderInput {
  order_no?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  deposit_lak?: number;
  delivery_date?: string;
  google_drive_link?: string;
  items: OrderItemInput[];
}

export interface PricingCalculationRequest {
  job_name: string;
  quantity: number;
  paper_sku?: string;
  paper_cost_per_unit_lak?: number;
  paper_format?: string;
  sheets_per_pack?: number;
  cuts_per_sheet?: number;
  unfolded_width_mm?: number;
  unfolded_height_mm?: number;
  page_count?: number;
  ink_coverage_percent?: number;
  ink_cost_per_ml_lak?: number;
  use_compatible_ink?: boolean;
  compatible_ink_cost_per_ml_lak?: number;
  lamination_type?: string;
  lamination_cost_lak?: number;
  binding_type?: string;
  binding_cost_lak?: number;
  grommets_count?: number;
  grommet_cost_lak?: number;
  edge_folding?: boolean;
  folding_cost_lak?: number;
  labor_hours?: number;
  labor_rate_per_hour_lak?: number;
  machine_depreciation_rate_lak?: number;
  plate_cost_per_unit_lak?: number;
  spoilage_rate_percent?: number;
  markup_margin_percent?: number;
  tax_rate_percent?: number;
  min_total_price_lak?: number;
}

export interface PricingResponse {
  job_name: string;
  quantity: number;
  unit_price_lak: number;
  total_price_lak: number;
  cost_breakdown: CostBreakdown;
  currency: string;
}
