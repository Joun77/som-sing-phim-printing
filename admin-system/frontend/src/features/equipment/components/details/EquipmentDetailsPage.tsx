import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle, 
  ShieldAlert, 
  Wrench, 
  Printer, 
  Layers, 
  Clock, 
  Camera, 
  FileText,
  ExternalLink,
  Laptop,
  Gauge,
  Plus,
  Trash2,
  Edit,
  Edit3,
  Save,
  Check,
  X,
  Calendar,
  AlertTriangle,
  Droplet,
  RotateCcw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@store/AppContext';
import ConfirmDeleteModal, { DeleteActionButton } from '@components/common/ConfirmDeleteModal';
import EditEquipmentModal from '../modals/EditEquipmentModal';
import RecordMeterModal from '../modals/RecordMeterModal';
import LogDowntimeModal from '../modals/LogDowntimeModal';
import QuickLinkInkModal from '../modals/QuickLinkInkModal';
import QuickSwapConsumableModal from '../modals/QuickSwapConsumableModal';
import PrinterInkComparisonCard from '@features/inventory/components/details/PrinterInkComparisonCard';
import { resolveMachineImage, calculateMachineWearPartsRate, getEquipmentAccurateCost, calculateEquipmentPrintCost, formatUnitPrecisionLAK } from '@utils/machineCostCalculator';
import { getAuthHeaders } from '@utils/authHeaders';

