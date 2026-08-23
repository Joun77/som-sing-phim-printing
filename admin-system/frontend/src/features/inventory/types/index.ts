export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type InboundStatus = 'COMPLETED' | 'CANCELLED';

export interface ColorSlot {
  id: string;
  code: string;       // e.g., "K", "C", "M", "Y", "W", "V", "LC", "LM"
  name: string;       // e.g., "Black", "Cyan", "White", "Varnish"
  hexColor?: string;  // e.g., "#000000", "#00FFFF", "#FFFFFF"
}

export interface ColorConfig {
  colorScheme: string; // e.g., "CMYK", "CMYK+W", "CMYK+W+V", "CUSTOM"
  slots: ColorSlot[];
}

export interface PrinterSpec {
  brand?: string;
  model?: string;
  printerCategory?: string;
  color_config?: ColorConfig;
  expectedLifeA4Pages?: number;
  maintenanceRatePercent?: number;
  location?: string;
  printerColorLinks?: any[];
  actual_images?: string[];
  payment_slip?: string;
  supplier_phone?: string;
  purchase_link?: string;
  [key: string]: any;
}

export interface InkSpec {
  inkCode?: string;
  colorName?: string;
  colorGroup?: string;
  volume?: number;
  inkBaseType?: string;
  isCompatible?: boolean;
  targetPrinterId?: string;
  supplier_phone?: string;
  purchase_link?: string;
  actual_images?: string[];
  payment_slip?: string;
  [key: string]: any;
}

export interface PaperSpec {
  paper_type?: string;          // e.g. "Art Paper", "Photo Paper", "Bond"
  paper_format?: 'sheet' | 'roll' | string; // 'sheet' (แผ่น) หรือ 'roll' (ม้วน)
  grammage?: number;            // gsm
  grammageGsm?: number;
  standardSize?: string;
  rollWidthM?: number;
  rollLengthM?: number;
  paperSurface?: string;
  width_mm?: number;
  height_mm?: number;
  sheets_per_ream?: number;
  sheets_per_pack?: number;
  sheetsPerPack?: number;
  supplier_phone?: string;
  purchase_link?: string;
  [key: string]: any;
}

export interface InventoryBatch {
  id: string;
  purchaseDate: string;
  supplierName: string;
  purchasePricePerReam: number;
  costPerSheet: number;
  initialQty: number;
  currentQty: number;
}

export interface MaterialMaster {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock_qty: number;
  consumption_unit: string;
  purchase_unit: string;
  purchase_multiplier: number;
  cost_per_purchase_unit: number;
  cost_per_consumption_unit: number;
  reorder_threshold: number;
  min_stock_alert: number;
  stock_status: StockStatus;
  is_active: boolean;
  technical_specs?: Record<string, any>;
  specification_meta?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku?: string;
  stockQty: number;
  consumptionUnit: string;
  purchaseUnit: string;
  purchaseMultiplier: number;
  costPerPurchaseUnit: number;
  costPerConsumptionUnit: number;
  reorderThreshold: number;
  minStockAlert?: number;
  stockStatus?: StockStatus;
  isActive?: boolean;
  inkSet?: string;
  batches?: InventoryBatch[];
  technical_specs?: Record<string, any>;
  specs?: Record<string, any>;
  [key: string]: any;
}

export interface StockInboundRecord {
  id: string;
  inbound_number: string;
  po_number?: string;
  material_id?: string;
  sku_code: string;
  item_name: string;
  category?: string;
  supplier_name?: string;
  inbound_date: string;
  quantity_received: number;
  purchase_unit?: string;
  purchase_multiplier: number;
  unit_purchase_price: number;
  total_price: number;
  status: InboundStatus;
  payment_method?: string;
  origin?: string;
  tariff_fee?: number;
  freight_fee?: number;
  product_image_url?: string;
  receipt_slip_url?: string;
  received_by_user_id?: string;
  cancelled_by_user_id?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  technical_specs?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface CreateInboundPayload {
  material_id?: string;
  sku_code: string;
  item_name: string;
  category: string;
  supplier_name?: string;
  po_number?: string;
  inbound_date: string;
  quantity_received: number;
  purchase_unit: string;
  purchase_multiplier: number;
  unit_purchase_price: number;
  total_price: number;
  payment_method?: string;
  origin?: string;
  tariff_fee?: number;
  freight_fee?: number;
  product_image_url?: string;
  receipt_slip_url?: string;
  received_by_user_id?: string;
  technical_specs?: Record<string, any>;
}

export interface CancelInboundPayload {
  inbound_id: string;
  user_id: string;
  reason: string;
}

export interface InkBottleInventory {
  id: string;
  ink_code: string;
  ink_name: string;
  color_group: string;
  color_code?: string;
  bottle_capacity_ml: number;
  bottle_cost: number;
  cost_per_ml: number;
  bottles_in_stock: number;
  min_bottle_alert: number;
  is_compatible: boolean;
  target_printer_id?: string;
  supplier_name?: string;
  supplier_phone?: string;
  purchase_link?: string;
  product_image_url?: string;
  receipt_slip_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DeductInkBottlePayload {
  ink_bottle_id: string;
  printer_id: string;
  quantity: number;
  operator_id: string;
  notes?: string;
}

export interface Offcut {
  id: string;
  name: string;
  qty: number;
  paperId: string;
  notes?: string;
}

export interface SpoilageLog {
  id: string;
  date: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  cause?: string;
  orderId?: string;
}
