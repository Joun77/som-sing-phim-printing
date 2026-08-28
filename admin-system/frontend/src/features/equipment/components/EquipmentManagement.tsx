import React, { useState } from 'react';
import { Settings, Plus, Wrench, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@store/AppContext';
import EquipmentTable from './EquipmentTable';
import AddEquipmentModal from './modals/AddEquipmentModal';
import EditEquipmentModal from './modals/EditEquipmentModal';
import EquipmentDetailsPage from './details/EquipmentDetailsPage';

export default function EquipmentManagement() {
  const { equipment, deleteEquipment, updateEquipmentMaintenance, showToast, askConfirmation, formatCurrency } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const [activeCategory, setActiveCategory] = useState('All'); // All, Printer, Cutter, Binder, Laminator
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All, In Use, Spare, Under Repair, Retired
  const [printerCategoryFilter, setPrinterCategoryFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');

  const handleMaintenanceReset = (eqId: string) => {
    updateEquipmentMaintenance(eqId);
    showToast(currentLang === 'lo' ? 'ຣີເຊັດອາຍຸອຸປະກອນເຄື່ອງຈັກກັບສູ່ 0% SLA ສຳເລັດ!' : 'Machinery components wear resets back to 0% SLA health!', 'success');
  };

  const handleViewDetails = (eq: any) => {
    setSelectedEquipmentId(eq.id);
  };

  const handleDeleteEquipment = (eq: any) => {
    askConfirmation(
      currentLang === 'lo' 
        ? `ທ່ານຕ້ອງການລຶບເຄື່ອງຈັກ "${eq.name}" (${eq.id}) ຫຼື ບໍ່?` 
        : `Are you sure you want to delete equipment "${eq.name}" (${eq.id})?`,
      () => {
        deleteEquipment(eq.id);
        showToast(currentLang === 'lo' ? 'ລຶບເຄື່ອງຈັກຮຽບຮ້ອຍແລ້ວ' : 'Equipment deleted successfully', 'success');
      }
    );
  };

  const filteredMachines = equipment.filter(eq => {
    const eqCat = (eq.category || '').toLowerCase();
    const eqType = (eq.printerCategory || eq.printerType || eq.specs?.type || '').toLowerCase();
    const isPrinter = eqCat === 'printer' || eqCat === 'press' || eqType.includes('digital') || eqType.includes('offset') || eqType.includes('inkjet') || eqType.includes('laser') || (eq.id && eq.id.toLowerCase().startsWith('prn'));

    let matchesCategory = true;
    if (activeCategory === 'Printer') {
      matchesCategory = isPrinter;
    } else if (activeCategory === 'Cutter') {
      matchesCategory = eqCat === 'cutter' || (eq.id && eq.id.toLowerCase().startsWith('cut')) || (eq.name && eq.name.toLowerCase().includes('cutter'));
    } else if (activeCategory === 'Binder') {
      matchesCategory = eqCat === 'binder' || (eq.id && eq.id.toLowerCase().startsWith('bin')) || (eq.name && eq.name.toLowerCase().includes('binder'));
    } else if (activeCategory === 'Laminator') {
      matchesCategory = eqCat === 'laminator' || (eq.id && eq.id.toLowerCase().startsWith('lam')) || (eq.name && eq.name.toLowerCase().includes('laminat'));
    }

    const matchesStatus = statusFilter === 'All' || (eq.status || 'In Use').toLowerCase() === statusFilter.toLowerCase();
    
    let matchesPrinterCategory = true;
    if (activeCategory === 'Printer' && printerCategoryFilter !== 'All') {
      const pcf = printerCategoryFilter.toLowerCase();
      matchesPrinterCategory = eqType.includes(pcf) || (eq.brand && eq.brand.toLowerCase().includes(pcf)) || (eq.name && eq.name.toLowerCase().includes(pcf));
    }

    const matchesLocation = !locationFilter || (eq.location && eq.location.toLowerCase().includes(locationFilter.toLowerCase()));
    const matchesSearch = !searchQuery || 
      (eq.name && eq.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (eq.id && eq.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (eq.brand && eq.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (eq.model && eq.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
            <Settings className="w-8 h-8 text-sky-600" />
            <span>{currentLang === 'lo' ? 'ຈັດການເຄື່ອງຈັກ & ບຳລຸງຮັກສາ' : 'Assets & Overheads'}</span>
          </h2>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            {currentLang === 'lo' 
              ? 'ຕິດຕາມສະຖານະການເຮັດວຽກ SLA, ອັດຕາການສວມເສຍ ແລະ ຕົ້ນທຶນຄ່າເສື່ອມລາຄາເຄື່ອງຈັກ' 
              : 'Track SLA operation parameters, equipment wear, & component metrics'}
          </p>
        </div>
      </div>

      {/* Category filters & Search controls row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        {/* Category Tab Selector */}
        <div className="flex flex-col">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-1">
            {currentLang === 'lo' ? 'ໝວດໝູ່ເຄື່ອງຈັກ' : 'Category'}
          </label>
          <select
            value={activeCategory}
            onChange={(e) => {
              setActiveCategory(e.target.value);
              setPrinterCategoryFilter('All');
            }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:border-sky-500"
          >
            <option value="All">{currentLang === 'lo' ? 'ເຄື່ອງຈັກທັງໝົດ (All)' : 'All Machinery'}</option>
            <option value="Printer">{currentLang === 'lo' ? 'ເຄື່ອງພິມ (Printer)' : 'Printer'}</option>
            <option value="Cutter">{currentLang === 'lo' ? 'ເຄື່ອງຕັດ (Cutter)' : 'Cutter'}</option>
            <option value="Binder">{currentLang === 'lo' ? 'ເຄື່ອງເຂົ້າເລັ້ມ (Binder)' : 'Binder'}</option>
            <option value="Laminator">{currentLang === 'lo' ? 'ເຄື່ອງເຄືອບ (Laminator)' : 'Laminator'}</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-1">
            {currentLang === 'lo' ? 'ສະຖານະ' : 'Status'}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:border-sky-500"
          >
            <option value="All">{currentLang === 'lo' ? 'ທຸກສະຖານະ (All)' : 'All Statuses'}</option>
            <option value="In Use">{currentLang === 'lo' ? 'ກຳລັງໃຊ້ງານ (In Use)' : 'In Use'}</option>
            <option value="Spare">{currentLang === 'lo' ? 'ສຳຮອງ (Spare)' : 'Spare'}</option>
            <option value="Under Repair">{currentLang === 'lo' ? 'ກຳລັງສ້ອມແປງ (Under Repair)' : 'Under Repair'}</option>
            <option value="Retired">{currentLang === 'lo' ? 'ປົດລະວາງ (Retired)' : 'Retired'}</option>
          </select>
        </div>

        {/* Printer Type Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-1">
            {currentLang === 'lo' ? 'ປະເພດເຄື່ອງພິມ' : 'Printer Type'}
          </label>
          <select
            value={printerCategoryFilter}
            onChange={(e) => setPrinterCategoryFilter(e.target.value)}
            disabled={activeCategory !== 'Printer' && activeCategory !== 'All'}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:border-sky-500 disabled:opacity-50"
          >
            <option value="All">{currentLang === 'lo' ? 'ທຸກປະເພດ (All)' : 'All Types'}</option>
            <option value="Laser">Laser</option>
            <option value="Inkjet">Inkjet</option>
            <option value="Plotter">Plotter</option>
            <option value="UV">UV Printer</option>
            <option value="Sublimation">Sublimation</option>
          </select>
        </div>

        {/* Location Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-1">
            {currentLang === 'lo' ? 'ສະຖານທີ່ / ພະແນກ' : 'Location / Dept'}
          </label>
          <input
            type="text"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder={currentLang === 'lo' ? 'ເຊັ່ນ: Main Dept' : 'e.g. Main Dept'}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Search Query */}
        <div className="flex flex-col">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-1">
            {currentLang === 'lo' ? 'ຄົ້ນຫາຄີເວີດ' : 'Search Keywords'}
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={currentLang === 'lo' ? 'ຄົ້ນຫາຊື່, ແບຣນ, ໂມເດວ, S/N...' : 'Search Brand, Model, S/N...'}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Equipment Table */}
      <EquipmentTable 
        machines={filteredMachines} 
        onViewDetails={handleViewDetails}
        onDelete={handleDeleteEquipment}
        formatLAK={formatCurrency}
        onMaintenance={handleMaintenanceReset}
      />
    </div>
  );
}
