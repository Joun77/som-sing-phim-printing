export interface CartItemSpecSelection {
  groupKey: string;
  groupName: string;
  optionValue: string;
  optionLabel: string;
  priceDeltaThb: number;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  categorySlug: string;
  quantity: number;
  selectedSpecs: CartItemSpecSelection[];
  unitPriceThb: number;
  totalPriceThb: number;
  artworkDriveUrl?: string;
  customNotes?: string;
}

export interface CustomerDetails {
  fullName: string;
  phone: string;
  email?: string;
  shippingAddress: string;
  courierId: string;
  courierName: string;
}

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  courierName: string;
  paymentMethod: string;
  depositAmount: number;
  totalPrice: number;
  totalPriceThb: number;
  status: string;
  slipNote?: string;
  slipUrl?: string;
  items: Array<{
    jobName: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
  }>;
}
