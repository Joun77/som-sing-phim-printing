import React, { useState, useMemo } from 'react';
import { Search, Check, Wrench, AlertCircle, ShieldCheck, Filter } from 'lucide-react';
import { FormModalTemplate } from '@components/common/FormModalTemplate';
import type { Equipment } from '../../../types';

interface PostPressSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (equipmentId: string) => void;
  selectedEquipmentIds: string[];
  equipmentList: Equipment[];
  formatCurrency: (amount: number) => string;
}

export const PostPressSelectorModal: React.FC<PostPressSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedEquipmentIds,
  equipmentList,
  formatCurrency
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const filteredEquipment = useMemo(() => {
    return equipmentList.filter(eq => {
      const name = (eq.name || '').toLowerCase();
      const brand = (eq.brand || '').toLowerCase();
      const model = (eq.model || '').toLowerCase();
      const assetId = (eq.assetId || eq.id || '').toLowerCase();
      const type = (eq.type || eq.specs?.type || '').toLowerCase();

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = name.includes(q) || brand.includes(q) || model.includes(q) || assetId.includes(q) || type.includes(q);
        if (!matches) return false;
      }

      if (selectedCategory !== 'ALL') {
        const combined = `${name} ${type} ${brand}`.toLowerCase();
        if (selectedCategory === 'CUT' && !combined.includes('cut') && !combined.includes('ຕັດ') && !combined.includes('guillotine')) return false;
        if (selectedCategory === 'FOLD' && !combined.includes('fold') && !combined.includes('ພັບ')) return false;
        if (selectedCategory === 'LAMINATE' && !combined.includes('laminat') && !combined.includes('ເຄືອບ') && !combined.includes('bopp')) return false;
        if (selectedCategory === 'BIND' && !combined.includes('bind') && !combined.includes('ເຢັບ') && !combined.includes('ສັນ') && !combined.includes('staple')) return false;
      }

      return true;
    });
  }, [equipmentList, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<Wrench className="w-5 h-5 text-white" />}
      title="ຄົ້ນຫາ & ເລືອກເຄື່ອງຈັກຫຼັງພິມ (Post-Press Machinery)"
      subtitle="ເລືອກເຄື່ອງຈັກຕັດ, ພັບ, ເຄືອບ, ເຢັບຫຼັງຄາ ຫຼື ໄສສັນກາວ"
      maxWidthClass="max-w-5xl"
      badgeText={`${filteredEquipment.length} ເຄື່ອງ`}
      footerActions={
        <div className="flex justify-between items-center w-full">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            ເລືອກເຄື່ອງຈັກທີ່ຕ້ອງການ (ເລືອກໄດ້ຫຼາຍເຄື່ອງ)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            ປິດໜ້າຕ່າງ
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search & Filter Bar */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ຄົ້ນຫາຊື່ເຄື່ອງຈັກ (ເຄື່ອງຕັດ, ເຄື່ອງເຄືອບ, ເຄື່ອງພັບ, ເຄື່ອງໄສສັນ...)"
              className="w-full pl-10 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-accent-sky focus:bg-white transition"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5 bg-slate-200 rounded"
              >
                ລ້າງ
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-accent-sky" />
              <span>ປະເພດ:</span>
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'ທັງໝົດ' },
                { id: 'CUT', label: 'ຕັດ (Cutter)' },
                { id: 'FOLD', label: 'ພັບ / ເສັ້ນພັບ (Folder)' },
                { id: 'LAMINATE', label: 'ເຄືອບ (Laminator)' },
                { id: 'BIND', label: 'ເຂົ້າເລັ້ມ / ເຢັບ (Binder)' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedCategory(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    selectedCategory === t.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="space-y-2.5">
          {filteredEquipment.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">ບໍ່ພົບເຄື່ອງຈັກທີ່ຄົ້ນຫາ</p>
              <p className="text-xs text-slate-400">ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ເລືອກປະເພດທັງໝົດ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[52vh] overflow-y-auto pr-1">
              {filteredEquipment.map(mach => {
                const isSelected = selectedEquipmentIds.includes(mach.id);
                const rate = Number((mach as any).costPerPage) || Number((mach as any).calculatedCostPerPage) || 300;

                return (
                  <div
                    key={mach.id}
                    onClick={() => onSelect(mach.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-50/90 border-sky-500 shadow-md ring-2 ring-sky-400/20'
                        : 'bg-white border-slate-200/90 hover:border-sky-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-black text-slate-900 font-sans block">
                            {mach.name}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {mach.brand} {mach.model ? `• ${mach.model}` : ''}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                          isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isSelected ? <><Check className="w-3 h-3" /> ເປີດໃຊ້</> : '+ ເລືອກ'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-medium">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-sans font-bold">
                          {mach.type || 'Post-Press Machinery'}
                        </span>
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> ພ້ອມໃຊ້ງານ
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">ຄ່າໃຊ້ຈ່າຍຕໍ່ຊິ້ນ/ໜ້າ:</span>
                      <span className="text-xs font-black text-slate-950 font-sans">
                        {formatCurrency(rate)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </FormModalTemplate>
  );
};
