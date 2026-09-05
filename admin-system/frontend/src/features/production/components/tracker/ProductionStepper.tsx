import React from 'react';
import {
  Check,
  Layers,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import type { ProductionStep } from '../../../orders/types';
import { PRODUCTION_STEPS_CONFIG, STEP_ORDER_MAP } from './types';

interface ProductionStepperProps {
  currentStep: ProductionStep;
  onAdvanceStep: (targetStep: ProductionStep) => void;
}

export const ProductionStepper: React.FC<ProductionStepperProps> = ({
  currentStep,
  onAdvanceStep,
}) => {
  const currentNum = STEP_ORDER_MAP[currentStep] || 0;

  return (
    <div className="bg-white border border-sky-100 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-sky-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-sky-600 tracking-wider block">
              6-Milestone Pipeline
            </span>
            <h3 className="text-sm font-black text-slate-900">
              ຂັ້ນຕອນການຜະລິດ (Production Milestones)
            </h3>
          </div>
        </div>
        <span className="font-mono text-xs text-sky-700 font-black bg-sky-50 px-3 py-1 rounded-xl border border-sky-200">
          ຄວາມຄືບໜ້າ: {Math.min(100, Math.round((currentNum / 6) * 100))}%
        </span>
      </div>

      {/* Stepper Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {PRODUCTION_STEPS_CONFIG.map((cfg) => {
          const isDone = currentNum > cfg.stepNumber;
          const isActive = currentNum === cfg.stepNumber;

          return (
            <button
              key={cfg.step}
              type="button"
              onClick={() => onAdvanceStep(cfg.step)}
              className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center ${
                isDone
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : isActive
                  ? 'bg-sky-500 border-2 border-sky-600 text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-300'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              }`}
            >
              {/* Active Pulse Badge */}
              {isActive && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
              )}

              <div className="mb-2">
                {isDone ? (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : isActive ? (
                  <div className="w-7 h-7 rounded-full bg-white text-sky-700 flex items-center justify-center font-black text-xs shadow-xs">
                    {cfg.stepNumber}
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                    {cfg.stepNumber}
                  </div>
                )}
              </div>

              <span className={`text-xs font-black leading-tight ${isActive ? 'text-white' : isDone ? 'text-emerald-900' : 'text-slate-700'}`}>
                {cfg.labelLao}
              </span>
              <span className={`text-[10px] font-medium mt-0.5 ${isActive ? 'text-sky-100' : 'text-slate-400'}`}>
                {cfg.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
