import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User, 
  Printer, 
  ChevronRight, 
  Plus, 
  Trash2,
  CheckCircle2,
  DollarSign,
  Package,
  Scissors,
  Layers,
  Settings,
  HelpCircle,
  FileText,
  Calculator,
  Info,
  Sliders,
  Sparkles,
  Download,
  ShoppingCart,
  PercentSquare,
  Edit3,
  AlertCircle,
  Check,
  Truck,
  Store,
  Send,
  MapPin,
  Building2,
  Calendar
} from 'lucide-react';

import ItemSpecConfigurator, { calculateItemCosting } from './ItemSpecConfigurator';
import CustomerCombobox from '@components/common/CustomerCombobox';
import { PreflightItemCreationModal } from '@components/PreflightItemCreationModal';
import type { PreflightResult } from '../types';
import { useInventoryStore } from '@store/useInventoryStore';
import { useApp } from '@store/AppContext';

export default function CreateOrderPage({
  onBack,
  inventory,
  equipment,
  customers,
  addCustomer,
  addOrder,
  showToast,
  formatLAK,
  currentLang,
  t,
  prefilledSpecs
}) {
  const [currentStep, setCurrentStep] = useState(1);

  // STEP 1: CUSTOMER SELECTION
  const [customerType, setCustomerType] = useState('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.name || '');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('ນະຄອນຫຼວງວຽງຈັນ');

  // STEP 2: DELIVERY & LOGISTICS SELECTION
  const { couriers = [], printerColorLinks = [] } = useApp();
  const [deliveryMethod, setDeliveryMethod] = useState<'Pickup' | 'Courier' | 'Direct'>('Pickup');
  const [selectedCourierId, setSelectedCourierId] = useState<string>(() => couriers?.[0]?.id || 'anousith');
  const [courierBranchCode, setCourierBranchCode] = useState('');
  const [courierTrackingNo, setCourierTrackingNo] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [promisedDeliveryDate, setPromisedDeliveryDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );

  useEffect(() => {
    if (customerType === 'existing' && selectedCustomerId) {
      const cust = customers.find(c => c.id === selectedCustomerId || c.name === selectedCustomerId);
      if (cust) {
        setPhone(cust.phone || '');
        setAddress(cust.address || '');
      }
    } else {
      setPhone('');
      setAddress('');
    }
  }, [selectedCustomerId, customerType, customers]);

  // Offcut warehouse inventory integration
  const offcuts = useInventoryStore((state) => state.offcuts);

  const getOffcutRecommendation = (it: any) => {
    const w = Number(it.jobWidth || 210);
    const h = Number(it.jobHeight || 297);
    const isSmall = (w <= 150 && h <= 210) || (w <= 210 && h <= 150) || 
      (it.name && (it.name.toLowerCase().includes('card') || it.name.toLowerCase().includes('tag') || it.name.toLowerCase().includes('sticker') || it.name.includes('ນາມບັດ') || it.name.includes('ສຕິກເກີ')));
    
    if (!isSmall) return null;

    const matched = offcuts.find((o: any) => 
      Number(o.quantity || o.qty || 0) >= Number(it.quantity || 1) &&
      ((Number(o.width_mm || o.width || 120) >= w && Number(o.length_mm || o.length || 250) >= h) ||
       (Number(o.width_mm || o.width || 120) >= h && Number(o.length_mm || o.length || 250) >= w))
    );

    return matched || { id: 'OFF-CRD350-01', name: 'Art Card 350g Strips', savingsPercent: 35 };
  };

  // STEP 2: MULTI-ITEM ORDER LIST & SPECS ENGINE
  const papers = inventory ? inventory.filter(item => item.category === 'Paper' || item.name.includes('A4') || item.name.includes('A3') || item.id.startsWith('LOT-')) : [];
  const printers = equipment ? equipment.filter(eq => eq.category === 'Printer' || eq.printerType || eq.name.includes('C6085')) : [];

  const defaultPaperId = papers[0]?.id || '';
  const defaultPrinterId = printers[0]?.id || '';

  const createDefaultItem = (name = 'ປຶ້ມ / ສຕິກເກີ ໃໝ່', isConfigured = false) => ({
    id: `item-${Date.now()}-${Math.random().toString().slice(-4)}`,
    name: name,
    quantity: 500,
    isConfigured: isConfigured,
    paperId: defaultPaperId,
    printerId: defaultPrinterId,
    jobWidth: 210,
    jobHeight: 297,
    bleedMargin: 2,
    isDoubleSided: false,
    colorMode: 'CMYK',
    avgCoverage: 15,
    avgCoverageK: 15,
    avgCoverageCMY: 10,
    mediaType: 'Sheet-fed',
    customFinishingOptions: [] as string[],
    overheadPercent: 15,
    useLamination: false,
    laminationType: 'Glossy',
    useFolding: false,
    useBinding: false,
    bindingType: 'Staple',
    printerAllocations: [] as any[],
    coatingMachineId: '',
    bindingMachineId: '',
    spoilageRate: 5,
    targetMarginPercent: 35,
    manualUnitPrice: null,
    pagesPerBook: 1,
    colorPrintMode: 'CMYK',
    fileName: '',
    artworkUrl: '',
    fileSize: 0,
    mimeType: '',
    cCoverage: 5,
    mCoverage: 5,
    yCoverage: 5,
    kCoverage: 15
  });

  const [items, setItems] = useState([
    createDefaultItem('ປຶ້ມ A4 Double A', false)
  ]);

  // Modal / Sub-view state for single item spec configurator
  const [editingItemIndex, setEditingItemIndex] = useState(null);

  // Pre-fill specs if passed from QuotationManager
  useEffect(() => {
    if (prefilledSpecs) {
      if (prefilledSpecs.artworkUrl || prefilledSpecs.artworkLink) {
        setArtworkLink(prefilledSpecs.artworkUrl || prefilledSpecs.artworkLink);
      }
      if (Array.isArray(prefilledSpecs.items) && prefilledSpecs.items.length > 0) {
        const configuredItems = prefilledSpecs.items.map((it: any) => {
          const item = createDefaultItem(it.name || 'ໃບສະເໜີລາຄາ (Quotation Job)', true);
          if (it.paperId) item.paperId = it.paperId;
          if (it.quantity) item.quantity = it.quantity;
          if (it.unitCost) item.manualUnitPrice = it.unitCost;
          if (it.artworkUrl) (item as any).artworkUrl = it.artworkUrl;
          if (it.fileName) item.fileName = it.fileName;
          if (it.fileSize) (item as any).fileSize = it.fileSize;
          if (it.jobWidth) item.jobWidth = it.jobWidth;
          if (it.jobHeight) item.jobHeight = it.jobHeight;
          if (it.pagesPerBook) item.pagesPerBook = it.pagesPerBook;
          return item;
        });
        setItems(configuredItems);
      } else if (prefilledSpecs.paperId) {
        const newItem = createDefaultItem(prefilledSpecs.paperName || 'ໃບສະເໜີລາຄາ (Quotation Job)', true);
        newItem.paperId = prefilledSpecs.paperId;
        if (prefilledSpecs.quantity) newItem.quantity = prefilledSpecs.quantity;
        if (prefilledSpecs.unitCost) newItem.manualUnitPrice = prefilledSpecs.unitCost;
        if (prefilledSpecs.artworkUrl) (newItem as any).artworkUrl = prefilledSpecs.artworkUrl;
        if (prefilledSpecs.artworkFileName) newItem.fileName = prefilledSpecs.artworkFileName;
        if (prefilledSpecs.artworkFileSize) (newItem as any).fileSize = prefilledSpecs.artworkFileSize;
        setItems([newItem]);
      }
    }
  }, [prefilledSpecs]);

  const [isPreflightModalOpen, setIsPreflightModalOpen] = useState(false);

  const handleAddItemRow = () => {
    const newItem = createDefaultItem(`ລາຍການທີ ${items.length + 1}`, false);
    setItems(prev => [...prev, newItem]);
  };

  const handleConfirmPreflightItem = (pfResult: PreflightResult) => {
    const rawName = pfResult.file_name ? pfResult.file_name.replace(/\.[^/.]+$/, '') : `ລາຍການທີ ${items.length + 1}`;
    const cleanName = rawName.replace(/_+/g, ' ');
    const isMonoOnly = (pfResult.color_pages_count || 0) === 0 && (pfResult.mono_pages_count || 0) > 0;
    const detectedColorMode = isMonoOnly ? 'MONO_K' : 'CMYK';

    const newItem = createDefaultItem(cleanName, true);
    newItem.jobWidth = pfResult.target_width_mm || 210;
    newItem.jobHeight = pfResult.target_height_mm || 297;
    newItem.pagesPerBook = pfResult.total_pages || 1;
    newItem.colorPrintMode = detectedColorMode;
    newItem.fileName = pfResult.file_name;
    newItem.cCoverage = pfResult.color_pages_avg_c || pfResult.avg_cov_c || 5;
    newItem.mCoverage = pfResult.color_pages_avg_m || pfResult.avg_cov_m || 5;
    newItem.yCoverage = pfResult.color_pages_avg_y || pfResult.avg_cov_y || 5;
    newItem.kCoverage = (pfResult.color_pages_count || 0) > 0 ? (pfResult.color_pages_avg_k || 15) : (pfResult.mono_pages_avg_k || pfResult.avg_cov_k || 10);

    setItems(prev => [...prev, newItem]);
    setIsPreflightModalOpen(false);
    if (showToast) showToast(`ເພີ່ມລາຍການ "${cleanName}" ຈາກການກວດໄຟລ໌ຮຽບຮ້ອຍ!`, 'success');
  };

  const handleSkipPreflightItem = () => {
    handleAddItemRow();
    setIsPreflightModalOpen(false);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length > 1) {
      const updated = items.filter((_, i) => i !== index);
      setItems(updated);
    }
  };

  const updateItemField = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Order-Level Operating Costs & Overhead State (Step 2)
  const [orderOverheadMode, setOrderOverheadMode] = useState('Standard');
  const [customSetupFee, setCustomSetupFee] = useState(10000);
  const [customLaborFee, setCustomLaborFee] = useState(25000);
  const [customDeprPowerFee, setCustomDeprPowerFee] = useState(15000);
  const [customSpoilageFee, setCustomSpoilageFee] = useState(10000);

  const isCustomOverhead = orderOverheadMode === 'Custom';
  const setupFee = isCustomOverhead ? Number(customSetupFee) : 10000;
  const laborFee = isCustomOverhead ? Number(customLaborFee) : (20000 + (items.length * 5000));
  const deprPowerFee = isCustomOverhead ? Number(customDeprPowerFee) : (15000 + (items.reduce((acc, it) => acc + Number(it.quantity || 0), 0) * 5));
  const spoilageFee = isCustomOverhead ? Number(customSpoilageFee) : 10000;

  const orderOperatingOverhead = setupFee + laborFee + deprPowerFee + spoilageFee;

  const getItemCosting = (item) => calculateItemCosting(item, inventory, equipment);

  const sumItemSubtotals = items.reduce((sum, it) => sum + getItemCosting(it).finalPrice, 0);
  const grandTotalBill = sumItemSubtotals + orderOperatingOverhead;
  const allItemsConfigured = items.every(it => it.isConfigured);

  // Modal spec handlers
  const handleOpenSpecModal = (index) => {
    setEditingItemIndex(index);
  };

  const handleSaveSpecModal = (updatedItem) => {
    if (editingItemIndex !== null) {
      setItems(prev => {
        const copy = [...prev];
        copy[editingItemIndex] = updatedItem;
        return copy;
      });
      setEditingItemIndex(null);
      if (showToast) showToast(`ບັນທຶກສເປກ "${updatedItem.name}" ສຳເລັດ!`, 'success');
    }
  };


  // STEP 3: Order Details & Payment
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [depositAmountPaid, setDepositAmountPaid] = useState(0);
  const [artworkLink, setArtworkLink] = useState('');

  const handleNextToStep2 = () => {
    if (customerType === 'new') {
      if (!newCustName.trim()) {
        showToast('ກະລຸນາປ້ອນຊື່ລູກຄ້າໃໝ່ (Customer Name Required)', 'warning');
        return;
      }
      if (!newCustPhone.trim()) {
        showToast('ກະລຸນາປ້ອນເບີໂທລະສັບລູກຄ້າ (Phone Number Required)', 'warning');
        return;
      }
    }
    if (customerType === 'existing' && !selectedCustomerId) {
      showToast('ກະລຸນາເລືອກລູກຄ້າທີ່ມີໃນລະບົບ (Select Existing Customer)', 'warning');
      return;
    }
    if (deliveryMethod === 'Courier') {
      if (!courierBranchCode.trim()) {
        showToast('ກະລຸນາປ້ອນລະຫັດສາຂາ ຫຼື ຊື່ສາຂາປາຍທາງ (Branch Code Required)', 'warning');
        return;
      }
    }
    setCurrentStep(2);
  };

  const [isCalculating, setIsCalculating] = useState(false);
  const [backendCalculationBreakdown, setBackendCalculationBreakdown] = useState([]);

  const handleNextToStep3 = async () => {
    if (items.length === 0) {
      showToast('ກະລຸນາເພີ່ມລາຍການສິນຄ້າຢ່າງໜ້ອຍ 1 ລາຍການ (Add At Least 1 Item)', 'warning');
      return;
    }

    const invalidQtyItem = items.find(it => !it.quantity || Number(it.quantity) <= 0);
    if (invalidQtyItem) {
      showToast(`ຈຳນວນຜະລິດຂອງ "${invalidQtyItem.name}" ຕ້ອງຫຼາຍກວ່າ 0`, 'error');
      return;
    }

    const unconfiguredItem = items.find(it => !it.isConfigured);
    if (unconfiguredItem) {
      showToast(`ກະລຸນາກຳນົດສເປກສິນຄ້າ "${unconfiguredItem.name}" ໃຫ້ຄົບກ່ອນດຳເນີນການຕໍ່`, 'warning');
      return;
    }

    setIsCalculating(true);
    try {
      const breakdowns = [];
      for (const it of items) {
        const paperItem = inventory ? inventory.find(p => p.id === it.paperId) : null;
        const paperCost = paperItem ? (paperItem.costPerConsumptionUnit || paperItem.unitPrice || 90) : 100;
        const printerItem = equipment ? equipment.find(e => e.id === it.printerId) : null;

        const prnPrice = Number(printerItem?.MachinePrice ?? printerItem?.purchasePrice ?? printerItem?.purchaseCost ?? printerItem?.price ?? 0);
        const prnTargetPages = Number(printerItem?.TargetTotalPages || printerItem?.printedPagesCapacity || printerItem?.expectedLifeA4Pages || (Number(printerItem?.lifespanYears || 5) * 12 * Number(printerItem?.estMonthlyVolume || 50000)) || 3000000);
        const prnMaintRatePct = Number(printerItem?.maintenanceRatePercent || 15);
        const prnMaintCostPerPage = Number(printerItem?.MaintenanceCostPerPage || printerItem?.maintenanceCostPerPage || (prnTargetPages > 0 && prnPrice > 0 ? (prnPrice / prnTargetPages) * (prnMaintRatePct / 100) : 0));

        let inkCostKPerMl = 3500;
        let inkCostCMYPerMl = 4500;

        if (printerItem) {
          const links = (printerColorLinks || []).filter((l: any) => l.assetId === printerItem.id);
          const kLink = links.find((l: any) => l.colorGroup === 'Black' || l.slotPosition?.toLowerCase().includes('black') || l.slotPosition?.includes('(k)'));
          if (kLink) {
            const kInk = (inventory || []).find((i: any) => i.id === kLink.inkCode || i.skuCode === kLink.inkCode || i.sku === kLink.inkCode);
            if (kInk && Number(kInk.unitPrice) > 0 && Number(kInk.volume || 100) > 0) {
              inkCostKPerMl = Number(kInk.unitPrice) / Number(kInk.volume || 100);
            }
          }
          const cmyLinks = links.filter((l: any) => l.colorGroup !== 'Black' && !l.slotPosition?.toLowerCase().includes('black') && !l.slotPosition?.includes('(k)'));
          if (cmyLinks.length > 0) {
            const cmyPrices = cmyLinks.map((l: any) => {
              const cmyInk = (inventory || []).find((i: any) => i.id === l.inkCode || i.skuCode === l.inkCode || i.sku === l.inkCode);
              return (cmyInk && Number(cmyInk.unitPrice) > 0 && Number(cmyInk.volume || 100) > 0)
                ? Number(cmyInk.unitPrice) / Number(cmyInk.volume || 100)
                : 4500;
            });
            inkCostCMYPerMl = cmyPrices.reduce((a: number, b: number) => a + b, 0) / cmyPrices.length;
          }
        }

        const payload = {
          job_name: it.name,
          quantity: Number(it.quantity || 1),
          paper_sku: it.paperId || 'default-paper',
          paper_cost_per_unit: paperCost,
          paper_format: it.mediaType === 'Roll-fed' ? 'roll' : 'sheet',
          ink_coverage_k_percent: Number(it.avgCoverageK !== undefined ? it.avgCoverageK : (it.avgCoverage || 5)),
          ink_coverage_cmy_percent: it.colorMode === 'Monochrome' ? 0.0 : Number(it.avgCoverageCMY !== undefined ? it.avgCoverageCMY : 10),
          ink_cost_k_per_ml: inkCostKPerMl,
          ink_cost_cmy_per_ml: inkCostCMYPerMl,
          machine_price: prnPrice,
          target_total_pages: prnTargetPages,
          maintenance_cost_per_page: prnMaintCostPerPage,
          job_width: Number(it.jobWidth || 210),
          job_height: Number(it.jobHeight || 297),
          custom_finishing_options: it.customFinishingOptions || [],
          lamination_type: it.useLamination ? (it.laminationType || 'Glossy') : 'none',
          lamination_cost: it.useLamination ? 150.0 : 0.0,
          binding_type: it.useBinding ? (it.bindingType || 'Staple') : 'none',
          binding_cost: it.useBinding ? 200.0 : 0.0,
          labor_cost_per_hour: 25000.0,
          estimated_hours: 0.5,
          overhead_percent: Number(it.overheadPercent !== undefined ? it.overheadPercent : 15) / 100.0,
          target_margin_percent: (Number(it.targetMarginPercent) || 35) / 100.0
        };

        const response = await fetch('/api/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Backend pricing failure');
        const data = await response.json();
        breakdowns.push(data);
      }

      setBackendCalculationBreakdown(breakdowns);
      setCurrentStep(4);
      showToast('ຄິດໄລ່ລາຄາຈາກ Pricing Engine ສຳເລັດ!', 'success');
    } catch (err) {
      console.error(err);
      showToast('ໃຊ້ລະບົບຄິດໄລ່ສຳຮອງເນື່ອງຈາກເຊີບເວີ Offline', 'warning');
      setCurrentStep(4);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmitFinal = (e) => {
    e.preventDefault();

    if (items.length === 0) {
      showToast('ບໍ່ມີລາຍການສິນຄ້າໃນອໍເດີ', 'error');
      return;
    }

    let finalCustomerName = '';
    let finalPhone = '';
    let finalAddress = '';

    if (customerType === 'new') {
      if (!newCustName.trim()) {
        showToast('ກະລຸນາປ້ອນຊື່ລູກຄ້າໃໝ່', 'warning');
        return;
      }
      finalCustomerName = newCustName;
      finalPhone = newCustPhone;
      finalAddress = newCustAddress;

      addCustomer({
        name: newCustName,
        phone: newCustPhone,
        address: newCustAddress,
        creditLimit: 1000000
      });
    } else {
      const cust = customers.find(c => c.id === selectedCustomerId || c.name === selectedCustomerId);
      finalCustomerName = cust ? cust.name : selectedCustomerId;
      finalPhone = cust ? cust.phone : phone;
      finalAddress = cust ? cust.address : address;
    }

    const firstItemArtwork = items.find(it => (it as any).artworkUrl)?.artworkUrl || artworkLink;
    const firstItemFileName = items.find(it => it.fileName)?.fileName || (firstItemArtwork ? firstItemArtwork.split('/').pop()?.split('?')[0] : '');
    const firstItemFileSize = (items.find(it => (it as any).fileSize) as any)?.fileSize || 0;

    const payload = {
      customer_name: finalCustomerName,
      customer_phone: finalPhone,
      customer_address: finalAddress,
      province: province,
      district: district,
      village: village,
      google_drive_link: artworkLink || firstItemArtwork,
      artwork_url: artworkLink || firstItemArtwork,
      artwork_file_name: firstItemFileName,
      artwork_file_size: firstItemFileSize,
      items: items.map(it => {
        const paperItem = inventory ? inventory.find(p => p.id === it.paperId) : null;
        const paperCost = paperItem ? (paperItem.costPerConsumptionUnit || paperItem.costPerSheet || 90) : 100;
        const printerItem = equipment ? equipment.find(e => e.id === it.printerId) : null;

        const prnPrice = Number(printerItem?.MachinePrice ?? printerItem?.purchasePrice ?? printerItem?.purchaseCost ?? printerItem?.price ?? 0);
        const prnTargetPages = Number(printerItem?.TargetTotalPages || printerItem?.printedPagesCapacity || printerItem?.expectedLifeA4Pages || (Number(printerItem?.lifespanYears || 5) * 12 * Number(printerItem?.estMonthlyVolume || 50000)) || 3000000);
        const prnMaintRatePct = Number(printerItem?.maintenanceRatePercent || 15);
        const prnMaintCostPerPage = Number(printerItem?.MaintenanceCostPerPage || printerItem?.maintenanceCostPerPage || (prnTargetPages > 0 && prnPrice > 0 ? (prnPrice / prnTargetPages) * (prnMaintRatePct / 100) : 0));

        let inkCostKPerMl = 3500;
        let inkCostCMYPerMl = 4500;

        if (printerItem) {
          const links = (printerColorLinks || []).filter((l: any) => l.assetId === printerItem.id);
          const kLink = links.find((l: any) => l.colorGroup === 'Black' || l.slotPosition?.toLowerCase().includes('black') || l.slotPosition?.includes('(k)'));
          if (kLink) {
            const kInk = (inventory || []).find((i: any) => i.id === kLink.inkCode || i.skuCode === kLink.inkCode || i.sku === kLink.inkCode);
            if (kInk && Number(kInk.unitPrice) > 0 && Number(kInk.volume || 100) > 0) {
              inkCostKPerMl = Number(kInk.unitPrice) / Number(kInk.volume || 100);
            }
          }
          const cmyLinks = links.filter((l: any) => l.colorGroup !== 'Black' && !l.slotPosition?.toLowerCase().includes('black') && !l.slotPosition?.includes('(k)'));
          if (cmyLinks.length > 0) {
            const cmyPrices = cmyLinks.map((l: any) => {
              const cmyInk = (inventory || []).find((i: any) => i.id === l.inkCode || i.skuCode === l.inkCode || i.sku === l.inkCode);
              return (cmyInk && Number(cmyInk.unitPrice) > 0 && Number(cmyInk.volume || 100) > 0)
                ? Number(cmyInk.unitPrice) / Number(cmyInk.volume || 100)
                : 4500;
            });
            inkCostCMYPerMl = cmyPrices.reduce((a: number, b: number) => a + b, 0) / cmyPrices.length;
          }
        }

        const paperSetup = {
          category_id: paperItem?.category || 'Paper',
          inventory_material_id: it.paperId || 'default-paper',
          cost_per_sheet: paperCost,
          gsm: paperItem?.gsm || 130,
        };

        const printingProcesses = (it.printerAllocations && it.printerAllocations.length > 0)
          ? it.printerAllocations.map((p, pIdx) => ({
              printer_asset_id: p.printer_id,
              sequence: pIdx + 1,
              color_mode: p.color_mode || 'AVERAGE',
              average_density_pct: p.average_density_pct || 100,
              color_channels: p.color_channels || [],
            }))
          : [{
              printer_asset_id: it.printerId || 'default-printer',
              sequence: 1,
              color_mode: 'AVERAGE',
              average_density_pct: 100,
              color_channels: [],
            }];

        const finishingProcesses = [];
        if (it.useLamination && it.coatingMachineId) {
          finishingProcesses.push({
            finishing_type: it.laminationType || 'LAMINATE_GLOSS',
            machine_asset_id: it.coatingMachineId,
            estimated_setup_time_mins: 15,
            estimated_run_time_mins: 30,
            unit_cost: 150.0,
          });
        }
        if (it.useBinding && it.bindingMachineId) {
          finishingProcesses.push({
            finishing_type: it.bindingType || 'HOT_MELT_BINDING',
            machine_asset_id: it.bindingMachineId,
            estimated_setup_time_mins: 20,
            estimated_run_time_mins: 45,
            unit_cost: 200.0,
          });
        }

        return {
          job_name: it.name,
          quantity: Number(it.quantity || 1),
          quantity_required: Number(it.quantity || 1),
          unfolded_width_mm: Number(it.jobWidth || 210),
          unfolded_height_mm: Number(it.jobHeight || 297),
          paper_setup: paperSetup,
          printing_processes: printingProcesses,
          finishing_processes: finishingProcesses,
          paper_sku: it.paperId || 'default-paper',
          paper_cost_per_unit: paperCost,
          paper_format: it.mediaType === 'Roll-fed' ? 'roll' : 'sheet',
          ink_coverage_k_percent: Number(it.avgCoverageK !== undefined ? it.avgCoverageK : (it.avgCoverage || 5)),
          ink_coverage_cmy_percent: it.colorMode === 'Monochrome' ? 0.0 : Number(it.avgCoverageCMY !== undefined ? it.avgCoverageCMY : 10),
          ink_cost_k_per_ml: inkCostKPerMl,
          ink_cost_cmy_per_ml: inkCostCMYPerMl,
          machine_price: prnPrice,
          target_total_pages: prnTargetPages,
          maintenance_cost_per_page: prnMaintCostPerPage,
          job_width: Number(it.jobWidth || 210),
          job_height: Number(it.jobHeight || 297),
          custom_finishing_options: it.customFinishingOptions || [],
          lamination_type: it.useLamination ? (it.laminationType || 'Glossy') : 'none',
          lamination_cost: it.useLamination ? 150.0 : 0.0,
          binding_type: it.useBinding ? (it.bindingType || 'Staple') : 'none',
          binding_cost: it.useBinding ? 200.0 : 0.0,
          labor_cost_per_hour: 25000.0,
          estimated_hours: 0.5,
          overhead_percent: Number(it.overheadPercent !== undefined ? it.overheadPercent : 15) / 100.0,
          target_margin_percent: (Number(it.targetMarginPercent) || 35) / 100.0,
          cover_file_url: (it as any).artworkUrl || (it as any).fileUrl || artworkLink || '',
          inner_file_url: (it as any).artworkUrl || (it as any).fileUrl || artworkLink || '',
          artwork_url: (it as any).artworkUrl || (it as any).fileUrl || artworkLink || '',
          artwork_file_name: it.fileName || ((it as any).artworkUrl ? (it as any).artworkUrl.split('/').pop()?.split('?')[0] : ''),
          artwork_file_size: (it as any).fileSize || 0,
          specs: {
            dimensions: `${it.jobWidth}x${it.jobHeight}mm`,
            double_sided: it.isDoubleSided,
            paper_setup: paperSetup,
            printing_processes: printingProcesses,
            finishing_processes: finishingProcesses,
            artwork_url: (it as any).artworkUrl || (it as any).fileUrl || artworkLink || '',
            artwork_file_name: it.fileName || ((it as any).artworkUrl ? (it as any).artworkUrl.split('/').pop()?.split('?')[0] : ''),
            artwork_file_size: (it as any).fileSize || 0
          }
        };
      })
    };

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error('Order creation failed');
      return res.json();
    })
    .then(orderData => {
      if (paymentStatus === 'Deposit Paid' && depositAmountPaid > 0) {
        return fetch(`/api/orders/${orderData.id}/deposit`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deposit_amount: Number(depositAmountPaid) })
        })
        .then(res => res.json())
        .then(updatedOrder => {
          addOrder({
            id: updatedOrder.id,
            orderNumber: updatedOrder.order_number,
            customerName: updatedOrder.customer_name,
            phone: updatedOrder.customer_phone,
            items: (updatedOrder.items || []).map((it: any) => ({
              id: it.id,
              name: it.job_name || it.name,
              quantity: it.quantity,
              unitCost: it.unit_price_snapshot || it.unit_price_lak,
              specs: 'Synced',
              artworkUrl: it.artwork_url || it.inner_file_url || it.cover_file_url || firstItemArtwork,
              artworkFileName: it.artwork_file_name || firstItemFileName,
              artworkFileSize: it.artwork_file_size || firstItemFileSize,
              inner_file_url: it.inner_file_url || firstItemArtwork,
              cover_file_url: it.cover_file_url || firstItemArtwork
            })),
            totalPriceCharged: updatedOrder.total_price,
            depositAmountPaid: updatedOrder.deposit_amount,
            remainingUnpaidBalance: Math.max(0, updatedOrder.total_price - updatedOrder.deposit_amount),
            paymentStatus: 'Deposit Paid',
            status: 'Received',
            promisedDeliveryDate: promisedDeliveryDate,
            deliveryMethod: deliveryMethod,
            artworkLink: updatedOrder.artwork_url || updatedOrder.google_drive_link || firstItemArtwork,
            artworkUrl: updatedOrder.artwork_url || updatedOrder.google_drive_link || firstItemArtwork,
            artworkFileName: updatedOrder.artwork_file_name || firstItemFileName,
            artworkFileSize: updatedOrder.artwork_file_size || firstItemFileSize
          });
        });
      } else {
        addOrder({
          id: orderData.id,
          orderNumber: orderData.order_number,
          customerName: orderData.customer_name,
          phone: orderData.customer_phone,
          items: (orderData.items || []).map((it: any) => ({
            id: it.id,
            name: it.job_name || it.name,
            quantity: it.quantity,
            unitCost: it.unit_price_snapshot || it.unit_price_lak,
            specs: 'Synced',
            artworkUrl: it.artwork_url || it.inner_file_url || it.cover_file_url || firstItemArtwork,
            artworkFileName: it.artwork_file_name || firstItemFileName,
            artworkFileSize: it.artwork_file_size || firstItemFileSize,
            inner_file_url: it.inner_file_url || firstItemArtwork,
            cover_file_url: it.cover_file_url || firstItemArtwork
          })),
          totalPriceCharged: orderData.total_price,
          depositAmountPaid: orderData.deposit_amount,
          remainingUnpaidBalance: orderData.total_price,
          paymentStatus: paymentStatus === 'Fully Paid' ? 'Fully Paid' : 'Pending',
          status: 'Received',
          promisedDeliveryDate: promisedDeliveryDate,
          deliveryMethod: deliveryMethod,
          artworkLink: orderData.artwork_url || orderData.google_drive_link || firstItemArtwork,
          artworkUrl: orderData.artwork_url || orderData.google_drive_link || firstItemArtwork,
          artworkFileName: orderData.artwork_file_name || firstItemFileName,
          artworkFileSize: orderData.artwork_file_size || firstItemFileSize
        });
      }
    })
    .then(() => {
      showToast('ເພີ່ມອໍເດີໃໝ່ ແລະ ຕັດສະຕ໋ອກ FIFO ສຳເລັດ!', 'success');
      onBack();
    })
    .catch(err => {
      console.error(err);
      showToast('Sync failure. Defaulting order creation to local state storage.', 'warning');
      const fallbackItems = items.map(it => ({
        id: it.paperId || 'paper-a4-80',
        name: it.name,
        quantity: it.quantity,
        unitCost: 15000,
        specs: `${it.jobWidth}x${it.jobHeight}mm`,
        artworkUrl: (it as any).artworkUrl || firstItemArtwork,
        artworkFileName: it.fileName || firstItemFileName,
        artworkFileSize: (it as any).fileSize || firstItemFileSize,
        inner_file_url: (it as any).artworkUrl || firstItemArtwork,
        cover_file_url: (it as any).artworkUrl || firstItemArtwork
      }));
      const selectedCourierObj = couriers?.find(c => c.id === selectedCourierId);
      const deliveryMethodLabel = deliveryMethod === 'Pickup' 
        ? 'Pickup (ຮັບເອງທີ່ຮ້ານ)' 
        : (deliveryMethod === 'Courier' 
            ? `${selectedCourierObj?.name || 'Courier'}${courierBranchCode ? ` [ສາຂາ: ${courierBranchCode}]` : ''}` 
            : 'Direct (ຈັດສົ່ງດ່ວນ)');

      const totalWithDelivery = grandTotalBill + (deliveryMethod === 'Courier' ? Number(deliveryFee || 0) : 0);

      addOrder({
        customerName: finalCustomerName,
        phone: finalPhone,
        address: finalAddress,
        village: village,
        district: district,
        province: province,
        items: fallbackItems,
        totalPriceCharged: totalWithDelivery,
        depositAmountPaid: Number(depositAmountPaid),
        remainingUnpaidBalance: Math.max(0, totalWithDelivery - Number(depositAmountPaid)),
        paymentMethod: 'BCEL One',
        bankName: 'BCEL',
        paymentStatus: paymentStatus,
        artworkLink: firstItemArtwork,
        artworkUrl: firstItemArtwork,
        artworkFileName: firstItemFileName,
        artworkFileSize: firstItemFileSize,
        promisedDeliveryDate: promisedDeliveryDate || new Date().toISOString().split('T')[0],
        deliveryMethod: deliveryMethodLabel,
        delivery_type: deliveryMethod,
        courier_id: deliveryMethod === 'Courier' ? selectedCourierId : undefined,
        courier_name: deliveryMethod === 'Courier' ? (selectedCourierObj?.name || selectedCourierId) : undefined,
        courier_branch_code: deliveryMethod === 'Courier' ? courierBranchCode : undefined,
        tracking_number: deliveryMethod === 'Courier' ? courierTrackingNo : undefined,
        delivery_fee: deliveryMethod === 'Courier' ? Number(deliveryFee || 0) : 0,
        status: 'Received'
      });
      onBack();
    });
  };

  if (editingItemIndex !== null && items[editingItemIndex]) {
    return (
      <ItemSpecConfigurator
        item={items[editingItemIndex]}
        itemIndex={editingItemIndex}
        allItems={items}
        inventory={inventory}
        equipment={equipment}
        formatLAK={formatLAK}
        onSave={handleSaveSpecModal}
        onCancel={() => setEditingItemIndex(null)}
        showToast={showToast}
        customerData={{
          name: customerType === 'existing' ? selectedCustomerId : newCustName,
          phone: customerType === 'existing' ? (customers.find(c => c.id === selectedCustomerId || c.name === selectedCustomerId)?.phone || '') : newCustPhone,
          deliveryMethod: deliveryMethod,
          courier: selectedCourierId
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in w-full text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-100 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ກັບຄືນ (Back to Orders)</span>
        </button>
        <div>
          <span className="text-xs uppercase font-extrabold text-accent-sky tracking-wider font-sans block text-right">
            ຂັ້ນຕອນ {currentStep} ຈາກ 3
          </span>
          <h3 className="text-2xl font-black text-primary-navy mt-0.5">
            ຟອມສ້າງອໍເດີໃໝ່ (Create Order Wizard)
          </h3>
        </div>
      </div>

      {/* Stepper Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { step: 1, label: '1. ຂໍ້ມູນລູກຄ້າ & ການຈັດສົ່ງ (Customer & Delivery)' },
          { step: 2, label: '2. ລາຍການສິນຄ້າ & ສເປກ (Items & Specs)' },
          { step: 3, label: '3. ສະຫຼຸບຍອດ & ເປີດອໍເດີ (Summary & Confirm)' }
        ].map(s => (
          <div 
            key={s.step}
            className={`text-center py-3 px-3 rounded-xl font-black text-xs transition-all ${
              currentStep === s.step 
                ? 'bg-accent-sky text-white shadow-md shadow-accent-sky/20' 
                : currentStep > s.step
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-slate-50 text-slate-400 border border-slate-100'
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* STEP 1: CUSTOMER SELECTION & DELIVERY OPTIONS (COMBINED) */}
      {currentStep === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8 animate-fade-in">
          {/* Section 1: Customer Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-accent-sky" />
              <h4 className="font-black text-slate-800 text-base">
                1. ຂໍ້ມູນລູກຄ້າ (Customer Information)
              </h4>
            </div>

            <div className="max-w-3xl">
              <CustomerCombobox
                customers={customers}
                valueName={customerType === 'existing' ? selectedCustomerId : newCustName}
                valuePhone={customerType === 'existing' ? phone : newCustPhone}
                valueAddress={customerType === 'existing' ? address : newCustAddress}
                onChange={(data) => {
                  if (data.isNew) {
                    setCustomerType('new');
                    setNewCustName(data.name);
                    setNewCustPhone(data.phone);
                    setNewCustAddress(data.address);
                    setVillage(data.village || '');
                    setDistrict(data.district || '');
                    setProvince(data.province || 'ນະຄອນຫຼວງວຽງຈັນ');
                    setSelectedCustomerId('');
                  } else {
                    setCustomerType('existing');
                    setSelectedCustomerId(data.customerId || data.name);
                    setPhone(data.phone);
                    setAddress(data.address);
                    setVillage(data.village || '');
                    setDistrict(data.district || '');
                    setProvince(data.province || 'ນະຄອນຫຼວງວຽງຈັນ');
                  }
                }}
                currentLang={currentLang}
              />
            </div>
          </div>

          {/* Section 2: Delivery & Logistics */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck className="w-5 h-5 text-accent-sky" />
              <div>
                <h4 className="font-black text-slate-800 text-base">
                  2. ຮູບແບບ & ຂໍ້ມູນການຈັດສົ່ງ (Delivery & Logistics Options)
                </h4>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  ເລືອກຮັບເອງທີ່ຮ້ານ ຫຼື ຈັດສົ່ງຜ່ານບໍລິສັດຂົນສົ່ງທີ່ບັນທຶກໃນລະບົບ (ດຶງຂໍ້ມູນຈາກ Database)
                </p>
              </div>
            </div>

            {/* Delivery Method Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'Pickup',
                  title: 'ຮັບເອງທີ່ຮ້ານ',
                  sub: 'Pickup at Store',
                  icon: Store,
                  color: 'sky'
                },
                {
                  id: 'Courier',
                  title: 'ຈັດສົ່ງຜ່ານຂົນສົ່ງ',
                  sub: 'Courier Logistics',
                  icon: Truck,
                  color: 'emerald'
                },
                {
                  id: 'Direct',
                  title: 'ຈັດສົ່ງດ່ວນ / ຕົງ',
                  sub: 'Direct Express',
                  icon: Send,
                  color: 'indigo'
                }
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = deliveryMethod === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setDeliveryMethod(m.id as any);
                      if (m.id === 'Courier' && couriers?.length > 0) {
                        const cur = couriers.find(c => c.id === selectedCourierId) || couriers[0];
                        setDeliveryFee(cur?.fee || 15000);
                      } else if (m.id === 'Pickup') {
                        setDeliveryFee(0);
                      }
                    }}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3.5 ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/60 shadow-sm'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20' : 'bg-white text-slate-500 border border-slate-200'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900">{m.title}</h5>
                      <p className="text-[11px] text-slate-400 font-semibold">{m.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Conditional Courier Details */}
            {deliveryMethod === 'Courier' && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>ເລືອກບໍລິສັດຂົນສົ່ງ (Select Logistics Provider from Database)</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    ດຶງຂໍ້ມູນຈາກຖານຂໍ້ມູນອັດຕະໂນມັດ
                  </span>
                </div>

                {/* Logistics Provider Dropdown / Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-600 mb-1">
                      ບໍລິສັດຂົນສົ່ງ (Courier Company) *
                    </label>
                    <select
                      value={selectedCourierId}
                      onChange={(e) => {
                        setSelectedCourierId(e.target.value);
                        const cur = couriers.find(c => c.id === e.target.value);
                        if (cur) setDeliveryFee(cur.fee || 15000);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
                    >
                      {couriers && couriers.length > 0 ? (
                        couriers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.shortName ? `(${c.shortName})` : ''} - ຄ່າສົ່ງເລີ່ມຕົ້ນ {c.fee?.toLocaleString()} LAK
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="anousith">Anousith Express (ອານຸສິດ)</option>
                          <option value="hal">HAL Logistics (ຮຸ່ງອາລຸນ)</option>
                          <option value="mixay">Mixay Express (ມີໄຊ)</option>
                          <option value="laopost">Lao Post (ໄປສະນີລາວ)</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Branch Code Input (User fills in manually) */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-600 mb-1 flex items-center justify-between">
                      <span>ລະຫັດສາຂາ / ຊື່ສາຂາປາຍທາງ (Branch Code / Name) *</span>
                      <span className="text-[10px] text-rose-500 font-bold">ປ້ອນເອງ</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AN-VTE-01, ສາຂາດົງໂດກ, ສາຂາປາກເຊ..."
                      value={courierBranchCode}
                      onChange={(e) => setCourierBranchCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
                    />
                  </div>
                </div>

                {/* Tracking Number & Delivery Fee */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-600 mb-1">
                      ເລກຕິດຕາມພັດສະດຸ (Tracking Number - ຖ້າມີ)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ANO-8899231"
                      value={courierTrackingNo}
                      onChange={(e) => setCourierTrackingNo(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-600 mb-1">
                      ຄ່າຈັດສົ່ງ (Delivery Fee - LAK)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Destination Address Summary */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      ທີ່ຢູ່ປາຍທາງຜູ້ຮັບ (Destination Summary):
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {address || `${village ? `ບ້ານ ${village}, ` : ''}${district ? `ເມືອງ ${district}, ` : ''}${province || 'ນະຄອນຫຼວງວຽງຈັນ'}` || 'ບໍ່ໄດ້ລະບຸທີ່ຢູ່ລະອຽດ'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>ກຳນົດສົ່ງສິນຄ້າ (Promised Delivery Date) *</span>
                </label>
                <input
                  type="date"
                  required
                  value={promisedDeliveryDate}
                  onChange={(e) => setPromisedDeliveryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 font-bold text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Step 1 Actions */}
          <div className="flex justify-end pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleNextToStep2}
              className="flex items-center gap-2 px-6 py-3 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95"
            >
              <span>ຕໍ່ໄປ: ເພີ່ມລາຍການສິນຄ້າ & ສເປກ (Next: Items & Specs)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: MASTER ITEM LIST VIEW */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fade-in">
          {/* Master Item List View */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <Package className="w-6 h-6 text-accent-sky" />
                  <span>ຮາຍການສິນຄ້າທີ່ລູກຄ້າສັ່ງ (Master Order Item List)</span>
                </h4>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  ເພີ່ມຮາຍການສິນຄ້າ, ກຳນົດຈຳນວນ ແລະ ກົດປຸ່ມ "ກຳນົດສະເປັກ" ເພື່ອຕັ້ງຄ່າສະເປັກການພິມ ແລະ ຄຳນວນຕົ້ນທຶນ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreflightModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-md shadow-accent-sky/20 transition active:scale-95 w-fit cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ເພີ່ມຮາຍການສິນຄ້າ (Add New Item)</span>
              </button>
            </div>

            {/* Item Rows Table */}
            <div className="space-y-3">
              {items.map((it, idx) => {
                const costing = calculateItemCosting(it, inventory, equipment);

                return (
                  <div 
                    key={it.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      it.isConfigured 
                        ? 'bg-emerald-50/30 border-emerald-200/80 shadow-sm' 
                        : 'bg-amber-50/30 border-amber-200/80 shadow-sm'
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      {/* Item Name / Title */}
                      <div className="sm:col-span-4 space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase">
                          Item #{idx + 1}: ຊື່ຮາຍການສິນຄ້າ (Item Name) *
                        </label>
                        <input
                          type="text"
                          required
                          value={it.name}
                          onChange={(e) => updateItemField(idx, 'name', e.target.value)}
                          placeholder="ເຊັ່ນ: ປຶ້ມພາສາລາວ, ປຶ້ມພາສາອັງກິດ..."
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-bold text-xs bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky"
                        />
                      </div>

                      {/* Quantity Input */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase">
                          ຈຳນວນ (Quantity) *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={it.quantity}
                          onChange={(e) => updateItemField(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-black text-xs font-sans bg-white text-center focus:outline-none focus:ring-2 focus:ring-accent-sky"
                        />
                      </div>

                      {/* Calculated Subtotal */}
                      <div className="sm:col-span-2 text-right space-y-0.5">
                        <span className="block text-[10px] font-black text-slate-400 uppercase">
                          ລາຄາລວມ (Subtotal)
                        </span>
                        <span className="text-base font-black text-slate-900 font-sans block">
                          {formatLAK(costing.finalPrice)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold block">
                          (~ {formatLAK(costing.unitPrice)} / ຊິ້ນ)
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="sm:col-span-2 flex items-center justify-center">
                        {it.isConfigured ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <Check className="w-3.5 h-3.5" />
                            <span>Configured - {formatLAK(costing.finalPrice)}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Pending Specs</span>
                          </span>
                        )}
                      </div>

                      {/* Config & Delete Actions */}
                      <div className="sm:col-span-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenSpecModal(idx)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
                            it.isConfigured
                              ? 'bg-primary-navy hover:bg-slate-800 text-white'
                              : 'bg-accent-sky hover:bg-sky-600 text-white'
                          }`}
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>ກຳນົດສະເປັກ</span>
                        </button>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                            title="ລຶບຮາຍການນີ້"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Offcut Scrap Recommendation Badge */}
                    {(() => {
                      const rec = getOffcutRecommendation(it);
                      if (!rec) return null;
                      return (
                        <div className="mt-3 p-2.5 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-black text-emerald-800">
                            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              ແນະນຳ: ໃຊ້ເສດເຈ້ຍລັອດ #{rec.id} ໃນຄັງ (ປະຢັດຕົ້ນທຶນເຈ້ຍ 35%)
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px] font-black uppercase tracking-wider">
                            Save 35%
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>

            {/* Order Operating Costs & Overhead Section */}
            <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-200/80 pb-3">
                <div>
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Settings className="w-5 h-5 text-rose-600" />
                    <span>ຄ່າດຳເນີນງານລວມອໍເດີ (Order Operating Costs & Overhead)</span>
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    ຄຳນວນຄ່າແຮງ, ຄ່າຕັ້ງເຄື່ອງ, ຄ່າເສື່ອມ ແລະ ຄ່າເຜື່ອເສຍ ລວມລະດັບອໍເດີ (ບໍ່ຕ້ອງຄິດຊ້ຳໃນແຕ່ລະສິນຄ້າ)
                  </p>
                </div>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setOrderOverheadMode('Standard')}
                    className={`px-3 py-1.5 rounded-lg transition ${!isCustomOverhead ? 'bg-primary-navy text-white font-black' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    ສະເປັກມາດຕະຖານ (Standard Preset)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderOverheadMode('Custom')}
                    className={`px-3 py-1.5 rounded-lg transition ${isCustomOverhead ? 'bg-primary-navy text-white font-black' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    ກຳນົດເອງ (Custom Spec)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold text-slate-700">
                {/* 1. Setup Fee */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-black block">1. ຄ່າຕັ້ງເຄື່ອງ & ກຽມງານ</span>
                  {isCustomOverhead ? (
                    <input
                      type="number"
                      value={customSetupFee}
                      onChange={(e) => setCustomSetupFee(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs font-black focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm font-black text-slate-900 font-sans block">{formatLAK(setupFee)}</span>
                  )}
                </div>

                {/* 2. Labor Fee */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-black block">2. ຄ່າແຮງງານຊ່າງລວມ</span>
                  {isCustomOverhead ? (
                    <input
                      type="number"
                      value={customLaborFee}
                      onChange={(e) => setCustomLaborFee(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs font-black focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm font-black text-slate-900 font-sans block">{formatLAK(laborFee)}</span>
                  )}
                </div>

                {/* 3. Depreciation & Power Fee */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-black block">3. ຄ່າເສື່ອມເຄື່ອງ & ໄຟຟ້າລວມ</span>
                  {isCustomOverhead ? (
                    <input
                      type="number"
                      value={customDeprPowerFee}
                      onChange={(e) => setCustomDeprPowerFee(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs font-black focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm font-black text-slate-900 font-sans block">{formatLAK(deprPowerFee)}</span>
                  )}
                </div>

                {/* 4. Spoilage Fee */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-black block">4. ຄ່າເຜື່ອເສຍລວມ</span>
                  {isCustomOverhead ? (
                    <input
                      type="number"
                      value={customSpoilageFee}
                      onChange={(e) => setCustomSpoilageFee(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs font-black focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm font-black text-slate-900 font-sans block">{formatLAK(spoilageFee)}</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 text-xs font-black">
                <span className="text-slate-600">ລວມຄ່າດຳເນີນງານລະດັບອໍເດີ (Order Overhead Sum):</span>
                <span className="text-base font-sans text-rose-600 font-black">{formatLAK(orderOperatingOverhead)}</span>
              </div>
            </div>

            {/* Dynamic Grand Total Bill Card */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Grand Total Bill ({items.length} items)
                </span>
                <span className="text-2xl sm:text-3xl font-black font-sans text-emerald-400 mt-1 block">
                  {formatLAK(grandTotalBill)}
                </span>
                <span className="text-[11px] text-slate-400 font-mono block">
                  (Items Subtotal: {formatLAK(sumItemSubtotals)} + Order Overhead: {formatLAK(orderOperatingOverhead)})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleNextToStep3}
                  className={`px-6 py-3.5 rounded-2xl font-black text-xs shadow-lg transition active:scale-95 flex items-center gap-2 ${
                    allItemsConfigured
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  }`}
                >
                  <span>ຖັດໄປ: ສະຫຼຸບຍອດ & ເປີດອໍເດີ (Step 3)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ຍ້ອນກັບ (Back)</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ORDER SUMMARY & STOCK DEDUCTION */}
      {currentStep === 3 && (
        <form onSubmit={handleSubmitFinal} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-fade-in text-sm">
          {backendCalculationBreakdown.length > 0 && (
            <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80">
              <h5 className="font-black text-xs text-sky-950 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                <Calculator className="w-4 h-4 text-sky-600" />
                <span>ສະຫຼຸບການຄຳນວນລາຄາຈາກລະບົບຫຼັງບ້ານ (Backend Pricing Breakdown)</span>
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-semibold text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase">
                      <th className="py-2 text-left">ລາຍການ (Job)</th>
                      <th className="py-2 text-right">ເຈ້ຍ (Paper)</th>
                      <th className="py-2 text-right">ໝຶກ (Ink)</th>
                      <th className="py-2 text-right">ເຄືອບ (Lam)</th>
                      <th className="py-2 text-right">ເຂົ້າເລັ້ມ (Bind)</th>
                      <th className="py-2 text-right">ຄ່າແຮງ (Labor)</th>
                      <th className="py-2 text-right">ຕົ້ນທຶນລວມ (Total Cost)</th>
                      <th className="py-2 text-right">ລາຄາຂາຍ (Sale Price)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {backendCalculationBreakdown.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 font-bold text-slate-900">{item.job_name} ({item.quantity} units)</td>
                        <td className="py-2.5 text-right font-mono">{formatLAK(item.paper_cost)}</td>
                        <td className="py-2.5 text-right font-mono">{formatLAK(item.ink_cost)}</td>
                        <td className="py-2.5 text-right font-mono">{formatLAK(item.lamination_cost)}</td>
                        <td className="py-2.5 text-right font-mono">{formatLAK(item.binding_cost)}</td>
                        <td className="py-2.5 text-right font-mono">{formatLAK(item.labor_cost)}</td>
                        <td className="py-2.5 text-right font-mono text-rose-600 font-bold">{formatLAK(item.total_cost)}</td>
                        <td className="py-2.5 text-right font-mono text-emerald-600 font-bold">{formatLAK(item.sale_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/60 p-6 rounded-2xl border border-slate-100">
            <div className="space-y-4">
              <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs border-b border-slate-200 pb-2">
                ຂໍ້ມູນການຈັດສົ່ງ & ກຳນົດສົ່ງ (Delivery Summary)
              </h4>
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">ຮູບແບບການຈັດສົ່ງ:</span>
                  <span className="font-bold text-sky-900">
                    {deliveryMethod === 'Pickup' ? 'ຮັບເອງທີ່ຮ້ານ' : (deliveryMethod === 'Courier' ? 'ຈັດສົ່ງຜ່ານຂົນສົ່ງ' : 'ຈັດສົ່ງດ່ວນ')}
                  </span>
                </div>
                {deliveryMethod === 'Courier' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">ບໍລິສັດຂົນສົ່ງ:</span>
                      <span className="font-bold text-emerald-700">
                        {couriers.find(c => c.id === selectedCourierId)?.name || selectedCourierId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">ລະຫັດສາຂາປາຍທາງ:</span>
                      <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        {courierBranchCode || '-'}
                      </span>
                    </div>
                    {courierTrackingNo && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Tracking No:</span>
                        <span className="font-mono font-bold text-slate-800">{courierTrackingNo}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">ຄ່າຂົນສົ່ງ:</span>
                      <span className="font-mono font-bold text-slate-800">{formatLAK(deliveryFee)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span className="text-slate-500">ກຳນົດສົ່ງ:</span>
                  <span className="font-bold text-slate-800">{promisedDeliveryDate}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-l border-slate-200/80 pl-0 sm:pl-6">
              <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs border-b border-slate-200 pb-2">
                ສະຫຼຸບຍອດ & ຕັດສະຕ໋ອກ (Order Summary & Trigger)
              </h4>
              <div className="space-y-3 text-xs font-semibold text-slate-600">
                <div className="flex justify-between items-center">
                  <span>ຍອດລວມທັງໝົດ (Grand Total):</span>
                  <span className="font-sans font-black text-slate-900 text-base">{formatLAK(grandTotalBill)}</span>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-200">
                  <label className="block text-[10px] font-black text-slate-400 uppercase">ສະຖານະການຊຳຣະ (Payment Status)</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => {
                      setPaymentStatus(e.target.value);
                      if (e.target.value === 'Fully Paid') setDepositAmountPaid(grandTotalBill);
                      else if (e.target.value === 'Pending') setDepositAmountPaid(0);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky text-xs font-bold transition"
                  >
                    <option value="Pending">Pending (ຍັງບໍ່ຊຳຣະ)</option>
                    <option value="Deposit Paid">Deposit Paid (ມັດຈຳ)</option>
                    <option value="Fully Paid">Fully Paid (ຊຳຣະເຕັມ)</option>
                  </select>
                </div>
                {paymentStatus === 'Deposit Paid' && (
                  <div className="space-y-1 pt-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase">ຈຳນວນເງິນມັດຈຳ (Deposit Paid)</label>
                    <input
                      type="number"
                      required
                      min="1000"
                      max={grandTotalBill}
                      value={depositAmountPaid}
                      onChange={(e) => setDepositAmountPaid(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold text-xs font-sans transition"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1 max-w-xl">
            <label className="block text-xs font-black text-slate-500">ລິ້ງໄຟລ໌ງານ (Google Drive / Dropbox)</label>
            <input
              type="text"
              placeholder="https://drive.google.com/..."
              value={artworkLink}
              onChange={(e) => setArtworkLink(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold font-sans text-xs transition"
            />
          </div>

          <div className="flex justify-between pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ກັບຄືນ (Back)</span>
            </button>
            <button
              type="submit"
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/15 transition active:scale-95"
            >
              ຢືນຢັນສ້າງອໍເດີ (Confirm & Deduct Stock FIFO)
            </button>
          </div>
        </form>
      )}

      {/* PREFLIGHT & COLOR ANALYZER MODAL */}
      <PreflightItemCreationModal
        isOpen={isPreflightModalOpen}
        onClose={() => setIsPreflightModalOpen(false)}
        onConfirm={handleConfirmPreflightItem}
        onSkip={handleSkipPreflightItem}
        currentLang="lo"
      />
    </div>
  );
}

