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
  Calendar
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { sampleInboundData } from '../../data/sampleInboundData';
import ImportForm from './ImportForm';
import PaperSpecDetail from '../inventory/details/PaperSpecDetail';
import InkSpecDetail from '../inventory/details/InkSpecDetail';
import PrinterSpecDetail from '../inventory/details/PrinterSpecDetail';
import ProcurementDetailCard from '../inventory/details/ProcurementDetailCard';
import InboundEditModal from './InboundEditModal';
import type { InboundEntry } from '../../types';

export default function InboundManagement() {
   const { showToast, askConfirmation, formatCurrency, addEquipment, addInventorySku, addInventoryBatch, updateInboundEntry, saveInventoryToBackend, inventory, addStock, addPrinterColorLink } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  // Filters state
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Drawers & Modals state
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Initial Master Dataset imported from standalone JSON file
  const [inboundList, setInboundList] = useState<InboundEntry[]>(sampleInboundData);

  useEffect(() => {
    const savedLocal = localStorage.getItem('som_sing_inbound_list');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInboundList(parsed);
        }
      } catch (e) {
        console.log('Failed to load local inbound data', e);
      }
    }

    fetch('http://localhost:8080/api/inbound')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
          const mapped = data.data.map((item: any) => ({
            id: item.id,
            poNumber: item.poNumber || item.id,
            receiptDate: item.inboundDate || new Date().toISOString().split('T')[0],
            category: item.category,
            categoryPill: item.category,
            name: item.itemName,
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
      })
      .catch(err => console.log('Using local inbound data fallback', err));
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

  // Group 3: Hardware & Equipment Specs (กาว, สันห่วง, แม็ก, กรรไกร)
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
    const apiPayload = {
      id: item.id,
      poNumber: item.poNumber || item.id,
      inboundDate: item.inboundDate || item.receiptDate || new Date().toISOString().split('T')[0],
      skuCode: item.skuCode || item.sku || item.id,
      itemName: item.itemName || item.name,
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

    const url = isUpdate ? `http://localhost:8080/api/inbound/${item.id}` : 'http://localhost:8080/api/inbound';
    const method = isUpdate ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiPayload)
    }).catch(err => console.log('Inbound API save error', err));
  };

  const deleteInboundFromBackend = (id: string) => {
    fetch(`http://localhost:8080/api/inbound/${id}`, {
      method: 'DELETE'
    }).catch(err => console.log('Inbound API delete error', err));
  };

  const handleImportSubmit = (type, data) => {
    const logId = `INB-${Date.now().toString().slice(-4)}`;
    const calcTotal = Number(data.price) || Number(data.unitPrice) || Number(data.rawImportCost) || ((data.importQty || 1) * Number(data.unitPrice || 0));
    const newLog = {
      id: logId,
      poNumber: logId,
      receiptDate: data.importDate || new Date().toISOString().split('T')[0],
      category: type,
      categoryPill: type,
      name: data.name,
      sku: data.id,
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

    setInboundList(prev => {
      const newList = [newLog, ...prev];
      localStorage.setItem('som_sing_inbound_list', JSON.stringify(newList));
      return newList;
    });
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

      showToast(`${type === 'PRINTER' ? 'Printer' : 'Machinery'} registered successfully in assets!`, 'success');
    } else {
      const sheetsPerPack = Number(data.sheetsPerPack || data.specs?.sheetsPerPack || data.sheets_per_pack || data.sheets_per_ream || 500);
      const isSheetPaper = type === 'PAPER' || type === 'MATERIAL' || data.category === 'Paper';
      const packQty = Number(data.importQty || 1);
      const totalSheets = isSheetPaper ? packQty * sheetsPerPack : packQty;
      const unitPrice = Number(data.unitPrice || data.price || calcTotal || 95000);
      const perSheetPrice = isSheetPaper ? Math.round(unitPrice / sheetsPerPack) : unitPrice;

      const existingItem = inventory.find(item => item.id === data.id || item.id === logId);
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
          consumptionUnit: isSheetPaper ? 'แผ่น' : (data.unit || 'Units'),
          purchaseUnit: isSheetPaper ? 'แพ็ก' : (data.unit || 'Units'),
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

      showToast(`${type} stock recorded successfully!`, 'success');
    }

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
      setInboundList(prev => prev.map(item => item.id === editingItem.id ? payload : item));
      saveInboundToBackend(payload);
      showToast(currentLang === 'lo' ? 'ອັບເດດຂໍ້ມູນນຳເຂົ້າຮຽບຮ້ອຍແລ້ວ!' : 'Inbound entry updated!', 'success');
    } else {
      setInboundList(prev => [payload, ...prev]);
      saveInboundToBackend(payload);

      // Cross-module sync: Add to Equipment or Inventory
      if (payload.category === 'PRINTER' || payload.category === 'CUTTER' || payload.category === 'MACHINERY') {
        addEquipment({
          id: payload.id,
          name: payload.name,
          brand: payload.name.split(' ')[0] || 'Generic',
          model: payload.name.split(' ').slice(1).join(' ') || payload.name,
          serialNumber: payload.sku || payload.id,
          category: payload.category === 'PRINTER' ? 'Printer' : (payload.category === 'CUTTER' ? 'Cutter' : 'Processing Tools'),
          printerCategory: (payload as any).specs?.printerCategory || 'Inkjet',
          colorSchemeType: 'CMYK',
          totalColorSlots: 4,
          expectedLifeA4Pages: 200000,
          maintenanceRatePercent: 20,
          price: payload.totalPrice,
          purchaseCost: payload.totalPrice,
          vendor: payload.supplier,
          warrantyExpirationYear: 2028,
          location: 'Main Dept',
          status: 'In Use'
        });
      } else {
        const existingItem = inventory.find(item => item.id === payload.sku || item.id === payload.id);
        if (existingItem) {
          addStock(existingItem.id, payload.currentQty);
        } else {
          addInventorySku({
            id: payload.sku || payload.id,
            name: payload.name,
            category: payload.category === 'MATERIAL' ? 'Paper' : (payload.category === 'INK' ? 'Ink' : 'Finishing'),
            stockQty: payload.currentQty,
            consumptionUnit: payload.unit,
            purchaseUnit: payload.unit,
            purchaseMultiplier: 1,
            costPerPurchaseUnit: payload.totalPrice / (payload.currentQty || 1),
            costPerConsumptionUnit: payload.totalPrice / (payload.currentQty || 1),
            reorderThreshold: 10,
            batches: [
              {
                id: `LOT-${payload.id}-001`,
                purchaseDate: payload.receiptDate || new Date().toISOString().split('T')[0],
                supplierName: payload.supplier,
                purchasePricePerReam: payload.totalPrice,
                costPerSheet: payload.totalPrice / (payload.currentQty || 1),
                initialQty: payload.currentQty,
                currentQty: payload.currentQty
              }
            ]
          });
        }
      }

      showToast(currentLang === 'lo' ? 'ບັນທຶກຂໍ້ມູນນຳເຂົ້າສິນຄ້າໃໝ່ຮຽບຮ້ອຍແລ້ວ!' : 'New inbound entry created!', 'success');
    }

    setIsModalOpen(false);
  };

  // Delete Entry
  const handleDeleteItem = (id) => {
    askConfirmation(
      currentLang === 'lo' ? 'ທ່ານຕ້ອງການລຶບລາຍການນຳເຂົ້ານີ້ ຫຼື ບໍ່?' : 'Are you sure you want to delete this inbound record?',
      () => {
        setInboundList(prev => {
          const newList = prev.filter(i => i.id !== id);
          localStorage.setItem('som_sing_inbound_list', JSON.stringify(newList));
          return newList;
        });
        deleteInboundFromBackend(id);
        if (selectedDrawerItem?.id === id) setSelectedDrawerItem(null);
        showToast(currentLang === 'lo' ? 'ລຶບລາຍການຮຽບຮ້ອຍແລ້ວ' : 'Item deleted successfully', 'success');
      }
    );
  };

  // Filter Data
  // Date filter state (YYYY-MM-DD)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtered dataset including date range, category, and search query
  const filteredData = inboundList.filter(item => {
    const matchCategory = activeCategoryFilter === 'ALL' || item.category === activeCategoryFilter;
    const matchQuery = !searchQuery || 
      item.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
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
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-900 flex items-center justify-center shadow-md shadow-blue-900/20 text-white shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
              <span>{currentLang === 'lo' ? 'ນຳເຂົ້າສິນຄ້າ & ອຸປະກອນ' : 'Inbound Procurement'}</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">ERP Inbound</span>
            </h2>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Complete ERP Inbound Receipt, Freight Tariff & Landed Cost Ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-sky-600/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ນຳເຂົ້າສິນຄ້າ / ອຸປະກອນໃໝ່' : 'Add Inbound Entry'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards & Date Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI Card 1: Total Inbound Quantity */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
              {currentLang === 'lo' ? 'ສະຫຼຸບຈຳນວນນຳເຂົ້າທັງໝົດ' : 'Total Inbound Quantity'}
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono block">
              {totalInboundQty.toLocaleString()} <span className="text-xs font-bold text-slate-400">{currentLang === 'lo' ? 'ລາຍການ / ຊິ້ນ' : 'Items/Pcs'}</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-900 shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* KPI Card 2: Total Inbound Purchase Value */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
              {currentLang === 'lo' ? 'ສະຫຼຸບຍອດມູນຄ່ານຳເຂົ້າທັງໝົດ' : 'Total Inbound Value'}
            </span>
            <span className="text-2xl font-black text-emerald-600 font-mono block">
              {formatLAK(totalInboundValue)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 font-black text-xl select-none">
            ₭
          </div>
        </div>

        {/* Date Filter Card (Day/Month/Year) */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-center space-y-2">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <span>{currentLang === 'lo' ? 'ຟິວເຕີຕາມວັນທີ (Date Filter)' : 'Date Filter'}</span>
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">{currentLang === 'lo' ? 'ແຕ່ວັນທີ:' : 'From:'}</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="w-full bg-slate-50 text-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 focus:border-sky-500 outline-none text-xs" 
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">{currentLang === 'lo' ? 'ເຖິງວັນທີ:' : 'To:'}</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="w-full bg-slate-50 text-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 focus:border-sky-500 outline-none text-xs" 
              />
            </div>
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
                {tab.id === 'ALL' ? inboundList.length : inboundList.filter(i => i.category === tab.id).length}
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
                <th className="py-4 px-6">{currentLang === 'lo' ? 'ວັນທີນຳເຂົ້າ' : 'Import Date'}</th>
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
                      <span className="font-mono font-bold text-slate-800 block">{item.receiptDate}</span>
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
                    <td className="py-4 px-6 font-mono font-bold text-slate-600">{item.sku || item.poNumber}</td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 block group-hover:text-sky-600 transition">{item.name}</span>
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
                    <span className="text-sm md:text-base font-black text-sky-700">
                      {(() => {
                        const cat = (selectedDrawerItem.category || '').toUpperCase();
                        const rawQty = Number(selectedDrawerItem.initialQty || selectedDrawerItem.currentQty) || 1;
                        if (cat === 'PRINTER' || cat === 'MACHINERY' || cat === 'EQUIPMENT') {
                          return `${rawQty} ${currentLang === 'lo' ? 'ເຄື່ອງ' : 'Unit'}`;
                        }
                        if (cat === 'INK') {
                          return `${rawQty} ${currentLang === 'lo' ? 'ຂວດ' : 'Bottle'}`;
                        }
                        if (cat === 'PAPER' || cat === 'MATERIAL') {
                          const isSheet = (selectedDrawerItem.specs?.paperFormat || selectedDrawerItem.paperFormat || 'sheet').toLowerCase() === 'sheet';
                          if (isSheet) {
                            const sheetsPerPack = Number(selectedDrawerItem.specs?.sheetsPerPack || selectedDrawerItem.specs?.sheets_per_ream || selectedDrawerItem.sheetsPerPack || selectedDrawerItem.sheets_per_ream) || 500;
                            const totalSheets = rawQty * sheetsPerPack;
                            return `${totalSheets.toLocaleString()} ${currentLang === 'lo' ? 'ແຜ່ນ' : 'sheets'}`;
                          } else {
                            return `${rawQty} ${currentLang === 'lo' ? 'ມ້ວນ' : 'roll'}`;
                          }
                        }
                        return `${rawQty} ${selectedDrawerItem.unit || ''}`;
                      })()}
                    </span>
                  </div>
                  <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                    <span className="text-[11px] text-blue-900 font-extrabold block mb-1">Unit Cost</span>
                    <span className="text-sm md:text-base font-black text-blue-950">
                      {formatLAK(Math.round((selectedDrawerItem.totalPrice || 0) / (selectedDrawerItem.initialQty || selectedDrawerItem.currentQty || 1)))}
                    </span>
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
                  {(() => {
                    const category = (selectedDrawerItem.category || '').toUpperCase();
                    if (category === 'PAPER' || category === 'MATERIAL') {
                      return <PaperSpecDetail item={selectedDrawerItem} currentLang={currentLang} />;
                    }
                    if (category === 'INK') {
                      return <InkSpecDetail item={selectedDrawerItem} currentLang={currentLang} />;
                    }
                    if (category === 'PRINTER') {
                      return <PrinterSpecDetail item={selectedDrawerItem} currentLang={currentLang} />;
                    }
                    const specs = selectedDrawerItem.specs || selectedDrawerItem.technical_specs || {};
                    return (
                      <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                        {Object.entries(specs).map(([key, val]) => {
                          if (!val || typeof val === 'object' || key === 'tariffRate' || key === 'origin' || key === 'freightCharge') return null;
                          return (
                            <div key={key}>
                              <span className="text-slate-400 block text-[11px] font-semibold">
                                {key.replace(/([A-Z])/g, ' $1')}:
                              </span>
                              <span className="text-slate-800 font-bold">{String(val)}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
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

      {/* Dynamic New Inbound Import Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-900" />
                <span>{currentLang === 'lo' ? 'ນຳເຂົ້າສິນຄ້າ / ອຸປະກອນໃໝ່ (Dynamic Inbound Form)' : 'New Inbound Procurement (Dynamic Inbound Form)'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <ImportForm 
                onSubmit={(type, data) => {
                  handleImportSubmit(type, data);
                  setIsModalOpen(false);
                }}
                onClose={() => setIsModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Category-Aware Edit Modal */}
      {editingItem && (
        <InboundEditModal
          item={editingItem}
          onSave={(updatedItem) => {
            setInboundList(prev => {
              const newList = prev.map(item => item.id === updatedItem.id ? updatedItem : item);
              localStorage.setItem('som_sing_inbound_list', JSON.stringify(newList));
              return newList;
            });
            updateInboundEntry(updatedItem);
            saveInboundToBackend(updatedItem, true);
            setEditingItem(null);
            setSelectedDrawerItem(updatedItem);
            showToast(currentLang === 'lo' ? 'ແກ້ໄຂຂໍ້ມູນสำเร็จ!' : 'Inbound item updated successfully!', 'success');
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
