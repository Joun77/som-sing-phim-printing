export interface OrderLotUsed {
  lotId: string;
  qty: number;
  cost: number;
}

export type BindingType =
  | 'NONE'
  | 'PERFECT_HOT_GLUE'
  | 'SADDLE_STITCH'
  | 'WIRE_O'
  | 'PLASTIC_COMB'
  | 'CALENDAR';

export type ProductionStep =
  | 'PENDING'
  | 'INNER_PRINTED'
  | 'COVER_PRINTED'
  | 'COVER_LAMINATED'
  | 'PAPER_TRIMMED'
  | 'BOUND'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED';

export interface PreflightResult {
  file_name: string;
  file_url?: string;
  file_type?: 'PDF' | 'IMAGE' | string;
  total_pages: number;
  image_width?: number;
  image_height?: number;
  dpi_estimate?: number;
  avg_cov_c: number;
  avg_cov_m: number;
  avg_cov_y: number;
  avg_cov_k: number;
  color_space: string;
  has_rgb: boolean;
  is_standard_cmyk: boolean;
  status_badge_lao: string;
  warning_message_lao?: string;
  suggested_paper?: string;
  is_simulated?: boolean;
  execution_notice?: string;
}

export interface MasterOrderItem {
  id: string;
  order_id: string;
  job_name?: string;
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
  avg_cov_c: number;
  avg_cov_m: number;
  avg_cov_y: number;
  avg_cov_k: number;
  unit_cost_lak: number;
  unit_price_lak: number;
  total_price_lak: number;
  unit_price_snapshot?: number;
  cost_price_snapshot?: number;
  specs?: any;
}

export interface MasterOrder {
  id: string;
  order_no: string;
  order_number?: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  total_amount_lak: number;
  deposit_lak: number;
  remaining_lak: number;
  overall_status: string;
  status?: string;
  delivery_date?: string;
  google_drive_link?: string;
  items: MasterOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  lotsUsed?: OrderLotUsed[];
  item_name?: string;
  page_count?: number;
  paper_size?: string;
  cover_file_url?: string;
  inner_file_url?: string;
  binding_type?: BindingType;
  spine_width_mm?: number;
  current_step?: ProductionStep;
  avg_cov_c?: number;
  avg_cov_m?: number;
  avg_cov_y?: number;
  avg_cov_k?: number;
  unit_cost_lak?: number;
  unit_price_lak?: number;
  total_price_lak?: number;
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
  order_no?: string;
  orderNumber?: string;
  customerName: string;
  customer_name?: string;
  customerPhone?: string;
  phone: string;
  date: string;
  items: OrderItem[];
  totalPriceCharged: number;
  total_amount_lak?: number;
  depositAmountPaid: number;
  deposit_lak?: number;
  remainingUnpaidBalance: number;
  remaining_lak?: number;
  paymentMethod: string;
  bankName?: string;
  paymentStatus: string;
  paidDateTime: string | null;
  paymentSlipNote?: string;
  paymentSlipUrl?: string;
  status: string;
  overall_status?: string;
  delivery_date?: string;
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

export interface ColorChannel {
  channel_name: string; // 'C' | 'M' | 'Y' | 'K' | 'PANTONE ...'
  density_pct: number;
  is_spot_color?: boolean;
}

export interface PrinterProcessSetup {
  printer_asset_id: string;
  printer_name?: string;
  sequence?: number;
  color_mode: 'AVERAGE' | 'SEPARATE_CHANNEL';
  average_density_pct: number;
  allocated_pages?: number;
  cost_per_page?: number;
  color_channels: ColorChannel[];
}

export interface PaperSelectionSetup {
  category_id: string;
  inventory_material_id: string;
  cost_per_sheet: number;
  gsm: number;
}

export interface FinishingProcessSetup {
  finishing_type: string;
  machine_asset_id: string;
  machine_name?: string;
  estimated_setup_time_mins?: number;
  estimated_run_time_mins?: number;
  unit_cost?: number;
}

export interface PrinterAllocation {
  printer_id: string;
  printer_name: string;
  allocated_pages: number;
  cost_per_page: number; // Depreciation + Ink + Electricity rate per page
  subtotal_cost: number;
  is_double_sided?: boolean;
  color_mode?: 'CMYK' | 'MONO_K' | 'SPOT_ONLY' | 'AVERAGE' | 'SEPARATE_CHANNEL';
  average_density_pct?: number;
  color_channels?: ColorChannel[];
}

export interface FinishingItem {
  id: string;
  name: string;
  cost_per_unit: number;
  unit_type: 'sheet' | 'sqm' | 'job';
  selected: boolean;
  total_cost: number;
  machine_asset_id?: string;
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

export type OrderStatus7Step =
  | 'Pending'
  | 'Pre-Press'
  | 'Queued'
  | 'Printing'
  | 'Post-Press'
  | 'Ready for Delivery'
  | 'Delivered';

export interface WorkflowStep {
  id: OrderStatus7Step;
  stepNumber: number;
  labelLao: string;
  labelEn: string;
  description: string;
}

export const WORKFLOW_7_STEPS: WorkflowStep[] = [
  { id: 'Pending', stepNumber: 1, labelLao: 'ກຳລັງກວດສອບອໍເດີ / ຊຳລະເງິນ', labelEn: 'Pending Payment Verification', description: 'ລູກຄ້າກດສັ່ງຊື້ ແລະ ອັບໂຫຼດສະລິບ ເພື່ອລໍຖ້າການເງິນກວດສອບ' },
  { id: 'Pre-Press', stepNumber: 2, labelLao: 'ກວດສອບໄຟລ໌ / ຢືນຢັນແບບ (Proofing)', labelEn: 'Pre-Press & Proofing', description: 'ກຣາຟິກອັບໂຫຼດ Digital Proof ໃຫ້ລູກຄ້າກວດສອບ ແລະ ຢືນຢັນແບບ' },
  { id: 'Queued', stepNumber: 3, labelLao: 'ຈັດຄິວພິມ / ເພລດ (Queued)', labelEn: 'Queued for Print', description: 'ອໍເດີຖືກຈັດສັນລົງເຄື່ອງພິມ ແລະ ຕັດສະຕ໋ອກວັດຖຸດິບ' },
  { id: 'Printing', stepNumber: 4, labelLao: 'ກຳລັງພິມ (Printing)', labelEn: 'Printing', description: 'ຊ່າງພິມກດເລີ່ມງານພິມ ເຄື່ອງພິມກຳລັງດຳເນີນການ' },
  { id: 'Post-Press', stepNumber: 5, labelLao: 'ຂັ້ນຕອນຫຼັງການພິມ (Post-Press)', labelEn: 'Post-Press & Finishing', description: 'ຕັດ, ພັບ, ເຄືອບ, ໄດຄັດ ຫຼື ເຂົ້າເລົ່ມ' },
  { id: 'Ready for Delivery', stepNumber: 6, labelLao: 'ພິມສໍາເລັດ / ຮໍານໍາສົ່ງ (Ready)', labelEn: 'Ready for Delivery', description: 'ຜ່ານ QC ແພັກສິນຄ້າຮຽບຮ້ອຍ ພ້ອມມອບໃຫ້ຂົນສົ່ງ' },
  { id: 'Delivered', stepNumber: 7, labelLao: 'ກຳລັງນໍາສົ່ງ / ສົ່ງສໍາເລັດ (Delivered)', labelEn: 'In Transit / Delivered', description: 'ອອກເລກ Tracking ขนส่ง Anousith Express ຫຼື HAL Logistics' },
];

