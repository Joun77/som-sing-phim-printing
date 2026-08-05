import React, { useState } from 'react';
import { Truck, Plus, CheckCircle, Boxes, Cpu, ArrowUpRight, ShieldCheck, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';

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

  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

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
  const [purchaseUnitName, setPurchaseUnitName] = useState('Ream (500 sheets)');
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

        // Add Batch
        addInventoryBatch(item.id, {
          batchId: `LOT-${item.id.slice(-3).toUpperCase()}-${finalPoId.slice(-4)}`,
          purchaseDate: new Date().toISOString().split('T')[0],
          supplierName: finalSupplier,
          purchasePrice: Number(totalCost),
          purchaseQty: Number(qty)
        });

        // Log PO
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
        // Register New SKU
        if (newMaterialCat === 'Ink' && newMaterialName.toLowerCase().includes('set')) {
          // If CMYK set, automatically split channels
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

          // Log PO
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
          // Standard Single SKU Registration
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

          // Log PO
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
      // Machinery & Equipment
      addEquipment({
        name: eqName,
        category: eqCategory,
        purchaseCost: Number(totalCost),
        lifespanYears: Number(lifespanYears),
        printedPagesCapacity: Number(lifetimeCapacity),
        linkedMaterialSku
      });

      // Log PO
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

    // Reset Form
    setPoId('');
    setSupplierName('');
    setTotalPrice('');
    setQty(1);
    setNewMaterialName('');
    setEqName('');
  };

  const filteredPO = purchaseOrders.filter(po => {
    return po.poId.toLowerCase().includes(searchQuery.toLowerCase()) || 
           po.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           po.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* 📦 TOP SUMMARY BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Spent (Month)</span>
            <p className="font-sans font-black text-2xl text-slate-800">{formatLAK(totalSpentThisMonth)}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-accent-sky/10 text-accent-sky flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Material Stock Spent</span>
            <p className="font-sans font-black text-2xl text-emerald-600">{formatLAK(spentMaterials)}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Machinery Investments</span>
            <p className="font-sans font-black text-2xl text-indigo-600">{formatLAK(spentMachinery)}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Grid: Form wizard & PO logs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Form Wizard Column */}
        <div className="xl:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-2">
              <Truck className="w-6 h-6 text-accent-sky" />
              <span>Inbound Stock-In Portal</span>
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">Acquire stock materials or machinery overhead</p>
          </div>

          <form onSubmit={handleInboundSubmit} className="space-y-4 text-xs font-bold">
            
            {/* Target Selector */}
            <div className="space-y-1.5">
              <label className="text-slate-500 uppercase tracking-wider">Inbound Destination Target</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('Material')}
                  className={`py-2 px-3 border rounded-xl flex items-center justify-center gap-1.5 transition ${
                    targetType === 'Material' 
                      ? 'bg-accent-sky border-accent-sky text-white' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Boxes className="w-4 h-4" />
                  <span>Material Stock</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('Equipment')}
                  className={`py-2 px-3 border rounded-xl flex items-center justify-center gap-1.5 transition ${
                    targetType === 'Equipment' 
                      ? 'bg-accent-sky border-accent-sky text-white' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                  <span>Machinery Asset</span>
                </button>
              </div>
            </div>

            {/* Sub-modes for Materials */}
            {targetType === 'Material' && (
              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase tracking-wider">Procurement Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMaterialMode('replenish')}
                    className={`py-2.5 px-3 border rounded-xl transition ${
                      materialMode === 'replenish' 
                        ? 'bg-slate-800 text-white' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Replenish Existing SKU
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaterialMode('register_new')}
                    className={`py-2.5 px-3 border rounded-xl transition ${
                      materialMode === 'register_new' 
                        ? 'bg-slate-800 text-white' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Register New SKU
                  </button>
                </div>
              </div>
            )}

            {/* Replenish fields */}
            {targetType === 'Material' && materialMode === 'replenish' && (
              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase tracking-wider">Select Existing SKU</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full min-h-[40px] px-3 border rounded-xl bg-white font-semibold text-xs"
                >
                  <option value="">-- Choose Material --</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Register New Material fields */}
            {targetType === 'Material' && materialMode === 'register_new' && (
              <div className="space-y-3.5 bg-slate-50 p-4 border rounded-2xl">
                <span className="text-[10px] font-black uppercase text-slate-400 block border-b pb-1.5">New Material Specifications</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase block">Category</label>
                    <select
                      value={newMaterialCat}
                      onChange={(e) => setNewMaterialCat(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-white font-semibold"
                    >
                      <option value="Paper">Paper</option>
                      <option value="Ink">Ink Set / Channel</option>
                      <option value="Film">Film</option>
                      <option value="Finishing">Finishing Consumable</option>
                    </select>
                  </div>

                  {newMaterialCat === 'Ink' && (
                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase block">Bottle Volume (ml)</label>
                      <input
                        type="number"
                        value={bottleVolumeMl}
                        onChange={(e) => setBottleVolumeMl(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-xl font-sans"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 uppercase block">SKU / Item Name</label>
                  <input
                    type="text"
                    required
                    value={newMaterialName}
                    onChange={(e) => setNewMaterialName(e.target.value)}
                    placeholder="e.g. Sticker Matte A4 or CMYK Set"
                    className="w-full px-3 py-2 border rounded-xl font-semibold"
                  />
                </div>

                {newMaterialCat !== 'Ink' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase block">Purchase Unit name</label>
                      <input
                        type="text"
                        value={purchaseUnitName}
                        onChange={(e) => setPurchaseUnitName(e.target.value)}
                        placeholder="Ream, Pack, Roll"
                        className="w-full px-3 py-2 border rounded-xl font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase block">Multiplier</label>
                      <input
                        type="number"
                        value={multiplier}
                        onChange={(e) => setMultiplier(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-xl font-sans"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Machinery Assets fields */}
            {targetType === 'Equipment' && (
              <div className="space-y-3.5 bg-slate-50 p-4 border rounded-2xl">
                <span className="text-[10px] font-black uppercase text-slate-400 block border-b pb-1.5">Machine Asset Parameters</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase block">Model / Name</label>
                    <input
                      type="text"
                      required
                      value={eqName}
                      onChange={(e) => setEqName(e.target.value)}
                      placeholder="e.g. Konica C6085"
                      className="w-full px-3 py-2 border rounded-xl font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase block">Category</label>
                    <select
                      value={eqCategory}
                      onChange={(e) => setEqCategory(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-white font-semibold"
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
                      className="w-full px-3 py-2 border rounded-xl font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase block">Lifetime Pages/Cuts Capacity</label>
                    <input
                      type="number"
                      value={lifetimeCapacity}
                      onChange={(e) => setLifetimeCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-xl font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 uppercase block">Linked Consumable SKU</label>
                  <select
                    value={linkedMaterialSku}
                    onChange={(e) => setLinkedMaterialSku(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-white font-semibold font-sans"
                  >
                    <option value="">-- No Linked SKU --</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Financial Ledger details */}
            <div className="space-y-3.5 bg-slate-50/50 p-4 border rounded-2xl">
              <span className="text-[10px] font-black uppercase text-slate-400 block border-b pb-1.5">Purchase Order Ledger</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase block">PO Number / Code</label>
                  <input
                    type="text"
                    value={poId}
                    onChange={(e) => setPoId(e.target.value)}
                    placeholder="Auto-generated"
                    className="w-full px-3 py-2 border rounded-xl font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase block">Inbound Supplier</label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. Lao Outlet"
                    className="w-full px-3 py-2 border rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase block">Inbound Volume Qty</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase block">Total Cost (LAK)</label>
                  <input
                    type="number"
                    required
                    value={totalCost}
                    onChange={(e) => setTotalPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <button
              type="submit"
              className="w-full py-3 bg-accent-sky text-white rounded-2xl hover:bg-sky-600 transition font-black text-sm tracking-wide shadow-sm"
            >
              Log Inbound Transaction
            </button>

          </form>
        </div>

        {/* PO History Logs Column */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div>
              <h3 className="font-extrabold text-base text-slate-800">Purchase Order Logs</h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Filter and query historical inbound records</p>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PO#, items, or suppliers..."
              className="w-full sm:w-64 min-h-[36px] px-3 border rounded-xl focus:outline-none text-xs font-semibold"
            />
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-slate-800">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-4 px-6">PO Number</th>
                    <th className="py-4 px-6">Received Date</th>
                    <th className="py-4 px-6">Asset Class</th>
                    <th className="py-4 px-6">Item description</th>
                    <th className="py-4 px-6">Qty</th>
                    <th className="py-4 px-6">Supplier</th>
                    <th className="py-4 px-6 text-right">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {filteredPO.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400 font-bold">
                        No purchase orders registered.
                      </td>
                    </tr>
                  ) : (
                    filteredPO.map(po => (
                      <tr key={po.poId} className="hover:bg-slate-50/50 transition">
                        <td className="py-4.5 px-6 font-mono text-xs text-slate-500 font-extrabold">
                          #{po.poId}
                        </td>
                        <td className="py-4.5 px-6 font-sans">
                          {po.purchaseDate}
                        </td>
                        <td className="py-4.5 px-6">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                            po.itemType === 'Material'
                              ? 'bg-green-50 text-green-700 border-green-100'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          }`}>
                            {po.itemType}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 font-extrabold text-slate-800">
                          {po.itemName}
                        </td>
                        <td className="py-4.5 px-6 font-sans">
                          {po.qty} {po.unitName || 'Units'}
                        </td>
                        <td className="py-4.5 px-6 truncate max-w-[130px]" title={po.supplierName}>
                          {po.supplierName}
                        </td>
                        <td className="py-4.5 px-6 font-sans font-black text-slate-900 text-right">
                          {formatLAK(po.totalCost)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
