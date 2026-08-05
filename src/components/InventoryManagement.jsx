import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { 
  Boxes, 
  Plus, 
  AlertTriangle, 
  RotateCw, 
  Info,
  Calendar,
  Layers,
  ShoppingBag,
  Truck,
  TrendingUp,
  Tag,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  ClipboardList
} from 'lucide-react';

export default function InventoryManagement() {
  const { 
    inventory, 
    spoilageLogs, 
    vendorPrices,
    offcuts,
    addInventoryBatch,
    updateVendorPrice, 
    addOffcut,
    consumeOffcut,
    addSpoilageLog,
    showToast,
    askConfirmation
  } = useApp();

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isVendorOpen, setIsVendorOpen] = useState(false);
  const [isOffcutOpen, setIsOffcutOpen] = useState(false);
  const [subSection, setSubSection] = useState('batches'); // batches, offcuts, vendors, spoilage

  // Wizard Step states
  const [restockStep, setRestockStep] = useState(1); // 1 to 3
  const [offcutStep, setOffcutStep] = useState(1); // 1 to 2
  const [vendorStep, setVendorStep] = useState(1); // 1 to 2

  // Form states (Restock/Batch)
  const [selectedItemId, setSelectedItemId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('2026-08-04');
  const [supplierName, setSupplierName] = useState('Lao Paper Supplier');
  const [purchasePrice, setPurchasePrice] = useState(45000);
  const [purchaseQty, setPurchaseQty] = useState(2);

  // Vendor form states
  const [vendorItemId, setVendorItemId] = useState('');
  const [vendorName, setVendorName] = useState('Lao Paper Supplier');
  const [vendorPrice, setVendorPrice] = useState(45000);

  // Offcut form states
  const [offcutName, setOffcutName] = useState('');
  const [offcutQty, setOffcutQty] = useState(10);
  const [offcutPaperId, setOffcutPaperId] = useState('');
  const [offcutNotes, setOffcutNotes] = useState('');

  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num).replace('LAK', '₭');
  };

  const filteredInventory = categoryFilter === 'All' 
    ? inventory 
    : inventory.filter(item => item.category === categoryFilter);

  const categories = ['All', 'Paper', 'Ink', 'Finishing'];

  const handleRestockSubmit = (e) => {
    e.preventDefault();
    if (!selectedItemId || !batchId) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກເຈ້ຍ ແລະ ປ້ອນລະຫັດລັອດ!' : 'Select paper and enter Lot ID!', 'warning');
      return;
    }

    addInventoryBatch(selectedItemId, {
      batchId,
      purchaseDate,
      supplierName,
      purchasePrice: Number(purchasePrice),
      purchaseQty: Number(purchaseQty)
    });

    showToast(currentLang === 'lo' ? 'ບັນທຶກລັອດສິນຄ້າໃໝ່ສຳເລັດ!' : 'Lot batch added successfully!', 'success');
    setIsRestockOpen(false);
    setSelectedItemId('');
    setBatchId('');
    setPurchaseQty(2);
    setRestockStep(1);
  };

  const handleVendorSubmit = (e) => {
    e.preventDefault();
    if (!vendorItemId) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກວັດສະດຸ!' : 'Select material!', 'warning');
      return;
    }
    updateVendorPrice(vendorItemId, vendorName, Number(vendorPrice));
    showToast(currentLang === 'lo' ? 'ອັບເດດລາຄາຮ້ານສະໜອງສຳເລັດ!' : 'Vendor price updated!', 'success');
    setIsVendorOpen(false);
    setVendorStep(1);
    setVendorItemId('');
  };

  const handleOffcutSubmit = (e) => {
    e.preventDefault();
    if (!offcutName || !offcutPaperId || offcutQty <= 0) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ!' : 'Please fill all required fields!', 'warning');
      return;
    }

    addOffcut({
      name: offcutName,
      qty: Number(offcutQty),
      paperId: offcutPaperId,
      notes: offcutNotes
    });

    showToast(currentLang === 'lo' ? 'ບັນທຶກເສດເຈ້ຍເຫຼືອໃຊ້ສຳເລັດ!' : 'Offcut cataloged successfully!', 'success');
    setIsOffcutOpen(false);
    setOffcutName('');
    setOffcutQty(10);
    setOffcutNotes('');
    setOffcutPaperId('');
    setOffcutStep(1);
  };

  const handleOpenRestock = (item) => {
    setSelectedItemId(item.id);
    setBatchId(`LOT-${item.id.slice(-2).toUpperCase()}-${Date.now().toString().slice(-4)}`);
    setPurchasePrice(item.costPerPurchaseUnit * (item.purchaseMultiplier || 500));
    setRestockStep(2); // Jump straight to step 2 since paper is preselected
    setIsRestockOpen(true);
  };

  const selectedItemData = inventory.find(i => i.id === selectedItemId);

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      
      {/* Header card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-primary-navy tracking-tight">
            {t('inventory.title')}
          </h2>
          <p className="text-base text-slate-500 font-semibold leading-relaxed">
            {t('inventory.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => {
              setOffcutStep(1);
              const papers = inventory.filter(i => i.category === 'Paper');
              if (papers.length > 0) setOffcutPaperId(papers[0].id);
              setIsOffcutOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 text-white rounded-2xl text-base font-extrabold shadow-md shadow-emerald-500/10 hover:bg-emerald-700 transition min-h-[48px]"
          >
            <Plus className="w-5 h-5 shrink-0" />
            <span>{t('inventory.btn_add_offcut')}</span>
          </button>
          <button
            onClick={() => {
              setRestockStep(1);
              setIsRestockOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-accent-sky text-white rounded-2xl text-base font-extrabold shadow-md shadow-accent-sky/15 hover:bg-accent-sky/95 transition min-h-[48px]"
          >
            <Plus className="w-5 h-5 shrink-0" />
            <span>{t('inventory.btn_add_lot')}</span>
          </button>
          <button
            onClick={() => {
              setVendorStep(1);
              const papers = inventory.filter(i => i.category === 'Paper');
              if (papers.length > 0) setVendorItemId(papers[0].id);
              setIsVendorOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-50 border-2 border-indigo-200 text-indigo-700 rounded-2xl text-base font-extrabold hover:bg-indigo-100/50 transition min-h-[48px]"
          >
            <Truck className="w-5 h-5 shrink-0" />
            <span>{t('inventory.btn_vendor_price')}</span>
          </button>
        </div>
      </div>

      {/* Categories and Info Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100">
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl border">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`
                px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all min-h-[42px]
                ${categoryFilter === cat 
                  ? 'bg-white text-primary-navy shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
                }
              `}
            >
              {cat === 'All' && (currentLang === 'lo' ? 'ທັງໝົດ' : 'All')}
              {cat !== 'All' && t(`inventory.material_cat`) + ': ' + cat}
            </button>
          ))}
        </div>
        
        <div className="text-sm text-slate-500 bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-start gap-2.5 max-w-lg font-medium leading-relaxed">
          <Info className="w-5 h-5 text-accent-sky shrink-0 mt-0.5" />
          <span>
            <strong>Offcut Remnants:</strong> {currentLang === 'lo' ? 'ທ່ານສາມາດດຶງເສດເຈ້ຍທີ່ເຫຼືອໃຊ້ໄປພິມງານຂະໜາດນ້ອຍ ເພື່ອຫຼຸດຜ່ອນຕົ້ນທຶນການຜະລິດ' : 'You can consume leftover offcut paper sizes on smaller print jobs to lower setup costs.'}
          </span>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 text-xs uppercase tracking-wider font-extrabold">
                <th className="p-4 pl-6">{t('inventory.material_name')}</th>
                <th className="p-4">{t('inventory.material_cat')}</th>
                <th className="p-4 text-right">{t('inventory.material_qty')}</th>
                <th className="p-4 text-center">{t('inventory.material_status')}</th>
                <th className="p-4 text-right">{t('inventory.material_cost')}</th>
                <th className="p-4 text-right">{t('inventory.material_batches')}</th>
                <th className="p-4 text-center pr-6">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base font-medium">
              {filteredInventory.map(item => {
                const isLow = item.stockQty <= item.reorderThreshold;
                const activeBatchCount = item.batches ? item.batches.filter(b => b.currentQty > 0).length : 0;
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition">
                    <td className="p-4 pl-6 font-extrabold text-slate-800">
                      {item.name}
                    </td>
                    <td className="p-4 text-sm font-bold">
                      <span className={`
                        px-3 py-1 rounded-xl
                        ${item.category === 'Paper' ? 'bg-blue-50 text-blue-700 border border-blue-100' : ''}
                        ${item.category === 'Ink' ? 'bg-purple-50 text-purple-700 border border-purple-100' : ''}
                        ${item.category === 'Finishing' ? 'bg-orange-50 text-orange-700 border border-orange-100' : ''}
                      `}>
                        {item.category === 'Paper' && 'Paper'}
                        {item.category === 'Ink' && 'Ink'}
                        {item.category === 'Finishing' && 'Finishing'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-slate-900 font-sans">
                      {item.stockQty.toLocaleString()} {item.consumptionUnit}s
                    </td>
                    <td className="p-4 text-center">
                      <span className={`
                        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border
                        ${isLow 
                          ? 'bg-red-50 text-red-700 border-red-100' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }
                      `}>
                        <span className={`w-2 h-2 rounded-full ${isLow ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`}></span>
                        {isLow ? 'Low Stock' : 'Stock OK'}
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-900 font-black text-sm font-sans">
                      {formatLAK(item.costPerConsumptionUnit)}<span className="text-xs text-slate-400 font-bold">/{item.consumptionUnit}</span>
                    </td>
                    <td className="p-4 text-right text-slate-600 text-xs font-bold font-sans">
                      {item.batches ? `${activeBatchCount} active lots` : 'N/A'}
                    </td>
                    <td className="p-4 text-center pr-6">
                      {item.category === 'Paper' && (
                        <button
                          onClick={() => handleOpenRestock(item)}
                          className="px-4 py-2 border-2 border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-extrabold transition active:scale-95 min-h-[38px]"
                        >
                          {t('inventory.btn_restock')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* sub-sections tabs */}
      <div className="space-y-4">
        
        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 overflow-x-auto max-w-full">
          <button
            onClick={() => setSubSection('batches')}
            className={`pb-3 px-6 font-extrabold text-sm border-b-2 whitespace-nowrap transition-all ${subSection === 'batches' ? 'border-accent-sky text-accent-sky' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {t('inventory.tab_batches')}
          </button>
          <button
            onClick={() => setSubSection('offcuts')}
            className={`pb-3 px-6 font-extrabold text-sm border-b-2 whitespace-nowrap transition-all ${subSection === 'offcuts' ? 'border-accent-sky text-accent-sky' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {t('inventory.tab_offcuts')}
          </button>
          <button
            onClick={() => setSubSection('vendors')}
            className={`pb-3 px-6 font-extrabold text-sm border-b-2 whitespace-nowrap transition-all ${subSection === 'vendors' ? 'border-accent-sky text-accent-sky' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {t('inventory.tab_vendors')}
          </button>
          <button
            onClick={() => setSubSection('spoilage')}
            className={`pb-3 px-6 font-extrabold text-sm border-b-2 whitespace-nowrap transition-all ${subSection === 'spoilage' ? 'border-accent-sky text-accent-sky' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {t('inventory.tab_spoilage')}
          </button>
        </div>

        {/* Tab panels */}
        {subSection === 'batches' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-fade-in space-y-4">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <Layers className="w-6 h-6 text-accent-sky" />
              <span>{t('inventory.tab_batches')}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-100 font-extrabold bg-slate-50 p-2">
                    <th className="p-3 pl-4">Paper Lot Description</th>
                    <th className="p-3">Batch ID</th>
                    <th className="p-3">Purchase Date</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3 text-right">Purchase Price</th>
                    <th className="p-3 text-right">FIFO Cost/Sheet</th>
                    <th className="p-3 text-right pr-4">Remaining Lot Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {inventory
                    .filter(item => item.category === 'Paper' && item.batches)
                    .flatMap(item => 
                      item.batches.map(batch => (
                        <tr key={batch.id} className={`hover:bg-slate-50 transition ${batch.currentQty === 0 ? 'opacity-35' : ''}`}>
                          <td className="p-3 pl-4 font-bold">{item.name}</td>
                          <td className="p-3 font-mono font-bold text-slate-900">{batch.id}</td>
                          <td className="p-3 font-sans font-medium text-slate-400">{batch.purchaseDate}</td>
                          <td className="p-3">{batch.supplierName}</td>
                          <td className="p-3 text-right font-sans">{formatLAK(batch.purchasePricePerReam)}</td>
                          <td className="p-3 text-right font-black font-sans text-accent-sky">{formatLAK(batch.costPerSheet)}</td>
                          <td className="p-3 text-right pr-4 font-black font-sans">
                            {batch.currentQty.toLocaleString()} / {batch.initialQty.toLocaleString()} sheets
                          </td>
                        </tr>
                      ))
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Offcuts catalog panel */}
        {subSection === 'offcuts' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-fade-in space-y-4">
            <div className="flex justify-between items-center border-b pb-3 mb-2">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-emerald-600" />
                <span>{t('inventory.tab_offcuts')}</span>
              </h3>
            </div>

            {offcuts.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-8">No leftover offcuts cataloged.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-100 font-extrabold bg-slate-50 p-2">
                      <th className="p-3 pl-4">{t('inventory.offcut_table_name')}</th>
                      <th className="p-3">{t('inventory.offcut_table_origin')}</th>
                      <th className="p-3 text-center">{t('inventory.offcut_table_qty')}</th>
                      <th className="p-3">{t('inventory.offcut_table_notes')}</th>
                      <th className="p-3 text-center pr-4">{t('common.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                    {offcuts.map((off, idx) => {
                      const paper = inventory.find(i => i.id === off.paperId);
                      return (
                        <tr key={off.id || idx} className="hover:bg-slate-50 transition">
                          <td className="p-3 pl-4 font-bold text-slate-800">{off.name}</td>
                          <td className="p-3 font-semibold text-slate-400">{paper ? paper.name : 'Unknown Paper'}</td>
                          <td className="p-3 text-center font-black text-emerald-600 font-sans">{off.qty.toLocaleString()} sheets</td>
                          <td className="p-3 text-slate-500 italic max-w-xs truncate">{off.notes || 'None'}</td>
                          <td className="p-3 text-center pr-4">
                            <button
                              onClick={() => {
                                const qtyToUse = prompt(currentLang === 'lo' ? 'ປ້ອນຈຳນວນແຜ່ນເສດເຈ້ຍທີ່ຕ້ອງການດຶງໄປໃຊ້:' : 'Enter offcut quantity sheets to consume:', '10');
                                if (qtyToUse && Number(qtyToUse) > 0) {
                                  if (Number(qtyToUse) > off.qty) {
                                    showToast(currentLang === 'lo' ? 'ຈຳນວນເສດເຈ້ຍໃນຄັງບໍ່ພໍ!' : 'Not enough offcut remnants!', 'warning');
                                    return;
                                  }
                                  askConfirmation(
                                    currentLang === 'lo' 
                                      ? `ດຶງເສດເຈ້ຍ ${qtyToUse} ແຜ່ນ ໄປໃຊ້ໃນງານພິມ ຫຼື ບໍ່?`
                                      : `Consume ${qtyToUse} sheets of this offcut remnant?`,
                                    () => {
                                      consumeOffcut(off.id, Number(qtyToUse));
                                      showToast(currentLang === 'lo' ? 'ດຶງເສດເຈ້ຍໄປໃຊ້ງານພິມສຳເລັດ!' : 'Offcut remnant consumed successfully!', 'success');
                                    }
                                  );
                                }
                              }}
                              className="px-3.5 py-2 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl font-bold transition active:scale-95 min-h-[38px]"
                            >
                              {t('inventory.btn_consume_offcut')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Vendors Matrix */}
        {subSection === 'vendors' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-fade-in space-y-4">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <Truck className="w-6 h-6 text-indigo-600" />
              <span>{t('inventory.tab_vendors')}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-100 font-extrabold bg-slate-50 p-2">
                    <th className="p-3 pl-4">Material Description</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3 text-right">{t('inventory.vendor_table_ream')}</th>
                    <th className="p-3 text-right">{t('inventory.vendor_table_sheet')}</th>
                    <th className="p-3 text-center pr-4">{t('inventory.vendor_table_update')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {vendorPrices.map((vendor, idx) => {
                    const paper = inventory.find(i => i.id === vendor.itemId);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 pl-4 font-bold">{paper ? paper.name : 'Unknown Paper'}</td>
                        <td className="p-3 font-bold text-slate-800">{vendor.vendorName}</td>
                        <td className="p-3 text-right font-black text-slate-950 font-sans">{formatLAK(vendor.pricePerReam)}</td>
                        <td className="p-3 text-right text-slate-500 font-sans">{formatLAK(Math.round(vendor.pricePerReam / 500))}</td>
                        <td className="p-3 text-center pr-4 font-sans font-medium text-slate-400">{vendor.lastUpdated}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Spoilage Log Panel */}
        {subSection === 'spoilage' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-fade-in space-y-4">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <span>{t('inventory.tab_spoilage')}</span>
            </h3>

            {spoilageLogs.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-6">No wasted material logs found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-100 font-extrabold bg-slate-50 p-2">
                      <th className="p-3 pl-4">Logged Date</th>
                      <th className="p-3">Material Name</th>
                      <th className="p-3 text-center">{t('inventory.spoilage_table_qty')}</th>
                      <th className="p-3 text-right">Unit Cost</th>
                      <th className="p-3 text-right">{t('inventory.spoilage_table_total')}</th>
                      <th className="p-3 pr-4 pl-6">Reported Cause</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                    {spoilageLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 pl-4 font-sans font-medium text-slate-400">{log.date}</td>
                        <td className="p-3 font-bold text-slate-800">{log.materialName}</td>
                        <td className="p-3 text-center font-black text-red-600 font-sans">{log.quantity}</td>
                        <td className="p-3 text-right font-sans font-medium text-slate-400">{formatLAK(log.unitCost)}</td>
                        <td className="p-3 text-right font-black font-sans text-red-600">{formatLAK(log.totalCost)}</td>
                        <td className="p-3 pr-4 pl-6 text-slate-500 italic max-w-xs truncate" title={log.cause}>
                          {log.cause}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ACCESSIBLE STEP-BY-STEP RESTOCK WIZARD MODAL */}
      {isRestockOpen && (
        <dialog
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent outline-none border-none w-full h-full"
          open
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsRestockOpen(false)} />
          
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 z-10 border border-slate-100 animate-fade-in flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b pb-4 mb-5">
                <div>
                  <span className="text-xs uppercase font-extrabold text-accent-sky tracking-wider font-sans">
                    {t('orders.step')} {restockStep} {t('orders.of')} 3
                  </span>
                  <h3 className="text-xl font-black text-primary-navy mt-1">
                    {t('inventory.modal_restock_title')}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsRestockOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex gap-2 mb-6">
                {[1, 2, 3].map(st => (
                  <div 
                    key={st} 
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${st <= restockStep ? 'bg-accent-sky' : 'bg-slate-100'}`}
                  />
                ))}
              </div>

              <form onSubmit={handleRestockSubmit} className="space-y-4">
                
                {/* STEP 1: SELECT PAPER (Visual cards) */}
                {restockStep === 1 && (
                  <div className="space-y-3.5 animate-fade-in">
                    <label className="text-sm font-extrabold text-slate-800 block">{t('inventory.choose_paper_stock')}</label>
                    <div className="grid grid-cols-1 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {inventory.filter(i => i.category === 'Paper').map(item => {
                        const selected = selectedItemId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSelectedItemId(item.id);
                              setPurchasePrice(item.costPerPurchaseUnit);
                              setBatchId(`LOT-${item.id.slice(-2).toUpperCase()}-${Date.now().toString().slice(-4)}`);
                            }}
                            className={`p-3.5 border-2 rounded-2xl text-left transition flex items-center justify-between ${
                              selected 
                                ? 'border-accent-sky bg-blue-50/30 text-primary-navy font-bold shadow-sm' 
                                : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                            }`}
                          >
                            <span>{item.name}</span>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selected ? 'bg-accent-sky border-accent-sky' : 'border-slate-300'}`}>
                              {selected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 2: SUPPLIER DETAILS */}
                {restockStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('inventory.lot_batch_id')} *</label>
                      <input
                        type="text"
                        required
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        className="w-full min-h-[48px] px-4 py-2 border-2 rounded-xl focus:outline-none text-sm font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('inventory.supplier_name')}</label>
                      <div className="grid grid-cols-1 gap-2">
                        {['Lao Paper Supplier', 'Vientiane Import', 'Sengsavanh Stationery'].map(vendor => {
                          const active = supplierName === vendor;
                          return (
                            <button
                              key={vendor}
                              type="button"
                              onClick={() => setSupplierName(vendor)}
                              className={`p-3 border-2 rounded-xl text-left text-xs font-bold transition flex items-center justify-between ${
                                active 
                                  ? 'border-accent-sky bg-blue-50/50 text-primary-navy shadow-sm' 
                                  : 'border-slate-200 hover:border-slate-300 text-slate-500 bg-white'
                              }`}
                            >
                              <span>{vendor}</span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${active ? 'bg-accent-sky border-accent-sky' : 'border-slate-300'}`}>
                                {active && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: QUANTITIES & PRICING */}
                {restockStep === 3 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">{t('inventory.purchase_volume')} *</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={purchaseQty}
                          onChange={(e) => setPurchaseQty(Number(e.target.value))}
                          className="w-full min-h-[48px] px-3 py-2 border-2 rounded-xl focus:outline-none text-sm font-sans font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">{t('inventory.ream_price')} *</label>
                        <input
                          type="number"
                          min="1000"
                          required
                          value={purchasePrice}
                          onChange={(e) => setPurchasePrice(Number(e.target.value))}
                          className="w-full min-h-[48px] px-3 py-2 border-2 rounded-xl focus:outline-none text-sm font-sans font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    {selectedItemData && (
                      <div className="bg-slate-50 p-4 rounded-2xl border space-y-1.5 text-xs font-semibold leading-relaxed">
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t('inventory.sheets_to_add')}</span>
                          <span className="font-bold text-slate-900">+{purchaseQty * selectedItemData.purchaseMultiplier} sheets</span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-600">
                          <span>{t('inventory.fifo_cost_ratio')}</span>
                          <span>{formatLAK(Math.round(purchasePrice / selectedItemData.purchaseMultiplier))}/sheet</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Wizard Navigation Footer */}
            <div className="flex justify-between items-center border-t pt-4 mt-6 gap-3">
              <div>
                {restockStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setRestockStep(restockStep - 1)}
                    className="flex items-center gap-1 px-4 py-2 border-2 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition min-h-[40px]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{t('common.back')}</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRestockOpen(false)}
                  className="px-4 py-2 border hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold transition"
                >
                  {t('common.cancel')}
                </button>
                
                {restockStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (restockStep === 1 && !selectedItemId) {
                        showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກເຈ້ຍກ່ອນ!' : 'Please select a paper first!', 'warning');
                        return;
                      }
                      setRestockStep(restockStep + 1);
                    }}
                    className="flex items-center gap-1 px-5 py-2 bg-accent-sky text-white rounded-xl text-xs font-bold hover:bg-accent-sky/95 transition min-h-[40px]"
                  >
                    <span>{t('common.next')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRestockSubmit}
                    className="px-5 py-2 bg-accent-sky hover:bg-accent-sky/95 text-white rounded-xl text-xs font-bold transition min-h-[40px]"
                  >
                    {t('common.confirm')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </dialog>
      )}

      {/* ACCESSIBLE STEP-BY-STEP UPDATE SUPPLIER PRICE WIZARD */}
      {isVendorOpen && (
        <dialog
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent outline-none border-none w-full h-full"
          open
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsVendorOpen(false)} />
          
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 z-10 border border-slate-100 animate-fade-in flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b pb-4 mb-5">
                <div>
                  <span className="text-xs uppercase font-extrabold text-indigo-500 tracking-wider font-sans">
                    {t('orders.step')} {vendorStep} {t('orders.of')} 2
                  </span>
                  <h3 className="text-xl font-black text-primary-navy mt-1">
                    {t('inventory.modal_vendor_title')}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsVendorOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* step bar */}
              <div className="flex gap-2 mb-6">
                {[1, 2].map(st => (
                  <div 
                    key={st} 
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${st <= vendorStep ? 'bg-indigo-500' : 'bg-slate-100'}`}
                  />
                ))}
              </div>

              <form onSubmit={handleVendorSubmit} className="space-y-4">
                {/* STEP 1: CHOOSE MATERIAL (visual cards) */}
                {vendorStep === 1 && (
                  <div className="space-y-3.5 animate-fade-in">
                    <label className="text-sm font-extrabold text-slate-800 block">{t('orders.choose_wasted_material')}:</label>
                    <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
                      {inventory.filter(i => i.category === 'Paper').map(item => {
                        const selected = vendorItemId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setVendorItemId(item.id);
                              setVendorPrice(item.costPerPurchaseUnit);
                            }}
                            className={`p-3.5 border-2 rounded-2xl text-left transition flex items-center justify-between ${
                              selected 
                                ? 'border-indigo-500 bg-indigo-50/20 text-indigo-950 font-bold shadow-sm' 
                                : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                            }`}
                          >
                            <span>{item.name}</span>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                              {selected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 2: SUPPLIER DETAILS & PRICE INPUT */}
                {vendorStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('inventory.supplier_name')}</label>
                      <select
                        value={vendorName}
                        required
                        onChange={(e) => setVendorName(e.target.value)}
                        className="w-full px-3 py-2.5 border rounded-xl focus:outline-none text-sm bg-white font-bold"
                      >
                        <option value="Lao Paper Supplier">Lao Paper Supplier</option>
                        <option value="Vientiane Import">Vientiane Import</option>
                        <option value="Sengsavanh Stationery">Sengsavanh Stationery</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('inventory.ream_price')} *</label>
                      <input 
                        type="number" 
                        required
                        min="1000"
                        value={vendorPrice}
                        onChange={(e) => setVendorPrice(Number(e.target.value))}
                        className="w-full min-h-[48px] px-4 py-2 border-2 rounded-xl focus:outline-none text-sm font-sans font-bold text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Wizard Navigation Footer */}
            <div className="flex justify-between items-center border-t pt-4 mt-6 gap-3">
              <div>
                {vendorStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setVendorStep(vendorStep - 1)}
                    className="flex items-center gap-1 px-4 py-2 border-2 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition min-h-[40px]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{t('common.back')}</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsVendorOpen(false)}
                  className="px-4 py-2 border hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold transition"
                >
                  {t('common.cancel')}
                </button>
                
                {vendorStep < 2 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!vendorItemId) {
                        showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກວັດສະດຸກ່ອນ!' : 'Please select a material first!', 'warning');
                        return;
                      }
                      setVendorStep(2);
                    }}
                    className="flex items-center gap-1 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition min-h-[40px]"
                  >
                    <span>{t('common.next')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleVendorSubmit}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition min-h-[40px]"
                  >
                    {t('common.confirm')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </dialog>
      )}

      {/* ACCESSIBLE STEP-BY-STEP ADD OFFCUT WIZARD */}
      {isOffcutOpen && (
        <dialog
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent outline-none border-none w-full h-full"
          open
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOffcutOpen(false)} />
          
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 z-10 border border-slate-100 animate-fade-in flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b pb-4 mb-5">
                <div>
                  <span className="text-xs uppercase font-extrabold text-emerald-600 tracking-wider font-sans">
                    {t('orders.step')} {offcutStep} {t('orders.of')} 2
                  </span>
                  <h3 className="text-xl font-black text-emerald-600 mt-1">
                    {t('inventory.modal_offcut_title')}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsOffcutOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* step bar */}
              <div className="flex gap-2 mb-6">
                {[1, 2].map(st => (
                  <div 
                    key={st} 
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${st <= offcutStep ? 'bg-emerald-500' : 'bg-slate-100'}`}
                  />
                ))}
              </div>

              <form onSubmit={handleOffcutSubmit} className="space-y-4">
                {/* STEP 1: CHOOSE BASE PAPER (visual cards) */}
                {offcutStep === 1 && (
                  <div className="space-y-3.5 animate-fade-in">
                    <label className="text-sm font-extrabold text-slate-800 block">{t('inventory.choose_origin_paper')}</label>
                    <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
                      {inventory.filter(i => i.category === 'Paper').map(item => {
                        const selected = offcutPaperId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setOffcutPaperId(item.id)}
                            className={`p-3.5 border-2 rounded-2xl text-left transition flex items-center justify-between ${
                              selected 
                                ? 'border-emerald-500 bg-emerald-50/20 text-emerald-950 font-bold shadow-sm' 
                                : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                            }`}
                          >
                            <span>{item.name}</span>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                              {selected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 2: OFFCUT SPECS */}
                {offcutStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('inventory.remnant_desc')}</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Art Paper (200x290mm)"
                        value={offcutName}
                        onChange={(e) => setOffcutName(e.target.value)}
                        className="w-full min-h-[48px] px-4 py-2 border-2 rounded-xl focus:outline-none text-sm font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('inventory.quantity_sheets')}</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={offcutQty}
                        onChange={(e) => setOffcutQty(Number(e.target.value))}
                        className="w-full min-h-[48px] px-4 py-2 border-2 rounded-xl focus:outline-none text-sm font-sans font-bold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('inventory.origin_notes')}</label>
                      <textarea 
                        placeholder="Cut remnant leftovers from Lansang Hotel poster jobs..."
                        value={offcutNotes}
                        onChange={(e) => setOffcutNotes(e.target.value)}
                        rows="2"
                        className="w-full p-3 border-2 rounded-xl focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Wizard Navigation Footer */}
            <div className="flex justify-between items-center border-t pt-4 mt-6 gap-3">
              <div>
                {offcutStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setOffcutStep(offcutStep - 1)}
                    className="flex items-center gap-1 px-4 py-2 border-2 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition min-h-[40px]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{t('common.back')}</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOffcutOpen(false)}
                  className="px-4 py-2 border hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold transition"
                >
                  {t('common.cancel')}
                </button>
                
                {offcutStep < 2 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!offcutPaperId) {
                        showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກເຈ້ຍກ່ອນ!' : 'Please select origin paper first!', 'warning');
                        return;
                      }
                      setOffcutStep(2);
                    }}
                    className="flex items-center gap-1 px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition min-h-[40px]"
                  >
                    <span>{t('common.next')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOffcutSubmit}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition min-h-[40px]"
                  >
                    {t('common.confirm')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
