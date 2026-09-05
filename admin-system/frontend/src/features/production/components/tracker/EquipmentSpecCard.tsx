import React, { useState } from 'react';
import {
  Printer,
  Scissors,
  Layers,
  Settings,
  Activity,
  CheckCircle2,
  Clock,
  RefreshCw,
  History,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import type { Equipment } from '../../../equipment/types';
import type { MachineChangeLog } from './types';
import { MachineSelectModal } from './MachineSelectModal';
import { calculateEquipmentPrintCost } from '../../../../utils/machineCostCalculator';
import { useApp } from '../../../../store/AppContext';

interface EquipmentSpecCardProps {
  item: any;
  availableMachines?: Equipment[];
  onMachineChanged?: (log: MachineChangeLog) => void;
}

export const EquipmentSpecCard: React.FC<EquipmentSpecCardProps> = ({
  item,
  availableMachines = [],
  onMachineChanged,
}) => {
  const { printerColorLinks = [], inventory = [] } = useApp();
  const [dbInks, setDbInks] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/inbound')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.data || [];
        const inks = items
          .filter((i: any) => {
            const c = (i.category || '').toUpperCase();
            const sku = (i.skuCode || i.id || '').toUpperCase();
            const name = (i.itemName || i.name || '').toUpperCase();
            return (
              c.includes('INK') ||
              name.includes('INK') ||
              name.includes('TONER') ||
              name.includes('ໝຶກ') ||
              sku.startsWith('INK')
            );
          })
          .map((m: any) => ({
            id: m.skuCode || m.id,
            sku: m.skuCode || m.id,
            skuCode: m.skuCode || m.id,
            name: m.itemName || m.name || m.skuCode || m.id,
            unitPrice: Number(
              m.unitPrice ||
                m.costPerPurchaseUnit ||
                (m.totalPrice && m.quantity ? Math.round(Number(m.totalPrice) / Number(m.quantity)) : 0)
            ),
            volume: Number(m.specs?.volume || m.specs?.volume_ml || 140),
            yield: Number(m.specs?.yield || m.specs?.expectedYield || m.specs?.isoYield || m.yield || 0),
          }));
        if (inks.length > 0) setDbInks(inks);
      })
      .catch(() => {});
  }, []);

  const allAvailableInks = React.useMemo(() => [...inventory, ...dbInks], [inventory, dbInks]);

  // Machine assignments state
  const defaultPress = item.page_count > 10 || item.quantity > 500
    ? 'Heidelberg Speedmaster SM52 (Offset 4-Color)'
    : 'Konica Minolta AccurioPress C4080 (Digital Color)';
  
  const defaultCutter = 'Polar 78 ECO Guillotine Cutter';

  const defaultFinish = item.binding_type === 'HARDCOVER_CASE_BINDING'
    ? 'Kolbus Case Maker / Hardcover Binding (ປົກແຂງຈົ່ວປັງ)'
    : item.binding_type === 'PERFECT_HOT_GLUE'
    ? 'Horizon BQ-270V Perfect Binder (ກາວຮ້ອນ)'
    : item.binding_type === 'WIRE_O'
    ? 'Renz DTP 340A Wire-O Binder (ສັນຂົດລວດ)'
    : 'Foliant Vega 400A Thermal Laminator (ເຄືອບຟິມ)';

  const [pressMachine, setPressMachine] = useState<string>(item.assigned_press_name || defaultPress);
  const [cutterMachine, setCutterMachine] = useState<string>(item.assigned_cutter_name || defaultCutter);
  const [finishMachine, setFinishMachine] = useState<string>(item.assigned_finish_name || defaultFinish);

  // Derive accurate machine costs
  const pressObj = availableMachines.find(m => m.name === pressMachine || m.id === pressMachine) || { name: pressMachine, category: 'Printer' };
  const cutterObj = availableMachines.find(m => m.name === cutterMachine || m.id === cutterMachine) || { name: cutterMachine, category: 'Cutter' };
  const finishObj = availableMachines.find(m => m.name === finishMachine || m.id === finishMachine) || { name: finishMachine, category: item.binding_type === 'NONE' ? 'Laminator' : 'Binder' };

  const finishCategory = item.binding_type === 'NONE' ? 'Laminator' : 'Binder';
  const pressCost = calculateEquipmentPrintCost(pressObj, printerColorLinks, allAvailableInks, 'Printer');
  const cutterCost = calculateEquipmentPrintCost(cutterObj, printerColorLinks, allAvailableInks, 'Cutter');
  const finishCost = calculateEquipmentPrintCost(finishObj, printerColorLinks, allAvailableInks, finishCategory);

  // Modal State
  const [modalCategory, setModalCategory] = useState<'Printer' | 'Cutter' | 'Binder' | 'Laminator' | null>(null);
  const [changeLogs, setChangeLogs] = useState<MachineChangeLog[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  const handleOpenSelect = (cat: 'Printer' | 'Cutter' | 'Binder' | 'Laminator') => {
    setModalCategory(cat);
  };

  const handleApplyMachine = (machine: Equipment, reason: string) => {
    if (!modalCategory) return;

    let prevName = '';
    if (modalCategory === 'Printer') {
      prevName = pressMachine;
      setPressMachine(machine.name);
    } else if (modalCategory === 'Cutter') {
      prevName = cutterMachine;
      setCutterMachine(machine.name);
    } else {
      prevName = finishMachine;
      setFinishMachine(machine.name);
    }

    const log: MachineChangeLog = {
      id: `LOG-${Date.now()}`,
      category: modalCategory,
      previousMachineId: prevName,
      previousMachineName: prevName,
      newMachineId: machine.id,
      newMachineName: machine.name,
      reason: reason,
      changedBy: 'ຊ່າງພິມ / Operator',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChangeLogs((prev) => [log, ...prev]);
    if (onMachineChanged) {
      onMachineChanged(log);
    }
  };

  const getCurrentModalName = () => {
    if (modalCategory === 'Printer') return pressMachine;
    if (modalCategory === 'Cutter') return cutterMachine;
    return finishMachine;
  };

  return (
    <div className="bg-white border border-sky-100 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 font-sans">
      <div className="flex flex-wrap items-center justify-between border-b border-sky-100 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-sky-600 tracking-wider block">
              Equipment & Dynamic Routing
            </span>
            <h3 className="text-sm font-black text-slate-900">
              ອຸປະກອນ & ເຄື່ອງຈັກທີ່ເລືອກນຳໃຊ້
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {changeLogs.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-amber-600" />
              <span>ປະຫວັດປ່ຽນເຄື່ອງ ({changeLogs.length})</span>
            </button>
          )}

          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            ພ້ອມແລ່ນງານ
          </span>
        </div>
      </div>

      {/* 3 Machine Specification Tiles with Search & Change Trigger */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Printing Press Tile */}
        <div className="p-3.5 bg-sky-50/50 border border-sky-100/80 rounded-2xl flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">1. ແທ່ນພິມຫຼັກ (Press)</span>
              <Activity className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
            </div>
            <strong className="text-xs font-black text-slate-900 block truncate mt-1" title={pressMachine}>
              {pressMachine}
            </strong>
            <div className="mt-1 space-y-0.5">
              <div className="flex items-baseline gap-1">
                <span className="text-[11px] font-bold text-sky-800">ຄ່າພິມ 1 ໜ້າ:</span>
                <strong className="text-xs font-black text-sky-700 font-mono">
                  {pressCost.formattedTotal}
                </strong>
                <span className="text-[10px] text-slate-400">/ {pressCost.unitLabel}</span>
              </div>
              {pressCost.linkedInkRatePerPage > 0 && (
                <span className="text-[10px] font-semibold text-emerald-600 block font-mono">
                  (ເຄື່ອງ {pressCost.formattedMachine} + ໝຶກ {pressCost.formattedInk})
                </span>
              )}
              <span className="text-[10px] text-slate-400 block truncate">
                ຄວາມລະອຽດສູງ • CMYK 300 DPI
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenSelect('Printer')}
            className="w-full py-1.5 px-2.5 bg-white hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>ຄົ້ນຫາ / ປ່ຽນແທ່ນພິມ</span>
          </button>
        </div>

        {/* 2. Precision Cutting Tile */}
        <div className="p-3.5 bg-sky-50/50 border border-sky-100/80 rounded-2xl flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">2. ເຄື່ອງຕັດເຈ້ຍ (Cutter)</span>
              <Scissors className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <strong className="text-xs font-black text-slate-900 block truncate mt-1" title={cutterMachine}>
              {cutterMachine}
            </strong>
            <div className="mt-1 space-y-0.5">
              <div className="flex items-baseline gap-1">
                <span className="text-[11px] font-bold text-slate-700">ຄ່າຕັດ 1 ແຜ່ນ:</span>
                <strong className="text-xs font-black text-slate-900 font-mono">
                  {cutterCost.formattedTotal}
                </strong>
                <span className="text-[10px] text-slate-400">/ {cutterCost.unitLabel}</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                ຕັດຂອບສາກ • ຕັດ Bleed 3mm
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenSelect('Cutter')}
            className="w-full py-1.5 px-2.5 bg-white hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>ຄົ້ນຫາ / ປ່ຽນເຄື່ອງຕັດ</span>
          </button>
        </div>

        {/* 3. Finishing & Binding Tile */}
        <div className="p-3.5 bg-sky-50/50 border border-sky-100/80 rounded-2xl flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">3. ເຂົ້າເຫຼັ້ມ/ເຄືອບ (Finishing)</span>
              <Layers className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <strong className="text-xs font-black text-slate-900 block truncate mt-1" title={finishMachine}>
              {finishMachine}
            </strong>
            <div className="mt-1 space-y-0.5">
              <div className="flex items-baseline gap-1">
                <span className="text-[11px] font-bold text-indigo-800">
                  {finishCost.unitLabel === 'ແຜ່ນ' ? 'ຄ່າເຄືອບ 1 ແຜ່ນ:' : 'ຄ່າເຂົ້າເຫຼັ້ມ 1 ຫົວ:'}
                </span>
                <strong className="text-xs font-black text-indigo-700 font-mono">
                  {finishCost.formattedTotal}
                </strong>
                <span className="text-[10px] text-slate-400">/ {finishCost.unitLabel}</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                ສັນປຶ້ມ: {item.spine_width_mm || 0} ມມ
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenSelect(item.binding_type === 'NONE' ? 'Laminator' : 'Binder')}
            className="w-full py-1.5 px-2.5 bg-white hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>ຄົ້ນຫາ / ປ່ຽນເຄື່ອງເຂົ້າເຫຼັ້ມ</span>
          </button>
        </div>
      </div>

      {/* Universal Search & Select Machine Modal */}
      {modalCategory && (
        <MachineSelectModal
          isOpen={!!modalCategory}
          onClose={() => setModalCategory(null)}
          category={modalCategory}
          currentMachineName={getCurrentModalName()}
          availableMachines={availableMachines}
          onSelectMachine={handleApplyMachine}
        />
      )}

      {/* Change History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-sky-100 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <h4 className="text-base font-black text-slate-900">ປະຫວັດການປ່ຽນເຄື່ອງຈັກໃນອໍເດີນີ້</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {changeLogs.map((log) => (
                <div key={log.id} className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-900">{log.category} Switch</span>
                    <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                  </div>
                  <div className="text-slate-700">
                    <span className="line-through text-slate-400">{log.previousMachineName}</span> ➔ <strong className="text-sky-700">{log.newMachineName}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    ເຫດຜົນ: <span className="text-slate-800">{log.reason}</span> ({log.changedBy})
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowHistoryModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs transition"
            >
              ປິດໜ້າຕ່າງ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
