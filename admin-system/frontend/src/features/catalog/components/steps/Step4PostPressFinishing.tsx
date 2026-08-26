import React, { useMemo } from 'react';
import { 
  Scissors, 
  Sparkles, 
  Layers, 
  BookOpen, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Check, 
  Settings2, 
  Percent, 
  LayoutGrid, 
  ListFilter,
  CheckCircle2,
  Wrench,
  X,
  FileCheck,
  Ban
} from 'lucide-react';
import { useApp } from '@store/AppContext';
import { SpecGroup, FeaturesConfig } from '../../types';

export interface PostPressMachine {
  id: string;
  name: string;
  brand: string;
  type: string;
  category: 'Cutter' | 'Laminator' | 'Binder' | 'Puncher';
  costPerUnit: number;
  unit: string;
  icon: string;
  defaultPrice: number;
}

export interface Step4PostPressFinishingProps {
  specGroups: SpecGroup[];
  setSpecGroups: React.Dispatch<React.SetStateAction<SpecGroup[]>>;
  targetMarginPercent: number;
  featuresConfig?: FeaturesConfig;
  setFeaturesConfig?: React.Dispatch<React.SetStateAction<FeaturesConfig>>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Step4PostPressFinishing: React.FC<Step4PostPressFinishingProps> = ({
  specGroups,
  setSpecGroups,
  targetMarginPercent,
  featuresConfig,
  setFeaturesConfig,
  showToast,
}) => {
  const { equipment, inventory } = useApp();

  // Check if finishing spec groups currently exist in product
  const finishingGroupIndices = useMemo(() => {
    return specGroups
      .map((g, idx) => ({ g, idx }))
      .filter(({ g }) => 
        g.id !== 'group_print_mode' && 
        g.groupType !== 'printing_mode' && 
        g.groupType !== 'material' && 
        !g.id.includes('material') && 
        !g.id.includes('paper') &&
        !g.titleLo?.includes('ເຈ້ຍ') &&
        !g.titleLo?.includes('ວັດສະດຸ')
      );
  }, [specGroups]);

  const [hasFinishing, setHasFinishing] = React.useState<boolean>(finishingGroupIndices.length > 0);

  // Dynamically load finishing machinery from real equipment state
  const dynamicFinishingMachines: PostPressMachine[] = useMemo(() => {
    const nonPrinters = (equipment || []).filter(
      eq => eq.category !== 'Printer' && eq.category !== 'PRINTER'
    );

    if (nonPrinters.length === 0) {
      return [
        {
          id: 'MAC-CUTTER-920',
          name: 'QZYK920 Hydraulic Paper Guillotine',
          brand: 'QZYK',
          type: 'Program Control Hydraulic Guillotine',
          category: 'Cutter',
          costPerUnit: 28.3,
          unit: 'ແຜ່ນ',
          icon: '✂️',
          defaultPrice: 0,
        },
        {
          id: 'MAC-LAM-FM360',
          name: 'FM-360 Roll Laminator Hot & Cold',
          brand: 'Boway',
          type: 'Thermal & Cold Roll Lamination',
          category: 'Laminator',
          costPerUnit: 27.5,
          unit: 'ແຜ່ນ',
          icon: '🛡️',
          defaultPrice: 3000,
        },
        {
          id: 'MAC-BIND-WD50',
          name: 'WD-50A Perfect Glue Thermal Binder',
          brand: 'Superbind',
          type: 'Heavy Duty Thermal Hot Melt Binder',
          category: 'Binder',
          costPerUnit: 110,
          unit: 'ເລັ້ມ',
          icon: '📖',
          defaultPrice: 10000,
        },
      ];
    }

    return nonPrinters.map(eq => {
      let icon = '✂️';
      let cat: 'Cutter' | 'Laminator' | 'Binder' | 'Puncher' = 'Cutter';
      let unit = 'ແຜ່ນ';

      if (eq.category === 'Laminator' || eq.name?.toLowerCase().includes('laminat')) {
        icon = '🛡️';
        cat = 'Laminator';
      } else if (eq.category === 'Binder' || eq.name?.toLowerCase().includes('binder')) {
        icon = '📖';
        cat = 'Binder';
        unit = 'ເລັ້ມ';
      } else if (eq.category === 'Puncher' || eq.name?.toLowerCase().includes('punch')) {
        icon = '🕳️';
        cat = 'Puncher';
      }

      const costPerUnit = Number(eq.costPerConsumptionUnit || eq.calculatedCostPerPage || 25);

      return {
        id: eq.id,
        name: eq.name,
        brand: eq.brand || 'Shop Machine',
        type: eq.model || eq.category || 'Finishing Machine',
        category: cat,
        costPerUnit,
        unit,
        icon,
        defaultPrice: cat === 'Binder' ? 10000 : (cat === 'Laminator' ? 3000 : 0),
      };
    });
  }, [equipment]);

  // Handle Enable / Disable Finishing
  const handleToggleFinishing = (enabled: boolean) => {
    setHasFinishing(enabled);
    if (!enabled) {
      // Remove all finishing groups
      setSpecGroups(prev => prev.filter(g => 
        g.id === 'group_print_mode' || 
        g.groupType === 'printing_mode' || 
        g.groupType === 'material' || 
        g.id.includes('material') || 
        g.id.includes('paper') ||
        g.titleLo?.includes('ເຈ້ຍ') ||
        g.titleLo?.includes('ວັດສະດຸ')
      ));
      showToast('ປິດໃຊ້ງານຫຼັງພິມ (ສິນຄ້ານີ້ຈະບໍ່ມີຕົວເລືອກງານຕັດ/ເຄືອບທີ່ໜ້າລູກຄ້າ)', 'info');
    } else {
      loadStickerFinishingPreset();
      showToast('ເປີດໃຊ້ງານຫຼັງພິມ & ງານຕັດສຳເລັດ', 'success');
    }
  };

  // Preset: Sticker Cutting & Lamination Group
  const loadStickerFinishingPreset = () => {
    const cutMach = dynamicFinishingMachines.find(m => m.category === 'Cutter') || dynamicFinishingMachines[0];
    const lamMach = dynamicFinishingMachines.find(m => m.category === 'Laminator') || dynamicFinishingMachines[1];

    const cutGroup: SpecGroup = {
      id: `group_cut_${Date.now() % 10000}`,
      titleLo: 'ຮູບແບບການຕັດ (Cutting & Die-Cut)',
      titleEn: 'Cutting Method',
      displayType: 'cards',
      groupType: 'finishing',
      options: [
        { 
          optionType: 'finishing', 
          machineId: cutMach?.id || 'MAC-CUTTER-920',
          machineName: cutMach?.name || 'QZYK920 Hydraulic Paper Guillotine',
          label: '✂️ ຕັດຊື່ແບ່ງແຜ່ນ A3+ (Straight Cut)', 
          labelLo: '✂️ ຕັດຊື່ແບ່ງແຜ່ນ A3+', 
          labelEn: 'Straight Cut Sheet', 
          value: 'straight_cut', 
          isDefault: true, 
          extraCostRate: cutMach?.costPerUnit || 28.3, 
          addPrice: 0 
        },
        { 
          optionType: 'finishing', 
          machineId: cutMach?.id || 'MAC-CUTTER-920',
          machineName: cutMach?.name || 'QZYK920 Hydraulic Paper Guillotine',
          label: '✨ ໄດຄັດລອກເປັນດວງ (Kiss-Cut Sheet)', 
          labelLo: '✨ ໄດຄັດລອກເປັນດວງ (Kiss-Cut)', 
          labelEn: 'Kiss-Cut Sheet', 
          value: 'kiss_cut', 
          isDefault: false, 
          extraCostRate: 150, 
          addPrice: 0 
        },
        { 
          optionType: 'finishing', 
          machineId: cutMach?.id || 'MAC-CUTTER-920',
          machineName: cutMach?.name || 'QZYK920 Hydraulic Paper Guillotine',
          label: '🌟 ໄດຄັດຂາດແຍກດວງ (Die-Cut Individual)', 
          labelLo: '🌟 ໄດຄັດຂາດແຍກດວງ (Die-Cut Individual)', 
          labelEn: 'Die-Cut Individual', 
          value: 'die_cut_individual', 
          isDefault: false, 
          extraCostRate: 250, 
          addPrice: 0 
        },
      ]
    };

    const lamGroup: SpecGroup = {
      id: `group_lam_${Date.now() % 10000}`,
      titleLo: 'ການເຄືອບຟິล์ມກັນຮອຍ (Lamination Coating)',
      titleEn: 'Lamination Finish',
      displayType: 'cards',
      groupType: 'cover_lamination',
      options: [
        { 
          optionType: 'finishing', 
          label: 'ບໍ່ເຄືອບຟິล์ມ (No Coating)', 
          labelLo: 'ບໍ່ເຄືອບຟິล์ມ (No Coating)', 
          labelEn: 'No Coating', 
          value: 'no_lam', 
          isDefault: true, 
          extraCostRate: 0, 
          addPrice: 0 
        },
        { 
          optionType: 'finishing', 
          machineId: lamMach?.id || 'MAC-LAM-FM360',
          machineName: lamMach?.name || 'FM-360 Roll Laminator Hot & Cold',
          label: '🛡️ ເຄືອບຟິล์ມເງົາ (Glossy Lamination)', 
          labelLo: '🛡️ ເຄືອບຟິล์ມເງົາ (Glossy)', 
          labelEn: 'Glossy Lamination', 
          value: 'gloss_lam', 
          isDefault: false, 
          extraCostRate: lamMach?.costPerUnit || 27.5, 
          addPrice: 0 
        },
        { 
          optionType: 'finishing', 
          machineId: lamMach?.id || 'MAC-LAM-FM360',
          machineName: lamMach?.name || 'FM-360 Roll Laminator Hot & Cold',
          label: '✨ ເຄືອບຟິล์ມດ້ານ (Matte Lamination)', 
          labelLo: '✨ ເຄືອບຟິล์ມດ້ານ (Matte)', 
          labelEn: 'Matte Lamination', 
          value: 'matte_lam', 
          isDefault: false, 
          extraCostRate: lamMach?.costPerUnit || 27.5, 
          addPrice: 0 
        },
      ]
    };

    setSpecGroups(prev => {
      const nonFinishing = prev.filter(g => 
        g.id === 'group_print_mode' || 
        g.groupType === 'printing_mode' || 
        g.groupType === 'material' || 
        g.id.includes('material') || 
        g.id.includes('paper')
      );
      return [...nonFinishing, cutGroup, lamGroup];
    });
    setHasFinishing(true);
    showToast('ໂຫຼດເທມເພລດງານຕັດ & ເຄືອບສະຕິກເກີສຳເລັດ', 'info');
  };

  // Preset: Book Binding Preset
  const loadBookBindingPreset = () => {
    const bindMach = dynamicFinishingMachines.find(m => m.category === 'Binder') || dynamicFinishingMachines[2];

    const bindGroup: SpecGroup = {
      id: `group_bind_${Date.now() % 10000}`,
      titleLo: 'ວິທີເຂົ້າເລັ້ມປຶ້ມ (Binding Method)',
      titleEn: 'Book Binding Style',
      displayType: 'cards',
      groupType: 'binding',
      options: [
        { 
          optionType: 'binding', 
          machineId: bindMach?.id || 'MAC-BIND-WD50',
          machineName: bindMach?.name || 'WD-50A Perfect Glue Thermal Binder',
          label: '📖 ເຂົ້າເລັ້ມສັນກາວຮ້ອນ (Perfect Glue)', 
          labelLo: '📖 ເຂົ້າເລັ້ມສັນກາວຮ້ອນ', 
          labelEn: 'Perfect Glue Binding', 
          value: 'perfect_glue', 
          isDefault: true, 
          extraCostRate: bindMach?.costPerUnit || 110, 
          addPrice: 0 
        },
        { 
          optionType: 'binding', 
          label: '🖇️ ສັນຫ່ວງກະດູກງູ / ສັນຂົດລວດ (Wire-O)', 
          labelLo: '🖇️ ສັນຫ່ວງກະດູກງູ / ສັນຂົດລວດ', 
          labelEn: 'Wire-O Spiral Binding', 
          value: 'wire_o', 
          isDefault: false, 
          extraCostRate: 200, 
          addPrice: 0 
        },
        { 
          optionType: 'binding', 
          label: '📑 ເຢັບມຸງຫຼັງຄາ (Saddle Stitch)', 
          labelLo: '📑 ເຢັບມຸງຫຼັງຄາ (Saddle Stitch)', 
          labelEn: 'Saddle Stitch', 
          value: 'saddle_stitch', 
          isDefault: false, 
          extraCostRate: 50, 
          addPrice: 0 
        },
      ]
    };

    setSpecGroups(prev => {
      const nonFinishing = prev.filter(g => 
        g.id === 'group_print_mode' || 
        g.groupType === 'printing_mode' || 
        g.groupType === 'material' || 
        g.id.includes('material') || 
        g.id.includes('paper')
      );
      return [...nonFinishing, bindGroup];
    });
    setHasFinishing(true);
    showToast('ໂຫຼດເທມເພລດເຂົ້າເລັ້ມປຶ້ມສຳເລັດ', 'info');
  };

  // Add Custom Finishing Group
  const handleAddCustomFinishingGroup = () => {
    const newGroup: SpecGroup = {
      id: `group_fin_${Date.now() % 10000}`,
      titleLo: 'ຕົວເລືອກງານຫຼັງພິມໃໝ່',
      titleEn: 'New Finishing Process',
      displayType: 'cards',
      groupType: 'finishing',
      options: [
        {
          optionType: 'finishing',
          label: 'ຕົວເລືອກພື້ນຖານ',
          labelLo: 'ຕົວເລືອກພື້ນຖານ',
          labelEn: 'Standard Option',
          value: 'default_opt',
          isDefault: true,
          extraCostRate: 0,
          addPrice: 0,
        }
      ]
    };
    setSpecGroups(prev => [...prev, newGroup]);
    setHasFinishing(true);
    showToast('ເພີ່ມກຸ່ມງານຫຼັງພິມໃໝ່ຮຽບຮ້ອຍ', 'success');
  };

  const handleRemoveGroup = (gIdx: number) => {
    setSpecGroups(prev => prev.filter((_, idx) => idx !== gIdx));
  };

  const handleGroupFieldChange = (gIdx: number, field: string, val: any) => {
    setSpecGroups(prev => {
      const next = [...prev];
      (next[gIdx] as any)[field] = val;
      return next;
    });
  };

  const handleAddOption = (gIdx: number) => {
    setSpecGroups(prev => {
      const next = [...prev];
      next[gIdx].options.push({
        optionType: 'finishing',
        label: 'ຕົວເລືອກໃໝ່',
        labelLo: 'ຕົວເລືອກໃໝ່',
        labelEn: 'New Finishing Option',
        value: `opt_${Date.now() % 10000}`,
        isDefault: false,
        extraCostRate: 0,
        addPrice: 0,
      });
      return next;
    });
  };

  const handleRemoveOption = (gIdx: number, oIdx: number) => {
    setSpecGroups(prev => {
      const next = [...prev];
      next[gIdx].options = next[gIdx].options.filter((_, idx) => idx !== oIdx);
      return next;
    });
  };

  const handleOptionFieldChange = (gIdx: number, oIdx: number, field: string, val: any) => {
    setSpecGroups(prev => {
      const next = [...prev];
      const opt = next[gIdx].options[oIdx];
      (opt as any)[field] = val;
      if (field === 'isDefault' && val === true) {
        next[gIdx].options.forEach((o, i) => {
          if (i !== oIdx) o.isDefault = false;
        });
      }
      return next;
    });
  };

  const handleSelectMachine = (gIdx: number, oIdx: number, machId: string) => {
    const mach = dynamicFinishingMachines.find(m => m.id === machId);
    setSpecGroups(prev => {
      const next = [...prev];
      const opt = next[gIdx].options[oIdx];
      if (mach) {
        opt.machineId = mach.id;
        opt.machineName = mach.name;
        opt.extraCostRate = mach.costPerUnit;
        if (!opt.labelLo || opt.labelLo === 'ຕົວເລືອກໃໝ່') {
          opt.labelLo = `${mach.icon} ${mach.name}`;
          opt.label = opt.labelLo;
        }
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs text-slate-900">
        <div className="space-y-1">
          <h2 className="text-base font-black flex items-center gap-2 text-slate-900">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-xl">
              <Scissors className="w-5 h-5" />
            </div>
            <span>ຂັ້ນຕອນທີ 4: ເຄື່ອງຕັດ & ງານຫຼັງພິມ (Post-Press Machinery & Finishing)</span>
          </h2>
          <p className="text-xs text-slate-500">
            ດຶງຂໍ້ມູນເຄື່ອງຕັດ, ເຄື່ອງເຄືອບ, ເຄື່ອງເຂົ້າເລັ້ມຕົວຈິງຈາກໜ້າ <strong>ເຄື່ອງຈັກ (Equipment Assets)</strong> ພ້ອມຄິດໄລ່ຕົ້ນທຶນອັດຕະໂນມັດ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-xl text-xs font-mono font-bold">
            {dynamicFinishingMachines.length} Real Shop Machines
          </span>
        </div>
      </div>

      {/* Finishing Dynamic Toggle Mode */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-3xl space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-purple-600" />
              <span>ການນຳໃຊ້ງານຫຼັງພິມ & ງານຕັດ (Post-Press Capability Mode):</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              ເລືອກວ່າສິນຄ້ານີ້ຕ້ອງການຂະບວນການຕັດ/ເຄືອບ/ເຂົ້າເລັ້ມ ຫຼື ພິມແລ້ວສົ່ງມອບໄດ້ທັນທີ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option A: Has Finishing */}
          <button
            type="button"
            onClick={() => handleToggleFinishing(true)}
            className={`p-4 rounded-2xl border-2 transition text-left space-y-1.5 cursor-pointer ${
              hasFinishing
                ? 'bg-purple-50/70 border-purple-500 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-purple-600" />
                <span>[✓] ໃຊ້ງານຫຼັງພິມ & ງານຕັດ (Enable Post-Press & Cutting)</span>
              </span>
              {hasFinishing && <Check className="w-4 h-4 text-purple-600" />}
            </div>
            <p className="text-[11px] text-slate-500">
              ສຳລັບສະຕິກເກີໄດຄັດ, ໂປສເຕີເຄືອບຟິล์ມ, ປຶ້ມເຂົ້າເລັ້ມ, ນາມບັດ
            </p>
          </button>

          {/* Option B: No Finishing */}
          <button
            type="button"
            onClick={() => handleToggleFinishing(false)}
            className={`p-4 rounded-2xl border-2 transition text-left space-y-1.5 cursor-pointer ${
              !hasFinishing
                ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>[—] ບໍ່ມີງານຫຼັງພິມ (No Post-Press / Raw Document)</span>
              </span>
              {!hasFinishing && <Check className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-[11px] text-slate-500">
              ສຳລັບເອກະສານທົ່ວໄປ, ໃບປິວ, ບົດລາຍງານ (ພິມແລ້ວສົ່ງມອບເລີຍ)
            </p>
          </button>
        </div>
      </div>

      {/* STATE 1: NO POST-PRESS ACTIVE */}
      {!hasFinishing ? (
        <div className="p-8 bg-sky-50/50 border-2 border-dashed border-sky-200 rounded-3xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto">
            <FileCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-sm font-bold text-slate-800">
              ສິນຄ້ານີ້ຕັ້ງຄ່າເປັນ "ບໍ່ມີງານຫຼັງພິມ (No Post-Press)"
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              ພິມແລ້ວຈັດສົ່ງໄດ້ທັນທີ ໂດຍບໍ່ມີຂະບວນການຕັດ ຫຼື ເຄືອບເພີ່ມເຕີມ. ທີ່ໜ້າຮ້ານຄ້າລູກຄ້າຈະ <strong>ບໍ່ສະແດງຕົວເລືອກງານຫຼັງພິມ</strong> ແລະ ຕົ້ນທຶນຫຼັງພິມໃນຂັ້ນຕອນທີ 5 ຈະເປັນ <strong>0 ₭</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleToggleFinishing(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            + ເປີດໃຊ້ງານຫຼັງພິມ & ງານຕັດ (Enable Post-Press)
          </button>
        </div>
      ) : (
        /* STATE 2: POST-PRESS IS ENABLED */
        <div className="space-y-6">
          
          {/* Shop Machinery Quick Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {dynamicFinishingMachines.map((mach) => (
              <div
                key={mach.id}
                className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{mach.icon}</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-mono font-bold">
                    {mach.category}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 truncate" title={mach.name}>
                    {mach.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">{mach.type}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] font-mono flex items-center justify-between">
                  <span className="text-slate-400">ຕົ້ນທຶນ:</span>
                  <strong className="text-purple-600">{mach.costPerUnit} ₭/{mach.unit}</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Presets Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white border border-slate-200 rounded-3xl shadow-xs">
            <button
              type="button"
              onClick={loadStickerFinishingPreset}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-purple-500 text-left transition flex items-center justify-between group shadow-xs cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block group-hover:text-purple-600">
                  ✂️ ງານຕັດໄດຄັດ & ເຄືອບຟິล์ມ
                </span>
                <span className="text-[11px] text-slate-400">Kiss-Cut, Die-Cut, ເຄືອບດ້ານ/ເງົາ</span>
              </div>
              <Plus className="w-4 h-4 text-purple-500 opacity-0 group-hover:opacity-100 transition" />
            </button>

            <button
              type="button"
              onClick={loadBookBindingPreset}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-purple-500 text-left transition flex items-center justify-between group shadow-xs cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block group-hover:text-purple-600">
                  📖 ງານເຂົ້າເລັ້ມປຶ້ມ (Binding Styles)
                </span>
                <span className="text-[11px] text-slate-400">ສັນກາວຮ້ອນ, ສັນຫ່ວງ, ເຢັບມຸມ</span>
              </div>
              <Plus className="w-4 h-4 text-purple-500 opacity-0 group-hover:opacity-100 transition" />
            </button>

            <button
              type="button"
              onClick={handleAddCustomFinishingGroup}
              className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-left transition flex items-center justify-between shadow-md shadow-purple-600/20 hover:opacity-95 cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold block">
                  + ສ້າງກຸ່ມງານຫຼັງພິມໃໝ່
                </span>
                <span className="text-[11px] text-purple-100">Custom Post-Press Process</span>
              </div>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Finishing Spec Groups Editor */}
          <div className="space-y-5">
            {specGroups.map((group, gIdx) => {
              // Exclude print_mode and material groups from this Step 4 editor
              if (
                group.id === 'group_print_mode' || 
                group.groupType === 'printing_mode' || 
                group.groupType === 'material' || 
                group.id.includes('material') || 
                group.id.includes('paper') ||
                group.titleLo?.includes('ເຈ້ຍ') ||
                group.titleLo?.includes('ວັດສະດຸ')
              ) {
                return null;
              }

              return (
                <div
                  key={group.id || gIdx}
                  className="p-6 bg-white border border-slate-200/90 rounded-3xl space-y-4 shadow-xs"
                >
                  {/* Group Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                        {gIdx + 1}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                        <input
                          type="text"
                          value={group.titleLo}
                          onChange={(e) => handleGroupFieldChange(gIdx, 'titleLo', e.target.value)}
                          placeholder="ຊື່ກຸ່ມ (ລາວ) ເຊັ່ນ: ຮູບແບບການຕັດ"
                          className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                        />
                        <input
                          type="text"
                          value={group.titleEn}
                          onChange={(e) => handleGroupFieldChange(gIdx, 'titleEn', e.target.value)}
                          placeholder="Group Title (EN) e.g. Cutting Method"
                          className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleGroupFieldChange(gIdx, 'displayType', group.displayType === 'cards' ? 'dropdown' : 'cards')}
                        className="px-2.5 py-1 text-xs bg-slate-100 rounded-xl font-bold text-slate-600 flex items-center gap-1 cursor-pointer"
                      >
                        {group.displayType === 'cards' ? <LayoutGrid className="w-3 h-3" /> : <ListFilter className="w-3 h-3" />}
                        <span>{group.displayType === 'cards' ? 'Cards' : 'Dropdown'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveGroup(gIdx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                        title="ລຶບກຸ່ມນີ້"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="space-y-3">
                    {group.options.map((opt, oIdx) => {
                      const linkedMach = dynamicFinishingMachines.find(m => m.id === opt.machineId);
                      const linkedMat = (inventory || []).find((i: any) => i.sku === opt.materialSku || i.id === opt.materialSku);
                      const machCost = linkedMach ? linkedMach.costPerUnit : 0;
                      const matCost = linkedMat ? Number(linkedMat.costPerConsumptionUnit || linkedMat.costPerSheet || 0) : 0;

                      return (
                        <div
                          key={oIdx}
                          className={`p-3.5 rounded-2xl border transition grid grid-cols-1 lg:grid-cols-12 gap-3 items-center ${
                            opt.isDefault
                              ? 'bg-purple-50/40 border-purple-300 shadow-2xs'
                              : 'bg-slate-50/70 border-slate-200'
                          }`}
                        >
                          {/* 1. Radio Default & Labels */}
                          <div className="lg:col-span-3 flex items-center gap-2">
                            <input
                              type="radio"
                              name={`def_${group.id}`}
                              checked={Boolean(opt.isDefault)}
                              onChange={() => handleOptionFieldChange(gIdx, oIdx, 'isDefault', true)}
                              className="w-4 h-4 text-purple-600 cursor-pointer shrink-0"
                              title="ຕັ້ງເປັນຄ່າເລີ່ມຕົ້ນ"
                            />
                            <div className="flex-1 space-y-1">
                              <input
                                type="text"
                                value={opt.labelLo || opt.label}
                                onChange={(e) => {
                                  handleOptionFieldChange(gIdx, oIdx, 'labelLo', e.target.value);
                                  handleOptionFieldChange(gIdx, oIdx, 'label', e.target.value);
                                }}
                                placeholder="ຊື່ຕົວເລືອກ ເຊັ່ນ: ເຄືອບຟິล์ມດ້ານ"
                                className="w-full px-2.5 py-1 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                              />
                              <input
                                type="text"
                                value={opt.labelEn || ''}
                                onChange={(e) => handleOptionFieldChange(gIdx, oIdx, 'labelEn', e.target.value)}
                                placeholder="Option (EN) e.g. Matte Film"
                                className="w-full px-2.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                              />
                            </div>
                          </div>

                          {/* 2. ⚙️ Machine Linker (Depreciation & Wear) */}
                          <div className="lg:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                              <span>⚙️ ເຄື່ອງຈັກ (ຄ່າເສື່ອມ/ຄ່າໄຟ):</span>
                            </label>
                            <select
                              value={opt.machineId || ''}
                              onChange={(e) => {
                                const mId = e.target.value;
                                const mach = dynamicFinishingMachines.find(m => m.id === mId);
                                const newMachCost = mach ? mach.costPerUnit : 0;
                                handleOptionFieldChange(gIdx, oIdx, 'machineId', mId);
                                handleOptionFieldChange(gIdx, oIdx, 'machineName', mach?.name || '');
                                handleOptionFieldChange(gIdx, oIdx, 'extraCostRate', Math.round(newMachCost + matCost));
                              }}
                              className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-900 truncate cursor-pointer focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                            >
                              <option value="">-- ບໍ່ຜູກເຄື່ອງຈັກ --</option>
                              {dynamicFinishingMachines.map((mach) => (
                                <option key={mach.id} value={mach.id}>
                                  {mach.icon} [{mach.category}] {mach.name} (+{mach.costPerUnit} ₭)
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 3. 📦 Consumable Material SKU Linker (Film / Ring / Glue / Foil) */}
                          <div className="lg:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                              <span>📦 ວັດສະດຸ/ຟິล์ມ/ສັນຫ່ວງໃນຄັງ:</span>
                            </label>
                            <select
                              value={opt.materialSku || ''}
                              onChange={(e) => {
                                const sku = e.target.value;
                                const invMat = (inventory || []).find((i: any) => i.sku === sku || i.id === sku);
                                const newMatCost = invMat ? Number(invMat.costPerConsumptionUnit || invMat.costPerSheet || 0) : 0;
                                handleOptionFieldChange(gIdx, oIdx, 'materialSku', sku);
                                handleOptionFieldChange(gIdx, oIdx, 'extraCostRate', Math.round(machCost + newMatCost));
                              }}
                              className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-900 truncate cursor-pointer focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                            >
                              <option value="">-- ບໍ່ຜູກວັດສະດຸສິ້ນເປືອງ --</option>
                              {(inventory || []).map((inv: any) => (
                                <option key={inv.sku || inv.id} value={inv.sku || inv.id}>
                                  [{inv.category || 'Finishing'}] {inv.sku}: {inv.name} (+{Number(inv.costPerConsumptionUnit || inv.costPerSheet || 0).toLocaleString()} ₭)
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 4. Combined Unit Cost & Fixed Setup */}
                          <div className="lg:col-span-2 space-y-1 text-right">
                            <div className="p-1.5 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 font-bold">ຕົ້ນທຶນລວມ:</span>
                                <div className="flex items-center gap-0.5">
                                  <input
                                    type="number"
                                    value={opt.extraCostRate || 0}
                                    onChange={(e) => handleOptionFieldChange(gIdx, oIdx, 'extraCostRate', parseFloat(e.target.value) || 0)}
                                    className="w-14 px-1 py-0.5 text-xs font-mono font-black text-purple-700 bg-transparent text-right border-b border-dashed border-purple-400 focus:outline-none"
                                    placeholder="0"
                                  />
                                  <span className="text-[10px] font-mono font-bold text-purple-700">₭</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[9px] text-slate-400" title="ຄ່າຕັ້ງບລັອກ / ຄ່າ Set-up ເຄື່ອງຄົງທີ່">
                                <span>Set-up:</span>
                                <div className="flex items-center gap-0.5">
                                  <input
                                    type="number"
                                    value={(opt as any).fixedSetupCost || 0}
                                    onChange={(e) => handleOptionFieldChange(gIdx, oIdx, 'fixedSetupCost', parseFloat(e.target.value) || 0)}
                                    className="w-12 px-1 text-[10px] font-mono bg-white border border-slate-200 rounded text-right"
                                    placeholder="0"
                                  />
                                  <span>₭</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 5. Remove Button */}
                          <div className="lg:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(gIdx, oIdx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                              title="ລຶບຕົວເລືອກນີ້"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handleAddOption(gIdx)}
                      className="w-full py-2.5 border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-2xl text-xs font-bold text-purple-700 flex items-center justify-center gap-1.5 hover:bg-purple-50/50 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + ເພີ່ມແຖວຕົວເລືອກງານຫຼັງພິມໃນກຸ່ມນີ້ (Add Finishing Row)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
