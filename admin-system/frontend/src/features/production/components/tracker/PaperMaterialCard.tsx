import React from 'react';
import {
  FileText,
  Layers,
  Scissors,
  BookOpen,
  Sparkles,
  Maximize2
} from 'lucide-react';
import type { MasterOrderItem } from '../../../orders/types';

interface PaperMaterialCardProps {
  item: MasterOrderItem;
}

export const PaperMaterialCard: React.FC<PaperMaterialCardProps> = ({ item }) => {
  const formatBinding = (b: string) => {
    switch (b) {
      case 'PERFECT_HOT_GLUE': return 'ກາວຮ້ອນ (Perfect Binding)';
      case 'HARDCOVER_CASE_BINDING': return 'ເຂົ້າເຫຼັ້ມປົກແຂງ (Hardcover / Case Binding)';
      case 'SADDLE_STITCH': return 'ຫຍິບມຸງ (Saddle Stitch)';
      case 'WIRE_O': return 'ສັນຂົດລວດ (Wire-O)';
      case 'PLASTIC_COMB': return 'ສັນກະດູກງູ (Comb)';
      case 'CALENDAR': return 'ສັນປະຕິທິນ (Desk Calendar)';
      default: return b || 'ບໍ່ເຂົ້າເຫຼັ້ມ (None)';
    }
  };

  return (
    <div className="bg-white border border-sky-100 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-sky-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-sky-600 tracking-wider block">
              Paper & Material Specs
            </span>
            <h3 className="text-sm font-black text-slate-900">
              ຂະໜາດເຈ້ຍ & ວັດສະດຸທີ່ໃຊ້ຜະລິດ
            </h3>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-sky-50 text-sky-700 border border-sky-200">
          Job Specs
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Tile 1: Quantity */}
        <div className="p-3.5 bg-sky-50/40 border border-sky-100 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ຈຳນວນຜະລິດ</span>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-sky-700 font-mono">
              {item.quantity?.toLocaleString() || 100}
            </span>
            <span className="text-xs font-bold text-slate-500 ml-1.5">ຫົວ/ແຜ່ນ</span>
          </div>
        </div>

        {/* Tile 2: Size & Pages */}
        <div className="p-3.5 bg-sky-50/40 border border-sky-100 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ຂະໜາດ & ໜ້າ</span>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {item.paper_size || 'A4'}
            </span>
            <span className="text-xs font-bold text-slate-500 ml-1.5 block sm:inline">
              • {item.page_count || 1} ໜ້າ
            </span>
          </div>
        </div>

        {/* Tile 3: Material Stock & Paper Cost Per Sheet */}
        {(() => {
          const paperName = item.specs?.paper_name || item.specs?.paperName || (item as any).paper_name || 'Art Card 260gsm';
          const paperGsm = item.specs?.paperGSM || item.specs?.paper_gsm || (paperName.includes('260') ? 260 : paperName.includes('130') ? 130 : 80);
          const paperCostPerSheet = Number(
            item.specs?.paper_cost_per_sheet ||
            item.specs?.paperUnitCost ||
            item.specs?.paperCostPerSheet ||
            (item.unit_cost_lak > 0 ? Math.round(item.unit_cost_lak * 0.45) : (paperGsm >= 250 ? 1850 : paperGsm >= 120 ? 1200 : 650))
          );
          const isOffcutUsed = !!(item.specs?.usedOffcutLotId || (item as any).used_offcut_lot_id);

          return (
            <div className="p-3.5 bg-sky-50/40 border border-sky-100 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ວັດສະດຸ & ເຈ້ຍ</span>
              <div className="mt-2">
                <span className="text-xs sm:text-sm font-black text-slate-800 block truncate" title={paperName}>
                  {paperName}
                </span>
                <span className="text-[11px] text-sky-700 font-bold block">
                  ຕົ້ນທຶນເຈ້ຍ: {paperCostPerSheet.toLocaleString()} ₭/ແຜ່ນ
                </span>
                {isOffcutUsed && (
                  <span className="text-[10px] text-emerald-700 font-semibold block">
                    (ເສດເຈ້ຍສາງ - ປະຢັດ 35%)
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Tile 4: Binding & Spine */}
        <div className="p-3.5 bg-sky-50/40 border border-sky-100 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ເຂົ້າເຫຼັ້ມ & ສັນ</span>
          <div className="mt-2">
            <span className="text-xs sm:text-sm font-black text-slate-800 block truncate" title={formatBinding(item.binding_type)}>
              {formatBinding(item.binding_type)}
            </span>
            <span className="text-[11px] text-indigo-600 font-bold block">
              ສັນປຶ້ມ: {item.spine_width_mm || 0} ມມ
            </span>
          </div>
        </div>

        {/* Imposition Yield Banner for Batch Photos / Imposed Cuts */}
        {(() => {
          const isPhotoBatch = item.job_name?.toLowerCase().includes('photo') || 
            item.job_name?.toLowerCase().includes('ຮູບ') || 
            item.specs?.template_id === 'TPL_PHOTO_PRINT' ||
            !!item.specs?.imposition ||
            !!item.specs?.cuts_per_sheet;
          
          if (!isPhotoBatch) return null;

          const cutsPerSheet = Number(item.specs?.cuts_per_sheet || item.specs?.imposition?.total_cuts || 3);
          const reqSheets = Math.ceil((item.quantity || 40) / cutsPerSheet);
          const spoilSheets = Math.ceil(reqSheets * 0.05);
          const totalParentSheets = reqSheets + spoilSheets;
          const parentSheet = item.specs?.parent_sheet || 'A4';

          return (
            <div className="col-span-2 sm:col-span-4 p-3 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                  <Scissors className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-sky-700 tracking-wider block">
                    ການຕັດເຈ້ຍໃຫຍ່ຕົວຈິງ (Imposition Cutting Yield)
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    ຕັດເຈ້ຍ {parentSheet}: <span className="text-sky-700 font-black">{reqSheets} ແຜ່ນ</span> (ໄດ້ {item.quantity || 40} ຮູບ, ຈັດວາງ {cutsPerSheet} ຮູບ/ແຜ່ນ + ເຜື່ອເສຍ {spoilSheets} = ລວມ <span className="text-indigo-700 font-black">{totalParentSheets} ແຜ່ນ</span>)
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-white text-sky-700 font-mono font-bold text-[11px] rounded-xl border border-sky-200 shrink-0">
                {cutsPerSheet}-Up on {parentSheet}
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
