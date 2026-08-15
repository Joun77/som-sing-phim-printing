export interface PricingCalculationInput {
  job_name?: string;
  quantity: number;
  paper_sku?: string;
  paper_cost_per_unit?: number;
  paper_format?: 'sheet' | 'roll' | string;
  sheets_per_pack?: number;
  paper_roll_price_per_m2?: number;
  setup_cost?: number;
  finishing_cost?: number;
  base_profit_pct?: number;
  ink_coverage_k_percent?: number;
  ink_coverage_cmy_percent?: number;
  ink_cost_k_per_ml?: number;
  ink_cost_cmy_per_ml?: number;
  iso_yield_k?: number;
  iso_yield_cmy?: number;
  machine_price?: number;
  target_total_pages?: number;
  maintenance_cost_per_page?: number;
  maintenance_rate_percent?: number;
  job_width?: number;
  job_height?: number;
  custom_finishing_options?: any[];
  lamination_type?: string;
  lamination_cost?: number;
  binding_type?: string;
  binding_cost?: number;
  labor_cost_per_hour?: number;
  estimated_hours?: number;
  overhead_percent?: number;
  spoilage_percent?: number;
  target_margin_percent?: number;
  discount_percent?: number;
  tax_percent?: number;
  target_currency?: string;
  [key: string]: any;
}

export interface CostBreakdownItem {
  paper_cost: number;
  black_ink_cost: number;
  color_ink_cost: number;
  depreciation_cost: number;
  maintenance_cost: number;
  setup_cost: number;
  finishing_cost: number;
  labor_cost: number;
  direct_subtotal: number;
  overhead_cost: number;
  total_cost: number;
}

export interface PricingCalculationResult {
  job_name: string;
  quantity: number;
  area_factor: number;
  total_breakdown?: CostBreakdownItem;
  unit_breakdown?: CostBreakdownItem;
  paper_cost: number;
  ink_cost: number;
  ink_cost_k: number;
  ink_cost_cmy: number;
  depreciation_cost: number;
  maintenance_cost: number;
  custom_finishing_cost: number;
  lamination_cost: number;
  binding_cost: number;
  labor_cost: number;
  setup_cost: number;
  finishing_cost: number;
  direct_cost: number;
  overhead_cost: number;
  subtotal: number;
  spoilage_cost: number;
  net_internal_cost: number;
  total_cost: number;
  sale_price: number;
  discount_amount: number;
  tax_amount: number;
  grand_total: number;
  unit_price: number;
  profit_margin: number;
  volume_discount_percent: number;
  currency: string;
  exchange_rate: number;
  custom_options?: any[];
}

/**
  * Calls the Go Backend Pricing Engine API to compute job costs & price pipeline.
  */
export async function calculateBackendPricing(input: PricingCalculationInput): Promise<PricingCalculationResult> {
  const payload = {
    job_name: input.job_name || 'Print Job',
    quantity: Math.max(1, input.quantity || 1),
    paper_sku: input.paper_sku || 'paper-default',
    paper_cost_per_unit: input.paper_cost_per_unit || 100,
    paper_format: input.paper_format || 'sheet',
    sheets_per_pack: input.sheets_per_pack || 500,
    paper_roll_price_per_m2: input.paper_roll_price_per_m2 || 0,
    setup_cost: input.setup_cost || 0,
    finishing_cost: input.finishing_cost || 0,
    base_profit_pct: input.base_profit_pct || input.target_margin_percent || 30,
    ink_coverage_k_percent: input.ink_coverage_k_percent || 5,
    ink_coverage_cmy_percent: input.ink_coverage_cmy_percent || 15,
    ink_cost_k_per_ml: input.ink_cost_k_per_ml || 250000,
    ink_cost_cmy_per_ml: input.ink_cost_cmy_per_ml || 250000,
    iso_yield_k: input.iso_yield_k || 4000,
    iso_yield_cmy: input.iso_yield_cmy || 4000,
    machine_price: input.machine_price || 50000000,
    target_total_pages: input.target_total_pages || 500000,
    maintenance_cost_per_page: input.maintenance_cost_per_page || 10,
    maintenance_rate_percent: input.maintenance_rate_percent || 20,
    job_width: input.job_width || 210,
    job_height: input.job_height || 297,
    custom_finishing_options: input.custom_finishing_options || [],
    lamination_type: input.lamination_type || 'none',
    lamination_cost: input.lamination_cost || 0,
    binding_type: input.binding_type || 'none',
    binding_cost: input.binding_cost || 0,
    labor_cost_per_hour: input.labor_cost_per_hour || 15000,
    estimated_hours: input.estimated_hours || 0,
    overhead_percent: input.overhead_percent || 0.15,
    spoilage_percent: input.spoilage_percent || 0.05,
    target_margin_percent: input.target_margin_percent || 0.30,
    discount_percent: input.discount_percent || 0,
    tax_percent: input.tax_percent || 0,
    target_currency: input.target_currency || 'LAK',
  };

  const response = await fetch('/api/pricing/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
  }

  return await response.json();
}
