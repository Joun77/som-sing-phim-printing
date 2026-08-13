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
