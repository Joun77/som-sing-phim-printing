import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle, 
  ShieldAlert, 
  Wrench, 
  Printer, 
  Scissors, 
  Layers, 
  Clock, 
  Camera
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import ConfirmDeleteModal, { DeleteActionButton } from '../common/ConfirmDeleteModal';

export default function EquipmentDetailsPage({ equipmentId, onBack }) {
  const { equipment, inventory, updateEquipmentMaintenance, setEquipment, showToast, formatCurrency } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  
  const machine = equipment ? equipment.find(eq => eq.id === equipmentId) : null;
  const linkedInks = (machine && inventory) 
    ? inventory.filter(i => 
        i.category === 'Ink' && (
          i.id === machine.linkedInkSku || 
          i.linkedInkSku === machine.id ||
          (i.linkedMachineIds && i.linkedMachineIds.includes(machine.id)) ||
          i.linkedMachineId === machine.id
        )
      ) 
    : [];

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

  const formatLAK = formatCurrency;

  const isCritical = machine.components && machine.components.some(c => c.usage >= (c.threshold || 90));

  const handleDeleteEquipment = () => {
    if (setEquipment) {
      setEquipment(prev => prev.filter(eq => eq.id !== machine.id));
      showToast(`ລຶບຂໍ້ມູນເຄື່ອງຈັກ "${machine.name}" ສຳເລັດ!`, 'info');
      onBack();
    }
  };

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

        <span className="px-3 py-1 bg-sky-50 text-sky-700 font-mono font-black text-xs rounded-full border border-sky-200 uppercase">
          {machine.category}
        </span>
      </div>

      {/* Main Machine Overview Grid */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Machine Image Display */}
        <div className="md:col-span-4 flex flex-col items-center justify-center">
          {machine.imageUrl || machine.itemPhoto ? (
            <img 
              src={machine.imageUrl || machine.itemPhoto} 
              alt={machine.name} 
              className="w-full h-56 object-contain rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner"
            />
          ) : (
            <div className="w-full h-56 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 flex flex-col items-center justify-center text-slate-400 gap-2">
              {machine.category === 'Cutter' ? <Scissors className="w-12 h-12 text-slate-300" /> : <Printer className="w-12 h-12 text-slate-300" />}
              <span className="text-xs font-bold">{currentLang === 'lo' ? 'ບໍ່ມີຮູບຖ່າຍເຄື່ອງຈັກ' : 'No Machine Image'}</span>
            </div>
          )}
        </div>

        {/* Machine Details Overview */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
              isCritical 
                ? 'text-red-600 bg-red-50 border-red-200 animate-pulse' 
                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
            }`}>
              {isCritical ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              <span>{isCritical ? 'Service Required' : (currentLang === 'lo' ? 'ພ້ອມໃຊ້ງານ (Operational)' : 'Operational')}</span>
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {machine.name}
            </h2>
            <p className="text-xs font-mono font-bold text-slate-400 mt-1 uppercase">
              SKU / Asset ID: {machine.id}
            </p>
          </div>

          {/* Dedicated Machine Specs rendering: Printer vs Cutter vs General */}
          {machine.category === 'Printer' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-100">
                <span className="text-[10px] text-purple-700 uppercase font-black block">{currentLang === 'lo' ? 'ໝຶກທີ່ຮອງຮັບ' : 'Supported Ink'}</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">{machine.specs?.supportedInkType || machine.inkType || 'Pigment Waterproof Ink'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-black block">{currentLang === 'lo' ? 'ຄວາມໄວພິມ' : 'Print Speed'}</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">{machine.specs?.printSpeedColor || machine.printSpeed || '25 PPM'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-black block">{currentLang === 'lo' ? 'ຂະໜາດພິມສູງສຸດ' : 'Max Print Size'}</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">{machine.specs?.maxPaperSize || machine.maxWidth || 'A3+ (330x483mm)'}</span>
              </div>
            </div>
          ) : machine.category === 'Cutter' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-teal-50/60 p-3 rounded-2xl border border-teal-100">
                <span className="text-[10px] text-teal-700 uppercase font-black block">{currentLang === 'lo' ? 'ໜ້າກວ້າງຕັດສູງສຸດ (Max Cut Width)' : 'Max Cut Width'}</span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">{machine.specs?.maxCutWidthMm || machine.cutCapacity || '480'} mm</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-black block">{currentLang === 'lo' ? 'ຂໍ້ມູນທົ່ວໄປ & ຟັງຊັນການເຮັດງານ (Machine Functionality)' : 'Machine Functionality'}</span>
                <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                  {machine.specs?.cuttingSpeed || machine.functionality || 'ເຄື່ອງຕັດເຈາະກະດາດອັດສະລິຍະ ຮອງຮັບການຕັດກະດາດຄວາມໜາສູງສຸດ 400 gsm'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-black block">{currentLang === 'lo' ? 'ອາຍຸການໃຊ້ງານ' : 'Lifespan'}</span>
              <span className="text-sm font-black text-slate-900">{machine.lifespanYears || 5} ປີ</span>
            </div>
          )}
        </div>
      </div>

      {/* Printer Color Slots Pills Display (For Printer category only) */}
      {machine.category === 'Printer' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>{currentLang === 'lo' ? 'Slot ສີໝຶກປະຈຳເຄື່ອງ (Color Slots)' : 'Printer Color Slots'}</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {(machine.specs?.colorSlots || ['Cyan (C)', 'Magenta (M)', 'Yellow (Y)', 'Black (K)']).map((slot, idx) => (
              <span key={idx} className="px-3.5 py-1.5 rounded-full text-xs font-black bg-purple-50 text-purple-900 border border-purple-200 shadow-2xs">
                🎨 {slot}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Printer Ink Consumption Technical Rates (Printer only) */}
      {machine.category === 'Printer' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900">{currentLang === 'lo' ? 'ອັດຕາການສິ້ນເປືອງໝຶກພິມ (Technical Ink Rates)' : 'Technical Ink Rates'}</h4>
              <p className="text-[11px] text-slate-400 font-semibold">ISO 5% Standard Coverage Rates</p>
            </div>
          </div>

          <div className="space-y-3 text-xs font-bold text-slate-700">
            <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-slate-600">{currentLang === 'lo' ? 'ອັດຕາໝຶກດຳ (Black Ink Rate @ 5%):' : 'Black Ink Rate @ 5%:'}</span>
              <span className="font-sans font-black text-purple-700 text-sm">
                {(machine.blackMlPerSheet || 0.0169).toFixed(4)} ml / {currentLang === 'lo' ? 'ແຜ່ນ' : 'sheet'}
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-slate-600">{currentLang === 'lo' ? 'ອັດຕາໝຶກຊຸດສີ (Color Set Rate @ 5%):' : 'Color Set Rate @ 5%:'}</span>
              <span className="font-sans font-black text-purple-700 text-sm">
                {(machine.colorMlPerSheet || machine.inkConsumptionStandard || 0.035).toFixed(4)} ml / {currentLang === 'lo' ? 'ແຜ່ນ' : 'sheet'}
              </span>
            </div>

            {/* Linked Inventory Ink Items (CMYK / Individual Colors) */}
            <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-3">
              <span className="text-[10px] text-purple-700 uppercase font-black block">
                {currentLang === 'lo' ? 'ລາຍການນ້ຳໝຶກທີ່ເຊື່ອมໂຍງ (Linked CMYK Inks):' : 'Linked CMYK Inks:'}
              </span>
              {linkedInks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {linkedInks.map(ink => {
                    const colorModel = ink.colorModel || ink.specs?.colorModel || ink.inkColor || '';
                    const isCyan = colorModel.toLowerCase().includes('cyan') || ink.name.toLowerCase().includes('cyan');
                    const isMagenta = colorModel.toLowerCase().includes('magenta') || ink.name.toLowerCase().includes('magenta');
                    const isYellow = colorModel.toLowerCase().includes('yellow') || ink.name.toLowerCase().includes('yellow');
                    const isBlack = colorModel.toLowerCase().includes('black') || ink.name.toLowerCase().includes('black');
                    
                    let colorPill = 'bg-slate-100 text-slate-800';
                    if (isCyan) colorPill = 'bg-cyan-100 text-cyan-800 border border-cyan-200';
                    else if (isMagenta) colorPill = 'bg-pink-100 text-pink-800 border border-pink-200';
                    else if (isYellow) colorPill = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
                    else if (isBlack) colorPill = 'bg-neutral-900 text-white border border-neutral-800';

                    return (
                      <div key={ink.id} className="bg-white p-3 rounded-xl border border-purple-200/40 flex flex-col justify-between space-y-1.5 shadow-2xs">
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-extrabold text-slate-800 text-[11px] leading-tight block truncate max-w-[150px]" title={ink.name}>
                            {ink.name}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${colorPill}`}>
                            {colorModel || 'Ink'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-mono">{ink.id}</span>
                          <span className="font-black text-emerald-600 font-sans">
                            {ink.stockQty.toLocaleString()} ml
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-purple-900/60 font-bold">
                  {currentLang === 'lo' ? 'ຍັງບໍ່ມີນ້ຳໝຶກທີ່ເຊື່ອມໂຍง' : 'No inks linked to this printer yet'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Component Wear & Maintenance Health */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900">{currentLang === 'lo' ? 'ສະຖານະຊິ້ນສ່ວນ & ບຳລຸງຮັກສາ (SLA Component Wear)' : 'SLA Component Wear'}</h4>
              <p className="text-[11px] text-slate-400 font-semibold">Track wear percentages & component SLA thresholds</p>
            </div>
          </div>
          <button
            onClick={() => {
              updateEquipmentMaintenance(machine.id);
              showToast(currentLang === 'lo' ? `ຣີເຊັດຄ່າບຳລຸງຮັກສາເຄື່ອງ "${machine.name}" ສຳເລັດ!` : 'Maintenance reset successfully!', 'success');
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition cursor-pointer active:scale-95"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>SLA Reset</span>
          </button>
        </div>

        <div className="space-y-3">
          {machine.components && machine.components.length > 0 ? (
            machine.components.map((comp, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">{comp.name}</span>
                  <span className={comp.usage >= (comp.threshold || 90) ? 'text-red-600 font-black' : 'text-slate-600 font-sans'}>
                    {comp.usage}% / {comp.threshold || 90}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      comp.usage >= (comp.threshold || 90) ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, comp.usage)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 font-semibold">{currentLang === 'lo' ? 'ບໍ່ມີຂໍ້ມູນສະຖານະຊິ້ນສ່ວນອາໄຫຼ່' : 'No component data available'}</p>
          )}
        </div>
      </div>

      {/* Payment Slip Attachment Card */}
      {machine.paymentSlip && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-600" />
            {currentLang === 'lo' ? 'ຫຼັກຖານການຈ່າຍເງິນ / ສະລິບ (Payment Slip)' : 'Payment Slip'}
          </h4>
          <div className="h-52 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center">
            <img src={machine.paymentSlip} alt="Payment Slip" className="w-full h-48 object-contain rounded-lg" />
          </div>
        </div>
      )}

      {/* Bottom Action Footer with Reusable Delete Button */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-end gap-3">
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
