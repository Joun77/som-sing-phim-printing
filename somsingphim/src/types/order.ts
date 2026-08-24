// Domain TypeScript Contracts aligned strictly with Go Backend Domain Models (backend/internal/domain/)

export type OrderStatus =
  | 'QUOTATION'
  | 'PENDING_PAYMENT'
  | 'ORDER_CREATED'
  | 'FILE_CONFIRMED'
  | 'IN_PRODUCTION'
  | 'COMPLETED'
  | 'CANCELLED';

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
  finishing?: string;
  lamination?: string;
  binding?: string;
  width_mm?: number | string;
  height_mm?: number | string;
  width_cm?: number;
  height_cm?: number;
  pages?: number;
  is_double_sided?: boolean;
  grommets_count?: number;
  edge_folding?: boolean;
  ink_coverage_percent?: number | string;
  ink_coverage_c?: number | string;
  ink_coverage_m?: number | string;
  ink_coverage_y?: number | string;
  ink_coverage_k?: number | string;
  color_mode?: string;
  spoilage_rate_pct?: number | string;
  additional_notes?: string;
}

export type PrintSpecification = CustomPrintSpecs;

export interface CoverageMetrics {
  c: number | string;
  m: number | string;
  y: number | string;
  k: number | string;
  tac: number | string;
}

export interface InternalOrderPricing {
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

export type CostBreakdown = InternalOrderPricing;
export type AdminPricingBreakdown = InternalOrderPricing;

export interface OrderItemCostBreakdown {
  id: string;
  order_item_id: string;
  paper_cost: string | number;
  ink_cost: string | number;
  binding_cost: string | number;
  finishing_cost: string | number;
  unit_price: string | number;
  total_price: string | number;
  raw_c_pct: string | number;
  raw_m_pct: string | number;
  raw_y_pct: string | number;
  raw_k_pct: string | number;
  raw_tac_pct: string | number;
  applied_tac_pct: string | number;
  is_manual_override: boolean;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  previous_status: OrderStatus;
  new_status: OrderStatus;
  reason?: string;
  performed_by?: string;
  created_at: string;
}

export interface SpoilageLog {
  id: string;
  order_id: string;
  order_item_id?: string;
  material_sku: string;
  material_name: string;
  category: string;
  quantity_spoiled: string | number;
  unit: string;
  reason: string;
  cost_impact: string | number;
  recorded_by?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  job_name: string;
  item_name: string;
  quantity: number;
  page_count: number;
  paper_size: string;
  paper_sku?: string;
  binding_type: BindingType;
  spine_width_mm: string | number;
  unit_price: string | number;
  unit_cost: string | number;
  total_price: string | number;
  total_cost: string | number;
  is_manual_override: boolean;
  override_reason?: string;
  override_by?: string;
  specs: CustomPrintSpecs;
  cost_breakdown?: InternalOrderPricing;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  status: OrderStatus;
  total_amount: string | number;
  deposit_amount: string | number;
  remaining_amount: string | number;
  currency: string;
  exchange_rate: string | number;
  google_drive_link?: string;
  proof_url?: string;
  proof_approved_at?: string | null;
  proof_rejected_at?: string | null;
  proof_rejection_reason?: string;
  stock_deducted_at?: string | null;
  delivery_date?: string;
  notes?: string;
  created_by?: string;
  items: OrderItem[];
  status_histories?: OrderStatusHistory[];
  spoilage_logs?: SpoilageLog[];
  created_at: string;
  updated_at: string;
}

export interface ProductPricingTemplate {
  id: string;
  name: string;
  material_id: string;
  baseline_coverage_percent: string | number;
  coverage_surcharge_multiplier: string | number;
  min_order_quantity: number;
  min_total_price: string | number;
  addon_rates: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePricingTemplatePayload {
  name: string;
  material_id: string;
  baseline_coverage_percent?: string | number;
  coverage_surcharge_multiplier?: string | number;
  min_order_quantity?: number;
  min_total_price?: string | number;
  addon_rates?: Record<string, any>;
  is_active?: boolean;
}

export interface UpdatePricingTemplatePayload {
  name?: string;
  material_id?: string;
  baseline_coverage_percent?: string | number;
  coverage_surcharge_multiplier?: string | number;
  min_order_quantity?: number;
  min_total_price?: string | number;
  addon_rates?: Record<string, any>;
  is_active?: boolean;
}

export interface AddonItemBreakdown {
  name: string;
  type: string;
  quantity: string | number;
  unit_price: string | number;
  total_cost: string | number;
}

export interface DynamicPriceBreakdown {
  template_id: string;
  template_name: string;
  material_id: string;
  material_name: string;
  quantity: number;
  min_order_quantity: number;
  area_m2: string | number;
  perimeter_m: string | number;
  base_unit_price: string | number;
  base_material_cost: string | number;
  baseline_coverage_percent: string | number;
  actual_coverage_percent: string | number;
  coverage_delta_percent: string | number;
  coverage_surcharge_multiplier: string | number;
  coverage_surcharge: string | number;
  addon_cost: string | number;
  itemized_addons: AddonItemBreakdown[];
  subtotal: string | number;
  min_total_price: string | number;
  min_price_applied: boolean;
  final_price: string | number;
  final_unit_price: string | number;
}

export interface PricingCalculationRequest {
  job_name: string;
  quantity: number;
  template_id?: string;
  paper_sku?: string;
  paper_cost_per_unit_lak?: number;
  paper_format?: string;
  sheets_per_pack?: number;
  cuts_per_sheet?: number;
  width_cm?: number;
  height_cm?: number;
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

export interface PricingCalculationResponse {
  job_name: string;
  quantity: number;
  unit_price_lak: number;
  total_price_lak: number;
  cost_breakdown: InternalOrderPricing;
  currency: string;
}

export type PricingResponse = PricingCalculationResponse;
