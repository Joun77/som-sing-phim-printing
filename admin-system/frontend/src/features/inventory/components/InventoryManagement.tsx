import React, { useState, useEffect } from 'react';
import { Boxes, Scissors, History, RefreshCw, PackageMinus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '@store/AppContext';
import InventoryTable from './InventoryTable';
import StockTable from './StockTable';
import InboundHistoryTable from './InboundHistoryTable';
import InventoryMaterialDetailsPage from './details/InventoryMaterialDetailsPage';
import OffcutsTab from './OffcutsTab';
import AddOffcutModal from './modals/AddOffcutModal';
import StockDischargeModal from './modals/StockDischargeModal';
import IssueSparePartModal from './modals/IssueSparePartModal';
import { fetchMaterials, fetchInboundHistory } from '../api/inventoryApi';
import { MaterialMaster, StockInboundRecord } from '../types';

export default function InventoryManagement() {
  const queryClient = useQueryClient();
  const { 
    inventory, 
    offcuts, 
    showToast 
  } = useApp();

  const invalidateInventoryQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    queryClient.invalidateQueries({ queryKey: ['materials'] });
    queryClient.invalidateQueries({ queryKey: ['inbound'] });
    queryClient.invalidateQueries({ queryKey: ['inbound-records'] });
  };

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  // Master view mode: 'stock' (Master Stock & Ledger) vs 'offcuts' (Scrap Paper) vs 'inbound_history' (Procurement Inbound Logs)
  const [mainView, setMainView] = useState<'stock' | 'offcuts' | 'inbound_history'>('stock');

  // Navigation tabs & detail view state
  const [activeTab, setActiveTab] = useState('All'); // All, Paper, Offcut, Ink, Hardware, Finishing, Packaging
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailLot, setSelectedDetailLot] = useState<any>(null);

  // Backend Synchronized State
  const [backendMaterials, setBackendMaterials] = useState<MaterialMaster[]>([]);
  const [inboundHistory, setInboundHistory] = useState<StockInboundRecord[]>([]);
  const [loadingBackendData, setLoadingBackendData] = useState(false);

  // Modals state
  const [isOffcutOpen, setIsOffcutOpen] = useState(false);
  const [isDischargeOpen, setIsDischargeOpen] = useState(false);
  const [isIssuePartOpen, setIsIssuePartOpen] = useState(false);
  const [selectedPartForIssue, setSelectedPartForIssue] = useState<any>(null);
  const [selectedDischargeItem, setSelectedDischargeItem] = useState<any>(null);

  // Fetch backend data
  const loadBackendData = async () => {
    setLoadingBackendData(true);
    try {
      const [mats, history] = await Promise.all([
        fetchMaterials().catch(() => []),
        fetchInboundHistory().catch(() => [])
      ]);
      setBackendMaterials(mats);
      setInboundHistory(history);
    } catch (err) {
      console.error('Failed to load backend inventory:', err);
    } finally {
      setLoadingBackendData(false);
    }
  };

  useEffect(() => {
    loadBackendData();
  }, []);

  // Render standalone detail page if a material lot is selected
  if (selectedDetailLot) {
    return (
      <InventoryMaterialDetailsPage
        lotId={selectedDetailLot.id || selectedDetailLot.sku}
        parentSkuId={selectedDetailLot.parentItem?.id || selectedDetailLot.sku || selectedDetailLot.id}
        initialItem={selectedDetailLot}
        onBack={() => setSelectedDetailLot(null)}
      />
    );
  }

  // Category tabs for Inventory (Excludes Machinery: Printer, Cutter, Laminator)
  const categoryTabs = ['All', 'Paper', 'ParentSheet', 'Offcut', 'Ink', 'Rigid', 'Finishing', 'Packaging', 'SpareParts'];

  const categoryTabLabels: Record<string, { lo: string; en: string }> = {
    All: { lo: 'ທັງໝົດ', en: 'All Items' },
    Paper: { lo: 'ເຈ້ຍ & ວັດສະດຸ', en: 'Paper & Substrates' },
    ParentSheet: { lo: 'ເຈ້ຍໃຫຍ່ 31x43"', en: 'Parent Sheets 31x43"' },
    Offcut: { lo: 'ເສດເຈ້ຍ', en: 'Offcuts' },
    Ink: { lo: 'ນ້ຳໝຶກ & ໂທເນີ', en: 'Ink & Toner' },
    Rigid: { lo: 'ແຜ່ນແຂງ Rigid', en: 'Rigid Substrates' },
    Finishing: { lo: 'ງານຫຼັງພິມ & ເຄືອບ', en: 'Finishing' },
    Packaging: { lo: 'ກ່ອງ & ບັນຈຸພັນ', en: 'Packaging' },
    SpareParts: { lo: 'ອະໄຫຼ່ສຳຮອງ', en: 'Spare Parts' },
  };

  // Filter logic for legacy / local items
  const filteredItems = inventory.filter(item => {
    if (!item) return false;
    const cat = (item.category || '').toLowerCase();
    const isMachinery = cat === 'printer' || cat === 'cutter' || cat === 'laminator' || cat === 'binder' || cat === 'equipment' || cat === 'machinery';
    if (isMachinery) return false;

    let matchesTab = activeTab === 'All';
    if (activeTab === 'Paper') {
      matchesTab = (cat === 'paper' || cat === 'material') && !item.isOffcut && !cat.includes('offcut') && !cat.includes('parent');
    } else if (activeTab === 'ParentSheet') {
      const is31x43 = (item.name || '').includes('31x43') || (item.name || '').includes('787') || (item.sku || '').includes('PARENT') || cat.includes('parent');
      matchesTab = cat === 'parent_sheet' || cat === 'parentsheet' || is31x43;
    } else if (activeTab === 'Offcut') {
      matchesTab = cat === 'offcut' || item.isOffcut || (item.id || '').startsWith('OFF-');
    } else if (activeTab === 'Ink') {
      matchesTab = cat === 'ink' || cat === 'toner';
    } else if (activeTab === 'Rigid') {
      matchesTab = cat === 'rigid' || cat === 'rigid_substrates' || (item.sku || '').startsWith('RIGID-') || (item.name || '').toLowerCase().includes('foam') || (item.name || '').toLowerCase().includes('acrylic') || (item.name || '').toLowerCase().includes('plaswood');
    } else if (activeTab === 'Finishing') {
      matchesTab = cat === 'finishing' || cat === 'film' || cat === 'glue' || cat === 'lamination' || cat === 'binding' || cat === 'cutting_supplies';
    } else if (activeTab === 'Packaging') {
      matchesTab = cat === 'packaging' || (item.id || '').startsWith('PKG-');
    } else if (activeTab === 'SpareParts') {
      matchesTab = cat === 'spareparts' || cat === 'spare_parts' || cat === 'hardware' || (item.sku || '').startsWith('PART-') || (item.id || '').startsWith('PART-');
    } else if (activeTab !== 'All') {
      matchesTab = cat === activeTab.toLowerCase();
    }

    const nameStr = (item.name || item.itemName || '').toLowerCase();
    const idStr = (item.id || item.sku || '').toLowerCase();
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = !q || nameStr.includes(q) || idStr.includes(q);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Upper header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-8 h-8 text-blue-600" />
            <span>{currentLang === 'lo' ? 'ຈັດການສະຕ໋ອກ & ວັດຖຸດິບ (ສາງສິນຄ້າ)' : 'Warehouse Inventory & Materials'}</span>
          </h2>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            {currentLang === 'lo' ? 'ສະຕ໋ອກເຈ້ຍ, ໝຶກພິມ, ແລະ ອຸປະກອນ (ບໍ່ລວມເຄື່ອງຈັກ)' : 'Paper, Inks, & Consumables Ledger (Single-Master Stock)'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => { setSelectedDischargeItem(null); setIsDischargeOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition shadow-md shadow-slate-900/10 cursor-pointer active:scale-98"
          >
            <PackageMinus className="w-4 h-4 text-sky-400" />
            <span>{currentLang === 'lo' ? 'ເບີກໃຊ້ງານ / ຕັດສະຕ໋ອກ' : 'Discharge Stock'}</span>
          </button>
          <button
            onClick={() => setIsOffcutOpen(true)}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition cursor-pointer active:scale-98"
          >
            <Scissors className="w-4 h-4 text-slate-600" />
            <span>{currentLang === 'lo' ? 'ເພີ່ມເສດເຈ້ຍ (Offcut)' : 'Add Offcut'}</span>
          </button>
        </div>
      </div>

      {/* Main View Switcher: Master Stock Ledger vs Offcuts vs Inbound History */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setMainView('stock')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              mainView === 'stock'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ຕາຕະລາງສະຕ໋ອກ Master (Stock)' : 'Master Stock'}</span>
          </button>

          <button
            onClick={() => setMainView('offcuts')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              mainView === 'offcuts'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scissors className="w-4 h-4 text-indigo-600" />
            <span>{currentLang === 'lo' ? 'ຄັງເສດເຈ້ຍ (Offcuts)' : 'Offcuts Ledger'}</span>
            <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded-md font-mono text-[10px] font-black">
              {offcuts.length}
            </span>
          </button>

          <button
            onClick={() => setMainView('inbound_history')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              mainView === 'inbound_history'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ປະຫວັດການຮັບເຂົ້າ (Inbound)' : 'Inbound History'}</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-md font-mono text-[10px] font-black">
              {inboundHistory.length}
            </span>
          </button>
        </div>

        <button
          onClick={loadBackendData}
          disabled={loadingBackendData}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer self-end sm:self-auto"
          title="ໂຫຼດຂໍ້ມູນໃໝ່"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingBackendData ? 'animate-spin text-blue-600' : ''}`} />
          <span>{currentLang === 'lo' ? 'ໂຫຼດໃໝ່' : 'Refresh'}</span>
        </button>
      </div>

      {/* Content based on Main View */}
      {mainView === 'stock' ? (
        <>
          {/* If backend materials exist, render Master StockTable */}
          {backendMaterials.length > 0 ? (
            <StockTable
              materials={backendMaterials}
              loading={loadingBackendData}
              onRefresh={loadBackendData}
              onViewDetails={(mat) => setSelectedDetailLot(mat)}
              onIssuePart={(mat) => {
                setSelectedPartForIssue(mat);
                setIsIssuePartOpen(true);
              }}
            />
          ) : (
            <>
              {/* Tabs & Search for Fallback / Local Items */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 border border-slate-200/60 rounded-2xl font-bold text-xs">
                  {categoryTabs.map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4.5 py-2 rounded-xl transition cursor-pointer ${
                        activeTab === tab 
                          ? 'bg-white text-slate-800 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {categoryTabLabels[tab]?.[currentLang === 'en' ? 'en' : 'lo'] || tab}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ຄົ້ນຫາ SKU, ຊື່ສິນຄ້າ, ໝວດໝູ່..."
                  className="w-full md:w-80 min-h-[40px] px-3.5 border rounded-2xl focus:outline-none font-semibold text-sm bg-white"
                />
              </div>

              {/* Main ledger table */}
              <InventoryTable 
                items={filteredItems} 
                activeTab={activeTab}
                onViewDetails={(lot) => setSelectedDetailLot(lot)}
                onIssuePart={(item) => {
                  setSelectedPartForIssue(item.parentItem || item);
                  setIsIssuePartOpen(true);
                }}
              />
            </>
          )}
        </>
      ) : mainView === 'offcuts' ? (
        /* Offcuts Remnants Management Tab */
        <OffcutsTab onOpenAddModal={() => setIsOffcutOpen(true)} />
      ) : (
        /* Inbound History View */
        <InboundHistoryTable
          records={inboundHistory}
          loading={loadingBackendData}
          onRefresh={loadBackendData}
        />
      )}

      {/* Offcut Summary Grid */}
      {offcuts && offcuts.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/50 p-6 rounded-3xl space-y-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
            <Scissors className="w-4 h-4" />
            <span>ເສດເຈ້ຍທີ່ຈັດໄວ້ (Offcut Remnants) ({offcuts.length})</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {offcuts.map(off => (
              <div key={off.id} className="bg-white border rounded-2xl p-4 text-xs font-semibold space-y-1.5 shadow-sm">
                <div className="flex justify-between items-center border-b pb-1.5 mb-1.5">
                  <span className="font-extrabold text-slate-800">{off.name}</span>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded font-black font-sans">{off.qty} ແຜ່ນ</span>
                </div>
                <div className="text-slate-500 leading-normal">
                  <p>SKU ຕົ້ນທາງ: <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">{off.paperId}</span></p>
                  {off.notes && <p className="italic mt-1">"{off.notes}"</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offcuts modal */}
      <AddOffcutModal 
        isOpen={isOffcutOpen} 
        onClose={() => {
          setIsOffcutOpen(false);
          invalidateInventoryQueries();
        }} 
      />

      {/* Stock Discharge Modal */}
      <StockDischargeModal
        item={selectedDischargeItem}
        isOpen={isDischargeOpen}
        onClose={() => {
          setIsDischargeOpen(false);
          setSelectedDischargeItem(null);
          invalidateInventoryQueries();
        }}
      />
      {/* Issue Spare Part to Equipment Modal */}
      <IssueSparePartModal
        isOpen={isIssuePartOpen}
        onClose={() => {
          setIsIssuePartOpen(false);
          setSelectedPartForIssue(null);
        }}
        materialItem={selectedPartForIssue}
        onSuccess={() => {
          invalidateInventoryQueries();
          loadBackendData();
        }}
      />
    </div>
  );
}
