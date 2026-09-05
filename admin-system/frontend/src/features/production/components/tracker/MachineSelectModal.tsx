import React, { useState, useMemo, useEffect } from 'react';
import {
  Printer,
  Scissors,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  History,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { FormModalTemplate } from '@components/common';
import type { Equipment } from '../../../equipment/types';
import type { MachineChangeLog } from './types';
import { calculateEquipmentPrintCost } from '../../../../utils/machineCostCalculator';
import { useApp } from '../../../../store/AppContext';

interface MachineSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: 'Printer' | 'Cutter' | 'Binder' | 'Laminator' | string;
  currentMachineName: string;
  availableMachines: Equipment[];
  onSelectMachine: (machine: Equipment, reason: string) => void;
}

export const MachineSelectModal: React.FC<MachineSelectModalProps> = ({
  isOpen,
  onClose,
  category,
  currentMachineName,
  availableMachines,
  onSelectMachine,
}) => {
  const { printerColorLinks = [], inventory = [] } = useApp();
  const [dbInks, setDbInks] = useState<any[]>([]);

  useEffect(() => {
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

  const allAvailableInks = useMemo(() => [...inventory, ...dbInks], [inventory, dbInks]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMachine, setSelectedMachine] = useState<Equipment | null>(null);
  const [changeReason, setChangeReason] = useState('คิวยาวติดงานอื่น (Queue Busy)');
  const [customReason, setCustomReason] = useState('');

  // Find active machine cost
  const activeMachineObj = useMemo(() => {
    return (availableMachines || []).find((m) => m.name === currentMachineName || m.id === currentMachineName);
  }, [availableMachines, currentMachineName]);

  const activeMachineCost = useMemo(() => {
    if (!activeMachineObj) return null;
    return calculateEquipmentPrintCost(activeMachineObj, printerColorLinks, allAvailableInks, category);
  }, [activeMachineObj, printerColorLinks, allAvailableInks, category]);

  // Filter machines by category & search query
  const filteredMachines = useMemo(() => {
    return (availableMachines || []).filter((m) => {
      // Category match
      const mCat = (m.category || '').toLowerCase();
      const targetCat = category.toLowerCase();
      const catMatch = mCat.includes(targetCat) || 
                       (targetCat === 'binder' && mCat.includes('binder')) ||
                       (targetCat === 'laminator' && mCat.includes('laminator')) ||
                       (targetCat === 'cutter' && mCat.includes('cutter'));

      if (!catMatch && targetCat !== 'all') return false;

      // Search match
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const name = (m.name || '').toLowerCase();
      const brand = (m.brand || '').toLowerCase();
      const model = (m.model || '').toLowerCase();
      const id = (m.id || '').toLowerCase();
      return name.includes(q) || brand.includes(q) || model.includes(q) || id.includes(q);
    });
  }, [availableMachines, category, searchQuery]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedMachine) return;
    const finalReason = changeReason === 'ອື່ນໆ (Other)' ? customReason || 'ປ່ຽນເຄື່ອງຈັກຕາມສະພາບໜ້າວຽກ' : changeReason;
    onSelectMachine(selectedMachine, finalReason);
    onClose();
  };

  const getCategoryTitle = () => {
    switch (category) {
      case 'Printer': return { lo: 'ແທ່ນພິມ (Printing Press)', icon: <Printer className="w-5 h-5 text-white" /> };
      case 'Cutter': return { lo: 'ເຄື່ອງຕັດເຈ້ຍ (Paper Cutter)', icon: <Scissors className="w-5 h-5 text-white" /> };
      case 'Binder': return { lo: 'ເຄື່ອງເຂົ້າເຫຼັ້ມ (Book Binder)', icon: <Layers className="w-5 h-5 text-white" /> };
      case 'Laminator': return { lo: 'ເຄື່ອງເຄືອບ (Laminator)', icon: <Sparkles className="w-5 h-5 text-white" /> };
      default: return { lo: 'ເຄື່ອງຈັກຜະລິດ (Production Machine)', icon: <Printer className="w-5 h-5 text-white" /> };
    }
  };

  const catInfo = getCategoryTitle();

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={catInfo.icon}
      title={`ເລືອກປ່ຽນ ${catInfo.lo}`}
      subtitle="ເລືອກເຄື່ອງຈັກທົດແທນທີ່ວ່າງ ແລະ ບັນທຶກປະຫວັດການປ່ຽນແປງເຂົ້າລະບົບ"
      badgeText="Dynamic Routing"
      maxWidthClass="max-w-3xl"
      footerActions={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 font-medium">
            {selectedMachine ? (
              <span>ເລືອກ: <strong className="text-sky-700 font-bold">{selectedMachine.name}</strong></span>
            ) : (
              <span>ກະລຸນາເລືອກເຄື່ອງຈັກທີ່ຕ້ອງການນຳໃຊ້</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              ຍົກເລີກ
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedMachine}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-black rounded-xl text-xs shadow-md shadow-sky-500/25 transition cursor-pointer border-none flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>ຢືນຢັນປ່ຽນເຄື່ອງຈັກ</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 p-6 font-sans">
        {/* Current Active Machine Callout */}
        <div className="p-3.5 bg-sky-50 border border-sky-200/80 rounded-2xl flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-medium block">ເຄື່ອງຈັກທີ່ກຳນົດໄວ້ເດີມ:</span>
            <strong className="text-slate-900 font-black text-sm block mt-0.5">{currentMachineName}</strong>
            {activeMachineCost && (
              <div className="flex items-center gap-1.5 mt-1 font-mono">
                <span className="text-sky-800 font-bold text-[11px]">{activeMachineCost.formattedTotal}</span>
                <span className="text-slate-400 text-[10px]">/ {activeMachineCost.unitLabel} ({activeMachineCost.unitLabelEn})</span>
                {!activeMachineCost.isPostPress && activeMachineCost.linkedInkRatePerPage > 0 && (
                  <span className="text-emerald-700 text-[10px] font-semibold">
                    (ເຄື່ອງ {activeMachineCost.formattedMachine} + ໝຶກ {activeMachineCost.formattedInk})
                  </span>
                )}
              </div>
            )}
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-sky-100 text-sky-800 font-bold font-mono text-[11px]">
            Active
          </span>
        </div>

        {/* Universal Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ຄົ້ນຫາຊື່ເຄື່ອງຈັກ, ຍີ່ຫໍ້ (Brand), ລຸ້ນ (Model), ຫຼື ລະຫັດ ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition shadow-2xs"
          />
        </div>

        {/* Machine Selection Grid */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            ລາຍການເຄື່ອງຈັກໃນໝວດໝູ່ດຽວກັນ ({filteredMachines.length} ເຄື່ອງ)
          </span>

          {filteredMachines.length === 0 ? (
            <div className="p-8 bg-white border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
              ບໍ່ພົບເຄື່ອງຈັກທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາ
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredMachines.map((m) => {
                const isCurrent = m.name === currentMachineName;
                const isSelected = selectedMachine?.id === m.id;
                const isIdle = m.status === 'Idle' || m.status === 'Ready' || !m.status;
                const isUnderRepair = m.status === 'Under Repair';

                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      if (!isUnderRepair) setSelectedMachine(m);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-sky-50/80 border-sky-500 ring-2 ring-sky-300 shadow-sm'
                        : isCurrent
                        ? 'bg-slate-100/70 border-slate-300 text-slate-600'
                        : isUnderRepair
                        ? 'bg-rose-50/40 border-rose-200 opacity-60 cursor-not-allowed'
                        : 'bg-white hover:bg-sky-50/30 border-slate-200 hover:border-sky-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <span className="font-mono text-[10px] font-bold text-slate-400 uppercase block">
                          {m.id}
                        </span>
                        <strong className="text-xs font-black text-slate-900 block truncate" title={m.name}>
                          {m.name}
                        </strong>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {m.brand || 'Brand'} • {m.printerCategory || m.postPressSubtype || m.category}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
                          isUnderRepair
                            ? 'bg-rose-100 text-rose-700'
                            : isIdle
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        ● {m.status || 'Ready'}
                      </span>
                    </div>

                    {(() => {
                      const cost = calculateEquipmentPrintCost(m, printerColorLinks, allAvailableInks, category);
                      return (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1">
                          <div className="flex flex-col">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[11px] font-bold text-slate-600">
                                {category === 'Printer'
                                  ? 'ຄ່າພິມ 1 ໜ້າ:'
                                  : category === 'Cutter'
                                  ? 'ຄ່າຕັດ 1 ແຜ່ນ:'
                                  : category === 'Laminator'
                                  ? 'ຄ່າເຄືອບ 1 ແຜ່ນ:'
                                  : 'ຄ່າເຂົ້າເຫຼັ້ມ 1 ຫົວ:'}
                              </span>
                              <strong className="text-sm font-black text-sky-700 font-mono">
                                {cost.formattedTotal}
                              </strong>
                              <span className="text-[10px] text-slate-400 font-medium">
                                / {cost.unitLabel} ({cost.unitLabelEn})
                              </span>
                            </div>
                            {!cost.isPostPress && cost.linkedInkRatePerPage > 0 && (
                              <span className="text-[10px] font-semibold text-emerald-600 block font-mono">
                                (ເຄື່ອງ {cost.formattedMachine} + ໝຶກ {cost.formattedInk})
                              </span>
                            )}
                            {cost.isPostPress && (
                              <span className="text-[10px] text-slate-400 block font-mono">
                                (ຄ່າເສື່ອມ LAK {cost.baseCostPerUnit.toFixed(2)} + ສ້ອມແປງ LAK {cost.wearAllowancePerUnit.toFixed(2)})
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <span className="text-sky-600 font-bold flex items-center gap-1 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" /> ເລືອກແລ້ວ
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Change Reason Dropdown & Notes */}
        <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-2xl space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              ເຫດຜົນໃນການປ່ຽນເຄື່ອງຈັກ (Reason for Switch - ບັນທຶກປະຫວັດ):
            </label>
            <select
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-sky-500 shadow-2xs"
            >
              <option value="ຄິວຍາວຕິດງານອື່ນ (Queue Busy)">ຄິວຍາວຕິດງານອື່ນ (Queue Busy)</option>
              <option value="ເຄື່ອງເດີມກຳລັງບຳລຸງຮັກສາ (Under Maintenance)">ເຄື່ອງເດີມກຳລັງບຳລຸງຮັກສາ (Under Maintenance)</option>
              <option value="ປັບປ່ຽນເພື່ອຄຸນນະພາບສີທີ່ເໝາະສົມ (Color Calibration Match)">ປັບປ່ຽນເພື່ອຄຸນນະພາບສີທີ່ເໝາະສົມ (Color Calibration Match)</option>
              <option value="ເຄື່ອງເດີມໝຶກໝົດຊົ່ວຄາວ (Toner / Ink Depleted)">ເຄື່ອງເດີມໝຶກໝົດຊົ່ວຄາວ (Toner / Ink Depleted)</option>
              <option value="ອື່ນໆ (Other)">ອື່ນໆ (Other Specification)</option>
            </select>
          </div>

          {changeReason === 'ອື່ນໆ (Other)' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">
                ລະບຸເຫດຜົນເພີ່ມເຕີມ:
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="ເຊັ່ນ: ແກ້ໄຂບັນຫາເຈ້ຍຕິດ, ປ່ຽນຕາມຄຳສັ່ງຫົວໜ້າຊ່າງ..."
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-sky-500"
              />
            </div>
          )}
        </div>
      </div>
    </FormModalTemplate>
  );
};
