import React, { useState } from 'react';
import { 
  Printer, 
  Scissors, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface ProductionProcessFlowCardProps {
  orderId: any;
  orderStatus: string;
  orderSpecs?: any;
  currentLang: string;
  onAdvanceToStep3: () => void;
  onUpdateStatus: (orderId: any, newStatus: string) => void;
  showToast: (msg: string, type?: string) => void;
}

export const ProductionProcessFlowCard: React.FC<ProductionProcessFlowCardProps> = ({
  orderId,
  orderStatus,
  orderSpecs,
  currentLang,
  onAdvanceToStep3,
  onUpdateStatus,
  showToast,
}) => {
  // Post-Press Finishing Step derived dynamically from customer specs
  const bindingChoice = orderSpecs?.binding || 'ຫຍິບມຸງ / ເຂົ້າເລ່ມ';
  const laminationChoice = orderSpecs?.lamination || 'ເຄືອບດ້ານ / ເຄືອບເງົາ';

  // Sub-stages status tracking
  const [printDone, setPrintDone] = useState(
    ['Printing', 'Cutting', 'Ready', 'Delivered', 'COMPLETED'].includes(orderStatus)
  );
  const [cuttingDone, setCuttingDone] = useState(
    ['Cutting', 'Ready', 'Delivered', 'COMPLETED'].includes(orderStatus)
  );
  const [finishingDone, setFinishingDone] = useState(
    ['Ready', 'Delivered', 'COMPLETED'].includes(orderStatus)
  );
  const [qcPassed, setQcPassed] = useState(
    ['Ready', 'Delivered', 'COMPLETED'].includes(orderStatus)
  );

  const isAllProductionCompleted = printDone && cuttingDone && finishingDone && qcPassed;

  const handleToggleStage = (stage: 'print' | 'cutting' | 'finishing' | 'qc') => {
    if (stage === 'print') {
      const next = !printDone;
      setPrintDone(next);
      if (next) {
        onUpdateStatus(orderId, 'Printing');
        showToast(currentLang === 'lo' ? '✓ ອັບເດດ: ພິມສຳເລັດແລ້ວ' : 'Printing phase finished', 'info');
      }
    } else if (stage === 'cutting') {
      const next = !cuttingDone;
      setCuttingDone(next);
      if (next) {
        onUpdateStatus(orderId, 'Cutting');
        showToast(currentLang === 'lo' ? '✓ ອັບເດດ: ຕັດເຈ້ຍ & ຕັດເຈຽນສຳເລັດ' : 'Guillotine cutting finished', 'info');
      }
    } else if (stage === 'finishing') {
      const next = !finishingDone;
      setFinishingDone(next);
      if (next) {
        showToast(currentLang === 'lo' ? '✓ ອັບເດດ: ເຂົ້າເລ່ມ & ແປຮູບສຳເລັດ' : 'Binding & Finishing finished', 'info');
      }
    } else if (stage === 'qc') {
      const next = !qcPassed;
      setQcPassed(next);
      if (next) {
        onUpdateStatus(orderId, 'Ready');
        showToast(currentLang === 'lo' ? '✓ ອັບເດດ: ກວດ QC ຜ່ານ 100% ພ້ອມຈັດສົ່ງ!' : 'QC Passed 100%! Ready for dispatch', 'success');
      }
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider block">Production Pipeline</span>
            <h3 className="text-sm font-black text-slate-900">
              {currentLang === 'lo' ? 'ຂະບວນການຜະລິດ & ແປຮູບຫຼັງພິມ (Post-Press Finishing)' : 'Production & Finishing Workflow'}
            </h3>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${
          isAllProductionCompleted 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-purple-50 text-purple-700 border-purple-200'
        }`}>
          {isAllProductionCompleted ? '✓ ຜະລິດຄົບ 100%' : 'In Production'}
        </span>
      </div>

      {/* 4-Stage Sequential Flow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Stage 1: Print Run */}
        <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
          printDone ? 'bg-emerald-50/80 border-emerald-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <div className="flex justify-between items-start">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                printDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {printDone ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 font-mono">Stage 1</span>
            </div>
            <h4 className="text-xs font-black text-slate-900 mt-2">1. ພິມອອກແທ່ນພິມ</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Digital Color / Offset Press Run</p>
          </div>

          <button
            type="button"
            onClick={() => handleToggleStage('print')}
            className={`w-full py-2 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer ${
              printDone 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            {printDone ? '✓ ພິມແລ້ວ' : 'ກົດຢືນຢັນພິມ'}
          </button>
        </div>

        {/* Stage 2: Cutting */}
        <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
          cuttingDone ? 'bg-emerald-50/80 border-emerald-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <div className="flex justify-between items-start">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                cuttingDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {cuttingDone ? <CheckCircle2 className="w-4 h-4" /> : '2'}
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 font-mono">Stage 2</span>
            </div>
            <h4 className="text-xs font-black text-slate-900 mt-2">2. ຕັດເຈ້ຍ & ຕັດເຈຽນ</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Guillotine Precision Cutting</p>
          </div>

          <button
            type="button"
            onClick={() => handleToggleStage('cutting')}
            className={`w-full py-2 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer ${
              cuttingDone 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            {cuttingDone ? '✓ ຕັດແລ້ວ' : 'ກົດຢືນຢັນຕັດ'}
          </button>
        </div>

        {/* Stage 3: Finishing & Binding */}
        <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
          finishingDone ? 'bg-emerald-50/80 border-emerald-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <div className="flex justify-between items-start">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                finishingDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {finishingDone ? <CheckCircle2 className="w-4 h-4" /> : '3'}
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 font-mono">Stage 3</span>
            </div>
            <h4 className="text-xs font-black text-slate-900 mt-2">3. ເຂົ້າເລ່ມ & ເຄືອບ</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium truncate" title={`${bindingChoice} • ${laminationChoice}`}>
              {bindingChoice}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleToggleStage('finishing')}
            className={`w-full py-2 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer ${
              finishingDone 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            {finishingDone ? '✓ ແປຮູບແລ້ວ' : 'ກົດຢືນຢັນແປຮູບ'}
          </button>
        </div>

        {/* Stage 4: QC Passed */}
        <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
          qcPassed ? 'bg-emerald-50/80 border-emerald-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <div className="flex justify-between items-start">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                qcPassed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {qcPassed ? <CheckCircle2 className="w-4 h-4" /> : '4'}
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 font-mono">Stage 4</span>
            </div>
            <h4 className="text-xs font-black text-slate-900 mt-2">4. ກວດສອບຄຸນນະພາບ</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">100% Quality & Packing Inspection</p>
          </div>

          <button
            type="button"
            onClick={() => handleToggleStage('qc')}
            className={`w-full py-2 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer ${
              qcPassed 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            {qcPassed ? '✓ QC ຜ່ານແລ້ວ' : 'ກົດຢືນຢັນ QC'}
          </button>
        </div>

      </div>

      {/* Bottom Advance Action: Ready for Delivery (Step 3) */}
      <div className="pt-2">
        {isAllProductionCompleted ? (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-600/25 animate-fade-in">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <strong className="block text-sm">ສິນຄ້າຜະລິດ ແລະ ຜ່ານ QC ຄົບທຸກຂັ້ນຕອນແລ້ວ!</strong>
                <span className="text-xs text-emerald-100 block mt-0.5">ພ້ອມສົ່ງຕໍ່ເຂົ້າສູ່ຂັ້ນຕອນການຈັດສົ່ງ (Step 3: Delivery)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onAdvanceToStep3}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-100 text-emerald-900 text-xs font-black rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-none"
            >
              <span>{currentLang === 'lo' ? '📦 ສົ່ງຕໍ່ເຂົ້າຂັ້ນຕອນການຈັດສົ່ງ (Step 3) ➜' : 'Advance to Delivery (Step 3) ➜'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center justify-between">
            <span className="font-semibold">
              ກະລຸນາກວດສອບ ແລະ ຢືນຢັນຂະບວນການຜະລິດຄົບທັງ 4 ຂັ້ນຕອນ ເພື່ອປົດລັອກການຈັດສົ່ງ
            </span>
            <span className="font-mono font-bold text-amber-600">
              {[printDone, cuttingDone, finishingDone, qcPassed].filter(Boolean).length} / 4 ສຳເລັດ
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionProcessFlowCard;
