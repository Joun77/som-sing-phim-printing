import React, { useState } from 'react';
import { Truck, Plus, CheckCircle, Boxes, Cpu, ArrowUpRight, DollarSign, X, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import InboundEntryPage from './InboundEntryPage';
import InboundDetailsPage from './InboundDetailsPage';

export default function InboundManagement() {
  const { 
    inventory, 
    equipment, 
    purchaseOrders, 
    addPurchaseOrder, 
    addInventorySku, 
    addInventoryBatch, 
    addEquipment, 
    showToast 
  } = useApp();

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  // Full-page entry & details states
  const [isEntryPageOpen, setIsEntryPageOpen] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState(null);

  // Modal toggle state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Target toggle
  const [targetType, setTargetType] = useState('Material'); // Material or Equipment
  const [materialMode, setMaterialMode] = useState('replenish'); // replenish or register_new

  // Common Form States
  const [poId, setPoId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [totalCost, setTotalPrice] = useState('');
  const [qty, setQty] = useState(1);

  // Material Replenishment
  const [selectedItemId, setSelectedItemId] = useState('');

  // Material Register New SKU
  const [newMaterialCat, setNewMaterialCat] = useState('Paper');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [purchaseUnitName, setPurchaseUnitName] = useState('Ream');
  const [multiplier, setMultiplier] = useState(500);

  // Ink Set bundle states
  const [bottleVolumeMl, setBottleVolumeMl] = useState(100);

  // Equipment Form states
  const [eqName, setEqName] = useState('');
  const [eqCategory, setEqCategory] = useState('Printer');
  const [lifespanYears, setLifespanYears] = useState(5);
  const [lifetimeCapacity, setLifetimeCapacity] = useState(500000);
  const [linkedMaterialSku, setLinkedMaterialSku] = useState('');

  // Search/Filters for PO Log Table
  const [searchQuery, setSearchQuery] = useState('');

  // Helper formats
  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num).replace('LAK', '₭');
  };

  // Dashboard calculations
  const totalSpentThisMonth = purchaseOrders.reduce((sum, po) => sum + po.totalCost, 0);
  const spentMaterials = purchaseOrders
    .filter(po => po.itemType === 'Material')
    .reduce((sum, po) => sum + po.totalCost, 0);
  const spentMachinery = purchaseOrders
    .filter(po => po.itemType === 'Equipment')
    .reduce((sum, po) => sum + po.totalCost, 0);

  const handleInboundSubmit = (e) => {
    e.preventDefault();
    const finalPoId = poId || `PO-${Date.now().toString().slice(-6)}`;
    const finalSupplier = supplierName || 'Global Supplier';

    if (targetType === 'Material') {
      if (materialMode === 'replenish') {
        const item = inventory.find(i => i.id === selectedItemId);
        if (!item) {
          showToast('Select an existing material to replenish!', 'warning');
          return;
        }

        addInventoryBatch(item.id, {
          batchId: `LOT-${item.id.slice(-3).toUpperCase()}-${finalPoId.slice(-4)}`,
          purchaseDate: new Date().toISOString().split('T')[0],
          supplierName: finalSupplier,
          purchasePrice: Number(totalCost),
          purchaseQty: Number(qty)
        });

        addPurchaseOrder({
          poId: finalPoId,
          itemType: 'Material',
          itemName: item.name,
          supplierName: finalSupplier,
          totalCost: Number(totalCost),
          qty: Number(qty),
          unitName: item.purchaseUnit
        });

        showToast('Inventory replenished successfully!', 'success');
      } else {
        if (newMaterialCat === 'Ink' && newMaterialName.toLowerCase().includes('set')) {
          const colors = ['Cyan', 'Magenta', 'Yellow', 'Black'];
          const pricePerColor = Math.round(Number(totalCost) / colors.length);
          const costPerMl = Math.round(pricePerColor / Number(bottleVolumeMl));

          colors.forEach(color => {
            const idStr = `ink-${newMaterialName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${color.toLowerCase()}`;
            addInventorySku({
              id: idStr,
              name: `ນ້ຳໝຶກ ${newMaterialName} ${color}`,
              category: 'Ink',
              inkSet: newMaterialName,
              stockQty: Number(bottleVolumeMl),
              consumptionUnit: 'ml',
              purchaseUnit: `Bottle (${bottleVolumeMl}ml)`,
              purchaseMultiplier: Number(bottleVolumeMl),
              costPerPurchaseUnit: pricePerColor,
              costPerConsumptionUnit: costPerMl,
              reorderThreshold: 50,
              batches: [
                {
                  id: `LOT-${color.substring(0,3).toUpperCase()}-${finalPoId.slice(-4)}`,
                  purchaseDate: new Date().toISOString().split('T')[0],
                  supplierName: finalSupplier,
                  purchasePricePerReam: pricePerColor,
                  costPerSheet: costPerMl,
                  initialQty: Number(bottleVolumeMl),
                  currentQty: Number(bottleVolumeMl)
                }
              ]
            });
          });

          addPurchaseOrder({
            poId: finalPoId,
            itemType: 'Material',
            itemName: `${newMaterialName} CMYK Set`,
            supplierName: finalSupplier,
            totalCost: Number(totalCost),
            qty: 1,
            unitName: 'Set'
          });

          showToast('Ink Set registered and logged successfully!', 'success');
        } else {
          const id = `${newMaterialCat.toLowerCase()}-${newMaterialName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          const consumptionUnit = newMaterialCat === 'Paper' ? 'Sheet' : newMaterialCat === 'Ink' ? 'ml' : 'Piece';
          const costPerConsumption = Math.round(Number(totalCost) / (Number(qty) * Number(multiplier)));

          addInventorySku({
            id,
            name: newMaterialName,
            category: newMaterialCat,
            stockQty: Number(qty) * Number(multiplier),
            consumptionUnit,
            purchaseUnit: purchaseUnitName,
            purchaseMultiplier: Number(multiplier),
            costPerPurchaseUnit: Math.round(Number(totalCost) / Number(qty)),
            costPerConsumptionUnit: costPerConsumption,
            reorderThreshold: newMaterialCat === 'Paper' ? 1000 : 50,
            batches: [
              {
                id: `LOT-${newMaterialCat.substring(0,3).toUpperCase()}-${finalPoId.slice(-4)}`,
                purchaseDate: new Date().toISOString().split('T')[0],
                supplierName: finalSupplier,
                purchasePricePerReam: Math.round(Number(totalCost) / Number(qty)),
                costPerSheet: costPerConsumption,
                initialQty: Number(qty) * Number(multiplier),
                currentQty: Number(qty) * Number(multiplier)
              }
            ]
          });

          addPurchaseOrder({
            poId: finalPoId,
            itemType: 'Material',
            itemName: newMaterialName,
            supplierName: finalSupplier,
            totalCost: Number(totalCost),
            qty: Number(qty),
            unitName: purchaseUnitName
          });

          showToast('New SKU registered and logged successfully!', 'success');
        }
      }
    } else {
      addEquipment({
        name: eqName,
        category: eqCategory,
        purchaseCost: Number(totalCost),
        lifespanYears: Number(lifespanYears),
        printedPagesCapacity: Number(lifetimeCapacity),
        linkedMaterialSku
      });

      addPurchaseOrder({
        poId: finalPoId,
        itemType: 'Equipment',
        itemName: eqName,
        supplierName: finalSupplier,
        totalCost: Number(totalCost),
        qty: 1,
        unitName: 'Unit'
      });

      showToast('Machinery asset registered and PO logged successfully!', 'success');
    }

    // Reset Form & Close Modal
    setPoId('');
    setSupplierName('');
    setTotalPrice('');
    setQty(1);
    setNewMaterialName('');
    setEqName('');
    setIsModalOpen(false);
  };

  const filteredPO = purchaseOrders.filter(po => {
    return po.poId.toLowerCase().includes(searchQuery.toLowerCase()) || 
           po.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           po.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isEntryPageOpen) {
    return <InboundEntryPage onBack={() => setIsEntryPageOpen(false)} />;
  }

  if (selectedPoId) {
    return (
      <InboundDetailsPage 
        poId={selectedPoId} 
        onBack={() => setSelectedPoId(null)} 
      />
    );
  }

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* 📦 TOP SUMMARY BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('inbound.total_spent_month')}</span>
            <p className="font-sans font-black text-2xl text-slate-800">{formatLAK(totalSpentThisMonth)}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-accent-sky/10 text-accent-sky flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('inbound.spent_materials')}</span>
            <p className="font-sans font-black text-2xl text-emerald-600">{formatLAK(spentMaterials)}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('inbound.spent_machinery')}</span>
            <p className="font-sans font-black text-2xl text-indigo-600">{formatLAK(spentMachinery)}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* PO logs taking full width */}
      <div className="space-y-6 w-full">
        
        {/* Controls row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <h3 className="font-extrabold text-base text-slate-800">{t('inbound.po_history_title')}</h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{t('inbound.po_history_subtitle')}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('inbound.po_placeholder')}
              className="w-full sm:w-64 min-h-[44px] px-3.5 border-2 rounded-xl focus:outline-none text-xs font-semibold"
            />
            <button
              onClick={() => setIsEntryPageOpen(true)}
              className="min-h-[44px] px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ นำเข้าสินค้า / อุปกรณ์ใหม่ (Inbound Procurement Entry)</span>
            </button>
          </div>
        </div>

        {/* PO Table */}
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-800">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-4 px-6">{t('inbound.po_number')}</th>
                  <th className="py-4 px-6">{t('inventory_status.received_initial')}</th>
                  <th className="py-4 px-6">{t('inbound.target_destination')}</th>
                  <th className="py-4 px-6">{t('inventory_status.item_sku')}</th>
                  <th className="py-4 px-6">{t('inbound.po_qty')}</th>
                  <th className="py-4 px-6">{t('inbound.po_supplier')}</th>
                  <th className="py-4 px-6">{t('inbound.po_cost')}</th>
                  <th className="py-4 px-6 text-right">{t('inventory_status.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                {filteredPO.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400 font-bold">
                      No purchase orders logged.
                    </td>
                  </tr>
                ) : (
                  filteredPO.map(po => {
                    const currentPoId = po.poId || po.id;
                    return (
                      <tr key={currentPoId} className="hover:bg-slate-50/50 transition">
                        <td className="py-4.5 px-6 font-mono text-xs text-slate-500 font-extrabold">
                          #{currentPoId}
                        </td>
                        <td className="py-4.5 px-6 font-sans">
                          {po.purchaseDate || po.date}
                        </td>
                        <td className="py-4.5 px-6">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                            (po.itemType || po.type) === 'Material'
                              ? 'bg-green-50 text-green-700 border-green-100'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          }`}>
                            {po.itemType || po.type || 'Material'}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 font-extrabold text-slate-800">
                          {po.itemName || po.name}
                        </td>
                        <td className="py-4.5 px-6 font-sans">
                          {po.qty} {po.unitName || 'Units'}
                        </td>
                        <td className="py-4.5 px-6 truncate max-w-[150px]" title={po.supplierName}>
                          {po.supplierName}
                        </td>
                        <td className="py-4.5 px-6 font-sans font-black text-slate-900">
                          {formatLAK(po.totalCost || po.totalPrice)}
                        </td>
                        <td className="py-4.5 px-6 text-right">
                          <button
                            onClick={() => setSelectedPoId(currentPoId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                            title={t('inbound.view_details')}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('inbound.view_details')}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 🚚 CENTRALIZED STOCK-IN FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-5 animate-scale-up relative">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                  <Truck className="w-6 h-6 text-accent-sky" />
                  <span>{t('inbound.title')}</span>
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">{t('inbound.subtitle')}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border rounded-xl transition text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInboundSubmit} className="space-y-4 text-xs font-bold text-slate-700">
              
              {/* Target Selector */}
              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase tracking-wider">{t('inbound.target_destination')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('Material')}
                    className={`py-2.5 px-3 border rounded-xl flex items-center justify-center gap-1.5 transition ${
                      targetType === 'Material' 
                        ? 'bg-accent-sky border-accent-sky text-white font-extrabold' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    <Boxes className="w-4 h-4" />
                    <span>{t('inbound.material_stock')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('Equipment')}
                    className={`py-2.5 px-3 border rounded-xl flex items-center justify-center gap-1.5 transition ${
                      targetType === 'Equipment' 
                        ? 'bg-accent-sky border-accent-sky text-white font-extrabold' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    <Cpu className="w-4 h-4" />
                    <span>{t('inbound.machinery_asset')}</span>
                  </button>
                </div>
              </div>

              {/* Sub-modes for Materials */}
              {targetType === 'Material' && (
                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider">{t('inbound.target_destination')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMaterialMode('replenish')}
                      className={`py-2.5 px-3 border rounded-xl transition ${
                        materialMode === 'replenish' 
                          ? 'bg-slate-800 text-white font-extrabold' 
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 font-semibold'
                      }`}
                    >
                      {t('inbound.replenish_existing')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaterialMode('register_new')}
                      className={`py-2.5 px-3 border rounded-xl transition ${
                        materialMode === 'register_new' 
                          ? 'bg-slate-800 text-white font-extrabold' 
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 font-semibold'
                      }`}
                    >
                      {t('inbound.register_new')}
                    </button>
                  </div>
                </div>
              )}

              {/* Replenish fields */}
              {targetType === 'Material' && materialMode === 'replenish' && (
                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider">{t('inbound.replenish_existing')}</label>
                  <select
                    required
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 border-2 rounded-xl bg-white font-semibold text-xs focus:outline-none"
                  >
                    <option value="">-- {t('inbound.replenish_existing')} --</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Register New Material fields */}
              {targetType === 'Material' && materialMode === 'register_new' && (
                <div className="space-y-3.5 bg-slate-50 p-4 border rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-slate-400 block border-b pb-1.5">{t('inbound.register_new')}</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase block">{t('inventory.material_cat')}</label>
                      <select
                        value={newMaterialCat}
                        onChange={(e) => setNewMaterialCat(e.target.value)}
                        className="w-full px-3.5 py-2 border rounded-xl bg-white font-semibold focus:outline-none"
                      >
                        <option value="Paper">Paper</option>
                        <option value="Ink">Ink Set / Channel</option>
                        <option value="Film">Film</option>
                        <option value="Finishing">Finishing Consumable</option>
                      </select>
                    </div>

                    {newMaterialCat === 'Ink' && (
                      <div className="space-y-1">
                        <label className="text-slate-500 uppercase block">Volume (ml)</label>
                        <input
                          type="number"
                          value={bottleVolumeMl}
                          onChange={(e) => setBottleVolumeMl(Number(e.target.value))}
                          className="w-full px-3.5 py-2 border rounded-xl font-sans focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase block">{t('inventory_status.item_sku')}</label>
                    <input
                      type="text"
                      required
                      value={newMaterialName}
                      onChange={(e) => setNewMaterialName(e.target.value)}
                      placeholder="e.g. Sticker Matte A4"
                      className="w-full px-3.5 py-2 border rounded-xl font-semibold focus:outline-none"
                    />
                  </div>

                  {newMaterialCat !== 'Ink' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-500 uppercase block">Unit Name</label>
                        <input
                          type="text"
                          value={purchaseUnitName}
                          onChange={(e) => setPurchaseUnitName(e.target.value)}
                          placeholder="Ream, Pack, Roll"
                          className="w-full px-3.5 py-2 border rounded-xl font-semibold focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 uppercase block">Multiplier</label>
                        <input
                          type="number"
                          value={multiplier}
                          onChange={(e) => setMultiplier(Number(e.target.value))}
                          className="w-full px-3.5 py-2 border rounded-xl font-sans focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Machinery Assets fields */}
              {targetType === 'Equipment' && (
                <div className="space-y-3.5 bg-slate-50 p-4 border rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-slate-400 block border-b pb-1.5">{t('inbound.machinery_asset')}</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase block">{t('inventory_status.item_sku')}</label>
                      <input
                        type="text"
                        required
                        value={eqName}
                        onChange={(e) => setEqName(e.target.value)}
                        placeholder="e.g. Konica C6085"
                        className="w-full px-3.5 py-2 border rounded-xl font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase block">{t('inventory.material_cat')}</label>
                      <select
                        value={eqCategory}
                        onChange={(e) => setEqCategory(e.target.value)}
                        className="w-full px-3.5 py-2 border rounded-xl bg-white font-semibold focus:outline-none"
                      >
                        <option value="Printer">Printer Machine</option>
                        <option value="Cutter">Cutter Machine</option>
                        <option value="Binder">Binder & Stitcher</option>
                        <option value="Laminator">Laminator Processor</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase block">Lifespan Years</label>
                      <input
                        type="number"
                        value={lifespanYears}
                        onChange={(e) => setLifespanYears(Number(e.target.value))}
                        className="w-full px-3.5 py-2 border rounded-xl font-sans focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase block">Lifetime Capacity</label>
                      <input
                        type="number"
                        value={lifetimeCapacity}
                        onChange={(e) => setLifetimeCapacity(Number(e.target.value))}
                        className="w-full px-3.5 py-2 border rounded-xl font-sans focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase block">{t('equipment_mapping.linked_material')}</label>
                    <select
                      value={linkedMaterialSku}
                      onChange={(e) => setLinkedMaterialSku(e.target.value)}
                      className="w-full px-3.5 py-2 border rounded-xl bg-white font-semibold font-sans focus:outline-none"
                    >
                      <option value="">-- {t('equipment_mapping.no_linked_material')} --</option>
                      {inventory.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Financial Ledger details */}
              <div className="space-y-3.5 bg-slate-50/50 p-4 border rounded-2xl">
                <span className="text-[10px] font-black uppercase text-slate-400 block border-b pb-1.5">{t('inbound.po_history_title')}</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase block">{t('inbound.po_number')}</label>
                    <input
                      type="text"
                      value={poId}
                      onChange={(e) => setPoId(e.target.value)}
                      placeholder="Auto-generated"
                      className="w-full px-3.5 py-2 border rounded-xl font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase block">{t('inbound.po_supplier')}</label>
                    <input
                      type="text"
                      required
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="e.g. Lao Outlet"
                      className="w-full px-3.5 py-2 border rounded-xl font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase block">{t('inbound.po_qty')}</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border rounded-xl font-sans focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase block">{t('inbound.po_cost')}</label>
                    <input
                      type="number"
                      required
                      value={totalCost}
                      onChange={(e) => setTotalPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border rounded-xl font-sans focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <button
                type="submit"
                className="w-full py-3 bg-accent-sky text-white rounded-2xl hover:bg-sky-600 transition font-black text-sm tracking-wide shadow-sm"
              >
                {t('inbound.btn_submit')}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
