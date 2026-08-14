import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle, 
  ShieldAlert, 
  Wrench, 
  Printer, 
  Layers, 
  Clock, 
  Camera, 
  FileText,
  ExternalLink,
  Laptop,
  Gauge,
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../../context/AppContext';
import ConfirmDeleteModal, { DeleteActionButton } from '../../common/ConfirmDeleteModal';
import EditEquipmentModal from '../modals/EditEquipmentModal';
import RecordMeterModal from '../modals/RecordMeterModal';
import LogDowntimeModal from '../modals/LogDowntimeModal';
import QuickLinkInkModal from '../modals/QuickLinkInkModal';
import PrinterInkComparisonCard from '../../inventory/details/PrinterInkComparisonCard';

export default function EquipmentDetailsPage({ equipmentId, onBack }: { equipmentId: string; onBack: () => void }) {
  const { 
    equipment, 
    inventory, 
    printerColorLinks, 
    deletePrinterColorLink, 
    updateEquipmentMaintenance, 
    updateEquipment,
    deleteEquipment,
    meterReadings,
    downtimeLogs,
    updateDowntimeLog,
    showToast, 
    formatCurrency 
  } = useApp();

  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  
  const machine = equipment ? equipment.find(eq => eq.id === equipmentId) : null;
  const formatLAK = formatCurrency;

  // Active sub-tab state: 'specs' | 'meter' | 'maintenance' | 'inks'
  const [activeTab, setActiveTab] = useState<'specs' | 'meter' | 'maintenance' | 'inks'>('specs');

  // Meter filter state: 'daily' | 'weekly' | 'monthly'
  const [meterFilter, setMeterFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Modal open states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRecordMeterOpen, setIsRecordMeterOpen] = useState(false);
  const [isLogDowntimeOpen, setIsLogDowntimeOpen] = useState(false);
  const [isQuickLinkInkOpen, setIsQuickLinkInkOpen] = useState(false);

  if (!machine) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
        <p className="text-slate-500 font-bold">ບໍ່ພົບຂໍ້ມູນໂປຣໄຟລ໌ເຄື່ອງຈັກ (Machine Profile Not Found)</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          ກັບຄືນຮາຍການເຄື່ອງຈັກ
        </button>
      </div>
    );
  }

  const isCritical = machine.components && machine.components.some((c: any) => c.usage >= (c.threshold || 90));

  const handleDeleteEquipment = () => {
    deleteEquipment(machine.id);
    showToast(
      currentLang === 'lo'
        ? `ລຶບຂໍ້ມູນເຄື່ອງຈັກ "${machine.name}" ສຳເລັດ!`
        : `Deleted equipment "${machine.name}" successfully!`,
      'info'
    );
    onBack();
  };

  // Get printer linked inks
  const linkedLinks = printerColorLinks.filter((lnk: any) => lnk.assetId === machine.id);

  // Get meter readings for this machine
  const machineReadings = meterReadings.filter((m: any) => m.equipmentId === machine.id);

  // Filter meter readings by view (daily / weekly / monthly)
  const filteredReadings = machineReadings.filter((m: any) => {
    if (!m.date) return true;
    const readingDate = new Date(m.date);
    const now = new Date();
    if (meterFilter === 'daily') {
      // Last 14 days
      const diffTime = Math.abs(now.getTime() - readingDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 14;
    } else if (meterFilter === 'weekly') {
      // Last 8 weeks
      const diffTime = Math.abs(now.getTime() - readingDate.getTime());
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      return diffWeeks <= 8;
    } else {
      // Last 12 months
      const diffTime = Math.abs(now.getTime() - readingDate.getTime());
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      return diffMonths <= 12;
    }
  });

  // Get downtime logs for this machine
  const machineDowntimes = downtimeLogs.filter((d: any) => d.equipmentId === machine.id);

  // Financial & Depreciation Math
  const assetValue = machine.MachinePrice !== undefined ? machine.MachinePrice : (machine.purchaseCost || 0);
  const targetPages = machine.TargetTotalPages !== undefined ? machine.TargetTotalPages : (machine.printedPagesCapacity || 1000000);
  const currentMeterCount = machine.currentMeterCount !== undefined ? machine.currentMeterCount : (machine.printedCount || 0);
  const maintCostPerPage = machine.MaintenanceCostPerPage !== undefined ? machine.MaintenanceCostPerPage : (machine.maintenanceCostPerPage || 0);

  const deprecationPerPage = targetPages > 0 ? (assetValue / targetPages) : 0;
  const totalOverheadPerPage = deprecationPerPage + maintCostPerPage;

  const roiPercent = targetPages > 0 ? Math.min(100, (currentMeterCount / targetPages) * 100) : 0;
  const recoveredValue = currentMeterCount * deprecationPerPage;
  const remainingValue = Math.max(0, assetValue - recoveredValue);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 font-sans pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-100 rounded-2xl border border-slate-200 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ກັບໜ້າຈັດຮາຍການເຄື່ອງຈັກ' : 'Back to Machinery'}</span>
          </button>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>{machine.name}</span>
            </h2>
            <p className="text-xs font-semibold text-slate-400">ID: {machine.id} | S/N: {machine.serialNumber || machine.sn || '-'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
            isCritical 
              ? 'text-red-600 bg-red-50 border-red-200 animate-pulse' 
              : 'text-emerald-700 bg-emerald-50 border-emerald-200'
          }`}>
            {isCritical ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span>{isCritical ? 'Service Required' : (currentLang === 'lo' ? 'ພ້ອມໃຊ້ງານ' : 'Operational')}</span>
          </span>

          <span className="px-3 py-1 bg-sky-50 text-sky-700 font-mono font-black text-xs rounded-full border border-sky-200 uppercase">
            {machine.category}
          </span>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-xl border border-sky-200 transition cursor-pointer active:scale-95"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>{currentLang === 'lo' ? 'แก้ไขโปรไฟล์' : 'Edit Profile'}</span>
          </button>

          <DeleteActionButton onClick={() => setIsDeleteModalOpen(true)} />
        </div>
      </div>

      {/* ROI & Amortization Progress Card (Option B) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/20 rounded-2xl border border-sky-400/30">
              <TrendingUp className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
                Asset ROI & Amortization Metrics (การคืนทุน & ค่าเสื่อมราคาเครื่อง)
              </h3>
              <p className="text-xs text-slate-400 font-medium">Real-time usage wear vs target total printed capacity</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Base Cost / Page</span>
              <span className="text-base font-black font-mono text-emerald-400">
                {formatLAK(totalOverheadPerPage)} / page
              </span>
            </div>
          </div>
        </div>

        {/* ROI Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-300">
              Printed: <strong className="font-mono text-white text-sm">{currentMeterCount.toLocaleString()}</strong> / {targetPages.toLocaleString()} pages
            </span>
            <span className="font-mono text-sky-400 font-black text-sm">{roiPercent.toFixed(1)}% Amortized</span>
          </div>
          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden p-0.5 border border-slate-600">
            <div 
              className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, roiPercent)}%` }}
            />
          </div>
        </div>

        {/* Financial Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Asset Price</span>
            <span className="font-mono font-black text-slate-100">{formatLAK(assetValue)}</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Depreciation / Page</span>
            <span className="font-mono font-black text-sky-400">{formatLAK(deprecationPerPage)}</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Cost Recovered</span>
            <span className="font-mono font-black text-emerald-400">{formatLAK(recoveredValue)}</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Remaining Asset Value</span>
            <span className="font-mono font-black text-amber-400">{formatLAK(remainingValue)}</span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('specs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === 'specs'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Profile & Technical Specs</span>
        </button>

        <button
          onClick={() => setActiveTab('meter')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === 'meter'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Daily/Weekly Meter Log ({machineReadings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === 'maintenance'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Maintenance & Downtime History ({machineDowntimes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === 'inks'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Linked Inks & Consumables ({linkedLinks.length})</span>
        </button>
      </div>

      {/* TAB CONTENT 1: SPECS & GENERAL (Categories 1, 2, 3, 5) */}
      {activeTab === 'specs' && (
        <div className="space-y-6">
          {/* CATEGORY 1: General & Visuals */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-600" />
              <span>Category 1: General & Visuals</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-4 flex justify-center">
                {machine.imageUrl || machine.itemPhoto ? (
                  <img 
                    src={machine.imageUrl || machine.itemPhoto} 
                    alt={machine.name} 
                    className="w-full max-h-60 object-contain rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner"
                  />
                ) : (
                  <div className="w-full h-48 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Printer className="w-12 h-12 text-slate-300" />
                    <span className="text-xs font-bold">No Product Image</span>
                  </div>
                )}
              </div>
              <div className="md:col-span-8 grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">Asset ID</span>
                  <span className="text-sm text-slate-900 font-mono block mt-1">{machine.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">Serial Number (S/N)</span>
                  <span className="text-sm text-slate-900 font-mono block mt-1">{machine.serialNumber || machine.sn || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">Brand / Make</span>
                  <span className="text-sm text-slate-900 block mt-1">{machine.brand || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">Model</span>
                  <span className="text-sm text-slate-900 block mt-1">{machine.model || machine.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">Printer Category</span>
                  <span className="text-sm text-slate-900 block mt-1">{machine.printerCategory || machine.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">Location / Department</span>
                  <span className="text-sm text-slate-900 block mt-1">{machine.location || 'Main Dept'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">Color Scheme Type</span>
                  <span className="text-sm text-slate-900 block mt-1">{machine.colorSchemeType || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">Total Color Slots</span>
                  <span className="text-sm text-slate-900 font-mono block mt-1">{machine.totalColorSlots || machine.totalSlots || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CATEGORY 2: Technical Specifications */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Printer className="w-4 h-4 text-purple-600" />
              <span>Category 2: Technical Specifications</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-bold text-slate-600">
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Print Speed (PPM)</span>
                <span className="text-xs text-slate-900 block mt-1">{machine.speedPpm || machine.printSpeedColor || machine.printSpeed || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Max Paper Size</span>
                <span className="text-xs text-slate-900 block mt-1">{machine.maxWidth || machine.paperSizes || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Ink Type</span>
                <span className="text-xs text-slate-900 block mt-1">{machine.inkType || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Print Tech</span>
                <span className="text-xs text-slate-900 block mt-1">{machine.printTech || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Black ISO Yield (A4 5%)</span>
                <span className="text-xs text-slate-900 font-mono block mt-1">{machine.blackYieldPages ? `${machine.blackYieldPages} pages` : '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Color ISO Yield (A4 5%)</span>
                <span className="text-xs text-slate-900 font-mono block mt-1">{machine.colorYieldPages ? `${machine.colorYieldPages} pages` : '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Click Rate (Color)</span>
                <span className="text-xs text-emerald-600 font-mono block mt-1">{machine.clickRateColor ? `${formatLAK(machine.clickRateColor)} / click` : '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Click Rate (B/W)</span>
                <span className="text-xs text-emerald-600 font-mono block mt-1">{machine.clickRateBW ? `${formatLAK(machine.clickRateBW)} / click` : '-'}</span>
              </div>
            </div>
          </div>

          {/* CATEGORY 3: Connectivity & Network */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-emerald-600" />
              <span>Category 3: Connectivity & Network</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-bold text-slate-600">
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Connectivity Interfaces</span>
                <span className="text-xs text-slate-900 block mt-1">{(machine.connectivity && machine.connectivity.join(', ')) || 'Ethernet, USB 3.0'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">IP Address</span>
                <span className="text-xs text-slate-900 font-mono block mt-1">{machine.ipAddress || machine.ip || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">MAC Address</span>
                <span className="text-xs text-slate-900 font-mono block mt-1">{machine.macAddress || machine.mac || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">OS Compatibility</span>
                <span className="text-xs text-slate-900 block mt-1">{(machine.osCompatibility && machine.osCompatibility.join(', ')) || 'Windows, macOS, Linux'}</span>
              </div>
            </div>
          </div>

          {/* CATEGORY 5: Financial Metrics & Documents */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Category 5: Financial & Depreciation Metrics</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-bold text-slate-600">
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Purchase Date</span>
                <span className="text-xs text-slate-900 block mt-1">{machine.purchaseDate || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Vendor / Supplier</span>
                <span className="text-xs text-slate-900 block mt-1">{machine.vendor || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Warranty Expiry</span>
                <span className="text-xs text-slate-900 block mt-1">{machine.warrantyExpirationYear || machine.warrantyExpiration || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Calculated Depreciation / Page</span>
                <span className="text-xs text-emerald-600 font-mono font-bold block mt-1">
                  {formatLAK(deprecationPerPage)} / page
                </span>
              </div>
            </div>

            {/* Quick update financial fields */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <span className="text-xs font-black text-slate-700 block uppercase tracking-wider">Inline Financial Parameters Update</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 block uppercase">Machine Price / Asset Value (LAK)</label>
                  <input
                    type="number"
                    value={assetValue}
                    onChange={(e) => {
                      updateEquipment(machine.id, { MachinePrice: Number(e.target.value), purchaseCost: Number(e.target.value) });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs font-black bg-white text-slate-950 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 block uppercase">Target Lifetime Pages</label>
                  <input
                    type="number"
                    value={targetPages}
                    onChange={(e) => {
                      updateEquipment(machine.id, { TargetTotalPages: Number(e.target.value), printedPagesCapacity: Number(e.target.value) });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs font-black bg-white text-slate-950 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 block uppercase">Maint. Cost Per Page (LAK)</label>
                  <input
                    type="number"
                    value={maintCostPerPage}
                    onChange={(e) => {
                      updateEquipment(machine.id, { MaintenanceCostPerPage: Number(e.target.value), maintenanceCostPerPage: Number(e.target.value) });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs font-black bg-white text-slate-950 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: METER COUNTER HISTORY (Option B) */}
      {activeTab === 'meter' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-emerald-600" />
                <span>Daily / Weekly / Monthly Meter Counter Log (ระบบบันทึกมิเตอร์พิมพ์)</span>
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Track daily click counter readings and volume output history</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setMeterFilter('daily')}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl transition cursor-pointer ${
                    meterFilter === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Daily (14D)
                </button>
                <button
                  onClick={() => setMeterFilter('weekly')}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl transition cursor-pointer ${
                    meterFilter === 'weekly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Weekly (8W)
                </button>
                <button
                  onClick={() => setMeterFilter('monthly')}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl transition cursor-pointer ${
                    meterFilter === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Monthly (12M)
                </button>
              </div>

              <button
                onClick={() => setIsRecordMeterOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{currentLang === 'lo' ? '+ ບັນທຶກมิเตอร์วันนี้' : '+ Record Today Meter'}</span>
              </button>
            </div>
          </div>

          {/* Table of Meter Readings */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-black">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Total Click Counter</th>
                  <th className="py-3 px-4 text-right">Pages Printed (+Diff)</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredReadings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                      No meter readings recorded yet for this view filter. Click "+ Record Today Meter" to log counter reads.
                    </td>
                  </tr>
                ) : (
                  filteredReadings.map((reading: any) => (
                    <tr key={reading.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{reading.date}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{reading.time || '-'}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        {(reading.meterCount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-600">
                        +{(reading.diffCount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-bold">
                        {reading.recordedBy || 'Operator'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium max-w-xs truncate">
                        {reading.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: MAINTENANCE & DOWNTIME LOG (Option C) */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* SLA Health Wear Reset Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Component Wear SLA Health (อายุการใช้งานชิ้นส่วนอะไหล่)
              </span>
              <button
                onClick={() => {
                  updateEquipmentMaintenance(machine.id);
                  showToast(currentLang === 'lo' ? `ຣີເຊັດຄ່າບຳລຸງຮັກສາເຄື່ອງ "${machine.name}" ສຳເລັດ!` : 'Maintenance SLA reset successfully!', 'success');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition cursor-pointer active:scale-95"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>SLA Wrench Reset (0%)</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {machine.components && machine.components.map((comp: any, idx: number) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">{comp.name}</span>
                    <span className={comp.usage >= (comp.threshold || 90) ? 'text-red-600 font-black' : 'text-slate-700 font-mono'}>
                      {comp.usage}% / {comp.threshold || 90}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        comp.usage >= (comp.threshold || 90) ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, comp.usage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Downtime Log Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-indigo-600" />
                  <span>Maintenance History & Downtime Log (ประวัติการส่งซ่อมบำรุง)</span>
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">Timeline of breakdown logs, repairs, parts replaced, and technician costs</p>
              </div>

              <button
                onClick={() => setIsLogDowntimeOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-md shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{currentLang === 'lo' ? '+ ບັນທຶກປະວັດການຊ້ອມ' : '+ Log Maintenance'}</span>
              </button>
            </div>

            {/* Downtime Timeline Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-black">
                    <th className="py-3 px-4">Start Time</th>
                    <th className="py-3 px-4">Reason / Issue</th>
                    <th className="py-3 px-4 text-right">Downtime (Mins)</th>
                    <th className="py-3 px-4">Technician / Action</th>
                    <th className="py-3 px-4 text-right">Cost (LAK)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {machineDowntimes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                        No maintenance downtime records logged for this machine yet. Click "+ Log Maintenance" to record a repair.
                      </td>
                    </tr>
                  ) : (
                    machineDowntimes.map((dt: any) => (
                      <tr key={dt.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {dt.startTime ? new Date(dt.startTime).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{dt.reason}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">{dt.description}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600">
                          {dt.downtimeMinutes || 0} min
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 block">{dt.technician || '-'}</span>
                          <span className="text-[10px] text-slate-500 font-normal">{dt.actionTaken || '-'}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                          {dt.cost ? formatLAK(dt.cost) : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            dt.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          }`}>
                            {dt.status || 'Completed'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {dt.status !== 'Completed' && (
                            <button
                              onClick={() => {
                                updateDowntimeLog(dt.id, { status: 'Completed', endTime: new Date().toISOString() });
                                showToast('Downtime marked as completed!', 'success');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition shadow-xs cursor-pointer"
                            >
                              Mark Done
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: LINKED INKS & CONSUMABLES (Option D) */}
      {activeTab === 'inks' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <span>Linked Colors & Consumables (การผูกหมวดหมวดหมึกพิมพ์)</span>
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">CMYK / White color slot mappings with real-time inventory unit prices</p>
            </div>

            <button
              onClick={() => setIsQuickLinkInkOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-2xl shadow-md shadow-purple-600/20 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{currentLang === 'lo' ? '+ ຜູກໝຶກพิมพ์เข้า Slot' : '+ Quick Link Ink SKU'}</span>
            </button>
          </div>

          {/* Table of Linked Inks */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-black">
                  <th className="py-3 px-4">Slot / Color Position</th>
                  <th className="py-3 px-4">Ink SKU Code</th>
                  <th className="py-3 px-4">Ink Name in Inventory</th>
                  <th className="py-3 px-4 text-right">Volume (ml)</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {linkedLinks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                      No linked inks configured for this machine yet. Click "+ Quick Link Ink SKU" to link ink bottles.
                    </td>
                  </tr>
                ) : (
                  linkedLinks.map((lnk: any) => {
                    const ink = inventory.find((i: any) => i.id === lnk.inkCode || i.skuCode === lnk.inkCode);
                    return (
                      <tr key={lnk.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{lnk.slotPosition}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{lnk.inkCode}</td>
                        <td className="py-3 px-4 text-slate-800 font-bold">{ink ? ink.name : '-'}</td>
                        <td className="py-3 px-4 font-mono text-right">{lnk.oemStandardVolumeMl || ink?.volume || 100} ml</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 text-right">
                          {ink ? formatLAK(ink.unitPrice || ink.costPerPurchaseUnit || 0) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              deletePrinterColorLink(lnk.id);
                              showToast('Unlinked ink slot successfully!', 'info');
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Unlink ink SKU"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* OEM vs Actual Compatible Ink Comparison Card Component */}
          <PrinterInkComparisonCard printerItem={machine} currentLang={currentLang} />
        </div>
      )}

      {/* Modals */}
      <EditEquipmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        equipmentItem={machine}
      />

      <RecordMeterModal
        isOpen={isRecordMeterOpen}
        onClose={() => setIsRecordMeterOpen(false)}
        equipmentItem={machine}
      />

      <LogDowntimeModal
        isOpen={isLogDowntimeOpen}
        onClose={() => setIsLogDowntimeOpen(false)}
        equipmentItem={machine}
      />

      <QuickLinkInkModal
        isOpen={isQuickLinkInkOpen}
        onClose={() => setIsQuickLinkInkOpen(false)}
        equipmentItem={machine}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteEquipment}
        itemName={`${machine.name} (${machine.id})`}
      />
    </div>
  );
}
