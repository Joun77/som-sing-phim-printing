import React, { useState } from 'react';
import { Boxes, Plus, Scissors, RotateCw, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import InventoryTable from './InventoryTable';
import InventoryMaterialDetailsPage from './details/InventoryMaterialDetailsPage';
import AddMaterialModal from './modals/AddMaterialModal';
import OffcutModal from './modals/OffcutModal';
import StockDischargeModal from './modals/StockDischargeModal';

export default function InventoryManagement() {
  const { 
    inventory, 
    offcuts, 
    addInventoryBatch, 
    showToast 
  } = useApp();

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  // Navigation tabs & detail view state
  const [activeTab, setActiveTab] = useState('All'); // All, Paper, Ink, Film, Finishing
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailLot, setSelectedDetailLot] = useState(null);

  // Modals state
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isOffcutOpen, setIsOffcutOpen] = useState(false);
  const [isDischargeOpen, setIsDischargeOpen] = useState(false);
  const [selectedDischargeItem, setSelectedDischargeItem] = useState(null);

  // Restock lot state
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedRestockItem, setSelectedRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState(1);
  const [restockPrice, setRestockPrice] = useState(45000);
  const [restockSupplier, setRestockSupplier] = useState('');
  const [restockBatchId, setRestockBatchId] = useState('');
  const [restockExpiry, setRestockExpiry] = useState('');

  const handleOpenRestock = (item) => {
    setSelectedRestockItem(item);
    setRestockQty(1);
    setRestockPrice(item.costPerPurchaseUnit || 45000);
    setRestockSupplier('Default Supplier');
    setRestockBatchId(`LOT-RESTOCK-${Date.now().toString().slice(-4)}`);
    // Default expiry = 1 year from now for ink/materials
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setRestockExpiry(nextYear.toISOString().split('T')[0]);
    setIsRestockOpen(true);
  };

  const handleRestockSubmit = (e) => {
    e.preventDefault();
    if (!selectedRestockItem) return;

    addInventoryBatch(selectedRestockItem.id, {
      batchId: restockBatchId,
      purchaseDate: new Date().toISOString().split('T')[0],
      expiryDate: restockExpiry,
      supplierName: restockSupplier,
      purchasePrice: Number(restockPrice),
      purchaseQty: Number(restockQty)
    });

    showToast('Inventory FIFO Lot restocked successfully!', 'success');
    setIsRestockOpen(false);
    setSelectedRestockItem(null);
  };

  // Render standalone detail page if a material lot is selected
  if (selectedDetailLot) {
    return (
      <InventoryMaterialDetailsPage
        lotId={selectedDetailLot.id}
        parentSkuId={selectedDetailLot.parentItem?.id}
        onBack={() => setSelectedDetailLot(null)}
      />
    );
  }

  // Category tabs for Inventory (Excludes Machinery: Printer, Cutter, Laminator)
  const categoryTabs = ['All', 'Paper', 'Ink', 'Hardware', 'Finishing'];

  // Filter logic: Exclude Machinery items (category PRINTER or CUTTER) from warehouse inventory
  const filteredItems = inventory.filter(item => {
    const isMachinery = item.category === 'PRINTER' || item.category === 'CUTTER' || item.category === 'Equipment';
    if (isMachinery) return false;

    const matchesTab = activeTab === 'All' || item.category === activeTab;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Upper header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-8 h-8 text-accent-sky" />
            <span>{currentLang === 'lo' ? 'ຈັດການສະຕ໋ອກ & ວັດຖຸດິບ (ຄັງສິນຄ້າ)' : 'Warehouse Inventory & Materials'}</span>
          </h2>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            {currentLang === 'lo' ? 'ສະຕ໋ອກເຈ້ຍ, ໝຶກພິມ, ແລະ ອຸປະກອນ (ບໍ່ລວມເຄື່ອງຈັກ)' : 'Paper, Inks, & Consumables Ledger (Excluding Machinery)'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => { setSelectedDischargeItem(null); setIsDischargeOpen(true); }}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl transition cursor-pointer"
          >
            <Scissors className="w-4 h-4" />
            <span>{currentLang === 'lo' ? '- ເບີກใช้งาน / ຕັດສະຕ໋ອກ' : '- Stock Discharge'}</span>
          </button>
          <button
            onClick={() => setIsOffcutOpen(true)}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-2xl transition cursor-pointer"
          >
            <Scissors className="w-4 h-4" />
            <span>+ Add Offcut Remnant</span>
          </button>
          <button
            onClick={() => setIsAddMaterialOpen(true)}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-accent-sky hover:bg-sky-600 text-white font-bold text-xs rounded-2xl transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Material SKU</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 border border-slate-200/60 rounded-2xl font-bold text-xs">
          {categoryTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4.5 py-2 rounded-xl transition ${
                activeTab === tab 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'All' ? (currentLang === 'lo' ? 'ທັງໝົດ' : 'All Items') : tab}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search materials by name or SKU..."
          className="w-full md:w-80 min-h-[40px] px-3.5 border rounded-2xl focus:outline-none font-semibold text-sm bg-white"
        />
      </div>

      {/* Main ledger table */}
      <InventoryTable 
        items={filteredItems} 
        activeTab={activeTab}
        onRestockItem={handleOpenRestock}
        onViewDetails={(lot) => setSelectedDetailLot(lot)}
        onDischargeItem={(item) => {
          setSelectedDischargeItem(item);
          setIsDischargeOpen(true);
        }}
      />

      {/* Offcut Summary Grid */}
      {offcuts && offcuts.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/50 p-6 rounded-3xl space-y-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
            <Scissors className="w-4 h-4" />
            <span>Cataloged Offcut Remnants ({offcuts.length})</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {offcuts.map(off => (
              <div key={off.id} className="bg-white border rounded-2xl p-4 text-xs font-semibold space-y-1.5 shadow-sm">
                <div className="flex justify-between items-center border-b pb-1.5 mb-1.5">
                  <span className="font-extrabold text-slate-800">{off.name}</span>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded font-black font-sans">{off.qty} sheets</span>
                </div>
                <div className="text-slate-500 leading-normal">
                  <p>Origin SKU: <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">{off.paperId}</span></p>
                  {off.notes && <p className="italic mt-1">"{off.notes}"</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Universal SKU Modal */}
      <AddMaterialModal isOpen={isAddMaterialOpen} onClose={() => setIsAddMaterialOpen(false)} />

      {/* Offcuts modal */}
      <OffcutModal isOpen={isOffcutOpen} onClose={() => setIsOffcutOpen(false)} />

      {/* Restock Lot Modal */}
      {isRestockOpen && selectedRestockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border p-6 text-slate-800 space-y-4">
            <div>
              <h3 className="font-extrabold text-lg">Inbound Restock lot</h3>
              <p className="text-xs font-bold text-slate-400">Add new FIFO lot batch to {selectedRestockItem.name}</p>
            </div>
            
            <form onSubmit={handleRestockSubmit} className="space-y-4 font-bold text-xs">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase tracking-wider block">Lot / Batch ID</label>
                <input
                  type="text"
                  required
                  value={restockBatchId}
                  onChange={(e) => setRestockBatchId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider block">Purchase Price (LAK)</label>
                  <input
                    type="number"
                    required
                    value={restockPrice}
                    onChange={(e) => setRestockPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider block">Quantity ({selectedRestockItem.purchaseUnit.split(' ')[0]})</label>
                  <input
                    type="number"
                    required
                    value={restockQty}
                    onChange={(e) => setRestockQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider block">Supplier Name</label>
                  <input
                    type="text"
                    required
                    value={restockSupplier}
                    onChange={(e) => setRestockSupplier(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider block text-amber-700">Expiry Date (วันหมดอายุ / FIFO)</label>
                  <input
                    type="date"
                    required
                    value={restockExpiry}
                    onChange={(e) => setRestockExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl font-sans bg-amber-50/50 text-amber-900 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsRestockOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent-sky text-white rounded-xl font-bold hover:bg-sky-600"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Discharge Modal */}
      <StockDischargeModal
        item={selectedDischargeItem}
        isOpen={isDischargeOpen}
        onClose={() => {
          setIsDischargeOpen(false);
          setSelectedDischargeItem(null);
        }}
      />
    </div>
  );
}
