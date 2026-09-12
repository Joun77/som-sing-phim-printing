import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, SlidersHorizontal, Tag, Globe, Sparkles, Layers } from 'lucide-react';
import { SystemLookup, CreateLookupInput, LOOKUP_GROUPS, LookupType } from '../types';
import { useCreateLookup, useUpdateLookup } from '../api/lookupsApi';
import { FormModalTemplate, FormSection } from '@components/common/FormModalTemplate';

interface LookupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeType: LookupType;
  editingLookup?: SystemLookup | null;
}

export const LookupFormModal: React.FC<LookupFormModalProps> = ({
  isOpen,
  onClose,
  activeType,
  editingLookup,
}) => {
  const createMutation = useCreateLookup();
  const updateMutation = useUpdateLookup();

  const [selectedType, setSelectedType] = useState<LookupType>(activeType);
  const groupConfig = LOOKUP_GROUPS.find((g) => g.key === selectedType) || LOOKUP_GROUPS[0];

  const [code, setCode] = useState('');
  const [nameLo, setNameLo] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameTh, setNameTh] = useState('');
  const [sortOrder, setSortOrder] = useState(10);
  const [isActive, setIsActive] = useState(true);
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingLookup) {
      setSelectedType(editingLookup.lookup_type);
      setCode(editingLookup.code);
      setNameLo(editingLookup.name_lo);
      setNameEn(editingLookup.name_en);
      setNameTh(editingLookup.name_th || '');
      setSortOrder(editingLookup.sort_order);
      setIsActive(editingLookup.is_active);
      setAttributes(editingLookup.attributes || {});
    } else {
      setSelectedType(activeType);
      setCode('');
      setNameLo('');
      setNameEn('');
      setNameTh('');
      setSortOrder(10);
      setIsActive(true);
      setAttributes({});
    }
    setError(null);
  }, [editingLookup, isOpen, activeType]);

  const handleAttrChange = (key: string, value: any, type: string) => {
    let parsedVal = value;
    if (type === 'number') {
      parsedVal = value === '' ? 0 : Number(value);
    }
    setAttributes((prev) => ({
      ...prev,
      [key]: parsedVal,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !nameLo.trim() || !nameEn.trim()) {
      setError('ກະລຸນາປ້ອນລະຫັດ (Code), ຊື່ພາສາລາວ (Lao Name) ແລະ ຊື່ພາສາອັງກິດ (English Name)');
      return;
    }

    try {
      if (editingLookup) {
        await updateMutation.mutateAsync({
          id: editingLookup.id,
          input: {
            name_lo: nameLo.trim(),
            name_en: nameEn.trim(),
            name_th: nameTh.trim() ? nameTh.trim() : undefined,
            sort_order: sortOrder,
            is_active: isActive,
            attributes,
          },
        });
      } else {
        const payload: CreateLookupInput = {
          lookup_type: selectedType,
          code: code.trim().toUpperCase().replace(/\s+/g, '_'),
          name_lo: nameLo.trim(),
          name_en: nameEn.trim(),
          name_th: nameTh.trim() ? nameTh.trim() : undefined,
          sort_order: sortOrder,
          is_active: isActive,
          attributes,
        };
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກຂໍ້ມູນ');
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const footerActions = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
      >
        ຍົກເລີກ (Cancel)
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSaving}
        className="px-6 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 disabled:opacity-50 rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
      >
        <Save className="w-4 h-4" />
        <span>{isSaving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກຂໍ້ມູນ (Save)'}</span>
      </button>
    </>
  );

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<SlidersHorizontal className="w-5 h-5 text-white" />}
      title={editingLookup ? 'ແກ້ໄຂຂໍ້ມູນພື້ນຖານ (Edit Master Data)' : 'ເພີ່ມຂໍ້ມູນພື້ນຖານໃໝ່ (Add Master Data)'}
      subtitle={`${groupConfig.labelLo} • ລະບົບຄ່າຄົງທີ່ອ້າງອິງກາງ Som Sing Phim`}
      badgeText={groupConfig.key.toUpperCase()}
      maxWidthClass="max-w-3xl"
      footerActions={footerActions}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs font-bold text-rose-700 animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Classification & Code */}
        <FormSection
          icon={<Tag className="w-4 h-4 text-indigo-600" />}
          title="ໝວດໝູ່ & ລະຫັດອ້າງອິງ (Category & Code)"
          subtitle="ເລືອກໝວດໝູ່ຂອງຂໍ້ມູນພື້ນຖານ ແລະ ກຳນົດລະຫັດສະເພາະທີ່ບໍ່ຊ້ຳກັນ"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                ໝວດໝູ່ຂໍ້ມູນພື້ນຖານ (Lookup Type) *
              </label>
              <select
                disabled={!!editingLookup}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as LookupType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
              >
                {LOOKUP_GROUPS.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.labelLo} ({g.labelEn})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                ລະຫັດອ້າງອິງສະເພາະ (Unique Code) *
              </label>
              <input
                type="text"
                disabled={!!editingLookup}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. ART_CARD, A4, GLOSS_PVC"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold uppercase text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 2: Multilingual Names */}
        <FormSection
          icon={<Globe className="w-4 h-4 text-indigo-600" />}
          title="ຊື່ສະແດງຜົນຫຼາຍພາສາ (Multilingual Names)"
          subtitle="ກຳນົດຊື່ພາສາລາວ ແລະ ອັງກິດໃຫ້ຄົບຖ້ວນເພື່ອໃຫ້ຜູ້ໃຊ້ງານທຸກຝ່າຍເຂົ້າໃຈກົງກັນ"
        >
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                ຊື່ພາສາລາວ (Lao Display Name) *
              </label>
              <input
                type="text"
                value={nameLo}
                onChange={(e) => setNameLo(e.target.value)}
                placeholder="e.g. ເຈ້ຍອາດກາດ 2 ໜ້າ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  ຊື່ພາສາອັງກິດ (English Name) *
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Double-Sided Coated Art Card"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  ຊື່ພາສາໄທ (Thai Name - ທາງເລືອກ)
                </label>
                <input
                  type="text"
                  value={nameTh}
                  onChange={(e) => setNameTh(e.target.value)}
                  placeholder="e.g. กระดาษอาร์ตการ์ด 2 หน้า"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </FormSection>

        {/* Section 3: Technical Attributes Specific to Group */}
        {groupConfig.attributeHints && groupConfig.attributeHints.length > 0 && (
          <FormSection
            icon={<Sparkles className="w-4 h-4 text-indigo-600" />}
            title="ຄຸນລັກສະນະທາງເທັກນິກ (Technical Attributes)"
            subtitle="ຕົວເລກມາດຕະຖານ ຫຼື ຕົວຄູນສຳລັບນຳໄປຄິດໄລ່ຕົ້ນທຶນ ແລະ ການວາງໜ້າພິມ"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100">
              {groupConfig.attributeHints.map((hint) => (
                <div key={hint.key}>
                  <label className="block text-xs font-bold text-indigo-950 mb-1">
                    {hint.label}
                  </label>
                  <input
                    type={hint.type === 'number' ? 'number' : 'text'}
                    value={attributes[hint.key] ?? ''}
                    onChange={(e) => handleAttrChange(hint.key, e.target.value, hint.type)}
                    placeholder={hint.placeholder}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
          </FormSection>
        )}

        {/* Section 4: Order & Active Status */}
        <FormSection
          icon={<Layers className="w-4 h-4 text-indigo-600" />}
          title="ລຳດັບ ແລະ ສະຖານະ (Display Order & Status)"
          subtitle="ກຳນົດລຳດັບທີ່ຈະສະແດງໃນ Dropdown ແລະ ເປີດ/ປິດການໃຊ້ງານ"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-full sm:w-48">
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                ລຳດັບການສະແດງ (Sort Order)
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                placeholder="10"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="pt-4 sm:pt-0">
              <label className="flex items-center gap-3 cursor-pointer select-none bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200/80 hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    ເປີດໃຊ້ງານໃນລະບົບ (Active)
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    ຫາກປິດ ຈະບໍ່ສະແດງໃນ Dropdown ໜ້າອື່ນໆ
                  </span>
                </div>
              </label>
            </div>
          </div>
        </FormSection>
      </form>
    </FormModalTemplate>
  );
};
