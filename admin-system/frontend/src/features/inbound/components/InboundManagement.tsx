import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  X, 
  Maximize2, 
  FileText, 
  Microchip, 
  Vault, 
  Sparkles,
  Upload,
  CreditCard,
  Image as ImageIcon,
  DollarSign,
  Calendar,
  PackagePlus,
  Layers,
  FileSpreadsheet,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '@store/AppContext';
import { FormModalTemplate } from '@components/common';
import ImportForm from './ImportForm';
import DynamicSpecDetail from '@features/inventory/components/details/DynamicSpecDetail';
import ProcurementDetailCard from '@features/inventory/components/details/ProcurementDetailCard';
import InboundEditModal from './modals/InboundEditModal';
import RestockBatchModal from './modals/RestockBatchModal';
import type { InboundEntry } from '../types';
import { formatCompositeItemName } from '@utils/costCalculator';

export const resolveInboundItemName = (item: any): string => {
  if (!item) return '-';
  const specs = item.specs || item.technical_specs || {};
  const cat = (item.category || item.categoryPill || '').toLowerCase();

  // Ink: Prioritize specific brand and color
  if (cat.includes('ink') || cat.includes('ໝຶກ')) {
    const brand = specs.brand || item.brand || '';
    const colorName = specs.colorName || specs.color_name || item.colorName || '';
    const colorGroup = specs.colorGroup || specs.color_group || item.colorGroup || '';

    if (colorName) {
      const prefix = brand ? `${brand} - ` : '';
      const groupSuffix = colorGroup && !colorName.toLowerCase().includes(colorGroup.toLowerCase()) ? ` (${colorGroup})` : '';
      return `${prefix}${colorName}${groupSuffix}`;
    }
  }

  // Paper: Prioritize name, grammage and format
  if (cat.includes('paper') || cat.includes('material') || cat.includes('ເຈ້ຍ')) {
    const baseName = item.name || item.itemName || specs.paperName || 'Paper';
    const gsm = specs.grammageGsm || specs.grammage || item.grammageGsm;
    const format = specs.paperFormat || specs.standardSize || item.paperFormat;
    if (gsm && format && !baseName.toLowerCase().includes(`${gsm}`)) {
      return `${baseName} - ${gsm}gsm (${format})`;
    }
    return baseName;
  }

  if (item.name && item.name.trim() !== '') return item.name;
  if (item.itemName && item.itemName.trim() !== '') return item.itemName;
  if (specs.brand || specs.model || specs.series) {
    return `${specs.brand || ''} ${specs.series || ''} ${specs.model || ''}`.trim();
  }
  if (specs.colorName) return `ໝຶກ ${specs.colorName} (${specs.inkBaseType || 'Dye'})`;
  if (item.skuCode || item.sku || item.poNumber || item.id) {
    return `${item.category || 'Item'} (${item.skuCode || item.sku || item.poNumber || item.id})`;
  }

  return 'Unspecified Item';
};

