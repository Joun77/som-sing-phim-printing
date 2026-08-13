import type { Dispatch, SetStateAction } from 'react';

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------

export interface EquipmentComponent {
  name: string;
  usage: number;
  threshold: number;
}

export interface Equipment {
  id: string;
  name: string;
  purchaseCost: number;
  MachinePrice?: number;
  lifespanYears: number;
  printedPagesCapacity: number;
  TargetTotalPages?: number;
  printedCount: number;
  calculatedCostPerPage: number;
  category: string;
  printerType?: string;
  inkConsumptionStandard?: number;
  inkUnitCostMl?: number;
  clickRateColor?: number;
  clickRateBW?: number;
  supportedInkSets?: string[];
  purchaseDate: string;
  warrantyExpiration: string;
  lastMaintenanceDate: string;
  components: EquipmentComponent[];
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// Customers (CRM)
// ---------------------------------------------------------------------------

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  creditLimit: number;
  instagram?: string;
  line?: string;
  facebook?: string;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface OrderLotUsed {
  lotId: string;
  qty: number;
  cost: number;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  lotsUsed?: OrderLotUsed[];
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
  customerName: string;
  phone: string;
  date: string;
  items: OrderItem[];
  totalPriceCharged: number;
  depositAmountPaid: number;
  remainingUnpaidBalance: number;
  paymentMethod: string;
  bankName?: string;
  paymentStatus: string;
  paidDateTime: string | null;
  paymentSlipNote?: string;
  paymentSlipUrl?: string;
  status: string;
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

// ---------------------------------------------------------------------------
// Spoilage / Offcuts / Purchase Orders
// ---------------------------------------------------------------------------

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

export interface Offcut {
  id: string;
  name: string;
  qty: number;
  paperId: string;
  notes?: string;
}

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

// ---------------------------------------------------------------------------
// Quotations
// ---------------------------------------------------------------------------

export interface QuotationItem {
  name: string;
  quantity: number;
  unitPrice: number;
  id?: string;
}

export interface QuotationVersion {
  version: number;
  date: string;
  total: number;
  note: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerName: string;
  phone?: string;
  status: string;
  version: number;
  versions: QuotationVersion[];
  items: QuotationItem[];
  subtotal: number;
  discountPercent: number;
  taxEnabled: boolean;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  expiresAt?: string;
  paymentTerms?: string;
  createdAt: string;
  convertedOrderId: string | null;
  notes?: string;
  artworkLink?: string;
}

// ---------------------------------------------------------------------------
// HR / Employees
// ---------------------------------------------------------------------------

export interface EmployeeAttendance {
  present: number;
  absent: number;
  late: number;
}

export interface Employee {
  id: string;
  name: string;
  nameEn: string;
  role: string;
  phone: string;
  address: string;
  salary: number;
  salaryType: string;
  startDate: string;
  status: string;
  attendance: EmployeeAttendance;
  skills: string[];
  shift: string;
  avatar: string;
  rating: number;
  assignedMachines: string[];
  pieceRatePerImpression: number;
  impressionsProduced: number;
  salesCommissionRate: number;
}

// ---------------------------------------------------------------------------
// Production / Machines / Deliveries
// ---------------------------------------------------------------------------

export interface PrinterColorLink {
  id: string;
  assetId: string;
  inkCode: string;
  slotPosition: string;
  notes?: string;
}

export interface MachineStatusEntry {
  status: string;
  lastChanged: string;
  reason?: string;
}

export interface DowntimeLog {
  id: string;
  equipmentId: string;
  equipmentName: string;
  startTime: string;
  endTime: string | null;
  downtimeMinutes: number;
  reason: string;
  description: string;
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

// ---------------------------------------------------------------------------
// Inbound / Procurement
// ---------------------------------------------------------------------------

export interface InboundEntry {
  id: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

export interface ExchangeRate {
  buy: number;
  sell: number;
}

// ---------------------------------------------------------------------------
// UI state helpers
// ---------------------------------------------------------------------------

export interface ToastState {
  message: string;
  type: string;
}

export interface ConfirmDialogState {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// AppContext value
// ---------------------------------------------------------------------------

export interface AppContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  focusOrderId: string | null;
  setFocusOrderId: (id: string | null) => void;
  preselectedCustomerName: string;
  setPreselectedCustomerName: (name: string) => void;
  prefilledOrderSpecs: any;
  setPrefilledOrderSpecs: (specs: any) => void;
  currency: string;
  setCurrency: (code: string) => void;
  formatCurrency: (num: number) => string;
  convertToCurrency: (num: number) => number;
  exchangeRates: Record<string, any>;
  ratesUpdatedAt: string;
  updateExchangeRate: (code: string, side: string, rate: number) => void;
  rateMode: string;
  setRateMode: (mode: string) => void;
  isRatesOpen: boolean;
  setIsRatesOpen: (open: boolean) => void;

  quotations: Quotation[];
  setQuotations: Dispatch<SetStateAction<Quotation[]>>;
  addQuotation: (...args: any[]) => any;
  reviseQuotation: (...args: any[]) => any;
  updateQuotation: (...args: any[]) => any;
  deleteQuotation: (...args: any[]) => any;
  convertQuotationToOrder: (...args: any[]) => any;

  employees: Employee[];
  setEmployees: Dispatch<SetStateAction<Employee[]>>;
  addEmployee: (...args: any[]) => any;
  updateEmployee: (...args: any[]) => any;
  deleteEmployee: (...args: any[]) => any;
  assignEmployeeToMachine: (...args: any[]) => any;
  recordImpressions: (...args: any[]) => any;

  machineStatus: Record<string, MachineStatusEntry>;
  setMachineStatus: (...args: any[]) => any;
  setMachineOperationalStatus: (...args: any[]) => any;
  downtimeLogs: DowntimeLog[];
  setDowntimeLogs: (...args: any[]) => any;
  resolveDowntime: (...args: any[]) => any;

  purchaseRequisitions: PurchaseRequisition[];
  setPurchaseRequisitions: (...args: any[]) => any;
  addPurchaseRequisition: (...args: any[]) => any;
  updatePurchaseRequisition: (...args: any[]) => any;

  deliveries: Delivery[];
  setDeliveries: (...args: any[]) => any;
  addDelivery: (...args: any[]) => any;
  updateDelivery: (...args: any[]) => any;

  activeRole: string;
  setActiveRole: (role: string) => void;
  canAccess: (permission: string) => boolean;

  inventory: InventoryItem[];
  equipment: Equipment[];
  orders: Order[];
  spoilageLogs: SpoilageLog[];
  customers: Customer[];
  offcuts: Offcut[];
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: Dispatch<SetStateAction<PurchaseOrder[]>>;
  deletePurchaseOrder: (...args: any[]) => any;
  linkedInboundEntries: InboundEntry[];
  customCategories: any[];
  setCustomCategories: (...args: any[]) => any;
  masterSpecsPool: any[];
  setMasterSpecsPool: (...args: any[]) => any;

  toast: ToastState | null;
  setToast: (toast: ToastState | null) => void;
  confirmDialog: ConfirmDialogState | null;
  showToast: (message: string, type?: string) => void;
  askConfirmation: (message: string, onConfirm: () => void) => void;

  getDashboardStats: () => any;
  getFIFOCostPerSheet: (itemId: string, sheetsNeeded: number) => number;
  addInventoryBatch: (...args: any[]) => any;
  addInventorySku: (...args: any[]) => any;
  deleteInventoryBatch: (...args: any[]) => any;
  editInventoryBatch: (...args: any[]) => any;
  editInventorySku: (...args: any[]) => any;
  checkCreditLimit: (...args: any[]) => any;

  addCustomer: (...args: any[]) => any;
  updateCustomer: (...args: any[]) => any;
  deleteCustomer: (...args: any[]) => any;
  addOffcut: (...args: any[]) => any;
  consumeOffcut: (...args: any[]) => any;

  updatePreflightCheck: (...args: any[]) => any;
  updateProductionStep: (...args: any[]) => any;
  addOrderVersion: (...args: any[]) => any;
  addOrder: (...args: any[]) => any;
  updateOrderStatus: (...args: any[]) => any;
  settleOrderBalance: (...args: any[]) => any;
  deleteOrder: (...args: any[]) => any;
  addSpoilageLog: (...args: any[]) => any;
  addStock: (...args: any[]) => any;
  addEquipment: (...args: any[]) => any;

  addInboundEntry: (...args: any[]) => any;
  printerColorLinks: PrinterColorLink[];
  setPrinterColorLinks: (...args: any[]) => any;
  addPrinterColorLink: (...args: any[]) => any;
  deletePrinterColorLink: (...args: any[]) => any;
  quickAdjustStock: (...args: any[]) => any;
  editInboundEntry: (...args: any[]) => any;
  deleteInboundEntry: (...args: any[]) => any;
  addPurchaseOrder: (...args: any[]) => any;
  updateEquipmentComponentUsage: (...args: any[]) => any;
  resetEquipmentComponent: (...args: any[]) => any;
  updateEquipmentMaintenance: (...args: any[]) => any;
  resetToDefaultData: (...args: any[]) => any;
}
