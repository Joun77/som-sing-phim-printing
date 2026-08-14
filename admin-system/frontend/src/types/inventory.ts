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

export interface InventoryBatch {
  id: string;
  purchaseDate: string;
  supplierName: string;
  purchasePricePerReam: number;
  costPerSheet: number;
  initialQty: number;
  currentQty: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  inkSet?: string;
  stockQty: number;
  consumptionUnit: string;
  purchaseUnit: string;
  purchaseMultiplier: number;
  costPerPurchaseUnit: number;
  costPerConsumptionUnit: number;
  reorderThreshold: number;
  batches: InventoryBatch[];
  [key: string]: any;
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