export default function InboundManagement() {
  const queryClient = useQueryClient();
  const { showToast, askConfirmation, formatCurrency, addEquipment, addInventorySku, addInventoryBatch, updateInboundEntry, deleteInboundEntry, unrecordDeletedId, saveInventoryToBackend, inventory, addStock, addPrinterColorLink, refreshData } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const invalidateInboundAndInventory = () => {
    queryClient.invalidateQueries({ queryKey: ['inbound'] });
    queryClient.invalidateQueries({ queryKey: ['inbound-records'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    queryClient.invalidateQueries({ queryKey: ['materials'] });
  };

  // Filters state
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Drawers & Modals state
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Initial Master Dataset
  const [inboundList, setInboundList] = useState<InboundEntry[]>(() => {
    const savedLocal = localStorage.getItem('som_sing_inbound_list');
    if (savedLocal !== null) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    const savedCtx = localStorage.getItem('ss_print_inbound_entries_v6');
    if (savedCtx !== null) {
      try {
        const parsed = JSON.parse(savedCtx);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const getDeletedIds = (): Set<string> => {
    try {
      const raw = localStorage.getItem('som_sing_deleted_item_ids');
      if (raw) return new Set(JSON.parse(raw));
    } catch (e) {}
    return new Set();
  };

  const recordDeletedId = (id: string) => {
    try {
      const set = getDeletedIds();
      set.add(id);
      set.add(id.toLowerCase());
      localStorage.setItem('som_sing_deleted_item_ids', JSON.stringify(Array.from(set)));
    } catch (e) {}
  };

  const fetchInbound = async () => {
    try {
      const res = await fetch('/api/inbound');
      if (res.ok) {
        const data = await res.json();
        const deletedIds = getDeletedIds();
        let dbRows = (data.status === 'success' && Array.isArray(data.data)) ? data.data : [];
        const dbIdSet = new Set(dbRows.map((d: any) => d.id?.toLowerCase()));

        // 1. Auto-sync any local items that are missing from PostgreSQL database
        const localCachedRaw = localStorage.getItem('som_sing_inbound_list');
        let localCached: any[] = [];
        if (localCachedRaw) {
          try { localCached = JSON.parse(localCachedRaw); } catch (e) {}
        }
        
        const missingFromDb = (localCached || []).filter((item: any) => 
          item && item.id && !dbIdSet.has(item.id.toLowerCase()) && !deletedIds.has(item.id) && !deletedIds.has(item.id.toLowerCase())
        );

        if (missingFromDb.length > 0) {
          for (const item of missingFromDb) {
            try {
              await fetch('/api/inbound', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: item.id,
                  poNumber: item.poNumber || item.id,
                  inboundDate: item.receiptDate || item.inboundDate || new Date().toISOString().split('T')[0],
                  skuCode: item.sku || item.skuCode || item.id,
                  itemName: item.name || item.itemName || item.id,
                  supplierName: item.supplier || item.supplierName || 'Supplier',
                  category: item.category || 'PAPER',
                  quantity: Number(item.currentQty || item.initialQty || item.quantity || 1),
                  unit: item.unit || 'Unit',
                  totalPrice: Number(item.totalPrice || 0),
                  paymentMethod: item.paymentMethod || 'TRANSFER',
                  origin: item.origin || 'TH',
                  specs: item.specs || {},
                  productImage: item.docs?.productPhoto || item.productImage || '',
                  receiptSlip: item.docs?.paymentSlip || item.receiptSlip || ''
                })
              });
            } catch (syncErr) {
              console.warn('Auto-sync item to PostgreSQL error:', syncErr);
            }
          }

          // Re-fetch after syncing all missing records to get full DB state
          const reRes = await fetch('/api/inbound');
          if (reRes.ok) {
            const reData = await reRes.json();
            if (reData.status === 'success' && Array.isArray(reData.data)) {
              dbRows = reData.data;
            }
          }
        }

        // 2. Map directly from PostgreSQL (Database as Single Source of Truth)
        if (dbRows.length > 0) {
          const mapped = dbRows
            .filter((item: any) => !deletedIds.has(item.id) && !deletedIds.has(item.id?.toLowerCase()))
            .map((item: any) => ({
              id: item.id,
              poNumber: item.poNumber || item.id,
              receiptDate: item.inboundDate || new Date().toISOString().split('T')[0],
              category: item.category,
              categoryPill: item.category,
              name: resolveInboundItemName(item),
              itemName: resolveInboundItemName(item),
              sku: item.skuCode,
              currentQty: item.quantity || 1,
              initialQty: item.quantity || 1,
              unit: (item.category === 'PRINTER' || item.category === 'MACHINERY') ? 'ເຄື່ອງ' : item.category === 'INK' ? 'ຂວດ' : (item.unit || 'ແຜ່ນ'),
              subUnit: `(${item.quantity} ${item.unit || 'Unit'})`,
              supplier: item.supplierName || 'Supplier',
              totalPrice: item.totalPrice || 0,
              paymentMethod: item.paymentMethod || 'TRANSFER',
              origin: item.origin || 'TH',
              specs: item.specs || {},
              docs: {
                productPhoto: item.productImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E",
                paymentSlip: item.receiptSlip || ''
              },
              receiptUrl: item.receiptSlip || ''
            }));

          setInboundList(mapped);
          localStorage.setItem('som_sing_inbound_list', JSON.stringify(mapped));
        }
      }
    } catch (err) {
      console.log('Using local inbound data fallback', err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchInbound(),
      refreshData()
    ]);
    setIsRefreshing(false);
    showToast(currentLang === 'lo' ? 'ດຶງຂໍ້ມູນລ່າສຸດສຳເລັດ!' : 'All data refreshed successfully!', 'success');
  };

  useEffect(() => {
    fetchInbound();
  }, []);

  // Form input state (Common Master)
  // Categories: 'MATERIAL' (A.1), 'INK' (A.2), 'HARDWARE' (A.3), 'PRINTER' (B.1), 'CUTTER' (B.2)
  const [formCategory, setFormCategory] = useState('MATERIAL');
  const [formPo, setFormPo] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formQty, setFormQty] = useState(1);
  const [formUnit, setFormUnit] = useState('Ream');
  const [formTotalPrice, setFormTotalPrice] = useState(0);
  const [formPaymentMethod, setFormPaymentMethod] = useState('TRANSFER'); // 'CASH' | 'TRANSFER'
  const [formOrigin, setFormOrigin] = useState('TH');
  const [formTariff, setFormTariff] = useState(0);
  const [formFreight, setFormFreight] = useState(0);
  const [formImgProduct, setFormImgProduct] = useState('');
  const [formImgSlip, setFormImgSlip] = useState('');

  // Group 1: Material (Sheet & Roll) Specs
  const [specFormFactor, setSpecFormFactor] = useState('SHEET');
  const [specGrammage, setSpecGrammage] = useState('');
  const [specSizePreset, setSpecSizePreset] = useState('A4');
  const [specWidthMm, setSpecWidthMm] = useState('');
  const [specLength, setSpecLength] = useState('');
  const [specPackQty, setSpecPackQty] = useState('');

  // Group 2: Ink Specs
  const [specInkType, setSpecInkType] = useState('UV Ink');
  const [specColorModel, setSpecColorModel] = useState('CMYK Set');
  const [specVolumeBottle, setSpecVolumeBottle] = useState('1000 ml');
  const [specCompatiblePrinter, setSpecCompatiblePrinter] = useState('');

  // Group 3: Hardware & Equipment Specs (ກາວ, ສັນຫ່ວງ, ແມັກ, ມີດຕັດ)
  const [specHwType, setSpecHwType] = useState('FASTENER');
  const [specHwSpec, setSpecHwSpec] = useState('');
  const [specPackCount, setSpecPackCount] = useState('');
  const [specContainerWeight, setSpecContainerWeight] = useState('');

  // Group 4: Printers Specs (Dynamic Color Slots)
  const [printerColorSlots, setPrinterColorSlots] = useState(['Cyan (C)', 'Magenta (M)', 'Yellow (Y)', 'Black (K)']);
  const [newColorInput, setNewColorInput] = useState('');
  const [specClickBw, setSpecClickBw] = useState('');
  const [specClickColor, setSpecClickColor] = useState('');
  const [specMaxPaperSize, setSpecMaxPaperSize] = useState('');
  const [specPrintSpeed, setSpecPrintSpeed] = useState('');
  const [specDepreciation, setSpecDepreciation] = useState('');
  const [specLaborCostPrinter, setSpecLaborCostPrinter] = useState('');

  // Add custom color slot to printer
  const handleAddColorSlot = () => {
    if (!newColorInput.trim()) return;
    if (!printerColorSlots.includes(newColorInput.trim())) {
      setPrinterColorSlots([...printerColorSlots, newColorInput.trim()]);
    }
    setNewColorInput('');
  };

  // Remove color slot from printer
  const handleRemoveColorSlot = (colorToRemove) => {
    setPrinterColorSlots(printerColorSlots.filter(c => c !== colorToRemove));
  };

  // Group 5: Cutters Specs
  const [specCutterType, setSpecCutterType] = useState('GUILLOTINE');
  const [specMaxCutWidth, setSpecMaxCutWidth] = useState('');
  const [specCuttingSpeed, setSpecCuttingSpeed] = useState('');
  const [specBladeLifespan, setSpecBladeLifespan] = useState('');
  const [specSetupTime, setSpecSetupTime] = useState('');
  const [specLaborCostCutter, setSpecLaborCostCutter] = useState('');

  // Multi-currency formatter from context
  const formatLAK = formatCurrency;

  // Calculate Net Landed Cost
  const calculateLandedCost = (item) => {
    const raw = Number(item.totalPrice) || 0;
    const qty = Number(item.initialQty || item.currentQty) || 1;
    return raw / qty;
  };

  // File Upload Handlers for Product Image & Payment Slip
  const handleFileUpload = (e, setUrlState) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setUrlState(uploadEvent.target.result);
      showToast(currentLang === 'lo' ? 'ອັບໂຫຼດຮູບພາບສຳເລັດແລ້ວ!' : 'Image uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Open Modal for Add/Edit
  const handleOpenModal = (itemToEdit = null) => {
    if (itemToEdit) {
      setEditingItem(itemToEdit);
      setFormCategory(itemToEdit.category || 'MATERIAL');
      setFormPo(itemToEdit.poNumber || '');
      setFormDate(itemToEdit.receiptDate || '');
      setFormSku(itemToEdit.sku || '');
      setFormName(itemToEdit.name || '');
      setFormSupplier(itemToEdit.supplier || '');
      setFormQty(itemToEdit.initialQty || itemToEdit.currentQty || 1);
      setFormUnit(itemToEdit.unit || 'Ream');
      setFormTotalPrice(itemToEdit.totalPrice || 0);
      setFormPaymentMethod(itemToEdit.paymentMethod || 'TRANSFER');
      setFormOrigin(itemToEdit.origin || 'TH');
      setFormTariff(itemToEdit.tariffRate || 0);
      setFormFreight(itemToEdit.freightCharge || 0);
      setFormImgProduct(itemToEdit.docs?.productPhoto || '');
      setFormImgSlip(itemToEdit.docs?.paymentSlip || '');

      // Load Specs into form
      const specs = itemToEdit.specs || {};
      setSpecFormFactor(specs.formFactor || 'SHEET');
      setSpecGrammage(specs.grammage || '');
      setSpecSizePreset(specs.standardSize || 'A4');
      setSpecWidthMm(specs.widthMm || '');
      setSpecLength(specs.length || '');
      setSpecPackQty(specs.packQty || '');

      setSpecInkType(specs.inkType || 'UV Ink');
      setSpecColorModel(specs.colorModel || 'CMYK Set');
      setSpecVolumeBottle(specs.volumePerBottle || '1000 ml');
      setSpecCompatiblePrinter(specs.compatiblePrinter || '');

      setSpecHwType(specs.hwType || 'FASTENER');
      setSpecHwSpec(specs.hwSpec || '');
      setSpecPackCount(specs.packCount || '');
      setSpecContainerWeight(specs.containerWeight || '');

      setSpecClickBw(specs.clickBw || '');
      setSpecClickColor(specs.clickColor || '');
      setSpecMaxPaperSize(specs.maxPaperSize || '');
      setSpecPrintSpeed(specs.printSpeed || '');
      setSpecDepreciation(specs.depreciationYears || '');
      setSpecLaborCostPrinter(specs.laborCostHr || '');

      setSpecCutterType(specs.cutterType || 'GUILLOTINE');
      setSpecMaxCutWidth(specs.maxCutWidthMm || '');
      setSpecCuttingSpeed(specs.cuttingSpeed || '');
      setSpecBladeLifespan(specs.bladeLifespan || '');
      setSpecSetupTime(specs.setupTimeMins || '');
      setSpecLaborCostCutter(specs.laborCostHr || '');
    } else {
      setEditingItem(null);
      setFormCategory('MATERIAL');
      setFormPo(`PO-${Math.floor(100000 + Math.random() * 900000)}`);
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setFormName('');
      setFormSupplier('');
      setFormQty(1);
      setFormUnit('Ream');
      setFormTotalPrice(0);
      setFormPaymentMethod('TRANSFER');
      setFormOrigin('TH');
      setFormTariff(0);
      setFormFreight(0);
      setFormImgProduct('');
      setFormImgSlip('');

      // Reset Specs
      setSpecFormFactor('SHEET');
      setSpecGrammage('');
      setSpecSizePreset('A4');
      setSpecWidthMm('');
      setSpecLength('');
      setSpecPackQty('');

      setSpecInkType('UV Ink');
      setSpecColorModel('CMYK Set');
      setSpecVolumeBottle('1000 ml');
      setSpecCompatiblePrinter('');

      setSpecHwType('FASTENER');
      setSpecHwSpec('');
      setSpecPackCount('');
      setSpecContainerWeight('');

      setSpecClickBw('');
      setSpecClickColor('');
      setSpecMaxPaperSize('');
      setSpecPrintSpeed('');
      setSpecDepreciation('');
      setSpecLaborCostPrinter('');

      setSpecCutterType('GUILLOTINE');
      setSpecMaxCutWidth('');
      setSpecCuttingSpeed('');
      setSpecBladeLifespan('');
      setSpecSetupTime('');
      setSpecLaborCostCutter('');
    }
    setIsModalOpen(true);
  };

  const saveInboundToBackend = (item: any, isUpdate = false) => {
    const resolvedName = resolveInboundItemName(item);
    const resolvedSku = item.specs?.materialId || item.specs?.skuCode || item.specs?.sku || item.skuCode || item.sku || item.id;
    const apiPayload = {
      id: item.id,
      poNumber: item.poNumber || item.id,
      inboundDate: item.inboundDate || item.receiptDate || new Date().toISOString().split('T')[0],
      skuCode: resolvedSku,
      itemName: resolvedName,
      supplierName: item.supplierName || item.supplier || '',
      category: item.category,
      quantity: Number(item.quantity || item.initialQty || item.currentQty) || 1,
      unit: item.unit || 'Unit',
      totalPrice: Number(item.totalPrice) || 0,
      paymentMethod: item.paymentMethod || 'TRANSFER',
      origin: item.origin || 'TH',
      productImage: item.productImage || item.docs?.productPhoto || '',
      receiptSlip: item.receiptSlip || item.docs?.paymentSlip || item.receiptUrl || '',
      specs: item.specs || {}
    };

    const url = isUpdate ? `/api/inbound/${item.id}` : '/api/inbound';
    const method = isUpdate ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiPayload)
    }).catch(err => console.log('Inbound API save error', err));
  };

  const deleteInboundFromBackend = (id: string) => {
    fetch(`/api/inbound/${id}`, {
      method: 'DELETE'
    }).catch(err => console.log('Inbound API delete error', err));
  };

  const processSingleImportItem = (type: string, data: any, batchIndex?: number) => {
    const logId = data.id || `INB-${Date.now().toString().slice(-4)}${batchIndex !== undefined ? `-${batchIndex}` : ''}`;
    const calcTotal = Number(data.price) || Number(data.unitPrice) || Number(data.rawImportCost) || ((data.importQty || 1) * Number(data.unitPrice || 0));
    const resolvedItemName = resolveInboundItemName(data);

    unrecordDeletedId(logId);
    if (data.id) unrecordDeletedId(data.id);
    if (resolvedItemName) unrecordDeletedId(resolvedItemName);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const fullDate = data.importDate ? (data.importDate.includes(':') ? data.importDate : `${data.importDate} ${timeStr}`) : `${now.toISOString().split('T')[0]} ${timeStr}`;

    const newLog = {
      id: logId,
      poNumber: data.poNumber || logId,
      receiptDate: fullDate,
      inboundDate: fullDate,
      category: type,
      categoryPill: type,
      name: resolvedItemName,
      itemName: resolvedItemName,
      sku: data.sku || data.id,
      currentQty: (type === 'PRINTER' || type === 'MACHINERY') ? 1 : data.importQty || 1,
      initialQty: (type === 'PRINTER' || type === 'MACHINERY') ? 1 : data.importQty || 1,
      unit: data.unit || 'Unit',
      subUnit: (type === 'PRINTER' || type === 'MACHINERY') ? '(1 Unit)' : `(${data.importQty} ${data.unit})`,
      supplier: data.supplier || data.vendor || '',
      totalPrice: calcTotal,
      paymentMethod: data.paymentMethod || 'TRANSFER',
      supplier_phone: data.supplier_phone || data.specs?.supplier_phone || '',
      purchase_link: data.purchase_link || data.specs?.purchase_link || '',
      specs: data.specs || { ...data },
      docs: {
        productPhoto: data.imageUrl || (Array.isArray(data.actual_images) && data.actual_images[0]) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E",
        paymentSlip: data.receiptUrl || data.payment_slip || ''
      },
      receiptUrl: data.receiptUrl || data.payment_slip || ''
    };

    saveInboundToBackend(newLog);

    if (type === 'PRINTER' || type === 'MACHINERY') {
      addEquipment({
        ...data,
        category: type === 'PRINTER' ? 'Printer' : 'Processing Tools',
        status: 'In Use'
      });

      if (type === 'PRINTER' && Array.isArray(data.printerColorLinks)) {
        data.printerColorLinks.forEach((link: any) => {
          const vol = Number(link.oemStandardVolumeMl) || 100;
          const yieldPages = Number(link.oemStandardIsoYieldA4) || 5000;
          const baseRate = vol / yieldPages;
          addPrinterColorLink({
            assetId: data.id,
            inkCode: link.oemInkCode || link.inkCode,
            slotPosition: link.slotPosition,
            oemStandardVolumeMl: vol,
            oemStandardIsoYieldA4: yieldPages,
            baseConsumptionRateMl: baseRate,
            isoPageYieldA4: yieldPages,
            notes: `Color Group: ${link.colorGroup || 'General'}`
          });
        });
      }
    } else {
      const sheetsPerPack = Number(data.sheetsPerPack || data.specs?.sheetsPerPack || data.sheets_per_pack || data.sheets_per_ream || 500);
      const isSheetPaper = type === 'PAPER' || type === 'MATERIAL' || data.category === 'Paper';
      const packQty = Number(data.importQty || 1);
      const totalSheets = isSheetPaper ? packQty * sheetsPerPack : packQty;
      const unitPrice = Number(data.unitPrice || data.price || calcTotal || 95000);
      const perSheetPrice = isSheetPaper && sheetsPerPack > 0 ? (unitPrice / sheetsPerPack) : unitPrice;


      const existingItem = inventory.find(item => 
        (item.id && (item.id === data.id || item.id === data.sku || item.id === logId)) ||
        (item.sku && (item.sku === data.sku || item.sku === data.id || item.sku === data.skuCode)) ||
        (data.restockItemId && item.id === data.restockItemId) ||
        (item.name && data.name && item.name.toLowerCase().trim() === data.name.toLowerCase().trim()) ||
        (item.name && resolvedItemName && item.name.toLowerCase().trim() === resolvedItemName.toLowerCase().trim())
      );
      if (existingItem) {
        addInventoryBatch(existingItem.id, {
          batchId: `LOT-${logId}`,
          purchaseDate: data.receiptDate || data.importDate || new Date().toISOString().split('T')[0],
          supplierName: data.supplier || data.vendor || '',
          purchasePrice: unitPrice,
          purchaseQty: packQty,
          sheetsToAdd: totalSheets
        });
      } else {
        const newItem = {
          id: data.id || logId,
          name: data.name,
          category: isSheetPaper ? 'Paper' : (type === 'INK' ? 'Ink' : 'Finishing'),
          stockQty: totalSheets,
          consumptionUnit: isSheetPaper ? 'ແຜ່ນ' : (data.unit || 'Units'),
          purchaseUnit: isSheetPaper ? 'ແພັກ' : (data.unit || 'Units'),
          purchaseMultiplier: isSheetPaper ? sheetsPerPack : 1,
          costPerPurchaseUnit: unitPrice,
          costPerConsumptionUnit: perSheetPrice,
          reorderThreshold: 50,
          specs: data.specs || { ...data },
          batches: [
            {
              id: `LOT-${logId}`,
              purchaseDate: data.receiptDate || data.importDate || new Date().toISOString().split('T')[0],
              supplierName: data.supplier || data.vendor || '',
              purchasePricePerReam: unitPrice,
              costPerSheet: perSheetPrice,
              initialQty: totalSheets,
              currentQty: totalSheets
            }
          ]
        };
        addInventorySku(newItem);
        saveInventoryToBackend(newItem);
      }

      if (type === 'INK' && data.targetPrinterId) {
        addPrinterColorLink({
          assetId: data.targetPrinterId,
          inkCode: data.id,
          slotPosition: `${data.colorGroup} (${data.colorName})`,
          notes: data.isCompatible ? 'Compatible Ink' : 'OEM Ink'
        });
      }
    }

    return newLog;
  };

  const handleImportSubmit = (type, data) => {
    if (type === 'BATCH' && Array.isArray(data)) {
      const createdLogs = data.map((item, idx) => processSingleImportItem(item.type, item.data, idx + 1));
      setInboundList(prev => {
        const newList = [...createdLogs, ...prev];
        localStorage.setItem('som_sing_inbound_list', JSON.stringify(newList));
        return newList;
      });
      showToast(currentLang === 'lo' ? `ບັນທຶກ ${data.length} ລາຍການຮຽບຮ້ອຍແລ້ວ!` : `Successfully recorded ${data.length} items!`, 'success');
    } else {
      const newLog = processSingleImportItem(type, data);
      setInboundList(prev => {
        const newList = [newLog, ...prev];
        localStorage.setItem('som_sing_inbound_list', JSON.stringify(newList));
        return newList;
      });
      showToast(`${type} recorded successfully!`, 'success');
    }

    invalidateInboundAndInventory();
    setIsModalOpen(false);
  };

  // Submit Add / Edit
  const handleSubmitForm = (e) => {
    e.preventDefault();

    let specs = {};
    if (formCategory === 'MATERIAL') {
      specs = {
        formFactor: specFormFactor,
        grammage: specGrammage,
        standardSize: specSizePreset,
        widthMm: specWidthMm,
        length: specLength,
        packQty: specPackQty
      };
    } else if (formCategory === 'INK') {
      specs = {
        inkType: specInkType,
        colorModel: specColorModel,
        volumePerBottle: specVolumeBottle,
        compatiblePrinter: specCompatiblePrinter
      };
    } else if (formCategory === 'HARDWARE') {
      specs = {
        hwType: specHwType,
        hwSpec: specHwSpec,
        packCount: specPackCount,
        containerWeight: specContainerWeight
      };
    } else if (formCategory === 'PRINTER') {
      specs = {
        clickBw: specClickBw,
        clickColor: specClickColor,
        maxPaperSize: specMaxPaperSize,
        printSpeed: specPrintSpeed,
        depreciationYears: specDepreciation,
        laborCostHr: specLaborCostPrinter
      };
    } else if (formCategory === 'CUTTER') {
      specs = {
        cutterType: specCutterType,
        maxCutWidthMm: specMaxCutWidth,
        cuttingSpeed: specCuttingSpeed,
        bladeLifespan: specBladeLifespan,
        setupTimeMins: specSetupTime,
        laborCostHr: specLaborCostCutter
      };
    }

    const payload = {
      id: editingItem ? editingItem.id : `INB-${Date.now().toString().slice(-4)}`,
      poNumber: formPo,
      receiptDate: formDate,
      category: formCategory,
      categoryPill: formCategory === 'MATERIAL' ? 'PAPER' : formCategory,
      name: formName,
      sku: formSku,
      currentQty: Number(formQty),
      initialQty: Number(formQty),
      unit: formUnit,
      subUnit: `(${formQty} ${formUnit})`,
      supplier: formSupplier,
      totalPrice: Number(formTotalPrice),
      paymentMethod: formPaymentMethod,
      origin: formOrigin,
      specs: specs,
      docs: {
        productPhoto: formImgProduct || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E",
        paymentSlip: formPaymentMethod === 'TRANSFER' ? formImgSlip : ''
      }
    };

    if (editingItem) {
      setInboundList(prev => {
        const newList = prev.map(item => item.id === editingItem.id ? payload : item);
        localStorage.setItem('som_sing_inbound_list', JSON.stringify(newList));
        return newList;
      });
      updateInboundEntry(payload);
      saveInboundToBackend(payload, true);
      showToast(currentLang === 'lo' ? 'ອັບເດດຂໍ້ມູນນຳເຂົ້າຮຽບຮ້ອຍແລ້ວ!' : 'Inbound entry updated!', 'success');
    } else {
      setInboundList(prev => {
        const newList = [payload, ...prev];
        localStorage.setItem('som_sing_inbound_list', JSON.stringify(newList));
        return newList;
      });
      updateInboundEntry(payload);
      saveInboundToBackend(payload, false);
      showToast(currentLang === 'lo' ? 'ບັນທຶກຂໍ້ມູນນຳເຂົ້າສິນຄ້າໃໝ່ຮຽບຮ້ອຍແລ້ວ!' : 'New inbound entry created!', 'success');
    }

    invalidateInboundAndInventory();
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Delete Entry
  const handleDeleteItem = (id) => {
    askConfirmation(
      currentLang === 'lo' ? 'ທ່ານຕ້ອງການລຶບລາຍການນຳເຂົ້ານີ້ ຫຼື ບໍ່?' : 'Are you sure you want to delete this inbound record?',
      () => {
        recordDeletedId(id);
        deleteInboundEntry(id);
        setInboundList(prev => {
          const newList = prev.filter(i => i.id !== id && i.id?.toLowerCase() !== id?.toLowerCase() && i.poNumber !== id);
          localStorage.setItem('som_sing_inbound_list', JSON.stringify(newList));
          return newList;
        });
        deleteInboundFromBackend(id);
        if (selectedDrawerItem?.id === id) setSelectedDrawerItem(null);
        invalidateInboundAndInventory();
        showToast(currentLang === 'lo' ? 'ລຶບລາຍການ ແລະ ປັບປຸງສະຕັອກຮຽບຮ້ອຍແລ້ວ' : 'Item deleted and stock synchronized successfully', 'success');
      }
    );
  };

  const isCategoryMatch = (itemCat: string, filterId: string) => {
    if (filterId === 'ALL') return true;
    const cat = (itemCat || '').toUpperCase();
    if (filterId === 'MATERIAL') return cat === 'MATERIAL' || cat === 'PAPER';
    if (filterId === 'INK') return cat === 'INK' || cat === 'TONER';
    if (filterId === 'PRINTER') return cat === 'PRINTER' || cat === 'MACHINERY';
    if (filterId === 'CUTTER') return cat === 'CUTTER' || cat === 'LAMINATOR' || cat === 'BINDER';
    return cat === filterId.toUpperCase();
  };

  // Filtered dataset including date range, category, and search query
  const filteredData = inboundList.filter(item => {
    if (!item) return false;
    const matchCategory = isCategoryMatch(item.category, activeCategoryFilter);
    const po = (item.poNumber || item.id || '').toLowerCase();
    const name = (item.name || item.itemName || '').toLowerCase();
    const sku = (item.sku || '').toLowerCase();
    const q = (searchQuery || '').toLowerCase();
    const matchQuery = !q || po.includes(q) || name.includes(q) || sku.includes(q);
    
    let matchDate = true;
    if (startDate && item.receiptDate < startDate) matchDate = false;
    if (endDate && item.receiptDate > endDate) matchDate = false;

    return matchCategory && matchQuery && matchDate;
  });

  // Calculate summary KPIs
  const totalInboundQty = filteredData.reduce((sum, item) => sum + (Number(item.initialQty) || 1), 0);
  const totalInboundValue = filteredData.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);

  return (
    <div className="space-y-6 text-slate-800 antialiased">
      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <PackagePlus className="w-8 h-8 text-indigo-600" />
            <span>{currentLang === 'lo' ? 'ບັນທຶກການນຳເຂົ້າສິນຄ້າ (Inbound Master)' : 'Inbound Master Management'}</span>
          </h2>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            {currentLang === 'lo' 
              ? 'ຈັດການປະຫວັດການນຳເຂົ້າ, ເພີ່ມສິນຄ້າໃໝ່, ອັດຕາແລກປ່ຽນ ແລະ ຄຳນວນຕົ້ນທຶນແທ້ຈິງ' 
              : 'Track and manage material receipts, calculate real landed costs, and import assets'}
          </p>
        </div>

        {/* Global Import Action Buttons - 2 Distinct Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl font-bold shadow-xs hover:border-slate-300 transition active:scale-98 cursor-pointer disabled:opacity-60"
            title={currentLang === 'lo' ? 'ດຶງຂໍ້ມູນລ່າສຸດ' : 'Refresh live data'}
          >
            <RefreshCw className={`w-4 h-4 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-xs">{currentLang === 'lo' ? 'ຣີເຟຣຊ' : 'Refresh'}</span>
          </button>

          {/* Button 1: Restock Existing Inventory */}
          <button
            onClick={() => setIsRestockModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ເຕີມສະຕັອກເດີມ (Restock)' : 'Restock Existing'}</span>
          </button>

          {/* Button 2: New Item Batch Inbound */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ນຳເຂົ້າສິນຄ້າໃໝ່ (New Items)' : 'New Inbound'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">
              {currentLang === 'lo' ? 'ລາຍການທັງໝົດ' : 'Total Items'}
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{filteredData.length}</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {currentLang === 'lo' ? 'ລາຍການທີ່ສະແດງ' : 'Filtered entries'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <PackagePlus className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">
              {currentLang === 'lo' ? 'ຈຳນວນນຳເຂົ້າລວມ' : 'Total Inbound Qty'}
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalInboundQty.toLocaleString()}</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {currentLang === 'lo' ? 'ຫົວໜ່ວຍທັງໝົດ' : 'Total units received'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">
              {currentLang === 'lo' ? 'ມູນຄ່ານຳເຂົ້າລວມ' : 'Total Inbound Value'}
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{formatCurrency(totalInboundValue)}</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {currentLang === 'lo' ? 'ຕົ້ນທຶນຕົວຈິງ' : 'Actual Landed Cost'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">
              {currentLang === 'lo' ? 'ໝວດໝູ່ທີ່ໃຊ້ງານ' : 'Active Category'}
            </p>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1 truncate">
              {activeCategoryFilter}
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {filteredData.length} entries found
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Filter className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Pills Bar & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'MATERIAL', label: 'Paper / Material' },
            { id: 'INK', label: 'Printing Ink' },
            { id: 'HARDWARE', label: 'Hardware & Tools' },
            { id: 'PRINTER', label: 'Printer' },
            { id: 'CUTTER', label: 'Cutter' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryFilter(tab.id)}
              className={`px-5 py-2.5 rounded-full text-xs transition cursor-pointer flex items-center ${
                activeCategoryFilter === tab.id
                  ? 'font-extrabold bg-slate-900 text-white shadow-xs'
                  : 'font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${
                activeCategoryFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.id === 'ALL' ? inboundList.length : inboundList.filter(i => isCategoryMatch(i.category, tab.id)).length}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search materials by name or SKU..."
            className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-full text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
          />
          <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Main Inbound Data Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">{currentLang === 'lo' ? 'ວັນທີ & ເວລານຳເຂົ້າ' : 'Import Date & Time'}</th>
                <th className="py-4 px-6 text-center">{currentLang === 'lo' ? 'ປະເພດ' : 'Type'}</th>
                <th className="py-4 px-6">{currentLang === 'lo' ? 'ລະຫັດສິນຄ້າ' : 'Item Code'}</th>
                <th className="py-4 px-6">{currentLang === 'lo' ? 'ຊື່ / ລຸ້ນ' : 'Name/Model'}</th>
                <th className="py-4 px-6 text-right">{currentLang === 'lo' ? 'ຈຳນວນ' : 'Quantity/Unit'}</th>
                <th className="py-4 px-6 text-right">{currentLang === 'lo' ? 'ມູນຄ່າລວມ' : 'Total Value'}</th>
                <th className="py-4 px-6 text-center">{currentLang === 'lo' ? 'ໃບບິນ' : 'Receipt Link'}</th>
                <th className="py-4 px-6 text-right">{currentLang === 'lo' ? 'ການຈັດການ' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-xs font-bold text-slate-500">ບໍ່ພົບຂໍ້ມູນລາຍການນຳເຂົ້າສິນຄ້າ</p>
                  </td>
                </tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-slate-800 block text-xs">
                        {item.inboundDate || item.receiptDate || item.createdAt || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        item.category === 'MATERIAL' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        item.category === 'INK' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        item.category === 'HARDWARE' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                        item.category === 'PRINTER' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {item.categoryPill || item.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-600">
                      {item.specs?.materialId || item.sku || item.skuCode || item.specs?.skuCode || item.specs?.sku || item.poNumber}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 block group-hover:text-sky-600 transition">{resolveInboundItemName(item)}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-mono font-black text-slate-900 block">
                        {(() => {
                          const cat = (item.category || '').toUpperCase();
                          const rawQty = Number(item.initialQty || item.currentQty) || 1;
                          if (cat === 'PRINTER' || cat === 'MACHINERY' || cat === 'EQUIPMENT') {
                            return `${rawQty} ${currentLang === 'lo' ? 'ເຄື່ອງ' : 'Unit'}`;
                          }
                          if (cat === 'INK') {
                            return `${rawQty} ${currentLang === 'lo' ? 'ຂວດ' : 'Bottle'}`;
                          }
                          if (cat === 'PAPER' || cat === 'MATERIAL') {
                            const isSheet = (item.specs?.paperFormat || item.paperFormat || 'sheet').toLowerCase() === 'sheet';
                            if (isSheet) {
                              const sheetsPerPack = Number(item.specs?.sheetsPerPack || item.specs?.sheets_per_ream || item.sheetsPerPack || item.sheets_per_ream) || 500;
                              const totalSheets = rawQty * sheetsPerPack;
                              return `${totalSheets.toLocaleString()} ${currentLang === 'lo' ? 'ແຜ່ນ' : 'sheets'}`;
                            } else {
                              return `${rawQty} ${currentLang === 'lo' ? 'ມ້ວນ' : 'roll'}`;
                            }
                          }
                          return `${rawQty} ${item.unit || ''}`;
                        })()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-mono font-black text-emerald-600 block">
                        {formatLAK(Number(item.totalPrice) || 0)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {item.receiptUrl || item.docs?.paymentSlip ? (
                        <a
                          href={item.receiptUrl || item.docs?.paymentSlip}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-600 hover:underline font-bold text-xs"
                        >
                          View Link
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedDrawerItem(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>{currentLang === 'lo' ? 'ລາຍລະອຽດ' : 'View Details'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-Over Item Detail Drawer */}
      {selectedDrawerItem && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            onClick={() => setSelectedDrawerItem(null)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white border-l border-slate-200 shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-extrabold text-blue-900 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">
                      {selectedDrawerItem.poNumber}
                    </span>
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                      {selectedDrawerItem.categoryPill || selectedDrawerItem.category}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900">{selectedDrawerItem.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const item = selectedDrawerItem;
                      setSelectedDrawerItem(null);
                      setEditingItem(item);
                    }}
                    className="p-2.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteItem(selectedDrawerItem.id)}
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setSelectedDrawerItem(null)}
                    className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer ml-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-extrabold block mb-1">Total Import Cost</span>
                    <span className="text-sm md:text-base font-black text-slate-900">{formatLAK(selectedDrawerItem.totalPrice || 0)}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-extrabold block mb-1">Total Inbound Qty</span>
                    <div className="text-sm md:text-base font-black text-sky-700">
                      {(() => {
                        const cat = (selectedDrawerItem.category || '').toUpperCase();
                        const rawQty = Number(selectedDrawerItem.initialQty || selectedDrawerItem.currentQty) || 1;
                        if (cat === 'PRINTER' || cat === 'MACHINERY' || cat === 'EQUIPMENT') {
                          return `${rawQty} ${currentLang === 'lo' ? 'ເຄື່ອງ' : 'Unit'}`;
                        }
                        if (cat === 'INK') {
                          return `${rawQty} ${currentLang === 'lo' ? 'ຂວດ' : 'Bottle'}`;
                        }
                        const isPaper = cat === 'PAPER' || cat === 'MATERIAL' || (selectedDrawerItem.name || '').toLowerCase().includes('paper');
                        if (isPaper) {
                          const isSheet = (selectedDrawerItem.specs?.paperFormat || selectedDrawerItem.paperFormat || 'sheet').toLowerCase() === 'sheet';
                          if (isSheet) {
                            let sheetsPerPack = Number(
                              selectedDrawerItem.specs?.sheetsPerPack || 
                              selectedDrawerItem.specs?.sheets_per_ream || 
                              selectedDrawerItem.specs?.sheets_per_pack || 
                              selectedDrawerItem.sheetsPerPack || 
                              selectedDrawerItem.sheets_per_ream ||
                              selectedDrawerItem.purchaseMultiplier
                            );
                            if (!sheetsPerPack || sheetsPerPack <= 1) {
                              const invItem = inventory.find(i => i.id === selectedDrawerItem.specs?.materialId || i.sku === selectedDrawerItem.sku || i.id === selectedDrawerItem.id || (i.name && selectedDrawerItem.name && i.name.toLowerCase().trim() === selectedDrawerItem.name.toLowerCase().trim()));
                              sheetsPerPack = Number(invItem?.purchaseMultiplier || invItem?.purchase_multiplier || invItem?.specs?.sheetsPerPack || 500);
                            }
                            if (sheetsPerPack <= 1) sheetsPerPack = 500;
                            const totalSheets = rawQty * sheetsPerPack;
                            return (
                              <div>
                                <span className="block">{totalSheets.toLocaleString()} {currentLang === 'lo' ? 'ແຜ່ນ' : 'sheets'}</span>
                                <span className="text-[10px] text-slate-400 font-bold block mt-0.5 font-sans">({rawQty} {currentLang === 'lo' ? 'ແພັກ' : 'packs'} x {sheetsPerPack} {currentLang === 'lo' ? 'ແຜ່ນ' : 'sheets'})</span>
                              </div>
                            );
                          } else {
                            return `${rawQty} ${currentLang === 'lo' ? 'ມ້ວນ' : 'roll'}`;
                          }
                        }
                        return `${rawQty} ${selectedDrawerItem.unit || ''}`;
                      })()}
                    </div>
                  </div>
                  <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                    <span className="text-[11px] text-blue-900 font-extrabold block mb-1">
                      {(() => {
                        const cat = (selectedDrawerItem.category || '').toUpperCase();
                        const isPaper = cat === 'PAPER' || cat === 'MATERIAL' || (selectedDrawerItem.name || '').toLowerCase().includes('paper');
                        if (isPaper) {
                          return currentLang === 'lo' ? 'ຕົ້ນທຶນຕໍ່ແຜ່ນ (Cost/Sheet)' : 'Cost Per Sheet';
                        }
                        return currentLang === 'lo' ? 'ຕົ້ນທຶນຕໍ່ໜ່ວຍ (Unit Cost)' : 'Unit Cost';
                      })()}
                    </span>
                    <div className="text-sm md:text-base font-black text-blue-950">
                      {(() => {
                        const cat = (selectedDrawerItem.category || '').toUpperCase();
                        const rawQty = Number(selectedDrawerItem.initialQty || selectedDrawerItem.currentQty) || 1;
                        const totalPrice = Number(selectedDrawerItem.totalPrice) || 0;
                        const isPaper = cat === 'PAPER' || cat === 'MATERIAL' || (selectedDrawerItem.name || '').toLowerCase().includes('paper');
                        if (isPaper) {
                          const isSheet = (selectedDrawerItem.specs?.paperFormat || selectedDrawerItem.paperFormat || 'sheet').toLowerCase() === 'sheet';
                          if (isSheet) {
                            let sheetsPerPack = Number(
                              selectedDrawerItem.specs?.sheetsPerPack || 
                              selectedDrawerItem.specs?.sheets_per_ream || 
                              selectedDrawerItem.specs?.sheets_per_pack || 
                              selectedDrawerItem.sheetsPerPack || 
                              selectedDrawerItem.sheets_per_ream ||
                              selectedDrawerItem.purchaseMultiplier
                            );
                            if (!sheetsPerPack || sheetsPerPack <= 1) {
                              const invItem = inventory.find(i => i.id === selectedDrawerItem.specs?.materialId || i.sku === selectedDrawerItem.sku || i.id === selectedDrawerItem.id || (i.name && selectedDrawerItem.name && i.name.toLowerCase().trim() === selectedDrawerItem.name.toLowerCase().trim()));
                              sheetsPerPack = Number(invItem?.purchaseMultiplier || invItem?.purchase_multiplier || invItem?.specs?.sheetsPerPack || 500);
                            }
                            if (sheetsPerPack <= 1) sheetsPerPack = 500;
                            const totalSheets = rawQty * sheetsPerPack;
                            const costPerSheet = totalPrice / Math.max(1, totalSheets);
                            const costPerPack = totalPrice / Math.max(1, rawQty);
                            return (
                              <div>
                                <span className="block text-emerald-700">{formatLAK(costPerSheet)} <span className="text-xs font-bold text-slate-500">/ {currentLang === 'lo' ? 'ແຜ່ນ' : 'sheet'}</span></span>
                                <span className="text-[10px] text-slate-400 font-bold block mt-0.5 font-sans">({formatLAK(costPerPack)} / {currentLang === 'lo' ? 'ແພັກ' : 'pack'})</span>
                              </div>
                            );
                          }
                        }
                        return `${formatLAK(totalPrice / Math.max(1, rawQty))} / ${selectedDrawerItem.unit || 'Unit'}`;
                      })()}

                    </div>
                  </div>
                </div>

                {/* Procurement Details */}
                <ProcurementDetailCard item={selectedDrawerItem} currentLang={currentLang} />

                {/* Dynamic Technical Specs */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Microchip className="w-4 h-4 text-purple-600" />
                    <span>{currentLang === 'lo' ? 'ສະເປັກທາງເຕັກນິກ (ERP Technical Specs)' : 'ERP Technical Specs'}</span>
                  </h3>
                  <DynamicSpecDetail item={selectedDrawerItem} currentLang={currentLang} />
                </div>

                {/* Document Vault Attachments */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Vault className="w-4 h-4 text-blue-900" />
                    <span>Document Vault Attachments</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Product Photo */}
                    <div 
                      onClick={() => selectedDrawerItem.docs?.productPhoto && setLightboxImg(selectedDrawerItem.docs.productPhoto)}
                      className="group relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-video flex flex-col items-center justify-center cursor-pointer shadow-2xs"
                    >
                      {selectedDrawerItem.docs?.productPhoto ? (
                        <img src={selectedDrawerItem.docs.productPhoto} alt="Product Photo" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      ) : (
                        <div className="text-center p-3 text-slate-400 text-xs">
                          <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                          <span>{currentLang === 'lo' ? 'ບໍ່ມີຮູບພາບສິນຄ້າ' : 'No image'}</span>
                        </div>
                      )}
                      <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-bold bg-white/90 text-slate-700 text-center py-0.5 rounded-lg shadow-2xs backdrop-blur-xs">
                        {currentLang === 'lo' ? 'ຮູບພາບສິນຄ້າ (Product Photo)' : 'Product Photo'}
                      </span>
                    </div>

                    {/* Payment Slip (if TRANSFER) */}
                    {selectedDrawerItem.paymentMethod === 'TRANSFER' && (
                      <div 
                        onClick={() => selectedDrawerItem.docs?.paymentSlip && setLightboxImg(selectedDrawerItem.docs.paymentSlip)}
                        className="group relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-video flex flex-col items-center justify-center cursor-pointer shadow-2xs"
                      >
                        {selectedDrawerItem.docs?.paymentSlip ? (
                          <img src={selectedDrawerItem.docs.paymentSlip} alt="Payment Slip" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        ) : (
                          <div className="text-center p-3 text-slate-400 text-xs">
                            <CreditCard className="w-6 h-6 mx-auto mb-1" />
                            <span>{currentLang === 'lo' ? 'ບໍ່ມີສະລິບໂອນເງິນ' : 'No payment slip'}</span>
                          </div>
                        )}
                        <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-bold bg-white/90 text-slate-700 text-center py-0.5 rounded-lg shadow-2xs backdrop-blur-xs">
                          {currentLang === 'lo' ? 'ສະລິບໂອນເງິນ (Payment Slip)' : 'Payment Slip'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restock Existing Inventory Batch Modal */}
      {isRestockModalOpen && (
        <RestockBatchModal
          isOpen={isRestockModalOpen}
          onClose={() => setIsRestockModalOpen(false)}
          onSuccess={(restockItems) => {
            setInboundList(prev => {
              const combined = [...restockItems, ...prev];
              localStorage.setItem('som_sing_inbound_list', JSON.stringify(combined));
              return combined;
            });
            invalidateInboundAndInventory();
            fetchInbound();
            refreshData();
          }}
        />
      )}

      {/* Dynamic Full-Screen New Items Inbound Workspace */}
      {isModalOpen && (
        <FormModalTemplate
          onClose={() => setIsModalOpen(false)}
          icon={<PackagePlus className="w-5 h-5 text-indigo-600" />}
          title={currentLang === 'lo' ? 'ນຳເຂົ້າສິນຄ້າ / ອຸປະກອນໃໝ່ (New Inbound Workspace)' : 'New Inbound Procurement Workspace'}
          subtitle={currentLang === 'lo' ? 'ເພີ່ມວັດຖຸດິບ, ເຈ້ຍ, ໝຶກ, ເຄື່ອງຈັກ ແລະ ອຸປະກອນເຂົ້າສະຕ໋ອກ ERP ພ້ອມກັນຫຼາຍລາຍການ' : 'Add Paper, Ink, Equipment & Materials to Stock with Independent Split-Pane Control'}
          badgeText="NEW ITEMS WORKSPACE"
          maxWidthClass="max-w-[96vw] w-[96vw] max-h-[94vh]"
        >
          <ImportForm 
            onSubmit={(type, data) => {
              handleImportSubmit(type, data);
              setIsModalOpen(false);
            }}
            onClose={() => setIsModalOpen(false)}
          />
        </FormModalTemplate>
      )}

      {/* Category-Aware Edit Modal */}
      {editingItem && (
        <InboundEditModal
          item={editingItem}
          onSave={(updatedItem) => {
            const masterSku = updatedItem.sku || updatedItem.skuCode || editingItem.sku || editingItem.skuCode || editingItem.specs?.materialId || editingItem.specs?.skuCode || editingItem.specs?.sku;
            const payload = {
              ...updatedItem,
              sku: masterSku,
              skuCode: masterSku,
              originalId: editingItem.id,
              originalSku: masterSku,
              originalName: editingItem.name || editingItem.itemName
            };
            setInboundList(prev => {
              const newList = prev.map(item => item.id === updatedItem.id ? { ...item, ...payload } : item);
              localStorage.setItem('som_sing_inbound_list', JSON.stringify(newList));
              return newList;
            });
            updateInboundEntry(payload);
            saveInboundToBackend(payload, true);
            invalidateInboundAndInventory();
            setEditingItem(null);
            setSelectedDrawerItem(payload);
            showToast(currentLang === 'lo' ? 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ!' : 'Inbound item updated successfully!', 'success');
          }}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* Fullscreen Lightbox */}
      {lightboxImg && (
        <div 
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={lightboxImg} alt="Lightbox" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain border border-slate-800" />
            <button className="absolute -top-10 right-0 text-white hover:text-sky-400 text-xs font-bold flex items-center gap-1">
              <X className="w-4 h-4" /> ປິດໜ້າຕ່າງ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
