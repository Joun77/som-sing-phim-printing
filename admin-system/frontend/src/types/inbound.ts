export interface PurchaseOrder {
  poId: string;
  id: string;
  date?: string;
  purchaseDate?: string;
  itemType?: string;
  categoryType?: string;
  materialType?: string;
  paperSpec?: string;
  itemName: string;
  supplierName: string;
  supplierContact?: string;
  unitPrice: number;
  costPerUnit?: number;
  totalCost: number;
  totalPrice?: number;
  qty: number;
  unitName?: string;
}

export interface PurchaseRequisition {
  id: string;
  prNumber: string;
  date: string;
  materialId?: string;
  materialName?: string;
  category?: string;
  qty?: number;
  unit?: string;
  currentStock?: number;
  reorderThreshold?: number;
  reason?: string;
  status: string;
}

export interface InboundEntry {
  id: string;
  poNumber?: string;
  inboundDate?: string;
  skuCode?: string;
  itemName?: string;
  supplierName?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  totalPrice?: number;
  paymentMethod?: string;
  origin?: string;
  tariffFee?: number;
  freightFee?: number;
  productImage?: string;
  receiptSlip?: string;
  specs?: Record<string, any>;
  [key: string]: any;
}
