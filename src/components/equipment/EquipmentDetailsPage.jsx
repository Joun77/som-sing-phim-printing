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
  Laptop
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import ConfirmDeleteModal, { DeleteActionButton } from '../common/ConfirmDeleteModal';

export default function EquipmentDetailsPage({ equipmentId, onBack }) {
  const { equipment, inventory, printerColorLinks, updateEquipmentMaintenance, setEquipment, showToast, formatCurrency } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  
  const machine = equipment ? equipment.find(eq => eq.id === equipmentId) : null;
  const formatLAK = formatCurrency;
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!machine) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
        <p className="text-slate-500 font-bold">ບໍ່ພົບຂໍ້ມູນໂປຣໄຟລ໌ເຄື່ອງຈັກ (Machine Profile Not Found)</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold"
        >
          ກັບຄືນຮາຍການເຄື່ອງຈັກ
        </button>
      </div>
    );
  }

  const isCritical = machine.components && machine.components.some(c => c.usage >= (c.threshold || 90));

  const handleDeleteEquipment = () => {
    if (setEquipment) {
      setEquipment(prev => prev.filter(eq => eq.id !== machine.id));
      showToast(`ລຶບຂໍ້ມູນເຄື່ອງຈັກ "${machine.name}" ສຳເລັດ!`, 'info');
      onBack();
    }
  };

  // Get printer linked inks
  const linkedLinks = printerColorLinks.filter(lnk => lnk.assetId === machine.id);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 font-sans pb-12">
      {/* Top Header Card */}
      <div className="flex items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-200 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-100 rounded-2xl border border-slate-200 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentLang === 'lo' ? 'ກັບໜ້າຈັດຮາຍການເຄື່ອງຈັກ (Back to Machinery)' : 'Back to Machinery'}</span>
        </button>

        <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* Vertical Form Spec Sheet (5 Categories) */}
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
              <span className="text-slate-400 uppercase text-[10px] block">Print Speed (Black / Color)</span>
              <span className="text-xs text-slate-900 block mt-1">{machine.printSpeedColor || machine.printSpeed || '25 PPM / 60 PPM'}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block">Max Resolution</span>
              <span className="text-xs text-slate-900 block mt-1">{machine.resolution || machine.maxResolution || '1200 x 1200 DPI'}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block">Supported Paper Sizes</span>
              <span className="text-xs text-slate-900 block mt-1">{machine.paperSizes || 'A4, A3, SRA3, 13x19"'}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block">Paper Tray Capacity</span>
              <span className="text-xs text-slate-900 block mt-1">{machine.trayCapacity || '1,500 Sheets'}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block">Duplex Printing</span>
              <span className="text-xs text-slate-900 block mt-1">{machine.duplex ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block">Registered Functions</span>
              <span className="text-xs text-slate-900 block mt-1">{(machine.functions && machine.functions.join(', ')) || 'Print, Scan, Copy'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-slate-400 uppercase text-[10px] block">Scanner Specs</span>
              <span className="text-xs text-slate-900 block mt-1">{machine.scannerSpecs || 'Dual-scan ADF, 240 opm'}</span>
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
              <span className="text-xs text-slate-900 font-mono block mt-1">{machine.ipAddress || machine.ip || '192.168.1.120'}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block">MAC Address</span>
              <span className="text-xs text-slate-900 font-mono block mt-1">{machine.macAddress || machine.mac || '00:1A:2B:3C:4D:5E'}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block">OS Compatibility</span>
              <span className="text-xs text-slate-900 block mt-1">{(machine.osCompatibility && machine.osCompatibility.join(', ')) || 'Windows, macOS, Linux'}</span>
            </div>
          </div>
        </div>

        {/* CATEGORY 4: Linked Colors & Consumables */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Category 4: Linked Colors & Consumables (Dynamic Section)</span>
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-black">
                  <th className="py-3 px-4">Slot / Color Name</th>
                  <th className="py-3 px-4">Color Code (Ink Code)</th>
                  <th className="py-3 px-4">Ink Model / Name</th>
                  <th className="py-3 px-4 text-right">Volume</th>
                  <th className="py-3 px-4">Ink Type</th>
                  <th className="py-3 px-4">OEM / Compatible</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {linkedLinks.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400 font-bold">
                      No linked inks found for this machine. Register inks via Inbound procurement to link colors.
                    </td>
                  </tr>
                ) : (
                  linkedLinks.map(lnk => {
                    const ink = inventory.find(i => i.id === lnk.inkCode);
                    return (
                      <tr key={lnk.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-800">{lnk.slotPosition}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{lnk.inkCode}</td>
                        <td className="py-3 px-4 text-slate-700">{ink ? ink.name : '-'}</td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-right">{ink?.volume || ink?.purchaseMultiplier || '-'} ml</td>
                        <td className="py-3 px-4 text-slate-600">{ink?.inkBaseType || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            ink?.isCompatible ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-green-50 text-green-700 border border-green-100'
                          }`}>
                            {ink?.isCompatible ? 'Compatible' : 'OEM'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-600 font-bold text-right">{ink ? formatLAK(ink.unitPrice || ink.costPerPurchaseUnit || 0) : '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Component wear (Maintenance units) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Maintenance Units SLA Health</span>
              <button
                onClick={() => {
                  updateEquipmentMaintenance(machine.id);
                  showToast(currentLang === 'lo' ? `ຣີເຊັດຄ່າບຳລຸງຮັກສາເຄື່ອງ "${machine.name}" ສຳເລັດ!` : 'Maintenance reset successfully!', 'success');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-xl border border-indigo-200 transition cursor-pointer active:scale-95"
              >
                <Wrench className="w-3 h-3" />
                <span>SLA Reset</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {machine.components && machine.components.map((comp, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">{comp.name}</span>
                    <span className={comp.usage >= (comp.threshold || 90) ? 'text-red-600 font-black' : 'text-slate-700 font-mono'}>
                      {comp.usage}% / {comp.threshold || 90}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
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
        </div>

        {/* CATEGORY 5: Purchasing & Document Links */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Category 5: Purchasing & Document Links</span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-bold text-slate-600">
            <div>
              <span className="text-slate-400 uppercase text-[10px] block">Purchase Date</span>
              <span className="text-xs text-slate-900 block mt-1">{machine.purchaseDate || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block">Price / Cost</span>
              <span className="text-xs text-slate-900 font-mono block mt-1">{formatLAK(machine.purchaseCost || machine.price || 0)}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block">Vendor / Supplier</span>
              <span className="text-xs text-slate-900 block mt-1">{machine.vendor || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block">Warranty Expiry Year</span>
              <span className="text-xs text-slate-900 block mt-1">{machine.warrantyExpirationYear || machine.warrantyExpiration || '-'}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
            {machine.receiptUrl || machine.paymentSlip ? (
              <a
                href={machine.receiptUrl || machine.paymentSlip}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition border border-slate-200 shadow-2xs"
              >
                <FileText className="w-4 h-4 text-amber-600" />
                <span>View Receipt / Invoice Link</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            ) : null}

            {machine.supplierLink || machine.vendorLink ? (
              <a
                href={machine.supplierLink || machine.vendorLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition border border-slate-200 shadow-2xs"
              >
                <span>Supplier Link</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            ) : null}
          </div>
        </div>

      </div>

      {/* Bottom Action Footer with Reusable Delete Button */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
        <span className="text-xs text-slate-400 font-semibold">Location / Dept: {machine.location || 'Main Office'}</span>
        <DeleteActionButton onClick={() => setIsDeleteModalOpen(true)} />
      </div>

      {/* Reusable Confirm Delete Modal Component */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteEquipment}
        itemName={`${machine.name} (${machine.id})`}
      />
    </div>
  );
}
