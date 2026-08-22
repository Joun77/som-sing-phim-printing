import React from 'react';
import { CheckCircle2, Clock, Printer, Truck, CheckCheck, ChevronRight, Lock } from 'lucide-react';

export interface OrderStepBarProps {
  currentStep: 1 | 2 | 3 | 4;
  onSelectStep: (step: 1 | 2 | 3 | 4) => void;
  isPaymentConfirmed: boolean;
  isArtworkApproved: boolean;
  isProductionFinished: boolean;
  isDelivered: boolean;
  currentLang: string;
}

export const OrderStepBar: React.FC<OrderStepBarProps> = ({
  currentStep,
  onSelectStep,
  isPaymentConfirmed,
  isArtworkApproved,
  isProductionFinished,
  isDelivered,
  currentLang,
}) => {
  const step1Ready = isPaymentConfirmed && isArtworkApproved;
  const step2Ready = isProductionFinished;
  const step3Ready = isDelivered;

  const steps = [
    {
      num: 1 as const,
      title: currentLang === 'lo' ? '1. ຮັບອໍເດີ & ປຼູຟໄຟລ໌' : '1. Reception & Proof',
      desc: currentLang === 'lo' ? 'ກວດສະລິບ & ກວດໄຟລ໌' : 'Slip & Artwork check',
      icon: Clock,
      isDone: step1Ready,
      isUnlocked: true,
    },
    {
      num: 2 as const,
      title: currentLang === 'lo' ? '2. ຕິດຕາມການຜະລິດ' : '2. Production Tracker',
      desc: currentLang === 'lo' ? 'ພິມ, ຕັດ & ກວດ QC' : 'Print, Finish & QC',
      icon: Printer,
      isDone: step2Ready,
      isUnlocked: step1Ready || currentStep >= 2,
    },
    {
      num: 3 as const,
      title: currentLang === 'lo' ? '3. ຈັດສົ່ງ & ມອບຮັບ' : '3. Delivery & Handover',
      desc: currentLang === 'lo' ? 'ແພັກ, ຂົນສົ່ງ & ມອບຮັບ' : 'Pack, Dispatch & Handover',
      icon: Truck,
      isDone: step3Ready && currentStep > 3,
      isUnlocked: (step1Ready && step2Ready) || currentStep >= 3,
    },
    {
      num: 4 as const,
      title: currentLang === 'lo' ? '4. ສຳເລັດສົມບູນ' : '4. Completed Summary',
      desc: currentLang === 'lo' ? 'ສະຫຼຸບຂໍ້ມູນອໍເດີທັງໝົດ' : 'Full Order Archive',
      icon: CheckCheck,
      isDone: step3Ready && currentStep === 4,
      isUnlocked: step3Ready || currentStep === 4,
    },
  ];

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-5 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((st, idx) => {
          const isActive = currentStep === st.num;
          const isDone = st.isDone;
          const isUnlocked = st.isUnlocked;
          const Icon = st.icon;

          return (
            <button
              key={st.num}
              type="button"
              disabled={!isUnlocked}
              onClick={() => onSelectStep(st.num)}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]'
                  : isDone
                  ? 'bg-emerald-50/80 text-emerald-950 border-emerald-200/80 hover:bg-emerald-100/70'
                  : isUnlocked
                  ? 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                  : 'bg-slate-50/50 text-slate-400 border-slate-100 cursor-not-allowed opacity-60'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs transition ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : isUnlocked
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone && !isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : !isUnlocked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-black truncate ${
                      isActive ? 'text-white' : isDone ? 'text-emerald-900' : 'text-slate-900'
                    }`}
                  >
                    {st.title}
                  </span>
                  {idx < steps.length - 1 && (
                    <ChevronRight
                      className={`w-3.5 h-3.5 hidden lg:block shrink-0 ${
                        isActive ? 'text-slate-500' : 'text-slate-300'
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`text-[10.5px] block mt-0.5 truncate font-medium ${
                    isActive ? 'text-slate-300' : isDone ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {st.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStepBar;