export default function EquipmentDetailsPage({ equipmentId, onBack }: { equipmentId: string; onBack: () => void }) {
  const { 
    equipment, 
    inventory, 
    printerColorLinks, 
    deletePrinterColorLink, 
    updateEquipmentMaintenance, 
    updateEquipment,
    deleteEquipment,
    meterReadings,
    downtimeLogs,
    updateDowntimeLog,
    showToast, 
    formatCurrency 
  } = useApp();

  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  
  const machine = equipment ? equipment.find(eq => eq.id === equipmentId) : null;
  const formatLAK = formatCurrency;
  const formatUnitLAK = (val: number) => {
    if (!val || isNaN(val)) return 'LAK 0';
    const rounded = Math.round(val * 100) / 100;
    if (Math.abs(rounded) < 1000 && rounded % 1 !== 0) {
      return `LAK ${rounded.toFixed(2)}`;
    }
    return formatCurrency(rounded);
  };

  // Active sub-tab state: 'specs' | 'meter' | 'maintenance' | 'inks'
  const [activeTab, setActiveTab] = useState<'specs' | 'meter' | 'maintenance' | 'inks'>('specs');

  // Meter filter state: 'daily' | 'weekly' | 'monthly'
  const [meterFilter, setMeterFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Modal open states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRecordMeterOpen, setIsRecordMeterOpen] = useState(false);
  const [isLogDowntimeOpen, setIsLogDowntimeOpen] = useState(false);
  const [isQuickLinkInkOpen, setIsQuickLinkInkOpen] = useState(false);
  const [swapModalConfig, setSwapModalConfig] = useState<{
    isOpen: boolean;
    mode: 'ink' | 'component';
    slotPosition?: string;
    inkSku?: string;
    inkName?: string;
    componentName?: string;
    currentUsage?: number;
  } | null>(null);

  // Core asset & lifetime parameter editing state
  const [isEditingCoreParams, setIsEditingCoreParams] = useState(false);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCapacity, setEditCapacity] = useState<number>(0);

  // Itemized wear parts editing state
  const [isEditingWearParts, setIsEditingWearParts] = useState(false);
  const [wearPartsDraft, setWearPartsDraft] = useState<Record<string, { cost: number; life: number }>>({});

  if (!machine) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
        <p className="text-slate-500 font-bold">ບໍ່ພົບຂໍ້ມູນໂປຣໄຟລ໌ເຄື່ອງຈັກ (Machine Profile Not Found)</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          ກັບຄືນຮາຍການເຄື່ອງຈັກ
        </button>
      </div>
    );
  }

  const isCritical = machine.components && machine.components.some((c: any) => c.usage >= (c.threshold || 90));

  const handleDeleteEquipment = () => {
    deleteEquipment(machine.id);
    showToast(
      currentLang === 'lo'
        ? `ລຶບຂໍ້ມູນເຄື່ອງຈັກ "${machine.name}" ສຳເລັດ!`
        : `Deleted equipment "${machine.name}" successfully!`,
      'info'
    );
    onBack();
  };

  // Get printer linked inks
  const linkedLinks = printerColorLinks.filter((lnk: any) => lnk.assetId === machine.id);

  // Get meter readings for this machine
  const machineReadings = meterReadings.filter((m: any) => m.equipmentId === machine.id);

  // Filter meter readings by view (daily / weekly / monthly)
  const filteredReadings = machineReadings.filter((m: any) => {
    if (!m.date) return true;
    const readingDate = new Date(m.date);
    const now = new Date();
    if (meterFilter === 'daily') {
      const diffTime = Math.abs(now.getTime() - readingDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 14;
    } else if (meterFilter === 'weekly') {
      const diffTime = Math.abs(now.getTime() - readingDate.getTime());
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      return diffWeeks <= 8;
    } else {
      const diffTime = Math.abs(now.getTime() - readingDate.getTime());
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      return diffMonths <= 12;
    }
  });

  // Get downtime logs for this machine
  const machineDowntimes = downtimeLogs.filter((d: any) => d.equipmentId === machine.id);

  // Financial & Depreciation Math (Robust & Synchronized Model)
  const rawPriceCandidates = [
    machine.price,
    machine.purchaseCost,
    machine.purchasePrice,
    machine.unitPrice,
    machine.MachinePrice,
    machine.totalPrice,
    machine.unitCost,
    machine.specs?.purchaseCost,
    machine.specs?.price,
    machine.specs?.purchasePrice,
    machine.specs?.totalPrice
  ];
  const foundPrice = rawPriceCandidates.find(p => p !== undefined && p !== null && Number(p) > 0);
  const assetValue = Number(foundPrice || 0);

  const machineCategoryLower = (machine.category || '').toLowerCase();
  const subtypeLower = (machine.postPressSubtype || machine.specs?.postPressSubtype || '').toLowerCase();
  const nameLower = (machine.name || '').toLowerCase();

  const isCutter = subtypeLower.includes('guillotine') || subtypeLower.includes('cutter') || subtypeLower.includes('plotter') || machineCategoryLower.includes('cutter') || nameLower.includes('cutter') || nameLower.includes('guillotine');
  const isLaminator = subtypeLower.includes('laminator') || machineCategoryLower.includes('laminator') || nameLower.includes('laminator');
  const isBinder = subtypeLower.includes('binder') || machineCategoryLower.includes('binder') || nameLower.includes('binder');

  // A machine is Post-Press only if explicitly a finishing machine (Cutter, Laminator, Binder)
  const isPostPressMachine = isCutter || isLaminator || isBinder || machineCategoryLower.includes('post_press') || machineCategoryLower.includes('postpress');
  const isPrinter = !isPostPressMachine;
  const isInkjet = !isPostPressMachine && (subtypeLower.includes('inkjet') || machineCategoryLower.includes('inkjet') || nameLower.includes('l15150') || nameLower.includes('epson') || (machine.specs?.feedType !== undefined));
  const accurate = getEquipmentAccurateCost(machine);
  const isLaser = isPrinter && !isInkjet;

  const isGuillotine = isCutter && (
    (machine.postPressSubtype || machine.specs?.postPressSubtype || machine.category || '').toLowerCase().includes('guillotine') ||
    (machine.name || '').toLowerCase().includes('guillotine') ||
    (machine.name || '').toLowerCase().includes('cutter') ||
    (machine.name || '').toLowerCase().includes('qzyk')
  );

  let machineUnitLabel = isGuillotine ? 'ຮອບຕັດ (Cuts)' : (isCutter || isLaminator) ? 'ແມັດ (m)' : isBinder ? 'ຫົວ (Book)' : 'ໜ້າ (Page)';
  let machineUnitEn = isGuillotine ? 'cuts' : (isCutter || isLaminator) ? 'meter' : isBinder ? 'book' : 'page';

  const postPressSubtypeMap: Record<string, string> = {
    guillotine: 'Guillotine Cutter',
    sticker_plotter: 'Sticker Plotter',
    hole_drill: 'Paper Hole Drill',
    binder: 'Paper Binder',
    folder: 'Folder / Creaser',
    laminator: 'Laminator'
  };
  const subtypeLabel = postPressSubtypeMap[machine.postPressSubtype || machine.specs?.postPressSubtype || ''] || machine.postPressSubtype || machine.category || 'Standard';

  const lifespanYears = Number(machine.lifespanYears || machine.specs?.lifespanYears || 5);
  const estMonthlyVolume = Number(machine.estMonthlyVolume || machine.specs?.estMonthlyVolume || 50000);
  const maintenanceRatePct = Number(machine.maintenanceRatePercent || machine.specs?.maintenanceRatePercent || 0);
  const maintCostPerPage = Number(machine.specs?.fixedMaintenanceCostPerPage || 0);

  const totalMonths = lifespanYears * 12;
  const explicitCapacity = Number(
    machine.specs?.expectedLife ||
    machine.specs?.expectedLifeA4Pages ||
    machine.expectedLifeA4Pages ||
    machine.TargetTotalPages || 
    machine.printedPagesCapacity || 
    machine.lifetimePagesA4 ||
    machine.expected_life_pages ||
    0
  );
  const fallbackCapacity = isInkjet ? 200000 : isLaser ? 500000 : isGuillotine ? 100000 : isBinder ? 30000 : 50000;
  const targetLifetimeCapacity = explicitCapacity > 0 ? explicitCapacity : fallbackCapacity;

  const currentMeterCount = Number(
    machine.currentMeterCount || 
    machine.current_meter || 
    machine.printedCount || 
    0
  );

  const baseCostPerUnit = (assetValue > 0 && targetLifetimeCapacity > 0)
    ? (assetValue / targetLifetimeCapacity)
    : 0;

  // 5 Critical Wear Parts Model (Bound to real purchase cost & specs from Inbound)
  const getStandard5WearParts = () => {
    const existingComponents = machine.components || [];
    const existingMap = new Map();
    existingComponents.forEach((c: any) => {
      existingMap.set(c.name?.toLowerCase(), c);
    });

    const specs = machine.specs || {};

    let defaults: Array<{ 
      name: string; 
      nameLo: string; 
      usage: number; 
      threshold: number; 
      lifespan: string;
      cost: number;
      lifeVal: number;
      unitLabel: string;
      costPerUnit: number;
      keyCost?: string;
      keyLife?: string;
    }> = [];

    if (isCutter) {
      const sharpCost = Number(specs.wearSharpeningCost || machine.wearSharpeningCost || 150000);
      const sharpLife = Number(specs.wearSharpeningIntervalCuts || machine.wearSharpeningIntervalCuts || 10000);
      const stickCost = Number(specs.wearCuttingStickCost || machine.wearCuttingStickCost || 100000);
      const stickLife = Number(specs.wearCuttingStickLifeCuts || machine.wearCuttingStickLifeCuts || 20000);
      const bladeCost = Number(specs.wearBladeCost || machine.wearBladeCost || 250000);
      const bladeLife = Number(specs.wearBladeLifeMeters || machine.wearBladeLifeMeters || 5000);

      defaults = [
        { name: 'Sharpening Blade Service', nameLo: 'ຄ່າຈ້າງລັບຄົມໃບມີດຕັດເຈ້ຍ', usage: 18, threshold: 90, lifespan: `${sharpLife.toLocaleString()} cuts`, cost: sharpCost, lifeVal: sharpLife, unitLabel: 'cuts', costPerUnit: sharpLife > 0 ? (sharpCost / sharpLife) : 0, keyCost: 'wearSharpeningCost', keyLife: 'wearSharpeningIntervalCuts' },
        { name: 'Cutting Stick Pad', nameLo: 'ໄມ້ຮອງໃບມີດຕັດ (Cutting Stick)', usage: 42, threshold: 85, lifespan: `${stickLife.toLocaleString()} cuts`, cost: stickCost, lifeVal: stickLife, unitLabel: 'cuts', costPerUnit: stickLife > 0 ? (stickCost / stickLife) : 0, keyCost: 'wearCuttingStickCost', keyLife: 'wearCuttingStickLifeCuts' },
        { name: 'Plotter Cutting Blade', nameLo: 'ໃບມີດພລັອດເຕີ (Plotter Blade)', usage: 25, threshold: 90, lifespan: `${bladeLife.toLocaleString()} m`, cost: bladeCost, lifeVal: bladeLife, unitLabel: 'm', costPerUnit: bladeLife > 0 ? (bladeCost / bladeLife) : 0, keyCost: 'wearBladeCost', keyLife: 'wearBladeLifeMeters' },
      ];
    } else if (isLaminator) {
      const rollerCost = Number(specs.wearSiliconeRollerCost || machine.wearSiliconeRollerCost || 1200000);
      const rollerLife = Number(specs.wearSiliconeRollerLifeMeters || machine.wearSiliconeRollerLifeMeters || 20000);
      const heatCost = Number(specs.wearHeatingElementCost || machine.wearHeatingElementCost || 800000);
      const heatLife = Number(specs.wearHeatingElementHours || machine.wearHeatingElementHours || 5000);

      defaults = [
        { name: 'Silicone Heat Rollers', nameLo: 'ລູກກິ້ງຢາງຄວາມຮ້ອນ (Silicone Rollers)', usage: 35, threshold: 85, lifespan: `${rollerLife.toLocaleString()} m`, cost: rollerCost, lifeVal: rollerLife, unitLabel: 'm', costPerUnit: rollerLife > 0 ? (rollerCost / rollerLife) : 0, keyCost: 'wearSiliconeRollerCost', keyLife: 'wearSiliconeRollerLifeMeters' },
        { name: 'Heating Element Core', nameLo: 'ແທ່ງຄວາມຮ້ອນ (Heating Element)', usage: 20, threshold: 90, lifespan: `${heatLife.toLocaleString()} hours`, cost: heatCost, lifeVal: heatLife, unitLabel: 'hours', costPerUnit: heatLife > 0 ? (heatCost / heatLife) : 0, keyCost: 'wearHeatingElementCost', keyLife: 'wearHeatingElementHours' },
      ];
    } else if (isBinder) {
      const millCost = Number(specs.wearMillingCutterCost || machine.wearMillingCutterCost || 800000);
      const millLife = Number(specs.wearMillingCutterLifeBooks || machine.wearMillingCutterLifeBooks || 10000);
      const punchCost = Number(specs.wearPunchingPinsCost || machine.wearPunchingPinsCost || 600000);
      const punchLife = Number(specs.wearPunchingPinsLifePunches || machine.wearPunchingPinsLifePunches || 20000);

      defaults = [
        { name: 'Spine Milling Cutter', nameLo: 'ໃບມີດປາດສັນປຶ້ມ (Milling Cutter)', usage: 40, threshold: 85, lifespan: `${millLife.toLocaleString()} books`, cost: millCost, lifeVal: millLife, unitLabel: 'books', costPerUnit: millLife > 0 ? (millCost / millLife) : 0, keyCost: 'wearMillingCutterCost', keyLife: 'wearMillingCutterLifeBooks' },
        { name: 'Wire Punching Pins Set', nameLo: 'ຊຸດເຂັມເຈາະຮູສັນລວດ (Punching Pins)', usage: 22, threshold: 90, lifespan: `${punchLife.toLocaleString()} punches`, cost: punchCost, lifeVal: punchLife, unitLabel: 'punches', costPerUnit: punchLife > 0 ? (punchCost / punchLife) : 0, keyCost: 'wearPunchingPinsCost', keyLife: 'wearPunchingPinsLifePunches' },
      ];
    } else if (isInkjet) {
      const maintCost = Number(specs.wearMaintBoxCost || machine.wearMaintBoxCost || 450000);
      const maintLife = Number(specs.wearMaintBoxLife || machine.wearMaintBoxLife || 25000);
      const headCost = Number(specs.wearPrintheadCost || machine.wearPrintheadCost || 4500000);
      const headLife = Number(specs.wearPrintheadLife || machine.wearPrintheadLife || 100000);
      const pickupCost = Number(specs.wearPickupRollerCost || machine.wearPickupRollerCost || 150000);
      const pickupLife = Number(specs.wearPickupRollerLife || machine.wearPickupRollerLife || 30000);
      const beltCost = Number(specs.wearCarriageBeltCost || machine.wearCarriageBeltCost || 500000);
      const beltLife = Number(specs.wearCarriageBeltLife || machine.wearCarriageBeltLife || 50000);

      defaults = [
        { name: 'Maintenance Waste Box', nameLo: 'ຊຸດຊັບໝຶກ (Maintenance Box)', usage: 35, threshold: 85, lifespan: `${maintLife.toLocaleString()} pages`, cost: maintCost, lifeVal: maintLife, unitLabel: 'pages', costPerUnit: maintLife > 0 ? (maintCost / maintLife) : 0, keyCost: 'wearMaintBoxCost', keyLife: 'wearMaintBoxLife' },
        { name: 'Precision Inkjet Printhead', nameLo: 'ຫົວພິມຄວາມລະອຽດສູງ (Printhead)', usage: 20, threshold: 90, lifespan: `${headLife.toLocaleString()} pages`, cost: headCost, lifeVal: headLife, unitLabel: 'pages', costPerUnit: headLife > 0 ? (headCost / headLife) : 0, keyCost: 'wearPrintheadCost', keyLife: 'wearPrintheadLife' },
        { name: 'Feed Pickup Roller', nameLo: 'ຢາງດຶງເຈ້ຍ (Pickup Roller)', usage: 50, threshold: 85, lifespan: `${pickupLife.toLocaleString()} pages`, cost: pickupCost, lifeVal: pickupLife, unitLabel: 'pages', costPerUnit: pickupLife > 0 ? (pickupCost / pickupLife) : 0, keyCost: 'wearPickupRollerCost', keyLife: 'wearPickupRollerLife' },
        { name: 'Carriage Drive Belt', nameLo: 'ສາຍພານຫົວພິມ (Carriage Belt)', usage: 25, threshold: 90, lifespan: `${beltLife.toLocaleString()} pages`, cost: beltCost, lifeVal: beltLife, unitLabel: 'pages', costPerUnit: beltLife > 0 ? (beltCost / beltLife) : 0, keyCost: 'wearCarriageBeltCost', keyLife: 'wearCarriageBeltLife' },
      ];
    } else {
      // Laser Production Press
      const drumCost = Number(specs.wearDrumUnitCost || machine.wearDrumUnitCost || 1500000);
      const drumLife = Number(specs.wearDrumUnitLife || machine.wearDrumUnitLife || 50000);
      const fuserCost = Number(specs.wearFuserUnitCost || machine.wearFuserUnitCost || specs.wearFuserCost || 2000000);
      const fuserLife = Number(specs.wearFuserUnitLife || machine.wearFuserUnitLife || specs.wearFuserLife || 100000);
      const itbCost = Number(specs.wearTransferBeltCost || machine.wearTransferBeltCost || 1800000);
      const itbLife = Number(specs.wearTransferBeltLife || machine.wearTransferBeltLife || 100000);
      const rollerCost = Number(specs.wearPickupRollerCost || machine.wearPickupRollerCost || specs.wearRollerCost || 150000);
      const rollerLife = Number(specs.wearPickupRollerLife || machine.wearPickupRollerLife || specs.wearRollerLife || 30000);
      const wasteBoxCost = Number(specs.wearWasteTonerBoxCost || machine.wearWasteTonerBoxCost || 350000);
      const wasteBoxLife = Number(specs.wearWasteTonerBoxLife || machine.wearWasteTonerBoxLife || 30000);

      defaults = [
        { name: 'OPC Drum Unit', nameLo: 'ຊຸດດຣັມສ້າງພາບ (Drum Unit)', usage: 65, threshold: 85, lifespan: `${drumLife.toLocaleString()} pages`, cost: drumCost, lifeVal: drumLife, unitLabel: 'pages', costPerUnit: drumLife > 0 ? (drumCost / drumLife) : 0, keyCost: 'wearDrumUnitCost', keyLife: 'wearDrumUnitLife' },
        { name: 'Fuser Fixing Assembly', nameLo: 'ຊຸດຄວາມຮ້ອນ (Fuser Unit)', usage: 72, threshold: 90, lifespan: `${fuserLife.toLocaleString()} pages`, cost: fuserCost, lifeVal: fuserLife, unitLabel: 'pages', costPerUnit: fuserLife > 0 ? (fuserCost / fuserLife) : 0, keyCost: 'wearFuserUnitCost', keyLife: 'wearFuserUnitLife' },
        { name: 'Intermediate Transfer Belt (ITB)', nameLo: 'ສາຍພານຖ່າຍທອດພາບ (Transfer Belt)', usage: 38, threshold: 90, lifespan: `${itbLife.toLocaleString()} pages`, cost: itbCost, lifeVal: itbLife, unitLabel: 'pages', costPerUnit: itbLife > 0 ? (itbCost / itbLife) : 0, keyCost: 'wearTransferBeltCost', keyLife: 'wearTransferBeltLife' },
        { name: 'Paper Feed Pickup Rollers', nameLo: 'ຊຸດລູກກິ້ງດຶງເຈ້ຍ (Pickup Roller)', usage: 82, threshold: 85, lifespan: `${rollerLife.toLocaleString()} pages`, cost: rollerCost, lifeVal: rollerLife, unitLabel: 'pages', costPerUnit: rollerLife > 0 ? (rollerCost / rollerLife) : 0, keyCost: 'wearPickupRollerCost', keyLife: 'wearPickupRollerLife' },
        { name: 'Waste Toner Box', nameLo: 'ກ່ອງເກັບຜົງໝຶກເສຍ (Waste Toner Box)', usage: 45, threshold: 90, lifespan: `${wasteBoxLife.toLocaleString()} pages`, cost: wasteBoxCost, lifeVal: wasteBoxLife, unitLabel: 'pages', costPerUnit: wasteBoxLife > 0 ? (wasteBoxCost / wasteBoxLife) : 0, keyCost: 'wearWasteTonerBoxCost', keyLife: 'wearWasteTonerBoxLife' },
      ];
    }

    return defaults.map(def => {
      const match = existingMap.get(def.name.toLowerCase());
      if (match) {
        return {
          ...def,
          ...match,
          keyCost: def.keyCost,
          keyLife: def.keyLife,
          cost: match.cost !== undefined ? match.cost : def.cost,
          lifeVal: match.lifeVal !== undefined ? match.lifeVal : def.lifeVal,
          unitLabel: match.unitLabel || def.unitLabel,
          costPerUnit: match.costPerUnit !== undefined ? match.costPerUnit : def.costPerUnit,
        };
      }
      return def;
    });
  };

  const criticalWearParts = getStandard5WearParts();
  const actualPartsWearPerUnit = criticalWearParts.reduce((acc, p) => acc + (Number(p.costPerUnit) || 0), 0);
  const formulaWearRate = calculateMachineWearPartsRate(machine);

  const wearAllowancePerUnit = formulaWearRate > 0 
    ? formulaWearRate 
    : (actualPartsWearPerUnit > 0 
        ? Math.round(actualPartsWearPerUnit * 1000) / 1000 
        : (maintenanceRatePct > 0 ? Math.round(baseCostPerUnit * (maintenanceRatePct / 100) * 1000) / 1000 : 0));

  const calculatedNetRate = Math.round((baseCostPerUnit + wearAllowancePerUnit) * 1000) / 1000;
  const netCostPerUnit = calculatedNetRate > 0
    ? calculatedNetRate
    : (machine.costPerConsumptionUnit || machine.calculatedCostPerPage || 0);

  // Direct updater for wear components in Master Data
  const handleUpdateWearPart = (part: any, newCost?: number, newLife?: number) => {
    const updatedCost = newCost !== undefined ? Number(newCost) : Number(part.cost);
    const updatedLife = newLife !== undefined ? Number(newLife) : Number(part.lifeVal);
    const costPerUnit = updatedLife > 0 ? (updatedCost / updatedLife) : 0;

    const currentComponents = Array.isArray(machine.components) ? [...machine.components] : [];
    const existingIndex = currentComponents.findIndex((c: any) => c.name?.toLowerCase() === part.name.toLowerCase());

    const updatedComponentObj = {
      ...part,
      cost: updatedCost,
      lifeVal: updatedLife,
      costPerUnit,
    };

    if (existingIndex >= 0) {
      currentComponents[existingIndex] = {
        ...currentComponents[existingIndex],
        ...updatedComponentObj,
      };
    } else {
      currentComponents.push(updatedComponentObj);
    }

    const updatedSpecs = {
      ...(machine.specs || {}),
      ...(part.keyCost ? { [part.keyCost]: updatedCost } : {}),
      ...(part.keyLife ? { [part.keyLife]: updatedLife } : {}),
    };

    const newWearRate = currentComponents.reduce((acc: number, c: any) => acc + (Number(c.costPerUnit) || 0), 0);
    const newNetRate = Math.round((baseCostPerUnit + newWearRate) * 1000) / 1000;

    updateEquipment(machine.id, {
      specs: updatedSpecs,
      components: currentComponents,
      ...(part.keyCost ? { [part.keyCost]: updatedCost } : {}),
      ...(part.keyLife ? { [part.keyLife]: updatedLife } : {}),
      costPerConsumptionUnit: newNetRate,
      calculatedCostPerPage: newNetRate,
      maintenanceCostPerPage: newNetRate,
    });
  };

  useEffect(() => {
    if (!isEditingCoreParams) {
      setEditPrice(assetValue);
      setEditCapacity(targetLifetimeCapacity);
    }
  }, [assetValue, targetLifetimeCapacity, isEditingCoreParams]);

  const handleSaveCoreParams = () => {
    const finalPrice = Math.max(0, Number(editPrice));
    const finalCap = Math.max(1, Number(editCapacity));
    const newBase = finalCap > 0 ? (finalPrice / finalCap) : 0;
    const nRate = Math.round((newBase + wearAllowancePerUnit) * 1000) / 1000;

    updateEquipment(machine.id, {
      price: finalPrice,
      unitPrice: finalPrice,
      MachinePrice: finalPrice,
      purchaseCost: finalPrice,
      purchasePrice: finalPrice,
      totalPrice: finalPrice,
      TargetTotalPages: finalCap,
      printedPagesCapacity: finalCap,
      expectedLifeA4Pages: isPrinter ? finalCap : undefined,
      specs: {
        ...(machine.specs || {}),
        price: finalPrice,
        purchaseCost: finalPrice,
        expectedLife: finalCap,
        expectedLifeA4Pages: isPrinter ? finalCap : undefined,
      },
      costPerConsumptionUnit: nRate,
      calculatedCostPerPage: nRate,
      maintenanceCostPerPage: nRate
    });

    setIsEditingCoreParams(false);
    showToast(currentLang === 'lo' ? 'ບັນທຶກພາຣາມິເຕີຕົ້ນທຶນເຄື່ອງຈັກສຳເລັດ' : 'Saved core machine parameters successfully', 'success');
  };

  const handleSaveAllWearParts = () => {
    const currentComponents = Array.isArray(machine.components) ? [...machine.components] : [];
    const updatedSpecs = { ...(machine.specs || {}) };

    criticalWearParts.forEach((part: any) => {
      const draft = wearPartsDraft[part.name];
      if (draft) {
        const updatedCost = draft.cost;
        const updatedLife = draft.life;
        const costPerUnit = updatedLife > 0 ? (updatedCost / updatedLife) : 0;

        const existingIndex = currentComponents.findIndex((c: any) => c.name?.toLowerCase() === part.name.toLowerCase());
        const updatedObj = {
          ...part,
          cost: updatedCost,
          lifeVal: updatedLife,
          costPerUnit
        };
        if (existingIndex >= 0) {
          currentComponents[existingIndex] = { ...currentComponents[existingIndex], ...updatedObj };
        } else {
          currentComponents.push(updatedObj);
        }

        if (part.keyCost) updatedSpecs[part.keyCost] = updatedCost;
        if (part.keyLife) updatedSpecs[part.keyLife] = updatedLife;
      }
    });

    const newWearRate = currentComponents.reduce((acc: number, c: any) => acc + (Number(c.costPerUnit) || 0), 0);
    const newNetRate = Math.round((baseCostPerUnit + newWearRate) * 1000) / 1000;

    updateEquipment(machine.id, {
      specs: updatedSpecs,
      components: currentComponents,
      costPerConsumptionUnit: newNetRate,
      calculatedCostPerPage: newNetRate,
      maintenanceCostPerPage: newNetRate
    });

    setIsEditingWearParts(false);
    showToast(currentLang === 'lo' ? 'ບັນທຶກລາຄາ ແລະ ອາຍຸອະໄຫຼ່ສຳເລັດ' : 'Saved wear parts successfully', 'success');
  };

  // Comprehensive Live Inks from PostgreSQL Database for accurate real-time costing
  const [dbInks, setDbInks] = useState<any[]>([]);

  useEffect(() => {
    const p1 = fetch('/api/inbound', { headers: getAuthHeaders() })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const items = Array.isArray(data) ? data : (data?.data || []);
        return items.filter((i: any) => {
          const c = (i.category || '').toUpperCase();
          const sku = (i.skuCode || i.id || '').toUpperCase();
          const name = (i.itemName || i.name || '').toUpperCase();
          return c.includes('INK') || name.includes('INK') || name.includes('TONER') || name.includes('ໝຶກ') || sku.startsWith('INK');
        }).map((m: any) => ({
          id: m.specs?.sku || m.specs?.inkCode || m.skuCode || m.id,
          sku: m.specs?.sku || m.specs?.inkCode || m.skuCode || m.id,
          skuCode: m.specs?.sku || m.specs?.inkCode || m.skuCode || m.id,
          name: m.itemName || m.name || m.skuCode || m.id,
          category: m.category || 'Ink',
          colorGroup: m.specs?.colorGroup || m.colorGroup || 'Black',
          stockQty: Number(m.quantity || 0),
          unitPrice: Number(m.unitPrice || m.costPerPurchaseUnit || (m.totalPrice && m.quantity ? Math.round(Number(m.totalPrice) / Number(m.quantity)) : 0)),
          costPerPurchaseUnit: Number(m.costPerPurchaseUnit || m.unitPrice || 0),
          volume: Number(m.specs?.volume || m.specs?.volume_ml || 140),
          yield: Number(m.specs?.yield || m.specs?.expectedYield || m.specs?.isoYield || m.yield || 0),
          specs: m.specs || {}
        }));
      })
      .catch(() => []);

    const p2 = fetch('/api/inventory/items', { headers: getAuthHeaders() })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const items = Array.isArray(data) ? data : (data?.data || []);
        return items.filter((i: any) => {
          const c = (i.category || '').toUpperCase();
          const sku = (i.skuCode || i.sku || i.id || '').toUpperCase();
          const name = (i.name || '').toUpperCase();
          return c.includes('INK') || name.includes('INK') || name.includes('TONER') || name.includes('ໝຶກ') || sku.startsWith('INK');
        }).map((m: any) => ({
          id: m.specs?.sku || m.specs?.inkCode || m.id || m.sku || m.inkCode,
          sku: m.specs?.sku || m.specs?.inkCode || m.sku || m.inkCode || m.id,
          skuCode: m.specs?.sku || m.specs?.inkCode || m.sku || m.inkCode || m.id,
          name: m.name || m.id,
          category: m.category || 'Ink',
          colorGroup: m.specs?.colorGroup || m.colorGroup || 'Black',
          unitPrice: Number(m.unitPrice || m.costPerPurchaseUnit || 0),
          costPerPurchaseUnit: Number(m.costPerPurchaseUnit || m.unitPrice || 0),
          volume: Number(m.specs?.volume || m.specs?.volume_ml || 140),
          yield: Number(m.specs?.yield || m.specs?.expectedYield || m.specs?.isoYield || m.yield || 0),
          specs: m.specs || {}
        }));
      })
      .catch(() => []);

    Promise.all([p1, p2]).then(([inbInks, matInks]) => {
      setDbInks([...(inbInks || []), ...(matInks || [])]);
    });
  }, []);

  const allAvailableInks = [...inventory, ...dbInks];

  // Extract OEM Baseline Slots (from inbound or specs)
  const oemBaselineSlots = 
    machine?.oem_baseline_specs?.slots || 
    machine?.specs?.oem_baseline_specs?.slots || 
    machine?.oemBaselineInks || 
    machine?.specs?.oemBaselineInks || 
    [
      { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500, oemPrice: 450000 },
      { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
      { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
      { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 }
    ];

  const equipmentCostResult = calculateEquipmentPrintCost(
    machine,
    printerColorLinks,
    allAvailableInks,
    machine?.category
  );

  // Authoritative ink cost: prioritize persistent actual linked ink cost from machine (e.g. 60.17 LAK)
  const persistentColorInkCost = Number(
    machine?.colorInkCost || 
    machine?.linkedInkCostPerPage || 
    (machine?.specs as any)?.colorInkCost || 
    (machine?.specs as any)?.linkedInkCostPerPage || 
    0
  );
  
  const cachedBreakdown = (machine?.specs as any)?.inkSlotsBreakdown || [];

  // Effective cost: persistent actual linked cost takes precedence over fallback estimation
  const effectiveInkCost = persistentColorInkCost > 0 
    ? persistentColorInkCost 
    : equipmentCostResult.linkedInkRatePerPage;

  const totalLinkedInkCostPerPage = !isPostPressMachine ? effectiveInkCost : 0;

  // Breakdown details: prioritize cached actual breakdown from linked slots
  const linkedInksDetails = cachedBreakdown.length > 0 
    ? cachedBreakdown 
    : equipmentCostResult.inkSlotsBreakdown;

  const grandTotalCostPerPage = Math.round((netCostPerUnit + totalLinkedInkCostPerPage) * 100) / 100;



  const roiPercent = targetLifetimeCapacity > 0 ? Math.min(100, (currentMeterCount / targetLifetimeCapacity) * 100) : 0;
  const recoveredValue = currentMeterCount * baseCostPerUnit;
  const remainingValue = Math.max(0, assetValue - recoveredValue);
  const maintenanceReserveAccrued = currentMeterCount * wearAllowancePerUnit;

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 font-sans pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-100 rounded-2xl border border-slate-200 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ກັບໜ້າຈັດຮາຍການເຄື່ອງຈັກ' : 'Back to Machinery'}</span>
          </button>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>{machine.name}</span>
            </h2>
            <p className="text-xs font-semibold text-slate-400">ID: {machine.id} | S/N: {machine.serialNumber || machine.sn || '-'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
            isCritical 
              ? 'text-red-600 bg-red-50 border-red-200 animate-pulse' 
              : 'text-emerald-700 bg-emerald-50 border-emerald-200'
          }`}>
            {isCritical ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span>{isCritical ? (currentLang === 'lo' ? 'ຕ້ອງບຳລຸງຮັກສາ' : 'Service Required') : (currentLang === 'lo' ? 'ພ້ອມໃຊ້ງານ' : 'Operational')}</span>
          </span>

          <span className="px-3 py-1 bg-sky-50 text-sky-700 font-mono font-black text-xs rounded-full border border-sky-200 uppercase">
            {subtypeLabel}
          </span>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-xl border border-sky-200 transition cursor-pointer active:scale-95"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>{currentLang === 'lo' ? 'ແກ້ໄຂໂປຣໄຟລ໌' : 'Edit Profile'}</span>
          </button>

          <DeleteActionButton onClick={() => setIsDeleteModalOpen(true)} />
        </div>
      </div>

      {/* COMPREHENSIVE COST-PER-PAGE & PRODUCTION OVERHEAD ENGINE CARD */}
      <div className="bg-white p-6 rounded-3xl border border-sky-200/80 shadow-md space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 text-sky-700">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>{currentLang === 'lo' ? 'ສະຫຼຸບຕົ້ນທຶນການພິມຕໍ່ໜ້າ / ຕໍ່ແຜ່ນ ລວມຍອດ (Total Direct Print Cost Breakdown)' : 'Total Direct Print Cost Breakdown'}</span>
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {currentLang === 'lo'
                  ? 'ຄິດໄລ່ຈາກ: ຄ່າເສື່ອມເຄື່ອງຈັກ + ຄ່າບຳລຸງຮັກສາ/ສວມເສຍ + ຕົ້ນທຶນນ້ຳໝຶກ CMYK ຈາກສາງສິນຄ້າ'
                  : 'Calculated from: Machine Depreciation + Maintenance Reserve + Linked Direct Inks'}
              </p>
            </div>
          </div>

          <div className="bg-sky-50/80 px-5 py-3 rounded-2xl border border-sky-200 text-right shrink-0">
            <span className="text-[10px] uppercase font-black text-sky-800 block tracking-wider">
              {currentLang === 'lo' ? 'ຕົ້ນທຶນລວມການພິມສຸດທິ / ໜ້າ' : 'Grand Total Direct Cost / Page'}
            </span>
            <span className="text-xl font-black font-mono text-sky-700">
              {formatUnitLAK(grandTotalCostPerPage)} <span className="text-xs font-bold text-slate-500">/ {machineUnitLabel}</span>
            </span>
          </div>
        </div>

        {/* Visual Equation Formula Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-black block">
              {currentLang === 'lo' ? '1. ຄ່າເສື່ອມເຄື່ອງຈັກ' : '1. Machine Depreciation'}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black font-mono text-slate-900">{formatUnitLAK(baseCostPerUnit)}</span>
              <span className="text-[10px] text-slate-400 font-bold">/ {machineUnitLabel}</span>
            </div>
            <span className="text-[9px] text-slate-400 block truncate">
              {formatLAK(assetValue)} / {targetLifetimeCapacity.toLocaleString()}
            </span>
          </div>

          <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-1">
            <span className="text-[10px] text-indigo-700 uppercase font-black block">
              {currentLang === 'lo' ? '2. ອະໄຫຼ່ສິ້ນເປືອງ (Wear Parts)' : '2. Wear Parts Rate'}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black font-mono text-indigo-700">+{formatUnitLAK(wearAllowancePerUnit)}</span>
              <span className="text-[10px] text-indigo-400 font-bold">/ {machineUnitLabel}</span>
            </div>
            <span className="text-[9px] text-indigo-500 block truncate">
              {currentLang === 'lo' ? 'ໄລ່ຕາມຕົ້ນທຶນອະໄຫຼ່ສິ້ນເປືອງຕາມຈິງ' : 'Itemized wear parts rate'}
            </span>
          </div>

          {!isPostPressMachine ? (
            <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-1">
              <span className="text-[10px] text-purple-700 uppercase font-black block">
                {currentLang === 'lo' 
                  ? `3. ຕົ້ນທຶນນ້ຳໝຶກ (${linkedInksDetails.length > 0 ? linkedInksDetails.length : 4} ສີ)` 
                  : `3. Linked Inks Cost (${linkedInksDetails.length > 0 ? linkedInksDetails.length : 4} Colors)`}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-black font-mono text-purple-700">+{formatUnitLAK(totalLinkedInkCostPerPage)}</span>
                <span className="text-[10px] text-purple-400 font-bold">/ ໜ້າ A4</span>
              </div>
              <span className="text-[9px] text-purple-500 block truncate">
                {linkedInksDetails.length > 0 
                  ? linkedInksDetails.map(i => `${i.colorGroup || i.slot}: ${formatUnitLAK(i.costPerPage)}`).join(' | ') 
                  : (totalLinkedInkCostPerPage > 0 
                      ? `${currentLang === 'lo' ? 'ຕົ້ນທຶນສະເລ່ຍ' : 'Average cost'}: ${formatUnitLAK(totalLinkedInkCostPerPage)}` 
                      : (currentLang === 'lo' ? 'ຍັງບໍ່ໄດ້ຜູກໝຶກ' : 'No inks linked'))}
              </span>

            </div>
          ) : (
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 space-y-1">
              <span className="text-[10px] text-amber-700 uppercase font-black block">
                {currentLang === 'lo' ? '3. ຄ່າສວມໃບມີດ/ອຸປະກອນ' : '3. Tooling Wear'}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-black font-mono text-amber-700">+0 LAK</span>
                <span className="text-[10px] text-amber-400 font-bold">/ ແຜ່ນ</span>
              </div>
              <span className="text-[9px] text-amber-500 block truncate">
                {currentLang === 'lo' ? 'ລວມໃນຄ່າບຳລຸງຮັກສາແລ້ວ' : 'Included in maint rate'}
              </span>
            </div>
          )}

          <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 space-y-1">
            <span className="text-[10px] text-emerald-800 uppercase font-black block">
              {currentLang === 'lo' ? '4. ຕົ້ນທຶນລວມສຸດທິ (Total)' : '4. Net Combined Rate'}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black font-mono text-emerald-700">={formatUnitLAK(grandTotalCostPerPage)}</span>
              <span className="text-[10px] text-emerald-600 font-bold">/ {isPostPressMachine ? 'ແຜ່ນ' : 'ໜ້າ'}</span>
            </div>
            <span className="text-[9px] text-emerald-600 font-bold block truncate">
              {currentLang === 'lo' ? 'ຄ່າເສື່ອມ + ບຳລຸງ + ໝຶກ' : 'Amortized + Maint + Ink'}
            </span>
          </div>
        </div>


        {/* Machine Lifetime Utilization & Financial Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {currentLang === 'lo' ? 'ຍອດຜະລິດສະສົມຕົວຈິງ' : 'Current Output Reading'}
            </span>
            <span className="text-xs font-mono font-black text-slate-900 mt-0.5 block">
              {currentMeterCount.toLocaleString()} {machineUnitLabel}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {currentLang === 'lo' ? 'ເປົ້າໝາຍຕະຫຼອດອາຍຸງານ' : 'Rated Lifetime Capacity'}
            </span>
            <span className="text-xs font-mono font-black text-slate-900 mt-0.5 block">
              {targetLifetimeCapacity.toLocaleString()} {machineUnitLabel}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {currentLang === 'lo' ? 'ອັດຕາການໃຊ້ງານສະສົມ' : 'Lifetime Utilization'}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono font-black text-indigo-700">
                {roiPercent.toFixed(1)}%
              </span>
              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden max-w-[80px]">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, roiPercent)}%` }}
                />
              </div>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {currentLang === 'lo' ? 'ມູນຄ່າເຄື່ອງຈັກຄົງເຫຼືອ (Book Value)' : 'Remaining Book Value'}
            </span>
            <span className="text-xs font-mono font-black text-emerald-700 mt-0.5 block">
              {formatLAK(remainingValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('specs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === 'specs'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>{currentLang === 'lo' ? 'ໂປຣໄຟລ໌ & ສະເປັກເຕັກນິກ' : 'Profile & Technical Specs'}</span>
        </button>

        {!isPostPressMachine && (
          <button
            onClick={() => setActiveTab('meter')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
              activeTab === 'meter'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>{currentLang === 'lo' ? `ບັນທຶກມິເຕີ (${machineReadings.length})` : `Daily/Weekly Meter Log (${machineReadings.length})`}</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === 'maintenance'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>{currentLang === 'lo' ? `ປະຫວັດບຳລຸງຮັກສາ & ເຄື່ອງຢຸດ (${machineDowntimes.length})` : `Maintenance & Downtime (${machineDowntimes.length})`}</span>
        </button>

        {!isPostPressMachine && (
          <button
            onClick={() => setActiveTab('inks')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
              activeTab === 'inks'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{currentLang === 'lo' ? `ໝຶກພິມ & ອຸປະກອນສິ້ນເປືອງ (${linkedLinks.length})` : `Linked Inks & Consumables (${linkedLinks.length})`}</span>
          </button>
        )}
      </div>

      {/* TAB CONTENT 1: SPECS & GENERAL (Categories 1, 2, 3, 5) */}
      {activeTab === 'specs' && (
        <div className="space-y-6">
          {/* CATEGORY 1: General & Visuals */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-600" />
              <span>{currentLang === 'lo' ? 'ໝວດ 1: ຂໍ້ມູນທົ່ວໄປ & ຮູບພາບ (General & Visuals)' : 'Category 1: General & Visuals'}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-4 flex justify-center">
                {resolveMachineImage(machine) ? (
                  <img 
                    src={resolveMachineImage(machine)!} 
                    alt={machine.name} 
                    className="w-full max-h-60 object-contain rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner"
                  />
                ) : (
                  <div className="w-full h-48 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Printer className="w-12 h-12 text-slate-300" />
                    <span className="text-xs font-bold">{currentLang === 'lo' ? 'ບໍ່ມີຮູບພາບ' : 'No Product Image'}</span>
                  </div>
                )}
              </div>
              <div className="md:col-span-8 grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ລະຫັດຊັບສິນ (Asset ID)' : 'Asset ID'}</span>
                  <span className="text-sm text-slate-900 font-mono block mt-1">{machine.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ໝາຍເລກຊີຣຽວ (S/N)' : 'Serial Number (S/N)'}</span>
                  <span className="text-sm text-slate-900 font-mono block mt-1">{machine.serialNumber || machine.sn || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ແບຣນ / ຍີ່ຫໍ້' : 'Brand / Make'}</span>
                  <span className="text-sm text-slate-900 block mt-1">{machine.brand || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ລຸ້ນໂມເດວ (Model)' : 'Model'}</span>
                  <span className="text-sm text-slate-900 block mt-1">{machine.model || machine.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">
                    {isPostPressMachine ? (currentLang === 'lo' ? 'ປະເພດເຄື່ອງຈັກຫຼັງພິມ' : 'Subtype') : (currentLang === 'lo' ? 'ໝວດໝູ່ເຄື່ອງພິມ' : 'Printer Category')}
                  </span>
                  <span className="text-sm text-sky-700 font-black block mt-1">{subtypeLabel}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ສະຖານທີ່ຕັ້ງ / ພະແນກ' : 'Location / Department'}</span>
                  <span className="text-sm text-slate-900 block mt-1">{machine.location || 'Main Dept'}</span>
                </div>
                {!isPostPressMachine && (
                  <>
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຮູບແບບລະບົບສີ' : 'Color Scheme Type'}</span>
                      <span className="text-sm text-slate-900 block mt-1">{machine.colorSchemeType || machine.specs?.colorSchemeType || 'CMYK'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຈຳນວນຊ່ອງໃສ່ສີ (Slots)' : 'Total Color Slots'}</span>
                      <span className="text-sm text-slate-900 font-mono block mt-1">{machine.totalColorSlots || machine.totalSlots || 4}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* CATEGORY 2: Technical Specifications */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-purple-600" />
              <span>
                {currentLang === 'lo' 
                  ? `ໝວດ 2: ສະເປັກເຕັກນິກ (${isPostPressMachine ? 'Post-Press Machinery Specs' : 'Technical Specifications'})` 
                  : `Category 2: ${isPostPressMachine ? 'Post-Press Machinery Specs' : 'Technical Specifications'}`}
              </span>
            </h3>

            {isPostPressMachine ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-bold text-slate-600">
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ປະເພດເຄື່ອງຈັກ (Subtype)' : 'Subtype'}</span>
                    <span className="text-xs text-sky-700 font-extrabold block mt-1">{subtypeLabel}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ອາຍຸການໃຊ້ງານ (Lifespan)' : 'Lifespan'}</span>
                    <span className="text-xs text-slate-900 font-mono block mt-1">{lifespanYears} {currentLang === 'lo' ? 'ປີ' : 'Years'} ({totalMonths} {currentLang === 'lo' ? 'ເດືອນ' : 'Mos'})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຍອດຜະລິດ/ເດືອນ (Monthly Vol)' : 'Monthly Vol'}</span>
                    <span className="text-xs text-slate-900 font-mono block mt-1">{estMonthlyVolume.toLocaleString()} {currentLang === 'lo' ? 'ແຜ່ນ/ເດືອນ' : 'sheets/mo'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ອັດຕາບຳລຸງຮັກສາ (Maint %)' : 'Maint Allowance'}</span>
                    <span className="text-xs text-emerald-600 font-mono font-black block mt-1">+{maintenanceRatePct}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຄ່າເສື່ອມພື້ນຖານ / ແຜ່ນ' : 'Base Depr / Sheet'}</span>
                    <span className="text-xs text-slate-900 font-mono block mt-1">{formatLAK(baseCostPerUnit)} / ແຜ່ນ</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? `ຄ່າບຳລຸງຮັກສາ (+${maintenanceRatePct}%)` : `Wear & Maint (+${maintenanceRatePct}%)`}</span>
                    <span className="text-xs text-emerald-600 font-mono block mt-1">+{formatLAK(wearAllowancePerUnit)} / ແຜ່ນ</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຕົ້ນທຶນຄ່າເສື່ອມສຸດທິ / ແຜ່ນ' : 'Net Effective Rate'}</span>
                    <span className="text-xs text-sky-700 font-mono font-black block mt-1">{formatLAK(netCostPerUnit)} / ແຜ່ນ</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ເປົ້າໝາຍຜະລິດທັງໝົດ' : 'Lifetime Target'}</span>
                    <span className="text-xs text-slate-900 font-mono block mt-1">{targetLifetimeCapacity.toLocaleString()} ແຜ່ນ</span>
                  </div>
                </div>

                {/* Render any additional dynamic specs inside machine.specs if present */}
                {machine.specs && typeof machine.specs === 'object' && (() => {
                  const validEntries = Object.entries(machine.specs).filter(([key, val]) => {
                    if (val === null || val === undefined || val === '') return false;
                    if (['postPressSubtype', 'lifespanYears', 'estMonthlyVolume', 'maintenanceRatePercent', 'netCostPerUnit'].includes(key)) return false;
                    return true;
                  });
                  if (validEntries.length === 0) return null;
                  
                  const labelMap: Record<string, string> = {
                    laminationWidth: 'ຄວາມກວ້າງການເຄືອບສູງສຸດ (Max Lamination Width)',
                    warmUpTime: 'ເວລາອຸ່ນເຄື່ອງ (Warm-Up Time Mins)',
                    speedMPerMin: 'ຄວາມໄວໃນການເຄືອບ (Speed m/min)',
                    bindingMethod: 'ຮູບແບບການເຂົ້າເລັ້ມ (Binding Method)',
                    maxBookSheets: 'ຈຳນວນແຜ່ນສູງສຸດຕໍ່ເລັ້ມ (Max Sheets/Book)',
                    avgTimePerBook: 'ເວລາສະເລ່ຍຕໍ່ເລັ້ມ (Avg Mins/Book)',
                    cutCapacity: 'ຄວາມຈຸໃນການຕັດສູງສຸດ (Max Cut Capacity)',
                    bladeDepreciationPerCut: 'ຄ່າຫຼຸ້ຍຫ້ຽນໃບມີດຕໍ່ຄັ້ງ (Blade Wear/Cut LAK)',
                    maxCuttingWidthMm: 'ຄວາມກວ້າງການຕັດສູງສຸດ (Max Cut Width mm)',
                    maxCuttingDepthMm: 'ຄວາມເລິກການຕັດສູງສຸດ (Max Cut Depth mm)',
                    minCuttingDepthMm: 'ຄວາມເລິກການຕັດຕໍ່າສຸດ (Min Cut Depth mm)',
                    clampPressureKn: 'ແຮງກົດທັບໄຮໂດຼລິກ (Clamp Pressure kN)',
                    opticalCutLine: 'ເສັ້ນແສງນຳຕັດ (Optical Cut Line)',
                    maxLaminatingWidthMm: 'ຄວາມກວ້າງເຄືອບສູງສຸດ (Max Laminating Width mm)',
                    maxSpeedMMin: 'ຄວາມໄວການເຄືອບສູງສຸດ (Max Speed m/min)',
                    rollerTempMaxC: 'ອຸນຫະພູມລູກກິ້ງສູງສຸດ (Max Temp °C)',
                    supportsHotCold: 'ລະບົບເຄືອບ (Hot/Cold Support)',
                    maxBindingLengthMm: 'ຄວາມຍາວເຂົ້າເລັ້ມສູງສຸດ (Max Binding Length mm)',
                    maxBindingThicknessMm: 'ຄວາມໜາສູງສຸດ (Max Thickness mm)',
                    millingCutterIncluded: 'ຊຸດກີດສັນເຈ້ຍ (Milling Cutter)',
                    bindingSpeedBooksPerHr: 'ຄວາມໄວເຂົ້າເລັ້ມ (Speed Books/Hr)',
                    operatingPowerWatts: 'ກຳລັງໄຟຟ້າຂະນະແລ່ນ (Operating Power Watts)',
                    warmupSeconds: 'ເວລາອຸ່ນເຄື່ອງ (Warm-up Seconds)'
                  };

                  return (
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">
                        {currentLang === 'lo' ? 'ຄຸນລັກສະນະສະເພາະທາງເຕັກນິກ (Dynamic Master Specs)' : 'Dynamic Master Specs'}
                      </span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-slate-600">
                        {validEntries.map(([key, val]) => (
                          <div key={key}>
                            <span className="text-slate-400 uppercase text-[10px] block">{labelMap[key] || key}</span>
                            <span className="text-xs text-slate-900 block mt-1">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-bold text-slate-600">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຄວາມໄວໃນການພິມ (Print Speed)' : 'Print Speed (PPM)'}</span>
                  <span className="text-xs text-slate-900 font-bold block mt-1">
                    {machine.specs?.speedPpmBlack || machine.speedPpmBlack ? (
                      <span className="font-mono text-sky-800">
                        {machine.specs?.speedPpmBlack || machine.speedPpmBlack} PPM (B&W) / {machine.specs?.speedPpmColor || machine.speedPpmColor || machine.specs?.speedPpmBlack || machine.speedPpmBlack} PPM (Color)
                      </span>
                    ) : (
                      machine.speedPpm || machine.printSpeedColor || machine.printSpeed || machine.specs?.speedPpm || '70 PPM (B&W) / 65 PPM (Color)'
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ລະບົບສອງໜ້າ (Duplex)' : 'Duplex Support'}</span>
                  <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    {machine.specs?.duplexSupport === false || machine.duplexSupport === false ? 'Manual 1-Sided' : 'Auto-Duplex (2-Sided)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຊ່ວງຄວາມໜາກະດາດ' : 'Supported Grammage'}</span>
                  <span className="text-xs text-slate-900 font-mono block mt-1">
                    {machine.specs?.minPaperGsm || 52} - {machine.specs?.maxPaperGsm || 350} GSM
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຂະໜາດເຈ້ຍສູງສຸດ' : 'Max Paper Size'}</span>
                  <span className="text-xs text-slate-900 block mt-1">
                    {machine.specs?.maxPrintWidth && machine.specs?.maxPrintLength 
                      ? `${machine.specs.maxPrintWidth} x ${machine.specs.maxPrintLength} mm`
                      : (machine.maxWidth || machine.paperSizes || machine.specs?.maxWidth || 'A3+ (329 x 483 mm)')}
                    {(machine.specs?.sra3Support || machine.sra3Support) && (
                      <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                        SRA3 Ready
                      </span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">
                    {!isInkjet && !isCutter 
                      ? (currentLang === 'lo' ? 'ກຳລັງໄຟ & ອຸ່ນເຄື່ອງ' : 'Power & Warm-up') 
                      : (currentLang === 'lo' ? 'ກຳລັງໄຟຟ້າຂະນະແລ່ນ' : 'Operating Power')}
                  </span>
                  <span className="text-xs text-slate-900 font-mono block mt-1">
                    {machine.specs?.operatingWatts || machine.specs?.machineOperatingWatts || machine.specs?.operatingPowerWatts || (isInkjet ? 350 : 1500)} W
                    {!isInkjet && !isCutter && (
                      ` (${machine.specs?.warmupSeconds || (machine.specs?.warmUpTimeMins ? machine.specs.warmUpTimeMins * 60 : 60)}s Warmup)`
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ປະເພດໝຶກພິມ (Ink Type)' : 'Ink Type'}</span>
                  <span className="text-xs text-slate-900 block mt-1">{machine.inkType || machine.specs?.inkType || 'Pigment / Dye Ink'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ເທັກໂນໂລຢີການພິມ' : 'Print Tech'}</span>
                  <span className="text-xs text-slate-900 block mt-1">{machine.printTech || machine.specs?.printTech || 'Production Digital Press'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ປະລິມານພິມໝຶກດຳ ISO' : 'Black ISO Yield (A4 5%)'}</span>
                  <span className="text-xs text-slate-900 font-mono block mt-1">{machine.blackYieldPages ? `${Number(machine.blackYieldPages).toLocaleString()} pages` : (machine.specs?.blackYieldPages ? `${Number(machine.specs.blackYieldPages).toLocaleString()} pages` : '7,500 pages')}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ປະລິມານພິມໝຶກສີ ISO' : 'Color ISO Yield (A4 5%)'}</span>
                  <span className="text-xs text-slate-900 font-mono block mt-1">{machine.colorYieldPages ? `${Number(machine.colorYieldPages).toLocaleString()} pages` : (machine.specs?.colorYieldPages ? `${Number(machine.specs.colorYieldPages).toLocaleString()} pages` : '6,000 pages')}</span>
                </div>
              </div>
            )}
          </div>

          {/* CATEGORY 3: Connectivity & Network */}
          {(machine.ipAddress || machine.ip || machine.macAddress || machine.mac || (machine.connectivity && machine.connectivity.length > 0)) && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-600" />
                <span>{currentLang === 'lo' ? 'ໝວດ 3: ການເຊື່ອມຕໍ່ & ລະບົບເຄືອຂ່າຍ (Connectivity & Network)' : 'Category 3: Connectivity & Network'}</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-bold text-slate-600">
                {machine.connectivity && machine.connectivity.length > 0 && (
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ພອດການເຊື່ອມຕໍ່' : 'Connectivity'}</span>
                    <span className="text-xs text-slate-900 block mt-1">{machine.connectivity.join(', ')}</span>
                  </div>
                )}
                {(machine.ipAddress || machine.ip) && (
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ໄອພີ (IP Address)' : 'IP Address'}</span>
                    <span className="text-xs text-slate-900 font-mono block mt-1">{machine.ipAddress || machine.ip}</span>
                  </div>
                )}
                {(machine.macAddress || machine.mac) && (
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ແມັກແອດເດຣສ (MAC Address)' : 'MAC Address'}</span>
                    <span className="text-xs text-slate-900 font-mono block mt-1">{machine.macAddress || machine.mac}</span>
                  </div>
                )}
                {machine.osCompatibility && machine.osCompatibility.length > 0 && (
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ລະບົບປະຕິບັດການ' : 'OS Compatibility'}</span>
                    <span className="text-xs text-slate-900 block mt-1">{machine.osCompatibility.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 5: Financial Metrics & Documents */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>{currentLang === 'lo' ? 'ໝວດ 5: ຕົ້ນທຶນ & ຄ່າເສື່ອມລາຄາ (Financial & Depreciation Metrics)' : 'Category 5: Financial & Depreciation Metrics'}</span>
            </h3>

            {/* Procurement Metadata Grid (Cleaned - No duplicate rate badges) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-slate-600 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/70">
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ວັນທີຊື້ / ນຳເຂົ້າ' : 'Purchase Date'}</span>
                <span className="text-xs font-black text-slate-900 block mt-1">{machine.purchaseDate || machine.importDate || machine.createdAt?.split('T')[0] || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຜູ້ສະໜອງ / ຕົວແທນ' : 'Vendor / Supplier'}</span>
                <span className="text-xs font-black text-slate-900 block mt-1 truncate">{machine.vendor || machine.importVendor || machine.supplier || 'Official Distributor'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ໝົດອາຍຸການຮັບປະກັນ' : 'Warranty Expiry'}</span>
                <span className="text-xs font-black text-slate-900 block mt-1">{machine.warrantyExpirationYear || machine.warrantyExpiration || '2028'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ສະຖານທີ່ຕິດຕັ້ງ' : 'Location'}</span>
                <span className="text-xs font-black text-slate-900 block mt-1 truncate">{machine.location || machine.specs?.location || 'Main Press Floor'}</span>
              </div>
            </div>

            {/* Core Asset & Lifetime Capacity Parameters */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                <span className="text-xs font-black text-slate-800 block uppercase tracking-wider">
                  {currentLang === 'lo' ? '1. ພາຣາມິເຕີຕົ້ນທຶນເຄື່ອງຈັກ & ອາຍຸການໃຊ້ງານ (Core Machine Asset & Lifetime)' : 'Core Machine Asset & Lifetime Parameters'}
                </span>

                {!isEditingCoreParams ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditPrice(assetValue);
                      setEditCapacity(targetLifetimeCapacity);
                      setIsEditingCoreParams(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-xl border border-sky-200 transition cursor-pointer active:scale-95 shadow-2xs self-start sm:self-auto"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{currentLang === 'lo' ? 'ແກ້ໄຂພາຣາມິເຕີ' : 'Edit Parameters'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={handleSaveCoreParams}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer active:scale-95 shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{currentLang === 'lo' ? 'ບັນທຶກ' : 'Save'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingCoreParams(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                    {currentLang === 'lo' ? '1. ລາຄາຊື້ເຄື່ອງຈັກ (LAK)' : '1. Purchase Price (LAK)'}
                  </label>
                  {isEditingCoreParams ? (
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step={100000}
                        value={editPrice === 0 ? '' : editPrice}
                        placeholder="0"
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 pr-12 bg-white border-2 border-sky-400 rounded-xl font-mono text-xs font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition shadow-2xs"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">LAK</span>
                    </div>
                  ) : (
                    <div className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-black text-slate-900 flex items-center justify-between shadow-2xs h-[42px]">
                      <span>{formatLAK(assetValue)}</span>
                      <span className="text-[10px] text-slate-400 font-bold">LAK</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                    {currentLang === 'lo' ? `2. ອາຍຸການໃຊ້ງານລວມ (${machineUnitLabel})` : `2. Lifetime Capacity (${machineUnitEn})`}
                  </label>
                  {isEditingCoreParams ? (
                    <div className="relative">
                      <input
                        type="number"
                        min={100}
                        step={1000}
                        value={editCapacity === 0 ? '' : editCapacity}
                        placeholder="200000"
                        onChange={(e) => setEditCapacity(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 pr-16 bg-white border-2 border-sky-400 rounded-xl font-mono text-xs font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition shadow-2xs"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 truncate max-w-[50px]">{machineUnitEn}</span>
                    </div>
                  ) : (
                    <div className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-black text-slate-900 flex items-center justify-between shadow-2xs h-[42px]">
                      <span>{targetLifetimeCapacity.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{machineUnitLabel}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                    {currentLang === 'lo' ? '3. ຄ່າເສື່ອມເຄື່ອງຈັກພື້ນຖານ' : '3. Base Machine Rate'}
                  </label>
                  <div className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 flex items-center justify-between shadow-2xs h-[42px]">
                    <span className="text-emerald-700 font-black">
                      {isEditingCoreParams
                        ? formatUnitLAK(editCapacity > 0 ? (editPrice / editCapacity) : 0)
                        : formatUnitLAK(baseCostPerUnit)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">LAK / {machineUnitLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Itemized Wear Parts Table (ອະໄຫຼ່ສິ້ນເປືອງປະຈຳເຄື່ອງຈັກ) */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      {currentLang === 'lo' ? '2. ລາຍການອະໄຫຼ່ສິ້ນເປືອງ & ອັດຕາຕົ້ນທຶນບຳລຸງຮັກສາ (Itemized Wear Parts)' : 'Itemized Wear Parts & Maintenance Allowance'}
                    </h4>
                    <p className="text-[10px] font-semibold text-slate-500">
                      {currentLang === 'lo' 
                        ? 'ດຶງຂໍ້ມູນອະໄຫຼ່ຕາມສູດ Master Data: ຕົ້ນທຶນຕໍ່ໜ່ວຍ = ລາຄາຊື້ອະໄຫຼ່ ÷ ຮອບອາຍຸການໃຊ້ງານ' 
                        : 'Derived from Master Data: Unit Rate = Replacement Cost ÷ Rated Lifespan'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditingWearParts ? (
                    <button
                      type="button"
                      onClick={() => {
                        const initDraft: Record<string, { cost: number; life: number }> = {};
                        criticalWearParts.forEach((p: any) => {
                          initDraft[p.name] = { cost: p.cost, life: p.lifeVal };
                        });
                        setWearPartsDraft(initDraft);
                        setIsEditingWearParts(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{currentLang === 'lo' ? 'ແກ້ໄຂອະໄຫຼ່' : 'Edit Parts'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveAllWearParts}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer active:scale-95 shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{currentLang === 'lo' ? 'ບັນທຶກ' : 'Save'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingWearParts(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Table of Wear Parts */}
              <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 text-slate-600 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">{currentLang === 'lo' ? 'ຊື່ຊິ້ນສ່ວນອະໄຫຼ່' : 'Wear Component'}</th>
                      <th className="py-2.5 px-3 text-right">{currentLang === 'lo' ? 'ລາຄາຊື້ປ່ຽນໃໝ່ (LAK)' : 'Replacement Cost (LAK)'}</th>
                      <th className="py-2.5 px-3 text-right">{currentLang === 'lo' ? 'ຮອບອາຍຸການໃຊ້ງານ' : 'Rated Lifespan'}</th>
                      <th className="py-2.5 px-3 text-right">{currentLang === 'lo' ? 'ຕົ້ນທຶນສະເລ່ຍ / ໜ່ວຍ' : 'Rate / Unit'}</th>
                      <th className="py-2.5 px-3 text-center">{currentLang === 'lo' ? 'ສະຖານະ SLA' : 'SLA Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {criticalWearParts.map((part: any, idx: number) => {
                      const usage = Number(part.usage || 0);
                      const isCritical = usage >= 90;
                      const isWarning = usage >= 70 && usage < 90;
                      const badgeClass = isCritical
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : isWarning
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      const statusLabel = isCritical
                        ? (currentLang === 'lo' ? 'ຕ້ອງປ່ຽນທັນທີ' : 'Critical')
                        : isWarning
                        ? (currentLang === 'lo' ? 'ໃກ້ຮອດກຳນົດ' : 'Warning')
                        : (currentLang === 'lo' ? 'ປົກກະຕິ' : 'Good');

                      const currentCost = isEditingWearParts ? (wearPartsDraft[part.name]?.cost ?? part.cost) : part.cost;
                      const currentLife = isEditingWearParts ? (wearPartsDraft[part.name]?.life ?? part.lifeVal) : part.lifeVal;
                      const currentRate = currentLife > 0 ? (currentCost / currentLife) : 0;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 block text-xs">
                              {part.nameLo || part.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              {part.name}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isEditingWearParts ? (
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  step={10000}
                                  value={currentCost}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setWearPartsDraft(prev => ({
                                      ...prev,
                                      [part.name]: {
                                        cost: val,
                                        life: prev[part.name]?.life ?? part.lifeVal
                                      }
                                    }));
                                  }}
                                  className="w-28 px-2 py-1 bg-white border-2 border-amber-400 rounded-lg font-mono text-xs font-bold text-right text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                                />
                                <span className="text-[10px] text-slate-400 font-bold">LAK</span>
                              </div>
                            ) : (
                              <span className="font-mono font-bold text-slate-900">
                                {formatLAK(part.cost)} <span className="text-[10px] text-slate-400 font-normal">LAK</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isEditingWearParts ? (
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <input
                                  type="number"
                                  min={1}
                                  step={1000}
                                  value={currentLife}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setWearPartsDraft(prev => ({
                                      ...prev,
                                      [part.name]: {
                                        cost: prev[part.name]?.cost ?? part.cost,
                                        life: val
                                      }
                                    }));
                                  }}
                                  className="w-24 px-2 py-1 bg-white border-2 border-amber-400 rounded-lg font-mono text-xs font-bold text-right text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                                />
                                <span className="text-[10px] text-slate-400 font-bold">{part.unitLabel || machineUnitEn}</span>
                              </div>
                            ) : (
                              <span className="font-mono font-bold text-slate-900">
                                {part.lifeVal.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">{part.unitLabel || machineUnitEn}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                            +{formatUnitLAK(currentRate)} LAK
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black border ${badgeClass}`}>
                              {statusLabel} ({usage}%)
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-xs text-slate-800">
                      <td colSpan={4} className="py-3 px-4 text-right">
                        {currentLang === 'lo' ? 'ລວມອັດຕາຕົ້ນທຶນອະໄຫຼ່ສິ້ນເປືອງທັງໝົດ (Total Wear Rate):' : 'Total Wear Parts Rate:'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-sm text-amber-700">
                        +{formatUnitLAK(wearAllowancePerUnit)} LAK
                      </td>
                      <td className="py-3 px-3 text-center text-[10px] text-slate-500 font-normal">
                        / {machineUnitLabel}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Consolidated Machine Rate Summary Strip (Clean Non-Repetitive Equation) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-700">
                  <span className="font-black text-slate-900">
                    {currentLang === 'lo' ? 'ສະຫຼຸບອັດຕາຕົ້ນທຶນເຄື່ອງຈັກ:' : 'Consolidated Machine Rate:'}
                  </span>
                  <span className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl font-mono font-bold border border-slate-200 shadow-2xs">
                    1. ຄ່າເສື່ອມ {formatUnitLAK(baseCostPerUnit)} LAK
                  </span>
                  <span className="font-black text-slate-400 text-sm">+</span>
                  <span className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl font-mono font-bold shadow-2xs">
                    2. ອະໄຫຼ່ລວມ +{formatUnitLAK(wearAllowancePerUnit)} LAK
                  </span>
                  <span className="font-black text-slate-400 text-sm">=</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider text-right">
                    {currentLang === 'lo' ? '3. ຕົ້ນທຶນເຄື່ອງຈັກສຸດທິ' : '3. Net Effective Rate'}
                  </span>
                  <div className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-4 py-2 rounded-xl font-mono font-black text-base shadow-2xs flex items-baseline gap-1.5">
                    <span className="text-emerald-700 font-black">{formatUnitLAK(netCostPerUnit)}</span>
                    <span className="text-xs text-emerald-600 font-bold">LAK / {machineUnitLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: METER COUNTER HISTORY */}
      {activeTab === 'meter' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-emerald-600" />
                <span>{currentLang === 'lo' ? 'ລະບົບບັນທຶກມິເຕີພິມ (Meter Counter Logs)' : 'Meter Counter Log'}</span>
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                {currentLang === 'lo' 
                  ? 'ຕິດຕາມເລກມິເຕີພິມແຕ່ລະວັນ/ອາທິດ/ເດືອນ ແລະ ສະຖິຕິປະລິມານພິມສະສົມ' 
                  : 'Track click counter readings and volume output history'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setMeterFilter('daily')}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl transition cursor-pointer ${
                    meterFilter === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {currentLang === 'lo' ? 'ລາຍວັນ (14 ວັນ)' : 'Daily (14D)'}
                </button>
                <button
                  onClick={() => setMeterFilter('weekly')}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl transition cursor-pointer ${
                    meterFilter === 'weekly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {currentLang === 'lo' ? 'ລາຍອາທິດ (8 ອາທິດ)' : 'Weekly (8W)'}
                </button>
                <button
                  onClick={() => setMeterFilter('monthly')}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl transition cursor-pointer ${
                    meterFilter === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {currentLang === 'lo' ? 'ລາຍເດືອນ (12 ເດືອນ)' : 'Monthly (12M)'}
                </button>
              </div>

              <button
                onClick={() => setIsRecordMeterOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{currentLang === 'lo' ? '+ ບັນທຶກມິເຕີມື້ນີ້' : '+ Record Meter'}</span>
              </button>
            </div>
          </div>

          {/* Table of Meter Readings */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-black">
                  <th className="py-3 px-4">{currentLang === 'lo' ? 'ວັນທີ & ເວລາ' : 'Date & Time'}</th>
                  <th className="py-3 px-4 text-right">{currentLang === 'lo' ? 'ເລກມິເຕີສະສົມ (Counter)' : 'Total Click Counter'}</th>
                  <th className="py-3 px-4 text-right">{currentLang === 'lo' ? 'ຈຳນວນພິມເພີ່ມ (+Diff)' : 'Pages Printed (+Diff)'}</th>
                  <th className="py-3 px-4">{currentLang === 'lo' ? 'ຜູ້ບັນທຶກ' : 'Operator'}</th>
                  <th className="py-3 px-4">{currentLang === 'lo' ? 'ໝາຍເຫດ' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredReadings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                      {currentLang === 'lo' 
                        ? 'ບໍ່ມີລາຍການບັນທຶກມິເຕີສຳລັບຊ່ວງເວລານີ້. ຄລິກ "+ ບັນທຶກມິເຕີມື້ນີ້" ເພື່ອເລີ່ມຕົ້ນບັນທຶກ.' 
                        : 'No meter readings recorded yet for this view filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredReadings.map((reading: any) => (
                    <tr key={reading.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{reading.date}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{reading.time || '-'}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        {(reading.meterCount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-600">
                        +{(reading.diffCount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-bold">
                        {reading.recordedBy || 'Operator'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium max-w-xs truncate">
                        {reading.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: MAINTENANCE & DOWNTIME LOG */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* SLA Health Wear Reset Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                {currentLang === 'lo' ? 'ອາຍຸການໃຊ້ງານຊິ້ນສ່ວນອະໄຫຼ່ & ສຸຂະພາບ SLA (Component Wear)' : 'Component Wear SLA Health'}
              </span>
              <button
                onClick={() => {
                  updateEquipmentMaintenance(machine.id);
                  showToast(currentLang === 'lo' ? `ຣີເຊັດຄ່າບຳລຸງຮັກສາເຄື່ອງ "${machine.name}" ສຳເລັດ!` : 'Maintenance SLA reset successfully!', 'success');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition cursor-pointer active:scale-95"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{currentLang === 'lo' ? 'ຣີເຊັດອະໄຫຼ່ທັງໝົດເປັນ 0%' : 'SLA Reset All (0%)'}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {criticalWearParts.map((comp: any, idx: number) => {
                const usage = Number(comp.usage || 0);
                const threshold = Number(comp.threshold || 90);
                const isCritical = usage >= 90;
                const isWarning = usage >= 70 && usage < 90;

                const gaugeBarClass = isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';
                const badgeClass = isCritical
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : isWarning
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200';
                const statusLabel = isCritical
                  ? (currentLang === 'lo' ? 'ຕ້ອງປ່ຽນທັນທີ' : 'Critical')
                  : isWarning
                  ? (currentLang === 'lo' ? 'ໃກ້ຮອດກຳນົດ' : 'Warning')
                  : (currentLang === 'lo' ? 'ປົກກະຕິ' : 'Good');

                return (
                  <div key={idx} className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs block">
                          {comp.nameLo ? `${comp.nameLo}` : comp.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono font-semibold text-slate-500">
                            {comp.name}
                          </span>
                          {comp.lifespan && (
                            <span className="text-[9px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                              {comp.lifespan}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {comp.cost > 0 && (
                            <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-200/70 px-1.5 py-0.5 rounded">
                              ຕົ້ນທຶນຊື້: {formatLAK(comp.cost)}
                            </span>
                          )}
                          {comp.costPerUnit > 0 && (
                            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              +{formatUnitLAK(comp.costPerUnit)} / {comp.unitLabel || 'ໜ້າ'}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${badgeClass}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500 text-[11px]">
                          {currentLang === 'lo' ? 'ລະດັບການສວມໃສ່ / ສຶກຫ້ຼາ:' : 'Wear Level:'}
                        </span>
                        <span className={`font-mono text-xs font-black ${
                          isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-800'
                        }`}>
                          {usage}% / {threshold}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300/60">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${gaugeBarClass}`}
                          style={{ width: `${Math.min(100, usage)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                      <div className="text-[10px] text-slate-500 font-bold">
                        <span>{currentLang === 'lo' ? 'ອາຍຸຄົງເຫຼືອ: ' : 'Remaining: '}</span>
                        <strong className="text-slate-800 font-mono">{Math.max(0, 100 - usage)}%</strong>
                        {comp.lifeVal > 0 && (
                          <span className="text-slate-400 font-mono ml-1">
                            (~{Math.max(0, Math.round(comp.lifeVal * (1 - usage / 100))).toLocaleString()} {comp.unitLabel})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSwapModalConfig({
                          isOpen: true,
                          mode: 'component',
                          componentName: comp.name,
                          currentUsage: usage
                        })}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl border border-indigo-200 transition cursor-pointer active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{currentLang === 'lo' ? 'ປ່ຽນອະໄຫຼ່' : 'Swap Part'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Downtime Log Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-indigo-600" />
                  <span>{currentLang === 'lo' ? 'ປະຫວັດການສ້ອມແປງ & ເຄື່ອງຢຸດເຮັດວຽກ (Maintenance & Downtime Logs)' : 'Maintenance History & Downtime'}</span>
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  {currentLang === 'lo' 
                    ? 'ບັນທຶກປະຫວັດເຄື່ອງຂັດຂ້ອງ, ອາການເສຍ, ການປ່ຽນອະໄຫຼ່ ແລະ ຄ່າໃຊ້ຈ່າຍຊ່າງສ້ອມ' 
                    : 'Timeline of breakdown logs, repairs, parts replaced, and costs'}
                </p>
              </div>

              <button
                onClick={() => setIsLogDowntimeOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-md shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{currentLang === 'lo' ? '+ ບັນທຶກການສ້ອມແປງ' : '+ Log Maintenance'}</span>
              </button>
            </div>

            {/* Downtime Timeline Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-black">
                    <th className="py-3 px-4">{currentLang === 'lo' ? 'ເວລາເລີ່ມຕົ້ນ' : 'Start Time'}</th>
                    <th className="py-3 px-4">{currentLang === 'lo' ? 'ອາການ / ສາເຫດ' : 'Reason / Issue'}</th>
                    <th className="py-3 px-4 text-right">{currentLang === 'lo' ? 'ເວລາຢຸດ (ນາທີ)' : 'Downtime (Mins)'}</th>
                    <th className="py-3 px-4">{currentLang === 'lo' ? 'ຊ່າງສ້ອມ / ວິທີແກ້' : 'Technician / Action'}</th>
                    <th className="py-3 px-4 text-right">{currentLang === 'lo' ? 'ຄ່າໃຊ້ຈ່າຍ (LAK)' : 'Cost (LAK)'}</th>
                    <th className="py-3 px-4">{currentLang === 'lo' ? 'ສະຖານະ' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">{currentLang === 'lo' ? 'ຈັດການ' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {machineDowntimes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                        {currentLang === 'lo' 
                          ? 'ບໍ່ມີປະຫວັດການສ້ອມແປງສຳລັບເຄື່ອງນີ້. ຄລິກ "+ ບັນທຶກການສ້ອມແປງ" ເພື່ອເພີ່ມລາຍການ.' 
                          : 'No maintenance downtime records logged for this machine yet.'}
                      </td>
                    </tr>
                  ) : (
                    machineDowntimes.map((dt: any) => (
                      <tr key={dt.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {dt.startTime ? new Date(dt.startTime).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{dt.reason}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">{dt.description}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600">
                          {dt.downtimeMinutes || 0} min
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 block">{dt.technician || '-'}</span>
                          <span className="text-[10px] text-slate-500 font-normal">{dt.actionTaken || '-'}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                          {dt.cost ? formatLAK(dt.cost) : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            dt.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          }`}>
                            {dt.status === 'Completed' ? (currentLang === 'lo' ? 'ສຳເລັດ' : 'Completed') : (currentLang === 'lo' ? 'ກຳລັງສ້ອມ' : 'In Progress')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {dt.status !== 'Completed' && (
                            <button
                              onClick={() => {
                                updateDowntimeLog(dt.id, { status: 'Completed', endTime: new Date().toISOString() });
                                showToast(currentLang === 'lo' ? 'ປັບສະຖານະການສ້ອມແປງເປັນສຳເລັດ!' : 'Downtime marked as completed!', 'success');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition shadow-xs cursor-pointer"
                            >
                              {currentLang === 'lo' ? 'ປິດງານ' : 'Mark Done'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: LINKED INKS & CONSUMABLES */}
      {activeTab === 'inks' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <span>{currentLang === 'lo' ? 'ໝຶກພິມ & ອຸປະກອນສິ້ນເປືອງທີ່ເຊື່ອມໂຍງ (Linked Inks & Consumables)' : 'Linked Colors & Consumables'}</span>
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                {currentLang === 'lo' 
                  ? 'ຈັບຄູ່ຊ່ອງສີ CMYK / White ກັບລະຫັດ SKU ໝຶກໃນສາງ ພ້ອມຕົ້ນທຶນ ແລະ ຈຳນວນຄົງເຫຼືອ Real-time' 
                  : 'Color slot mappings with real-time inventory unit prices & stock'}
              </p>
            </div>

            <button
              onClick={() => setIsQuickLinkInkOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-2xl shadow-md shadow-purple-600/20 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{currentLang === 'lo' ? '+ ຜູກໝຶກພິມເຂົ້າ Slot' : '+ Quick Link Ink SKU'}</span>
            </button>
          </div>

          {/* Table of Linked Inks */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-black">
                  <th className="py-3 px-4">{currentLang === 'lo' ? 'ຊ່ອງສີ / ຕຳແໜ່ງ Slot' : 'Slot / Color Position'}</th>
                  <th className="py-3 px-4">{currentLang === 'lo' ? 'ລະຫັດ SKU ໝຶກ' : 'Ink SKU Code'}</th>
                  <th className="py-3 px-4">{currentLang === 'lo' ? 'ຊື່ໝຶກໃນສາງສິນຄ້າ' : 'Ink Name in Inventory'}</th>
                  <th className="py-3 px-4 text-center">{currentLang === 'lo' ? 'ສະຕັອກໃນສາງ' : 'Stock Qty'}</th>
                  <th className="py-3 px-4 text-right">{currentLang === 'lo' ? 'ຄວາມຈຸ (ml)' : 'Volume (ml)'}</th>
                  <th className="py-3 px-4 text-right">{currentLang === 'lo' ? 'ລາຄາຕົ້ນທຶນ/ຕຸກ' : 'Unit Cost'}</th>
                  <th className="py-3 px-4 text-center">{currentLang === 'lo' ? 'ຈັດການ / ປ່ຽນໝຶກ' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {linkedLinks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                      {currentLang === 'lo' 
                        ? 'ຍັງບໍ່ໄດ້ຜູກໝຶກພິມສຳລັບເຄື່ອງນີ້. ຄລິກ "+ ຜູກໝຶກພິມເຂົ້າ Slot" ເພື່ອເລືອກໝຶກຈາກສາງ.' 
                        : 'No linked inks configured for this machine yet.'}
                    </td>
                  </tr>
                ) : (
                  linkedLinks.map((lnk: any) => {
                    const ink = inventory.find((i: any) => i.id === lnk.inkCode || i.skuCode === lnk.inkCode || i.sku === lnk.inkCode);
                    const stockCount = ink ? Number(ink.stockQty || 0) : 0;

                    return (
                      <tr key={lnk.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{lnk.slotPosition}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{lnk.inkCode}</td>
                        <td className="py-3 px-4 text-slate-800 font-bold">{ink ? ink.name : '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black font-mono inline-block ${
                            stockCount > 0 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                          }`}>
                            {stockCount > 0 ? `${stockCount} ຕຸກ` : (currentLang === 'lo' ? '0 ຕຸກ (ໝົດສາງ)' : '0 (Out of stock)')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-right">{lnk.oemStandardVolumeMl || ink?.volume || 100} ml</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 text-right">
                          {ink ? formatLAK(ink.unitPrice || ink.costPerPurchaseUnit || 0) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Quick Ink Swap Button */}
                            <button
                              type="button"
                              onClick={() => setSwapModalConfig({
                                isOpen: true,
                                mode: 'ink',
                                slotPosition: lnk.slotPosition,
                                inkSku: lnk.inkCode,
                                inkName: ink?.name || lnk.inkCode
                              })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-black text-xs rounded-xl border border-purple-200 transition cursor-pointer active:scale-95"
                              title={currentLang === 'lo' ? 'ປ່ຽນໝຶກຕຸກໃໝ່' : 'Swap Ink'}
                            >
                              <Droplet className="w-3.5 h-3.5" />
                              <span>{currentLang === 'lo' ? 'ປ່ຽນໝຶກຕຸກໃໝ່' : 'Swap Ink'}</span>
                            </button>

                            {/* Unlink button */}
                            <button
                              type="button"
                              onClick={() => {
                                deletePrinterColorLink(lnk.id);
                                showToast(currentLang === 'lo' ? 'ຍົກເລີກການຜູກໝຶກສຳເລັດ!' : 'Unlinked ink slot successfully!', 'info');
                              }}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title={currentLang === 'lo' ? 'ຍົກເລີກການຜູກ' : 'Unlink'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* OEM vs Actual Compatible Ink Comparison Card Component */}
          <PrinterInkComparisonCard printerItem={machine} currentLang={currentLang} />
        </div>
      )}

      {/* Modals */}
      <EditEquipmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        equipmentItem={machine}
      />

      <RecordMeterModal
        isOpen={isRecordMeterOpen}
        onClose={() => setIsRecordMeterOpen(false)}
        equipmentItem={machine}
      />

      <LogDowntimeModal
        isOpen={isLogDowntimeOpen}
        onClose={() => setIsLogDowntimeOpen(false)}
        equipmentItem={machine}
      />

      <QuickLinkInkModal
        isOpen={isQuickLinkInkOpen}
        onClose={() => setIsQuickLinkInkOpen(false)}
        equipmentItem={machine}
      />

      {/* Quick Swap Ink & Consumable Modal */}
      {swapModalConfig && (
        <QuickSwapConsumableModal
          isOpen={swapModalConfig.isOpen}
          onClose={() => setSwapModalConfig(null)}
          mode={swapModalConfig.mode}
          equipmentItem={machine}
          slotPosition={swapModalConfig.slotPosition}
          inkSku={swapModalConfig.inkSku}
          inkName={swapModalConfig.inkName}
          componentName={swapModalConfig.componentName}
          currentUsage={swapModalConfig.currentUsage}
        />
      )}

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteEquipment}
        itemName={`${machine.name} (${machine.id})`}
      />
    </div>
  );
}
