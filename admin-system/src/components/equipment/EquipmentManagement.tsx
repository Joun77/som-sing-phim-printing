import React, { useState } from 'react';
import { Settings, Plus, Wrench, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import EquipmentTable from './EquipmentTable';
import AddEquipmentModal from './AddEquipmentModal';
import EquipmentDetailsPage from './EquipmentDetailsPage';

export default function EquipmentManagement() {
  const { equipment, updateEquipmentMaintenance, showToast, formatCurrency } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const [activeCategory, setActiveCategory] = useState('All'); // All, Printer, Cutter, Binder, Laminator
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All, In Use, Spare, Under Repair, Retired
  const [printerCategoryFilter, setPrinterCategoryFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');

  const handleMaintenanceReset = (eqId) => {
    updateEquipmentMaintenance(eqId);
    showToast('Machinery components wear resets back to 0% SLA health!', 'success');
  };

  const handleViewDetails = (eq) => {
    setSelectedEquipmentId(eq.id);
  };

  const filteredMachines = equipment.filter(eq => {
    const matchesCategory = activeCategory === 'All' || eq.category === activeCategory;
    const matchesStatus = statusFilter === 'All' || eq.status === statusFilter;
    const matchesPrinterCategory = activeCategory !== 'Printer' || printerCategoryFilter === 'All' || eq.printerCategory === printerCategoryFilter;
    const matchesLocation = !locationFilter || (eq.location && eq.location.toLowerCase().includes(locationFilter.toLowerCase()));
    const matchesSearch = !searchQuery || 
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (eq.serialNumber && eq.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesStatus && matchesPrinterCategory && matchesLocation && matchesSearch;
  });

  if (selectedEquipmentId) {
    return (
      <EquipmentDetailsPage 
        equipmentId={selectedEquipmentId} 
        onBack={() => setSelectedEquipmentId(null)} 
      />
    );
  }

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-8 h-8 text-accent-sky" />
            <span>{currentLang === 'lo' ? 'ຈັດການເຄື່ອງຈັກ & ບຳລຸງຮັກສາ' : 'Assets & Overheads'}</span>
          </h2>
          <p className="text-sm font-semibold text-slate-400 mt-1">Track SLA operation parameters, equipment wear, & component metrics</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-sky-600/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{currentLang === 'lo' ? '+ ລົງທະບຽນເຄື່ອງຈັກ' : '+ Register Machine'}</span>
          </button>
        </div>
      </div>

      {/* Category filters & Search controls row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        {/* Category Tab Selector */}
        <div className="flex flex-col">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Category</label>
          <select
            value={activeCategory}
            onChange={(e) => {
              setActiveCategory(e.target.value);
              setPrinterCategoryFilter('All');
            }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:border-sky-500"
          >
            <option value="All">All Machinery</option>
            <option value="Printer">Printer</option>
            <option value="Cutter">Cutter</option>
            <option value="Binder">Binder</option>
            <option value="Laminator">Laminator</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:border-sky-500"
          >
            <option value="All">All Statuses</option>
            <option value="In Use">In Use</option>
            <option value="Spare">Spare</option>
            <option value="Under Repair">Under Repair</option>
            <option value="Retired">Retired</option>
          </select>
        </div>

        {/* Printer Type Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Printer Type</label>
          <select
            value={printerCategoryFilter}
            onChange={(e) => setPrinterCategoryFilter(e.target.value)}
            disabled={activeCategory !== 'Printer'}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:border-sky-500 disabled:opacity-50"
          >
            <option value="All">All Types</option>
            <option value="Laser">Laser</option>
            <option value="Inkjet">Inkjet</option>
            <option value="MFP">MFP</option>
            <option value="Plotter">Plotter</option>
            <option value="UV Flatbed">UV Flatbed</option>
            <option value="Sublimation">Sublimation</option>
          </select>
        </div>

        {/* Location Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Location / Dept</label>
          <input
            type="text"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder="e.g. Main Dept"
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* General Search Input */}
        <div className="flex flex-col">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Search Keywords</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Brand, Model, S/N..."
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* SLA Alert banner if wear thresholds exceed */}
      {equipment.some(eq => eq.components && eq.components.some(c => c.usage >= (c.threshold || 90))) && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 animate-pulse">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold">
            <p className="font-black">Critical Maintenance Alert</p>
            <p className="mt-0.5 leading-relaxed">Some printing drum units or cutter blades have exceeded safe operational thresholds. Execute Wrench Reset to restore SLA status.</p>
          </div>
        </div>
      )}

      {/* Equipment Table component */}
      <EquipmentTable 
        machines={filteredMachines} 
        onMaintenance={handleMaintenanceReset}
        onViewDetails={handleViewDetails}
        formatLAK={formatCurrency}
      />

      {/* Add modal wizard */}
      <AddEquipmentModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
}
