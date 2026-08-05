import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { 
  Cpu, 
  Plus, 
  Wrench, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Clock,
  Activity,
  Layers,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Printer,
  Scissors
} from 'lucide-react';

export default function EquipmentOverhead() {
  const { 
    equipment, 
    addEquipment, 
    updateEquipmentComponentUsage, 
    resetEquipmentComponent,
    updateEquipmentMaintenance,
    showToast,
    askConfirmation
  } = useApp();

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const [isOpen, setIsOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);

  // Wizard Step states
  const [addStep, setAddStep] = useState(1); // 1 to 3
  const [serviceStep, setServiceStep] = useState(1); // 1 to 4

  // Add Equipment Form States
  const [eqName, setEqName] = useState('');
  const [eqCost, setEqCost] = useState(15000000);
  const [eqLifespan, setEqLifespan] = useState(5);
  const [eqCapacity, setEqCapacity] = useState(100000);
  const [eqCategory, setEqCategory] = useState('Printer');
  const [eqPrinterType, setEqPrinterType] = useState('Laser');
  const [eqPurchaseDate, setEqPurchaseDate] = useState('2026-08-04');
  const [eqWarrantyDate, setEqWarrantyDate] = useState('2028-08-04');

  // Service Log Form States
  const [serviceEqId, setServiceEqId] = useState('');
  const [selectedCompName, setSelectedCompName] = useState('');
  const [serviceActionType, setServiceActionType] = useState('reset');
  const [serviceNewUsage, setServiceNewUsage] = useState(0);
  const [serviceNote, setServiceNote] = useState('');

  const todayStr = '2026-08-04';

  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num).replace('LAK', '₭');
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!eqName || eqCost <= 0 || eqCapacity <= 0) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ!' : 'Please fill all required fields!', 'warning');
      return;
    }

    let components = [];
    if (eqPrinterType === 'Laser') {
      components = [
        { name: 'Drum Unit (ຊຸດດຣຳ)', usage: 0, threshold: 90 },
        { name: 'Fuser Kit (ຊຸດຄວາມຮ້ອນ)', usage: 0, threshold: 90 },
        { name: 'Waste Toner (ກ່ອງໝຶກເສຍ)', usage: 0, threshold: 95 }
      ];
    } else if (eqPrinterType === 'Inkjet') {
      components = [
        { name: 'Printhead (ຫົວພິມ)', usage: 0, threshold: 90 },
        { name: 'Maintenance Box (ກ່ອງຊັບໝຶກ)', usage: 0, threshold: 90 }
      ];
    } else if (eqPrinterType === 'Large Format') {
      components = [
        { name: 'Printhead Status (ຫົວພິມໃຫຍ່)', usage: 0, threshold: 85 },
        { name: 'Carriage Belt (ສາຍພານ)', usage: 0, threshold: 90 },
        { name: 'Encoder Strip (ແຖບຕຳແໜ່ງ)', usage: 0, threshold: 90 }
      ];
    } else {
      components = [
        { name: 'Blade Lifespan (ໃບມີດ)', usage: 0, threshold: 95 },
        { name: 'Cutting Stick (ແທ່ງຮອງ)', usage: 0, threshold: 90 }
      ];
    }

    addEquipment({
      name: eqName,
      purchaseCost: Number(eqCost),
      lifespanYears: Number(eqLifespan),
      printedPagesCapacity: Number(eqCapacity),
      category: eqCategory,
      printerType: eqPrinterType,
      purchaseDate: eqPurchaseDate,
      warrantyExpiration: eqWarrantyDate,
      components
    });

    showToast(currentLang === 'lo' ? 'ເພີ່ມເຄື່ອງຈັກໃໝ່ສຳເລັດ!' : 'New equipment added successfully!', 'success');
    setIsOpen(false);
    setEqName('');
    setEqCost(15000000);
    setEqLifespan(5);
    setEqCapacity(100000);
    setAddStep(1);
  };

  const handleServiceSubmit = (e) => {
    e.preventDefault();
    if (!serviceEqId || !selectedCompName) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກເຄື່ອງຈັກ ແລະ ອົງປະກອບ!' : 'Select asset and component!', 'warning');
      return;
    }

    if (serviceActionType === 'reset') {
      resetEquipmentComponent(serviceEqId, selectedCompName);
    } else {
      updateEquipmentComponentUsage(serviceEqId, selectedCompName, serviceNewUsage);
    }

    showToast(currentLang === 'lo' ? 'ບັນທຶກການບຳລຸງຮັກສາອົງປະກອບສຳເລັດ!' : 'Component wear logged successfully!', 'success');
    setIsServiceOpen(false);
    setServiceEqId('');
    setSelectedCompName('');
    setServiceNote('');
    setServiceStep(1);
  };

  const selectedServiceEq = equipment.find(e => e.id === serviceEqId);

  const criticalComponents = [];
  equipment.forEach(eq => {
    if (eq.components) {
      eq.components.forEach(comp => {
        if (comp.usage >= comp.threshold) {
          criticalComponents.push({ eqName: eq.name, compName: comp.name, usage: comp.usage, limit: comp.threshold });
        }
      });
    }
  });

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      
      {/* Header card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-primary-navy tracking-tight">
            {t('equipment.title')}
          </h2>
          <p className="text-base text-slate-500 font-semibold leading-relaxed">
            {t('equipment.subtitle')}
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => {
              setServiceStep(1);
              if (equipment.length > 0) {
                setServiceEqId(equipment[0].id);
                if (equipment[0].components && equipment[0].components.length > 0) {
                  setSelectedCompName(equipment[0].components[0].name);
                }
              }
              setIsServiceOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 text-white rounded-2xl text-base font-extrabold shadow-md shadow-emerald-500/10 hover:bg-emerald-700 transition min-h-[48px]"
          >
            <Wrench className="w-5 h-5 shrink-0" />
            <span>{t('equipment.btn_service')}</span>
          </button>
          <button
            onClick={() => {
              setAddStep(1);
              setIsOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-accent-sky text-white rounded-2xl text-base font-extrabold shadow-md shadow-accent-sky/15 hover:bg-accent-sky/95 transition min-h-[48px]"
          >
            <Plus className="w-5 h-5 shrink-0" />
            <span>{t('equipment.btn_add')}</span>
          </button>
        </div>
      </div>

      {/* Critical Components Alert Banner (No Emojis, clean layout) */}
      {criticalComponents.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-3xl shadow-sm space-y-3.5">
          <div className="flex items-center gap-2.5 text-red-800 font-extrabold text-lg">
            <AlertTriangle className="w-6 h-6 shrink-0 text-red-600 animate-bounce" />
            <span>{t('equipment.alert_critical')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {criticalComponents.map((comp, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-red-100 text-sm flex justify-between items-center shadow-sm">
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-800 block truncate max-w-[150px]">{comp.eqName}</span>
                  <span className="text-xs text-slate-400 font-bold">{comp.compName}</span>
                </div>
                <span className="text-xs bg-red-100 text-red-800 font-black px-2.5 py-1 rounded-lg border border-red-200">
                  {comp.usage}% / {comp.limit}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment List Grid with accessible contrast */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment.map((eq) => {
          const isWarrantyExpired = eq.warrantyExpiration < todayStr;
          
          return (
            <div 
              key={eq.id} 
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300"
            >
              <div className="space-y-5">
                <div className="flex justify-between items-center gap-4">
                  <span className={`
                    px-3 py-1 rounded-xl text-xs font-black uppercase border
                    ${eq.printerType === 'Laser' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : ''}
                    ${eq.printerType === 'Inkjet' ? 'bg-teal-50 text-teal-700 border-teal-100' : ''}
                    ${eq.printerType === 'Large Format' ? 'bg-purple-50 text-purple-700 border-purple-100' : ''}
                    ${eq.printerType === 'Cutter' ? 'bg-amber-50 text-amber-700 border-amber-100' : ''}
                  `}>
                    {eq.printerType}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 font-mono">ID: {eq.id}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-lg line-clamp-1">
                    {eq.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold flex flex-wrap gap-2">
                    <span>{t('equipment.card_purchase')}: {eq.purchaseDate}</span>
                    <span>|</span>
                    <span>
                      {t('equipment.card_warranty')}: 
                      <span className={`ml-1 ${isWarrantyExpired ? 'text-red-500 font-black' : 'text-slate-600 font-bold'}`}>
                        {eq.warrantyExpiration}
                      </span>
                    </span>
                  </p>
                </div>

                {/* Wear progress metrics */}
                {eq.components && eq.components.length > 0 && (
                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                      {t('equipment.card_components')}
                    </span>
                    <div className="space-y-3.5">
                      {eq.components.map((comp, idx) => {
                        const isCritical = comp.usage >= comp.threshold;
                        return (
                          <div key={idx} className="space-y-2">
                            <div className="flex justify-between text-xs font-extrabold">
                              <span className="text-slate-700 flex items-center gap-1.5">
                                {comp.name}
                                {isCritical && <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-ping shrink-0" />}
                              </span>
                              <span className={`font-sans font-black ${isCritical ? 'text-red-600' : 'text-slate-700'}`}>
                                {comp.usage}% / {comp.threshold}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border">
                              <div 
                                className={`h-full rounded-full transition-all ${isCritical ? 'bg-red-500' : 'bg-accent-sky'}`} 
                                style={{ width: `${Math.min(100, comp.usage)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Costs details */}
                <div className="bg-slate-50 p-4 rounded-2xl border text-xs space-y-1.5 font-bold text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('equipment.card_depreciation')}</span>
                    <span className="font-black text-slate-900 font-sans">{formatLAK(eq.printedCount * eq.calculatedCostPerPage)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('equipment.card_printed')}</span>
                    <span className="font-black text-slate-900 font-sans">{eq.printedCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Maintenance actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => {
                    setServiceEqId(eq.id);
                    if (eq.components && eq.components.length > 0) {
                      setSelectedCompName(eq.components[0].name);
                    }
                    setServiceStep(1);
                    setIsServiceOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-black transition active:scale-95 min-h-[44px]"
                >
                  <Wrench className="w-4 h-4 text-accent-sky shrink-0" />
                  <span>{t('equipment.btn_update_comp')}</span>
                </button>
                <button
                  onClick={() => {
                    const msg = currentLang === 'lo' 
                      ? `ທ່ານຕ້ອງການຣີເຊັດອົງປະກອບທັງໝົດຂອງ ${eq.name} ເປັນ 0% ຫຼື ບໍ່?` 
                      : `Reset all component wear levels of ${eq.name} to 0%?`;
                    
                    askConfirmation(msg, () => {
                      updateEquipmentMaintenance(eq.id);
                      showToast(currentLang === 'lo' ? 'ຣີເຊັດອົງປະກອບທັງໝົດສຳເລັດ!' : 'All components reset successfully!', 'success');
                    });
                  }}
                  className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100/50 transition active:scale-95 min-h-[44px]"
                  title="Mark serviced"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ACCESSIBLE STEP-BY-STEP ADD EQUIPMENT WIZARD */}
      {isOpen && (
        <dialog
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent outline-none border-none w-full h-full"
          open
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 z-10 border border-slate-100 animate-fade-in flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b pb-4 mb-5">
                <div>
                  <span className="text-xs uppercase font-extrabold text-accent-sky tracking-wider font-sans">
                    Step {addStep} of 3
                  </span>
                  <h3 className="text-xl font-black text-primary-navy mt-1">
                    {t('equipment.modal_add_title')}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex gap-2 mb-6">
                {[1, 2, 3].map(st => (
                  <div 
                    key={st} 
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${st <= addStep ? 'bg-accent-sky' : 'bg-slate-100'}`}
                  />
                ))}
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                
                {/* STEP 1: PRINTER TYPE SELECT (visual cards grid) */}
                {addStep === 1 && (
                  <div className="space-y-3.5 animate-fade-in">
                    <label className="text-sm font-extrabold text-slate-800 block">Choose Printer Type:</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { type: 'Laser', icon: Printer, desc: 'Drum, Fuser' },
                        { type: 'Inkjet', icon: Zap, desc: 'Printhead, Pad' },
                        { type: 'Large Format', icon: Layers, desc: 'Encoder, Belt' },
                        { type: 'Cutter', icon: Scissors, desc: 'Blade, Stick' }
                      ].map(pt => {
                        const Icon = pt.icon;
                        const active = eqPrinterType === pt.type;
                        return (
                          <button
                            key={pt.type}
                            type="button"
                            onClick={() => setEqPrinterType(pt.type)}
                            className={`p-4 border-2 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition ${
                              active 
                                ? 'border-accent-sky bg-blue-50/50 text-primary-navy shadow-sm' 
                                : 'border-slate-200 hover:border-slate-300 text-slate-500 bg-white'
                            }`}
                          >
                            <Icon className={`w-6 h-6 ${active ? 'text-accent-sky' : 'text-slate-400'}`} />
                            <span className="font-extrabold text-sm block">{pt.type}</span>
                            <span className="text-[10px] text-slate-400 font-bold block">{pt.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 2: NAME & VALUE OVERHEAD */}
                {addStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Equipment Model Name *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Konica Minolta C6085"
                        value={eqName}
                        onChange={(e) => setEqName(e.target.value)}
                        className="w-full min-h-[48px] px-4 py-2 border-2 rounded-xl focus:outline-none text-sm font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Purchase Cost (LAK) *</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={eqCost}
                        onChange={(e) => setEqCost(Number(e.target.value))}
                        className="w-full min-h-[48px] px-4 py-2 border-2 rounded-xl focus:outline-none text-sm font-sans font-bold text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: SCHEDULES & CAPACITY LIMITS */}
                {addStep === 3 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">Purchase Date *</label>
                        <input 
                          type="date" 
                          required
                          value={eqPurchaseDate}
                          onChange={(e) => setEqPurchaseDate(e.target.value)}
                          className="w-full min-h-[44px] px-3 py-2 border-2 rounded-xl focus:outline-none text-xs font-sans font-bold bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">Warranty Expire *</label>
                        <input 
                          type="date" 
                          required
                          value={eqWarrantyDate}
                          onChange={(e) => setEqWarrantyDate(e.target.value)}
                          className="w-full min-h-[44px] px-3 py-2 border-2 rounded-xl focus:outline-none text-xs font-sans font-bold bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">SLA Lifespan (Years) *</label>
                        <input 
                          type="number" 
                          required
                          min="1"
                          value={eqLifespan}
                          onChange={(e) => setEqLifespan(Number(e.target.value))}
                          className="w-full min-h-[44px] px-3 py-2 border-2 rounded-xl focus:outline-none text-xs font-sans"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">Print SLA Capacity *</label>
                        <input 
                          type="number" 
                          required
                          min="1"
                          value={eqCapacity}
                          onChange={(e) => setEqCapacity(Number(e.target.value))}
                          className="w-full min-h-[44px] px-3 py-2 border-2 rounded-xl focus:outline-none text-xs font-sans"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Wizard Navigation Footer */}
            <div className="flex justify-between items-center border-t pt-4 mt-6 gap-3">
              <div>
                {addStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setAddStep(addStep - 1)}
                    className="flex items-center gap-1 px-4 py-2 border-2 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition min-h-[40px]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold transition"
                >
                  {t('common.cancel')}
                </button>
                
                {addStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAddStep(addStep + 1);
                    }}
                    className="flex items-center gap-1 px-5 py-2 bg-accent-sky text-white rounded-xl text-xs font-bold hover:bg-accent-sky/95 transition min-h-[40px]"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddSubmit}
                    className="px-5 py-2 bg-accent-sky hover:bg-accent-sky/95 text-white rounded-xl text-xs font-bold transition min-h-[40px]"
                  >
                    {t('common.confirm')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </dialog>
      )}

      {/* ACCESSIBLE STEP-BY-STEP DYNAMIC SERVICE LOG WIZARD */}
      {isServiceOpen && (
        <dialog
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent outline-none border-none w-full h-full"
          open
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsServiceOpen(false)} />
          
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 z-10 border border-slate-100 animate-fade-in flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b pb-4 mb-5">
                <div>
                  <span className="text-xs uppercase font-extrabold text-emerald-600 tracking-wider font-sans">
                    Step {serviceStep} of 4
                  </span>
                  <h3 className="text-xl font-black text-primary-navy mt-1">
                    {t('equipment.modal_service_title')}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsServiceOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* step bar */}
              <div className="flex gap-2 mb-6">
                {[1, 2, 3, 4].map(st => (
                  <div 
                    key={st} 
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${st <= serviceStep ? 'bg-emerald-500' : 'bg-slate-100'}`}
                  />
                ))}
              </div>

              <form onSubmit={handleServiceSubmit} className="space-y-4">
                {/* STEP 1: SELECT MACHINE (visual cards list) */}
                {serviceStep === 1 && (
                  <div className="space-y-3.5 animate-fade-in">
                    <label className="text-sm font-extrabold text-slate-800 block">Choose Machinery Asset:</label>
                    <div className="grid grid-cols-1 gap-2.5 max-h-[240px] overflow-y-auto pr-1">
                      {equipment.map(eq => {
                        const selected = serviceEqId === eq.id;
                        return (
                          <button
                            key={eq.id}
                            type="button"
                            onClick={() => {
                              setServiceEqId(eq.id);
                              if (eq.components && eq.components.length > 0) {
                                setSelectedCompName(eq.components[0].name);
                                setServiceNewUsage(eq.components[0].usage);
                              }
                            }}
                            className={`p-3.5 border-2 rounded-2xl text-left transition flex items-center justify-between ${
                              selected 
                                ? 'border-emerald-500 bg-emerald-50/20 text-emerald-950 font-bold shadow-sm' 
                                : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                            }`}
                          >
                            <div>
                              <span className="text-sm font-bold block">{eq.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{eq.printerType} | Printed: {eq.printedCount.toLocaleString()}</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                              {selected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 2: SELECT COMPONENT (visual cards list) */}
                {serviceStep === 2 && selectedServiceEq && (
                  <div className="space-y-3.5 animate-fade-in">
                    <label className="text-sm font-extrabold text-slate-800 block">Choose component to update:</label>
                    <div className="grid grid-cols-1 gap-2 max-h-[240px] overflow-y-auto pr-1">
                      {selectedServiceEq.components.map((comp, idx) => {
                        const selected = selectedCompName === comp.name;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedCompName(comp.name);
                              setServiceNewUsage(comp.usage);
                            }}
                            className={`p-3.5 border-2 rounded-2xl text-left transition flex items-center justify-between ${
                              selected 
                                ? 'border-emerald-500 bg-emerald-50/20 text-emerald-950 font-bold shadow-sm' 
                                : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                            }`}
                          >
                            <div>
                              <span className="text-sm font-bold block">{comp.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Current wear: {comp.usage}% / threshold: {comp.threshold}%</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                              {selected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 3: ACTION SELECTION */}
                {serviceStep === 3 && (
                  <div className="space-y-4 animate-fade-in">
                    <label className="text-sm font-extrabold text-slate-800 block">Select maintenance action:</label>
                    
                    <div className="flex gap-2.5 p-1 bg-slate-100 rounded-2xl border">
                      <button
                        type="button"
                        onClick={() => {
                          setServiceActionType('reset');
                          setServiceNewUsage(0);
                        }}
                        className={`flex-1 py-3 text-sm font-black rounded-xl transition ${serviceActionType === 'reset' ? 'bg-white text-primary-navy shadow-sm border' : 'text-slate-500'}`}
                      >
                        Reset Wear to 0%
                      </button>
                      <button
                        type="button"
                        onClick={() => setServiceActionType('manual')}
                        className={`flex-1 py-3 text-sm font-black rounded-xl transition ${serviceActionType === 'manual' ? 'bg-white text-primary-navy shadow-sm border' : 'text-slate-500'}`}
                      >
                        Set Custom Wear
                      </button>
                    </div>

                    {serviceActionType === 'manual' && (
                      <div className="space-y-2 pt-2 animate-fade-in">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Set Wear ratio (0-100%) *</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={serviceNewUsage}
                          onChange={(e) => setServiceNewUsage(Number(e.target.value))}
                          className="w-full min-h-[48px] px-4 py-2 border-2 rounded-xl focus:outline-none text-base font-black font-sans text-slate-900"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4: SERVICE NOTES */}
                {serviceStep === 4 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Service Notes / Remarks</label>
                      <textarea
                        placeholder="Replaced rollers, flushed nozzles, aligned belts..."
                        value={serviceNote}
                        onChange={(e) => setServiceNote(e.target.value)}
                        rows="3"
                        className="w-full p-3 border-2 rounded-xl focus:outline-none text-sm font-semibold"
                      />
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Wizard Navigation Footer */}
            <div className="flex justify-between items-center border-t pt-4 mt-6 gap-3">
              <div>
                {serviceStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setServiceStep(serviceStep - 1)}
                    className="flex items-center gap-1 px-4 py-2 border-2 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition min-h-[40px]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsServiceOpen(false)}
                  className="px-4 py-2 border hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold transition"
                >
                  {t('common.cancel')}
                </button>
                
                {serviceStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (serviceStep === 1 && !serviceEqId) {
                        showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກເຄື່ອງຈັກກ່ອນ!' : 'Please select asset first!', 'warning');
                        return;
                      }
                      if (serviceStep === 2 && !selectedCompName) {
                        showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກອົງປະກອບກ່ອນ!' : 'Please select component first!', 'warning');
                        return;
                      }
                      setServiceStep(serviceStep + 1);
                    }}
                    className="flex items-center gap-1 px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition min-h-[40px]"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleServiceSubmit}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition min-h-[40px]"
                  >
                    {t('common.confirm')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
