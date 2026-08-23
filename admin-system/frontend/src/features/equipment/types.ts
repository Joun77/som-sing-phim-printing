export interface EquipmentComponent {
  name: string;
  usage: number;
  threshold: number;
}

export interface MachineSpec {
  id: string;
  asset_id?: string;
  brand?: string;
  model?: string;
  purchase_price_lak: number;
  expected_life_pages: number;
  maintenance_rate_percent: number;
  color_scheme?: string[];
  depreciation_per_sheet_lak?: number;
  maintenance_per_sheet_lak?: number;
  machine_cost_per_sheet_lak?: number;
}

export interface Equipment {
  id: string;
  name: string;
  purchaseCost: number;
  purchasePrice?: number;
  purchase_price_lak?: number;
  MachinePrice?: number;
  lifespanYears: number;
  printedPagesCapacity: number;
  expected_life_pages?: number;
  expectedLifeA4Pages?: number;
  TargetTotalPages?: number;
  printedCount: number;
  calculatedCostPerPage: number;
  category: string;
  postPressSubtype?: 'guillotine' | 'sticker_plotter' | 'hole_drill' | 'binder' | 'folder' | 'laminator' | string;
  estMonthlyVolume?: number;
  maintenanceRatePercent?: number;
  maintenance_rate_percent?: number;
  costPerConsumptionUnit?: number;
  depreciation_per_sheet_lak?: number;
  maintenance_per_sheet_lak?: number;
  machine_cost_per_sheet_lak?: number;
  printerType?: string;
  printerCategory?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  status?: string;
  imageUrl?: string;
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

export interface PrinterColorLink {
  id: string;
  assetId: string;
  inkCode: string;
  slotPosition: string;
  colorGroup?: string;
  notes?: string;
  oemStandardVolumeMl?: number;
  oemStandardIsoYieldA4?: number;
  baseConsumptionRateMl?: number;
  isoPageYieldA4?: number;
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
  endTime?: string | null;
  downtimeMinutes: number;
  reason: string;
  description?: string;
  actionTaken?: string;
  technician?: string;
  cost?: number;
  status?: 'Pending' | 'In Progress' | 'Completed';
}

export interface MeterReading {
  id: string;
  equipmentId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  meterCount: number;
  diffCount: number; // pages printed since last record
  recordedBy?: string;
  notes?: string;
}

