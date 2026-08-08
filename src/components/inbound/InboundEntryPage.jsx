import React, { useState } from 'react';
import { ArrowLeft, Truck, Boxes, Printer, Plus, RefreshCw, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import MaterialInboundForm from './forms/MaterialInboundForm';
import EquipmentInboundForm from './forms/EquipmentInboundForm';
import CategoryBuilder, { INITIAL_PRESET_CATEGORIES, INITIAL_STANDARD_SPECS } from './forms/CategoryBuilder';

export default function InboundEntryPage({ onBack }) {
  const { 
    inventory, 
    equipment, 
    addInventoryBatch, 
    addInventorySku, 
    addEquipment, 
    addPurchaseOrder, 
    customCategories, 
    setCustomCategories, 
    masterSpecsPool: ctxMasterSpecsPool, 
    setMasterSpecsPool: setCtxMasterSpecsPool, 
    showToast 
  } = useApp();

  const { i18n } = useTranslation();
  const currentLang = i18n?.language || 'lo';

  // Entry Mode Selection: 'entry_form' (Case 1) vs 'category_builder' (Case 2)
  const [viewMode, setViewMode] = useState('entry_form');

  // Unified Reorder Selector: 'reorder_existing' vs 'inbound_new'
  const [inboundFlowMode, setInboundFlowMode] = useState('inbound_new');

  // Selected Existing Item ID for Reorder Flow
  const [reorderItemId, setReorderItemId] = useState('');

  // Categories Master Registry State (Uses context/localStorage if present)
  const [categories, setCategories] = useState(() => {
    return customCategories && customCategories.length > 0 ? customCategories : INITIAL_PRESET_CATEGORIES;
  });

  // Master Custom Field Pool State
  const [masterSpecsPool, setMasterSpecsPoolState] = useState(() => {
    return ctxMasterSpecsPool && ctxMasterSpecsPool.length > 0 ? ctxMasterSpecsPool : INITIAL_STANDARD_SPECS;
  });

  const updateMasterSpecsPool = (newPool) => {
    setMasterSpecsPoolState(newPool);
    if (setCtxMasterSpecsPool) setCtxMasterSpecsPool(newPool);
  };

  const updateCategories = (newCats) => {
    setCategories(newCats);
    if (setCustomCategories) setCustomCategories(newCats);
  };

  // Selected Primary Section (Category A: Materials vs Category B: Machinery)
  const [inboundCategory, setInboundCategory] = useState('Materials');

  // Filter Categories matching current Section
  const sectionCategories = categories.filter(c => c.targetSection === inboundCategory);
  const [selectedCategoryId, setSelectedCategoryId] = useState(sectionCategories[0]?.id || INITIAL_PRESET_CATEGORIES[0].id);

  // Custom Specs Values Keyed by Field ID
  const [customSpecsValues, setCustomSpecsValues] = useState({});

  // Category A States
  const [materialType, setMaterialType] = useState('Paper');
  const [paperSpec, setPaperSpec] = useState('Inkjet Paper');
  const [materialName, setMaterialName] = useState('');
  const [supplierName, setSupplierName] = useState('Vientiane Supply Co.');
  const [supplierContact, setSupplierContact] = useState('');
  const [lotId] = useState(`LOT-${Date.now().toString().slice(-6)}`);
  const [materialUnitCost, setMaterialUnitCost] = useState(120000);
  const [quantity, setQuantity] = useState(50);
  const [purchaseUnit] = useState('Ream');

  // Shared Media Attachments
  const [itemPhoto, setItemPhoto] = useState(null);
  const [paymentSlip, setPaymentSlip] = useState(null);

  // Category B States
  const [machineName, setMachineName] = useState('Epson EcoTank L15150');
  const [machineCategory, setMachineCategory] = useState('Printer');
  const [purchaseCost, setPurchaseCost] = useState(15000000);
  const [lifespanYears, setLifespanYears] = useState(5);
  const [lifetimeCapacity, setLifetimeCapacity] = useState(500000);

  // Printer Tech Spec States
  const [inkType, setInkType] = useState('Pigment');
  const [printTech, setPrintTech] = useState('Color');
  const [maxWidth, setMaxWidth] = useState('A3+');
  const [blackYieldPages, setBlackYieldPages] = useState(7500);
  const [blackCapacityMl, setBlackCapacityMl] = useState(127);
  const [colorYieldPages, setColorYieldPages] = useState(6000);
  const [colorCapacityMl, setColorCapacityMl] = useState(210);
  const [clickRateColor, setClickRateColor] = useState(500);
  const [clickRateBW, setClickRateBW] = useState(150);
  const [linkedInkSku, setLinkedInkSku] = useState('');

  // Cutter / Laminator / Binder States
  const [cutCapacity, setCutCapacity] = useState(500);
  const [bladeDepreciationPerCut, setBladeDepreciationPerCut] = useState(300);
  const [laminationWidth, setLaminationWidth] = useState('A3 (330mm)');
  const [bindingMethod, setBindingMethod] = useState('Perfect Glue');

  const activeCategoryRecord = categories.find(c => c.id === selectedCategoryId) || sectionCategories[0] || null;

  // File Upload Helper
  const handleFileUpload = (e, setter) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto Computations
  const blackMlPerSheet = Number(blackYieldPages) > 0 ? (Number(blackCapacityMl) / Number(blackYieldPages)) : 0.0169;
  const colorMlPerSheet = Number(colorYieldPages) > 0 ? (Number(colorCapacityMl) / Number(colorYieldPages)) : 0.035;

  // Reorder Item Selector Change Event
  const handleSelectReorderItem = (itemId) => {
    setReorderItemId(itemId);
    if (!itemId) return;

    if (inboundCategory === 'Materials') {
      const existing = inventory.find(i => i.id === itemId);
      if (existing) {
        setMaterialName(existing.name);
        setMaterialType(existing.category || 'Paper');
        setSupplierName(existing.supplierName || 'Vientiane Supply Co.');
        setSupplierContact(existing.supplierContact || '');
        setMaterialUnitCost(existing.costPerPurchaseUnit || existing.purchasePrice || 120000);
        setItemPhoto(existing.itemPhoto || existing.imageUrl || null);
        if (existing.customSpecs) setCustomSpecsValues(existing.customSpecs);
      }
    } else {
      const existing = equipment.find(e => e.id === itemId);
      if (existing) {
        setMachineName(existing.name);
        setMachineCategory(existing.category || 'Printer');
        setSupplierName(existing.supplierName || 'Lao Tech Machinery');
        setSupplierContact(existing.supplierContact || '');
        setPurchaseCost(existing.purchaseCost || 15000000);
        setLifespanYears(existing.lifespanYears || 5);
        setLifetimeCapacity(existing.printedPagesCapacity || existing.lifetimeCapacity || 500000);
        setItemPhoto(existing.itemPhoto || existing.imageUrl || null);
        if (existing.customSpecs) setCustomSpecsValues(existing.customSpecs);
      }
    }
  };

  const handleSectionChange = (section) => {
    setInboundCategory(section);
    setReorderItemId('');
    setItemPhoto(null);
    setPaymentSlip(null);
    setSupplierContact('');
    setCustomSpecsValues({});

    const matchingCats = categories.filter(c => c.targetSection === section);
    if (matchingCats.length > 0) {
      setSelectedCategoryId(matchingCats[0].id);
    }
  };

  const handleMachineCategoryChange = (cat) => {
    setMachineCategory(cat);
    setMaxWidth('A3+');
    setInkType('Pigment');
    setPrintTech('Color');
    setBlackYieldPages(7500);
    setBlackCapacityMl(127);
    setColorYieldPages(6000);
    setColorCapacityMl(210);
    setClickRateColor(500);
    setClickRateBW(150);
    setLinkedInkSku('');
    setCutCapacity(500);
    setBladeDepreciationPerCut(300);
    setLaminationWidth('A3 (330mm)');
    setBindingMethod('Perfect Glue');
  };

  // Delete custom field permanently from Master Spec Pool
  const handleDeleteSpecFromPool = (specId) => {
    const updated = masterSpecsPool.filter(s => s.id !== specId);
    updateMasterSpecsPool(updated);
    showToast('ລຶບ Custom Field ຈາກ Master Pool ສຳເລັດ!', 'info');
  };

  // Step 2.5: Save Category & Auto-populate Custom Fields to Master Pool & Auto-Redirect back to Case 1 View Mode
  const handleSaveCategoryRecord = (newCat) => {
    if (newCat.customFields && newCat.customFields.length > 0) {
      const newPoolEntries = newCat.customFields.map(f => ({
        id: f.id,
        nameLo: f.labelLo || f.labelEn,
        nameEn: f.labelEn || f.labelLo,
        category: newCat.targetSection,
        isCustom: true
      }));

      const existingIds = new Set(masterSpecsPool.map(p => p.id));
      const filteredNew = newPoolEntries.filter(e => !existingIds.has(e.id));
      updateMasterSpecsPool([...masterSpecsPool, ...filteredNew]);
    }

    const updatedCats = [newCat, ...categories];
    updateCategories(updatedCats);
    setInboundCategory(newCat.targetSection);
    setSelectedCategoryId(newCat.id);
    setViewMode('entry_form');
    showToast(`ບັນທຶກໝວດ "${currentLang === 'en' ? newCat.nameEn : newCat.nameLo}" ສຳເລັດ!`, 'success');
  };

  const sanitizePayload = (obj) =>
    Object.fromEntries(
      Object.entries(obj).filter(([, v]) =>
        v !== undefined && v !== null && v !== '' && v !== 0
      )
    );

  const handleSubmit = (e) => {
    e.preventDefault();

    // Payment Slip Required Validation
    if (!paymentSlip) {
      showToast(currentLang === 'en' ? 'Please upload a Payment Slip for this transaction' : 'ກະລຸນາອັບໂຫຼດສະລິບການຈ່າຍເງິນ', 'warning');
      return;
    }

    if (inboundCategory === 'Materials') {
      if (!materialName.trim()) {
        showToast(currentLang === 'en' ? 'Please specify material item name' : 'ກະລຸນາລະບຸຊື່ວັດສະດຸທີ່ນຳເຂົ້າ', 'warning');
        return;
      }

      const activeCatName = activeCategoryRecord
        ? (currentLang === 'en' ? activeCategoryRecord.nameEn : activeCategoryRecord.nameLo)
        : materialType;

      const poRecord = sanitizePayload({
        id: `PO-${Date.now().toString().slice(-6)}`,
        poId: `PO-${Date.now().toString().slice(-6)}`,
        type: 'Material',
        categoryType: 'Materials',
        materialType: activeCatName,
        paperSpec: materialType === 'Paper' ? paperSpec : undefined,
        itemName: materialName,
        name: materialName,
        supplierName,
        supplierContact: supplierContact || undefined,
        unitPrice: Number(materialUnitCost),
        costPerUnit: Number(materialUnitCost),
        qty: Number(quantity),
        unitName: purchaseUnit || 'Units',
        totalCost: Number(materialUnitCost) * Number(quantity),
        totalPrice: Number(materialUnitCost) * Number(quantity),
        date: new Date().toISOString().split('T')[0],
        itemPhoto: itemPhoto || undefined,
        paymentSlip: paymentSlip || undefined,
        customSpecs: customSpecsValues
      });

      if (inboundFlowMode === 'reorder_existing' && reorderItemId && addInventoryBatch) {
        addInventoryBatch(reorderItemId, {
          batchId: `LOT-${reorderItemId.slice(-4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
          purchaseDate: new Date().toISOString().split('T')[0],
          supplierName,
          purchasePrice: Number(materialUnitCost),
          purchaseQty: Number(quantity),
          paymentSlip
        });
      } else if (addInventorySku) {
        addInventorySku(sanitizePayload({
          id: lotId || `LOT-${Date.now()}`,
          name: materialName,
          category: activeCatName,
          paperSpec: materialType === 'Paper' ? paperSpec : undefined,
          supplierName,
          supplierContact: supplierContact || undefined,
          itemPhoto: itemPhoto || undefined,
          paymentSlip: paymentSlip || undefined,
          purchasePrice: Number(materialUnitCost),
          costPerSheet: Math.round(Number(materialUnitCost) / (purchaseUnit === 'Ream' ? 500 : 1)),
          costPerPurchaseUnit: Number(materialUnitCost),
          costPerConsumptionUnit: Math.round(Number(materialUnitCost) / (purchaseUnit === 'Ream' ? 500 : 1)),
          initialQty: Number(quantity),
          currentQty: Number(quantity),
          stockQty: Number(quantity),
          purchaseUnit,
          unitName: purchaseUnit,
          purchaseMultiplier: purchaseUnit === 'Ream' ? 500 : 1,
          reorderThreshold: 100,
          customSpecs: customSpecsValues,
          batches: [{
            id: `${lotId}-B1`,
            purchaseDate: new Date().toISOString().split('T')[0],
            supplierName,
            purchasePricePerReam: Number(materialUnitCost),
            costPerSheet: Math.round(Number(materialUnitCost) / (purchaseUnit === 'Ream' ? 500 : 1)),
            initialQty: Number(quantity),
            currentQty: Number(quantity)
          }],
          purchaseDate: new Date().toISOString().split('T')[0]
        }));
      }

      if (addPurchaseOrder) addPurchaseOrder(poRecord);
      showToast(currentLang === 'en' ? `Material inbound record "${materialName}" saved!` : `ບັນທຶກນຳເຂົ້າວັດສະດຸ "${materialName}" ສຳເລັດ!`, 'success');
    } else {
      if (!machineName.trim()) {
        showToast(currentLang === 'en' ? 'Please specify machine name' : 'ກະລຸນາລະບຸຊື່ເຄື່ອງຈັກ', 'warning');
        return;
      }

      const activeEqCatName = activeCategoryRecord
        ? (currentLang === 'en' ? activeCategoryRecord.nameEn : activeCategoryRecord.nameLo)
        : machineCategory;

      let categoryParams = {};
      if (machineCategory === 'Printer' || activeEqCatName.toLowerCase().includes('printer')) {
        categoryParams = {
          maxWidth,
          inkType,
          printTech,
          linkedInkSku,
          blackYieldPages: Number(blackYieldPages),
          blackCapacityMl: Number(blackCapacityMl),
          colorYieldPages: Number(colorYieldPages),
          colorCapacityMl: Number(colorCapacityMl),
          blackMlPerSheet,
          colorMlPerSheet,
          inkConsumptionStandard: colorMlPerSheet || 0.035,
          clickRateColor: Number(clickRateColor || 500),
          clickRateBW: Number(clickRateBW || 150)
        };
      } else if (machineCategory === 'Cutter' || activeEqCatName.toLowerCase().includes('cutter')) {
        categoryParams = { cutCapacity: Number(cutCapacity), bladeDepreciationPerCut: Number(bladeDepreciationPerCut) };
      } else if (machineCategory === 'Laminator') {
        categoryParams = { laminationWidth };
      } else if (machineCategory === 'Binder') {
        categoryParams = { bindingMethod };
      }

      const poRecord = sanitizePayload({
        id: `PO-EQ-${Date.now().toString().slice(-6)}`,
        poId: `PO-EQ-${Date.now().toString().slice(-6)}`,
        type: 'Equipment',
        categoryType: 'Machinery',
        itemName: machineName,
        name: machineName,
        itemType: activeEqCatName,
        lifespanYears: Number(lifespanYears),
        lifetimeCapacity: Number(lifetimeCapacity),
        purchaseCost: Number(purchaseCost),
        supplierName,
        supplierContact: supplierContact || undefined,
        unitPrice: Number(purchaseCost),
        costPerUnit: Number(purchaseCost),
        qty: Number(quantity || 1),
        unitName: 'Unit',
        totalCost: Number(purchaseCost) * Number(quantity || 1),
        totalPrice: Number(purchaseCost) * Number(quantity || 1),
        date: new Date().toISOString().split('T')[0],
        itemPhoto: itemPhoto || undefined,
        paymentSlip: paymentSlip || undefined,
        customSpecs: customSpecsValues,
        ...categoryParams
      });

      if (inboundFlowMode !== 'reorder_existing' && addEquipment) {
        addEquipment(sanitizePayload({
          name: machineName,
          category: activeEqCatName,
          imageUrl: itemPhoto || undefined,
          itemPhoto: itemPhoto || undefined,
          paymentSlip: paymentSlip || undefined,
          purchaseCost: Number(purchaseCost),
          lifespanYears: Number(lifespanYears),
          printedPagesCapacity: Number(lifetimeCapacity),
          supplierName,
          supplierContact: supplierContact || undefined,
          customSpecs: customSpecsValues,
          ...categoryParams
        }));
      }

      if (addPurchaseOrder) addPurchaseOrder(poRecord);
      showToast(currentLang === 'en' ? `Machinery inbound record "${machineName}" saved!` : `ບັນທຶກນຳເຂົ້າເຄື່ອງຈັກ "${machineName}" ສຳເລັດ!`, 'success');
    }

    onBack();
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12 text-slate-800 font-sans">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-100 rounded-2xl border border-slate-200 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{currentLang === 'en' ? 'Back to Inbound Procurement' : 'ກັບໜ້າການນຳເຂົ້າ'}</span>
          </button>
        </div>

        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-sky-600" />
            <span>{currentLang === 'en' ? 'Inbound Category & Entry System' : 'ຟອມບັນທຶກນຳເຂົ້າສິນຄ້າ & ເຄື່ອງຈັກ'}</span>
          </h3>
        </div>
      </div>

      {/* Case 2: Category Builder View Mode */}
      {viewMode === 'category_builder' ? (
        <CategoryBuilder
          initialTargetSection={inboundCategory}
          masterSpecsPool={masterSpecsPool}
          onDeleteSpecFromPool={handleDeleteSpecFromPool}
          onSaveCategory={handleSaveCategoryRecord}
          onCancel={() => setViewMode('entry_form')}
          lang={currentLang}
        />
      ) : (
        /* Case 1: Primary View Mode */
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {/* Reorder Existing vs Inbound New Item Workflow Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              {currentLang === 'en' ? 'Workflow Action' : 'ເລືອກຮູບແບບການນຳເຂົ້າ'} *
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setInboundFlowMode('inbound_new'); setReorderItemId(''); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition ${
                  inboundFlowMode === 'inbound_new'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{currentLang === 'en' ? 'Option 2: Inbound New Item / Category' : 'ນຳເຂົ້າສິນຄ້າ/ໝວດໃໝ່'}</span>
              </button>
              <button
                type="button"
                onClick={() => setInboundFlowMode('reorder_existing')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition ${
                  inboundFlowMode === 'reorder_existing'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>{currentLang === 'en' ? 'Option 1: Reorder Existing Item / Asset' : 'ນຳເຂົ້າເພີ່ມສິນຄ້າທີ່ມີໃນຄັງ'}</span>
              </button>
            </div>
          </div>

          {/* Section Selection Bar */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              1. ເລືອກໝວດຫຼັກການນຳເຂົ້າ (Select Section) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSectionChange('Materials')}
                className={`p-5 rounded-2xl border transition text-left flex items-start gap-4 ${
                  inboundCategory === 'Materials'
                    ? 'bg-sky-50 border-sky-500 shadow-md ring-2 ring-sky-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="p-3 bg-sky-500 text-white rounded-xl shadow-sm">
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-black text-sm text-slate-900 block">
                    ໝວດ A: ວັດສະດຸ & ວັດສະດຸສິ້ນເປືອງ (Materials & Supplies)
                  </span>
                  <span className="text-xs text-slate-500 font-semibold mt-0.5 block">
                    ເຈ້ຍ, ໝຶກພິມ, ຟິມເຄືອບ, ເຄມີພັນ, ວັດສະດຸ custom
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSectionChange('Machinery')}
                className={`p-5 rounded-2xl border transition text-left flex items-start gap-4 ${
                  inboundCategory === 'Machinery'
                    ? 'bg-purple-50 border-purple-500 shadow-md ring-2 ring-purple-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="p-3 bg-purple-600 text-white rounded-xl shadow-sm">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-black text-sm text-slate-900 block">
                    ໝວດ B: ເຄື່ອງຈັກ & ອຸປະກອນ (Machinery & Assets)
                  </span>
                  <span className="text-xs text-slate-500 font-semibold mt-0.5 block">
                    ເຄື່ອງພິມ, ເຄື່ອງຕັດ, ເຄື່ອງເຄືອບ, ອຸປະກອນ custom
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Reorder Searchable Dropdown Selector (Active when Option 1 is selected) */}
          {inboundFlowMode === 'reorder_existing' && (
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
              <label className="block text-xs font-black text-purple-950 uppercase">
                {currentLang === 'en' ? 'Select Existing Item to Reorder' : 'ເລືອກລາຍການທີ່ມີໃນຄັງເພື່ອຮຽກນຳເຂົ້າເພີ່ມ (Reorder Item)'} *
              </label>
              <select
                value={reorderItemId}
                onChange={(e) => handleSelectReorderItem(e.target.value)}
                className="w-full px-4 py-2.5 border border-purple-200 rounded-xl bg-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- {currentLang === 'en' ? 'Select Existing Item' : 'ເລືອກລາຍການ'} --</option>
                {inboundCategory === 'Materials' ? (
                  inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.category}) - {currentLang === 'en' ? 'Current Stock' : 'ຄັງເຫຼືອ'}: {item.stockQty}
                    </option>
                  ))
                ) : (
                  equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.category})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Sub-Category Dropdown Selector & Category Creator Trigger Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="space-y-1 flex-1">
              <label className="block text-xs font-black text-slate-700 uppercase">
                2. ເລືອກໝວດ / ປະເພດ ({inboundCategory === 'Materials' ? 'Material Category' : 'Equipment Category'}) *
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {sectionCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {currentLang === 'en' ? cat.nameEn : cat.nameLo}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:pt-5">
              <button
                type="button"
                onClick={() => setViewMode('category_builder')}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-xs shadow-md transition active:scale-95 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>➕ Add New Category/Type</span>
              </button>
            </div>
          </div>

          {/* Form Entry Body */}
          <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t border-slate-100">
            {inboundCategory === 'Materials' ? (
              <MaterialInboundForm
                materialType={materialType}
                setMaterialType={setMaterialType}
                materialName={materialName}
                setMaterialName={setMaterialName}
                paperSpec={paperSpec}
                setPaperSpec={setPaperSpec}
                materialUnitCost={materialUnitCost}
                setMaterialUnitCost={setMaterialUnitCost}
                quantity={quantity}
                setQuantity={setQuantity}
                supplierName={supplierName}
                setSupplierName={setSupplierName}
                supplierContact={supplierContact}
                setSupplierContact={setSupplierContact}
                itemPhoto={itemPhoto}
                setItemPhoto={setItemPhoto}
                paymentSlip={paymentSlip}
                setPaymentSlip={setPaymentSlip}
                handleFileUpload={handleFileUpload}
                activeTemplate={activeCategoryRecord}
                customSpecsValues={customSpecsValues}
                setCustomSpecsValues={setCustomSpecsValues}
                masterSpecsPool={masterSpecsPool}
                lang={currentLang}
              />
            ) : (
              <EquipmentInboundForm
                machineCategory={machineCategory}
                handleMachineCategoryChange={handleMachineCategoryChange}
                machineName={machineName}
                setMachineName={setMachineName}
                purchaseCost={purchaseCost}
                setPurchaseCost={setPurchaseCost}
                lifespanYears={lifespanYears}
                setLifespanYears={setLifespanYears}
                lifetimeCapacity={lifetimeCapacity}
                setLifetimeCapacity={setLifetimeCapacity}
                supplierName={supplierName}
                setSupplierName={setSupplierName}
                supplierContact={supplierContact}
                setSupplierContact={setSupplierContact}
                inkType={inkType}
                setInkType={setInkType}
                printTech={printTech}
                setPrintTech={setPrintTech}
                maxWidth={maxWidth}
                setMaxWidth={setMaxWidth}
                blackYieldPages={blackYieldPages}
                setBlackYieldPages={setBlackYieldPages}
                blackCapacityMl={blackCapacityMl}
                setBlackCapacityMl={setBlackCapacityMl}
                colorYieldPages={colorYieldPages}
                setColorYieldPages={setColorYieldPages}
                colorCapacityMl={colorCapacityMl}
                setColorCapacityMl={setColorCapacityMl}
                clickRateBW={clickRateBW}
                setClickRateBW={setClickRateBW}
                clickRateColor={clickRateColor}
                setClickRateColor={setClickRateColor}
                linkedInkSku={linkedInkSku}
                setLinkedInkSku={setLinkedInkSku}
                blackMlPerSheet={blackMlPerSheet}
                colorMlPerSheet={colorMlPerSheet}
                cutCapacity={cutCapacity}
                setCutCapacity={setCutCapacity}
                bladeDepreciationPerCut={bladeDepreciationPerCut}
                setBladeDepreciationPerCut={setBladeDepreciationPerCut}
                laminationWidth={laminationWidth}
                setLaminationWidth={setLaminationWidth}
                bindingMethod={bindingMethod}
                setBindingMethod={setBindingMethod}
                itemPhoto={itemPhoto}
                setItemPhoto={setItemPhoto}
                paymentSlip={paymentSlip}
                setPaymentSlip={setPaymentSlip}
                handleFileUpload={handleFileUpload}
                activeTemplate={activeCategoryRecord}
                customSpecsValues={customSpecsValues}
                setCustomSpecsValues={setCustomSpecsValues}
                masterSpecsPool={masterSpecsPool}
                lang={currentLang}
              />
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
              >
                {currentLang === 'en' ? 'Cancel' : 'ຍົກເລີກ'}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-black text-xs shadow-md transition active:scale-95"
              >
                {currentLang === 'en' ? 'Save Inbound Transaction' : `ບັນທຶກນຳເຂົ້າ (${inboundCategory === 'Materials' ? 'Save Material Stock' : 'Save Machinery Asset'})`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
