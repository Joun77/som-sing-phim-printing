import React, { useState } from 'react';
import { Settings, Plus, Wrench, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import EquipmentTable from './EquipmentTable';
import AddEquipmentModal from './AddEquipmentModal';

export default function EquipmentManagement() {
  const { equipment, updateEquipmentMaintenance, showToast } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const [activeCategory, setActiveCategory] = useState('All'); // All, Printer, Cutter, Binder, Laminator
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleMaintenanceReset = (eqId) => {
    updateEquipmentMaintenance(eqId);
    showToast('Machinery components wear resets back to 0% SLA health!', 'success');
  };

  const filteredMachines = activeCategory === 'All'
    ? equipment
    : equipment.filter(eq => eq.category === activeCategory);

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
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-accent-sky hover:bg-sky-600 text-white font-bold text-xs rounded-2xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Machine Profile</span>
        </button>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 border border-slate-200/60 rounded-2xl font-bold text-xs w-max">
        {['All', 'Printer', 'Cutter', 'Binder', 'Laminator'].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4.5 py-2 rounded-xl transition ${
              activeCategory === cat 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {cat === 'All' ? 'All Machinery' : cat}
          </button>
        ))}
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
      />

      {/* Add modal wizard */}
      <AddEquipmentModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
}
