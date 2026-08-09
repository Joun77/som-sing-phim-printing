import React, { useState } from 'react';
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

export default function InboundManagement() {
  const { showToast, askConfirmation, formatCurrency } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  // Filters state
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Drawers & Modals state
  const [selectedDrawerItem, setSelectedDrawerItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Initial Master Dataset imported from standalone JSON file
  const [inboundList, setInboundList] = useState(sampleInboundData);

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
    const tariff = raw * ((Number(item.tariffRate) || 0) / 100);
    const freight = Number(item.freightCharge) || 0;
    const qty = Number(item.initialQty || item.currentQty) || 1;
    return (raw + tariff + freight) / qty;
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
      tariffRate: Number(formTariff),
      freightCharge: Number(formFreight),
      specs: specs,
      docs: {
        productPhoto: formImgProduct || 'https://via.placeholder.com/300?text=Product+Photo',
        paymentSlip: formPaymentMethod === 'TRANSFER' ? formImgSlip : ''
      }
    };

    if (editingItem) {
      setInboundList(prev => prev.map(item => item.id === editingItem.id ? payload : item));
      showToast(currentLang === 'lo' ? 'ອັບເດດຂໍ້ມູນນຳເຂົ້າຮຽບຮ້ອຍແລ້ວ!' : 'Inbound entry updated!', 'success');
    } else {
      setInboundList(prev => [payload, ...prev]);
      showToast(currentLang === 'lo' ? 'ບັນທຶກຂໍ້ມູນນຳເຂົ້າສິນຄ້າໃໝ່ຮຽບຮ້ອຍແລ້ວ!' : 'New inbound entry created!', 'success');
    }

    setIsModalOpen(false);
  };

  // Delete Entry
  const handleDeleteItem = (id) => {
    askConfirmation(
      currentLang === 'lo' ? 'ທ່ານຕ້ອງການລຶບລາຍການນຳເຂົ້ານີ້ ຫຼື ບໍ່?' : 'Are you sure you want to delete this inbound record?',
      () => {
        setInboundList(prev => prev.filter(i => i.id !== id));
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
            <span>{currentLang === 'lo' ? '+ ນຳເຂົ້າສິນຄ້າ / ອຸປະກອນໃໝ່' : '+ Add Inbound Entry'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards & Date Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI Card 1: Total Inbound Quantity */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
              {currentLang === 'lo' ? 'ສຸຣຸບຈຳນວນນຳເຂົ້າທັງໝົດ' : 'Total Inbound Quantity'}
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono block">
              {totalInboundQty.toLocaleString()} <span className="text-xs font-bold text-slate-400">รายการ/ชิ้น</span>
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
              {currentLang === 'lo' ? 'ສຸຣຸບຍອດມູນຄ່ານຳເຂົ້າທັງໝົດ' : 'Total Inbound Value'}
            </span>
            <span className="text-2xl font-black text-emerald-600 font-mono block">
              {formatLAK(totalInboundValue)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <DollarSign className="w-6 h-6" />
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
                <th className="py-4 px-6">ລະຫັດ PO / Ref</th>
                <th className="py-4 px-6">ຊື່ລາຍການ & SKU</th>
                <th className="py-4 px-6 text-center">ໝວດໝູ່</th>
                <th className="py-4 px-6">ວັນທີຮັບ/ຕິດຕັ້ງ</th>
                <th className="py-4 px-6 text-right">ຈຳນວນນຳເຂົ້າ</th>
                <th className="py-4 px-6 text-right">ມູນຄ່ານຳເຂົ້າ (LAK ₭)</th>
                <th className="py-4 px-6 text-right">ການຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-xs font-bold text-slate-500">ບໍ່ພົບຂໍ້ມູນລາຍການນຳເຂົ້າສິນຄ້າ</p>
                  </td>
                </tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-4 px-6 font-mono font-bold text-slate-600">{item.poNumber}</td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 block group-hover:text-sky-600 transition">{item.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 font-bold block uppercase">{item.sku}</span>
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
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-slate-800 block">{item.receiptDate}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-mono font-black text-slate-900 block">{item.initialQty} {item.unit}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-mono font-black text-emerald-600 block">
                        {formatLAK(Number(item.totalPrice) || 0)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedDrawerItem(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>{currentLang === 'lo' ? 'ສາຍລະອຽດ' : 'View Details'}</span>
                        </button>
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
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
                      handleOpenModal(item);
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
                    <span className="text-[11px] text-slate-400 font-extrabold block mb-1">Raw Purchase Price</span>
                    <span className="text-sm md:text-base font-black text-slate-900">{formatLAK(selectedDrawerItem.totalPrice)}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-extrabold block mb-1">Total Inbound Qty</span>
                    <span className="text-sm md:text-base font-black text-sky-700">{selectedDrawerItem.initialQty || selectedDrawerItem.currentQty} {selectedDrawerItem.unit}</span>
                  </div>
                  <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                    <span className="text-[11px] text-blue-900 font-extrabold block mb-1">Net Landed Cost/Unit</span>
                    <span className="text-sm md:text-base font-black text-blue-950">{formatLAK(calculateLandedCost(selectedDrawerItem))}</span>
                  </div>
                </div>

                {/* Customs & General Info */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>{currentLang === 'lo' ? 'ລາຍລະອຽດການສັ່ງຊື້ & ນຳເຂົ້າ (Procurement Details)' : 'Procurement Details'}</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                    <div>
                      <span className="text-slate-400 block text-[11px]">SKU Code:</span>
                      <span className="font-mono text-slate-800 font-bold">{selectedDrawerItem.sku}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">{currentLang === 'lo' ? 'ວັນທີຮັບ/ຕິດຕັ້ງ:' : 'Receipt Date:'}</span>
                      <span className="text-slate-800">{selectedDrawerItem.receiptDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">{currentLang === 'lo' ? 'ຜູ້ສະໜອງ/ร้านค้า:' : 'Supplier Name:'}</span>
                      <span className="text-slate-800">{selectedDrawerItem.supplier}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">{currentLang === 'lo' ? 'ช่องทางชำระเงิน:' : 'Payment Method:'}</span>
                      <span className="font-bold text-slate-800">
                        {selectedDrawerItem.paymentMethod === 'TRANSFER' ? (currentLang === 'lo' ? 'ໂອນเงิน (Bank Transfer)' : 'Bank Transfer') : (currentLang === 'lo' ? 'เงินสด (Cash)' : 'Cash')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">{currentLang === 'lo' ? 'ประเทศต้นทาง:' : 'Origin Country:'}</span>
                      <span className="font-bold text-slate-800">{selectedDrawerItem.origin}</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Technical Specs */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Microchip className="w-4 h-4 text-purple-600" />
                    <span>{currentLang === 'lo' ? 'ສະເປັກທາງເຕັກນິກ (ERP Technical Specs)' : 'ERP Technical Specs'}</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                    {Object.entries(selectedDrawerItem.specs || {}).map(([key, val]) => {
                      if (!val || key === 'tariffRate' || key === 'clickRate' || key === 'clickBw' || key === 'clickColor') return null;
                      
                      const labelMapLo = {
                        formFactor: currentLang === 'lo' ? 'ຮູບແບບບັນຈຸພັນ (Form Factor)' : 'Form Factor',
                        grammage: currentLang === 'lo' ? 'ຄວາມໜາ/ນ້ຳໜັກ (Grammage GSM)' : 'Grammage (GSM)',
                        standardSize: currentLang === 'lo' ? 'ຂະໜາດມາດຕະຖານ (Standard Size)' : 'Standard Size',
                        widthMm: currentLang === 'lo' ? 'ໜ້າກວ້າງ (Width mm)' : 'Width (mm)',
                        length: currentLang === 'lo' ? 'ຄວາມຍາວລວມ (Length m)' : 'Length (m)',
                        packQty: currentLang === 'lo' ? 'ຈຳນວນແຜ່ນຕໍ່ຣີມ (Pack Qty)' : 'Pack Qty',
                        inkType: currentLang === 'lo' ? 'ປະເພດໝຶກພິມ (Ink Type)' : 'Ink Type',
                        colorModel: currentLang === 'lo' ? 'เฉດສີ / ຕະລັບສີ (Color Option)' : 'Color Option',
                        volumePerBottle: currentLang === 'lo' ? 'ບໍລິມາດບັນຈຸ (Volume/Bottle)' : 'Volume/Bottle',
                        compatiblePrinter: currentLang === 'lo' ? 'ເຄື່ອງພິມທີ່ເຊື່ອມໂຍງ (Linked Printer)' : 'Linked Printer',
                        supportedInkType: currentLang === 'lo' ? 'ຊະນິດໝຶກທີ່ເຄື່ອງໃຊ້ (Supported Ink)' : 'Supported Ink',
                        colorSlots: currentLang === 'lo' ? 'ສະລັອດສີໝຶກປະຈຳເຄື່ອງ (Color Slots)' : 'Color Slots',
                        hwType: currentLang === 'lo' ? 'ໝວດໝູ່ອຸປະກອນ (Hardware Type)' : 'Hardware Type',
                        hwSpec: currentLang === 'lo' ? 'ເບີ/ສະເປັກສະເພາະ (Hardware Spec)' : 'Hardware Spec',
                        packCount: currentLang === 'lo' ? 'ຈຳນວນບັນຈຸຕໍ່ກ່ອງ (Pack Count)' : 'Pack Count',
                        containerWeight: currentLang === 'lo' ? 'ນ້ຳໜັກບັນຈຸ (Container Weight)' : 'Container Weight',
                        maxPaperSize: currentLang === 'lo' ? 'ຂະໜາດພິມສູງສຸດ (Max Print Size)' : 'Max Print Size',
                        printSpeedColor: currentLang === 'lo' ? 'ຄວາມໄວພິມສີ (Print Speed Color)' : 'Print Speed (Color)',
                        printSpeedBw: currentLang === 'lo' ? 'ຄວາມໄວພິມຂາວດຳ (Print Speed BW)' : 'Print Speed (BW)',
                        isoBlackYield: currentLang === 'lo' ? 'ມາດຕະຖານພິມໝຶກດຳ (ISO Black Yield)' : 'ISO Black Yield',
                        isoColorYield: currentLang === 'lo' ? 'ມາດຕະຖານພິມໝຶກສີ (ISO Color Yield)' : 'ISO Color Yield',
                        costPerPage: currentLang === 'lo' ? 'ຕົ້ນທຶນໝຶກຕໍ່ແຜ່ນ (Cost Per Page - CPP)' : 'Cost Per Page (CPP)',
                        maxCutWidthMm: currentLang === 'lo' ? 'ໜ້າກວ້າງຕັດສູງສຸດ (Max Cut Width)' : 'Max Cut Width',
                        cuttingSpeed: currentLang === 'lo' ? 'ຂໍ້ມູນການທຳງານທົ່ວໄປ (Machine Functionality)' : 'Machine Functionality'
                      };

                      return (
                        <div key={key} className={key === 'cuttingSpeed' || key === 'colorSlots' ? 'col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100' : ''}>
                          <span className="text-slate-400 block text-[11px] font-semibold">
                            {labelMapLo[key] || key.replace(/([A-Z])/g, ' $1')}:
                          </span>
                          <span className="text-slate-800 font-bold">
                            {Array.isArray(val) ? val.join(', ') : val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
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
                            <span>{currentLang === 'lo' ? 'ບໍ່ມີສະລິບໂອນเงิน' : 'No payment slip'}</span>
                          </div>
                        )}
                        <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-bold bg-white/90 text-slate-700 text-center py-0.5 rounded-lg shadow-2xs backdrop-blur-xs">
                          {currentLang === 'lo' ? 'ສະລິບໂອນเงิน (Payment Slip)' : 'Payment Slip'}
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

      {/* Full Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-900" />
                <span>{editingItem ? `ແກ້ໄຂລາຍການ: ${editingItem.poNumber}` : '+ ນຳເຂົ້າສິນຄ້າ / ອຸປະກອນໃໝ່'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {/* Section 1: Category Option Selector */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5">
                  {currentLang === 'lo' ? 'ເລືອກໝວດໝູ່ ERP Master (Module A & B Options)' : 'Select ERP Category'}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                  {[
                    { id: 'MATERIAL', label: currentLang === 'lo' ? '1. ເຈ້ຍ/ວັດສະດຸ' : '1. Paper/Material', color: 'text-emerald-700' },
                    { id: 'INK', label: currentLang === 'lo' ? '2. ໝຶກພິມ' : '2. Printing Ink', color: 'text-amber-700' },
                    { id: 'HARDWARE', label: currentLang === 'lo' ? '3. ອຸປະກອນ/ກາວ' : '3. Hardware/Glue', color: 'text-teal-700' },
                    { id: 'PRINTER', label: currentLang === 'lo' ? '4. ເຄື່ອງພິມ (B.1)' : '4. Printer (B.1)', color: 'text-purple-700' },
                    { id: 'CUTTER', label: currentLang === 'lo' ? '5. ເຄື່ອງຕັດ (B.2)' : '5. Cutter (B.2)', color: 'text-indigo-700' }
                  ].map(cat => (
                    <label key={cat.id} className="relative flex items-center p-3 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:border-sky-500 transition font-bold">
                      <input 
                        type="radio" 
                        name="category" 
                        value={cat.id} 
                        checked={formCategory === cat.id}
                        onChange={() => setFormCategory(cat.id)}
                        className="text-sky-600 focus:ring-sky-500 border-slate-300"
                      />
                      <span className={`ml-2 text-[11px] ${cat.color}`}>{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section 2: General Procurement Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  1. ข้อมูลส่วนกลางและการสั่งซื้อนำเข้า (Common Master & Procurement)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
                  <div>
                    <label className="block text-slate-600 mb-1">เลขที่ PO / Ref ID *</label>
                    <input type="text" required value={formPo} onChange={(e) => setFormPo(e.target.value)} placeholder="PO-789818" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">วันที่รับ/ติดตั้ง *</label>
                    <input type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">SKU Code *</label>
                    <input type="text" required value={formSku} onChange={(e) => setFormSku(e.target.value)} placeholder="MAT-PAP-A4" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none font-mono" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-600 mb-1">ชื่อรายการนำเข้า *</label>
                    <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="กระดาษ A4 / หมึก UV / สันห่วง" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">ผู้จัดจำหน่าย/ร้านค้า *</label>
                    <input type="text" required value={formSupplier} onChange={(e) => setFormSupplier(e.target.value)} placeholder="Double A Official / Mimaki" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">จำนวนนำเข้า *</label>
                    <input type="number" min="1" required value={formQty} onChange={(e) => setFormQty(e.target.value)} className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">หน่วยนับ *</label>
                    <select value={formUnit} onChange={(e) => setFormUnit(e.target.value)} className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none">
                      <option value="Ream">Ream (รีม)</option>
                      <option value="Sheet">Sheet (แผ่น)</option>
                      <option value="Roll">Roll (ม้วน)</option>
                      <option value="Bottle">Bottle (ขวด)</option>
                      <option value="Box">Box (กล่อง)</option>
                      <option value="Unit">Unit (เครื่อง/ตัว)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">ราคาสั่งซื้อรวม (LAK ₭) *</label>
                    <input type="number" min="0" step="100" required value={formTotalPrice} onChange={(e) => setFormTotalPrice(e.target.value)} className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none font-semibold" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-bold text-sky-900">ช่องทางการชำระเงิน *</label>
                    <select value={formPaymentMethod} onChange={(e) => setFormPaymentMethod(e.target.value)} className="w-full bg-sky-50 text-sky-900 p-3 rounded-2xl border border-sky-300 focus:border-sky-500 outline-none font-extrabold">
                      <option value="TRANSFER">โอนเงินผ่านธนาคาร (Bank Transfer)</option>
                      <option value="CASH">เงินสด (Cash)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Dynamic Category Specifications */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span>2. สเปกเฉพาะตามประเภทสินค้า (Dynamic Product Spec Options)</span>
                  <span className="text-[10px] text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Auto-Switch Form
                  </span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                  {/* Group 1: Material (Sheet & Roll) */}
                  {formCategory === 'MATERIAL' && (
                    <>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">รูปแบบบรรจุภัณฑ์ (form_factor) *</label>
                        <select value={specFormFactor} onChange={(e) => setSpecFormFactor(e.target.value)} className="w-full bg-sky-50 text-sky-900 p-3 rounded-2xl border border-sky-300 focus:border-sky-500 outline-none font-extrabold">
                          <option value="SHEET">SHEET (แบบแผ่น)</option>
                          <option value="ROLL">ROLL (แบบม้วน)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">ความหนา/น้ำหนัก (grammage_gsm) *</label>
                        <input type="text" value={specGrammage} onChange={(e) => setSpecGrammage(e.target.value)} placeholder="e.g. 80 GSM, 300 GSM, 120 Micron" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                      </div>

                      {specFormFactor === 'SHEET' && (
                        <>
                          <div>
                            <label className="block text-slate-600 mb-1 font-bold">ขนาดมาตรฐาน (size_preset)</label>
                            <select value={specSizePreset} onChange={(e) => setSpecSizePreset(e.target.value)} className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none">
                              <option value="A4">A4 (210 x 297 mm)</option>
                              <option value="A3">A3 (297 x 420 mm)</option>
                              <option value="A3+">A3+ (330 x 483 mm)</option>
                              <option value="31x43">31 x 43 นิ้ว (กระดาษใหญ่)</option>
                              <option value="24x35">24 x 35 นิ้ว (กระดาษใหญ่)</option>
                              <option value="CUSTOM">CUSTOM (กำหนดเอง)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1 font-bold">จำนวนแผ่นต่อรีม/แพ็ค (pack_qty) *</label>
                            <input type="number" value={specPackQty} onChange={(e) => setSpecPackQty(e.target.value)} placeholder="e.g. 500 sheets/ream" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1 font-bold">ความกว้างแผ่น (sheet_width_mm)</label>
                            <input type="number" value={specWidthMm} onChange={(e) => setSpecWidthMm(e.target.value)} placeholder="e.g. 210 mm" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1 font-bold">ความยาวแผ่น (sheet_length_mm)</label>
                            <input type="number" value={specLength} onChange={(e) => setSpecLength(e.target.value)} placeholder="e.g. 297 mm" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                          </div>
                        </>
                      )}

                      {specFormFactor === 'ROLL' && (
                        <>
                          <div>
                            <label className="block text-slate-600 mb-1 font-bold">หน้ากว้างม้วน (roll_width_mm) *</label>
                            <input type="number" value={specWidthMm} onChange={(e) => setSpecWidthMm(e.target.value)} placeholder="e.g. 610 mm, 1270 mm" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1 font-bold">ความยาวรวมต่อม้วน (roll_length_m) *</label>
                            <input type="number" value={specLength} onChange={(e) => setSpecLength(e.target.value)} placeholder="e.g. 50 เมตร, 100 เมตร" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Group 2: Printing Ink Specific (Linked to Equipment Master) */}
                  {formCategory === 'INK' && (
                    <>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold text-sky-900">เชื่อมโยงกับเครื่องพิมพ์ (Linked Printer) *</label>
                        <select 
                          value={specCompatiblePrinter} 
                          onChange={(e) => setSpecCompatiblePrinter(e.target.value)} 
                          className="w-full bg-sky-50 text-sky-900 p-3 rounded-2xl border border-sky-300 focus:border-sky-500 outline-none font-bold"
                        >
                          <option value="">-- เลือกเครื่องพิมพ์ที่ใช้หมึกนี้ --</option>
                          <option value="Epson EcoTank L15150">Epson EcoTank L15150 (A3+ Multi-Function)</option>
                          <option value="Konica Minolta AccurioPress C1100">Konica Minolta AccurioPress C1100 (Digital Press)</option>
                          <option value="Mimaki JFX200-2513 UV">Mimaki JFX200-2513 UV Large Format</option>
                          <option value="Roland TrueVIS VG3-640 Eco-Solvent">Roland TrueVIS VG3-640 Eco-Solvent</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">ประเภทหมึกพิมพ์ (ink_type) *</label>
                        <select value={specInkType} onChange={(e) => setSpecInkType(e.target.value)} className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none font-bold">
                          <option value="Waterproof Pigment Ink">หมึกพิกเมนต์กันน้ำ (Waterproof Pigment Ink)</option>
                          <option value="Eco-Solvent Ink">หมึกน้ำมัน Eco-Solvent (กันน้ำ/ภายนอก)</option>
                          <option value="Full Solvent Ink">หมึกโซลเว้นท์เข้มข้น (Full Solvent Ink)</option>
                          <option value="UV Curable Ink">หมึก UV (UV Curable Ink)</option>

                          <option value="Dye Ink">หมึกดิสเพิร์ส / หมึกน้ำ (Dye-Based Ink)</option>
                          <option value="DTF / DTG Textile Ink">หมึกพิมพ์สกรีนเสื้อ (DTF / DTG Ink)</option>
                          <option value="Sublimation Ink">หมึกซับลิเมชั่น (Sublimation Ink)</option>
                          <option value="Offset Oil Ink">หมึกพิมพ์ออฟเซ็ทฐานน้ำมัน (Offset Ink)</option>
                          <option value="Laser Toner Powder">ผงหมึกเลเซอร์ (Laser Toner Powder)</option>
                          <option value="OTHER">อื่นๆ (Custom Ink Type)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">เฉดสี / ตลับสีที่ซื้อ (Color Option) *</label>
                        <select value={specColorModel} onChange={(e) => setSpecColorModel(e.target.value)} className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none font-bold">
                          <option value="Full CMYK Set">ซื้อยกชุด (Full Set / Full CMYK)</option>
                          {printerColorSlots.map((colorSlot, idx) => (
                            <option key={idx} value={colorSlot}>เฉพาะสี {colorSlot}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">มาตรฐานการพิมพ์ (ISO/IEC Page Yield Count) *</label>
                        <input 
                          type="number" 
                          value={specVolumeBottle} 
                          onChange={(e) => setSpecVolumeBottle(e.target.value)} 
                          placeholder="e.g. 7500 แผ่น (5% ISO Coverage)" 
                          className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" 
                        />
                      </div>
                      <div className="md:col-span-2 bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-emerald-800 block">ต้นทุนหมึกพิมพ์ต่อแผ่นจริง (Calculated Cost Per Page - CPP):</span>
                          <span className="text-xs text-emerald-600 font-semibold">คำนวณจาก (ราคาสั่งซื้อรวม ÷ จำนวนแผ่นมาตรฐาน ISO)</span>
                        </div>
                        <span className="text-lg font-black text-emerald-950 font-mono">
                          {formatLAK(formTotalPrice / (Number(specVolumeBottle) || 7500))} / แผ่น
                        </span>
                      </div>
                    </>
                  )}

                  {/* Group 3: Hardware, Glues & Equipment */}
                  {formCategory === 'HARDWARE' && (
                    <>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">หมวดหมู่อุปกรณ์ (hardware_type) *</label>
                        <select value={specHwType} onChange={(e) => setSpecHwType(e.target.value)} className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none">
                          <option value="GLUE_ADHESIVE">กาว/เคมีภัณฑ์ (กาวร้อน, กาวลาเท็กซ์)</option>
                          <option value="FASTENER">อุปกรณ์ยึดติด (สันห่วง, ลวดแม็ก, สก๊อตเทป)</option>
                          <option value="CUTTING_TOOL">อุปกรณ์ตัด/กรรไกร (ใบมีดคัตเตอร์, กรรไกร)</option>
                          <option value="PACKAGING">บรรจุภัณฑ์ (กล่องพัสดุ, ฟิล์มยืด)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">เบอร์/สเปกเฉพาะ (hardware_spec)</label>
                        <input type="text" value={specHwSpec} onChange={(e) => setSpecHwSpec(e.target.value)} placeholder="e.g. ลวดแม็ก 24/6, สันห่วง 10mm" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">จำนวนบรรจุต่อกล่อง (pack_count)</label>
                        <input type="number" value={specPackCount} onChange={(e) => setSpecPackCount(e.target.value)} placeholder="e.g. 1000 Pcs/Box" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">น้ำหนัก/ขนาดบรรจุ (container_weight)</label>
                        <input type="text" value={specContainerWeight} onChange={(e) => setSpecContainerWeight(e.target.value)} placeholder="e.g. 1 กิโลกรัม, 500 กรัม" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                      </div>
                    </>
                  )}

                  {/* Group 4: Printers */}
                  {formCategory === 'PRINTER' && (
                    <>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">ชนิดหมึกที่เครื่องใช้ (Supported Ink Types)</label>
                        <select className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none font-bold">
                          <option value="Waterproof Pigment Ink">หมึกพิกเมนต์กันน้ำ (Waterproof Pigment Ink)</option>
                          <option value="Eco-Solvent Ink">หมึกน้ำมัน Eco-Solvent (กันน้ำ/งานภายนอก)</option>
                          <option value="UV Curable Ink">หมึก UV (UV Curable Ink)</option>
                          <option value="Dye Ink">หมึกน้ำ (Dye Base Ink)</option>
                          <option value="Toner Powder">ผงหมึกเลเซอร์ (Laser Toner Powder)</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-slate-600 font-bold">สล็อตสีหมึกประจำเครื่อง (Dynamic Printer Color Slots) *</label>
                        <p className="text-[11px] text-slate-400">มาตรฐาน 4 สี CMYK หรือกด + เพิ่มสล็อตสีพิเศษ (เช่น White, Varnish, Light Cyan)</p>
                        
                        {/* List of active color slots */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {printerColorSlots.map((colorName, idx) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-900 border border-sky-200 shadow-2xs"
                            >
                              <span>{colorName}</span>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveColorSlot(colorName)}
                                className="text-sky-400 hover:text-rose-600 transition"
                                title="Remove Slot"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Input to add new custom color slot */}
                        <div className="flex items-center gap-2 pt-2">
                          <input 
                            type="text" 
                            value={newColorInput} 
                            onChange={(e) => setNewColorInput(e.target.value)} 
                            placeholder="เพิ่มสล็อตสีใหม่ (e.g. White, Varnish, Light Magenta)" 
                            className="flex-1 bg-slate-50 text-slate-900 p-2.5 rounded-2xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
                          />
                          <button 
                            type="button" 
                            onClick={handleAddColorSlot}
                            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                          >
                            <Plus className="w-4 h-4" /> เพิ่มสล็อตสี
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">ขนาดพิมพ์สูงสุด (max_paper_size)</label>
                        <input type="text" value={specMaxPaperSize} onChange={(e) => setSpecMaxPaperSize(e.target.value)} placeholder="e.g. A3+ (330x483mm), หน้ากว้าง 1.6m" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">มาตรฐานปริมาณพิมพ์หมึกดำ (ISO Black Page Yield) *</label>
                        <input type="number" placeholder="e.g. 7500 แผ่น (5% ISO Coverage)" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none font-bold" />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">มาตรฐานปริมาณพิมพ์หมึกสี (ISO CMY Page Yield) *</label>
                        <input type="number" placeholder="e.g. 6000 แผ่น (5% ISO Coverage)" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none font-bold" />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">ความเร็วพิมพ์สี (PPM / sqm_hr) [เก็บข้อมูลอ้างอิง]</label>
                        <input type="text" value={specPrintSpeed} onChange={(e) => setSpecPrintSpeed(e.target.value)} placeholder="e.g. 35 PPM สี" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">ความเร็วพิมพ์ขาวดำ (PPM) [เก็บข้อมูลอ้างอิง]</label>
                        <input type="text" value={specClickBw} onChange={(e) => setSpecClickBw(e.target.value)} placeholder="e.g. 60 PPM ขาวดำ" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                      </div>
                    </>
                  )}

                  {/* Group 5: Cutters & Processing Machines */}
                  {formCategory === 'CUTTER' && (
                    <>
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">หน้ากว้างตัดสูงสุด (Max Cut Width) *</label>
                        <input type="text" value={specMaxCutWidth} onChange={(e) => setSpecMaxCutWidth(e.target.value)} placeholder="e.g. 1150 mm, หน้ากว้าง 60 นิ้ว" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none font-bold" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-slate-600 mb-1 font-bold">ข้อมูลการทำงานทั่วไป / ทำอะไรได้บ้าง (Machine Functionality) *</label>
                        <textarea 
                          rows="3" 
                          value={specCuttingSpeed} 
                          onChange={(e) => setSpecCuttingSpeed(e.target.value)} 
                          placeholder="ระบุการทำงานทั่วไป เช่น: ตัดกระดาษหน้ากว้างไดคัทได้, เจาะกระดาษแบบสันห่วง, เข้าเล่มกาวร้อน" 
                          className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Section 4: Shipping Freight Charges */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  3. ข้อมูลประเทศต้นทางและค่าขนส่ง (Freight Charges)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                  <div>
                    <label className="block text-slate-600 mb-1">ประเทศผู้ผลิต / ต้นทาง (origin_country)</label>
                    <input type="text" value={formOrigin} onChange={(e) => setFormOrigin(e.target.value)} placeholder="TH, CN, JP" className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none uppercase" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">ค่าขนส่ง/ชิปปิ้ง (freight LAK ₭)</label>
                    <input type="number" min="0" step="100" value={formFreight} onChange={(e) => setFormFreight(e.target.value)} className="w-full bg-slate-50 text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-sky-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Section 5: Real File Uploads (Product Image & Bank Slip) */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  4. แนบรูปถ่ายสินค้าจริง และ สลิปโอนเงิน (Real Image Uploads)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                  {/* Real Product Photo Upload */}
                  <div className="space-y-2">
                    <label className="block text-slate-600 font-bold">รูปถ่ายสินค้าจริง (Product Photo)</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold cursor-pointer transition">
                        <Upload className="w-4 h-4" />
                        <span>อัปโหลดรูปสินค้า</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setFormImgProduct)} className="hidden" />
                      </label>
                      {formImgProduct && (
                        <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden shrink-0">
                          <img src={formImgProduct} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Slip Upload (Conditional on TRANSFER) */}
                  {formPaymentMethod === 'TRANSFER' && (
                    <div className="space-y-2">
                      <label className="block text-slate-600 font-bold text-sky-900">หลักฐานสลิปโอนเงิน (Payment Slip)</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-2xl font-bold cursor-pointer transition">
                          <Upload className="w-4 h-4" />
                          <span>อัปโหลดสลิปโอนเงิน</span>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setFormImgSlip)} className="hidden" />
                        </label>
                        {formImgSlip && (
                          <div className="w-12 h-12 rounded-xl border border-sky-200 overflow-hidden shrink-0">
                            <img src={formImgSlip} alt="Slip Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 font-bold">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-2xl transition cursor-pointer"
                >
                  ຍົກເລີກ (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white text-xs rounded-2xl shadow-md shadow-sky-600/20 transition cursor-pointer"
                >
                  ບັນທຶກລາຍການນຳເຂົ້າ (Save Inbound)
                </button>
              </div>
            </form>
          </div>
        </div>
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
