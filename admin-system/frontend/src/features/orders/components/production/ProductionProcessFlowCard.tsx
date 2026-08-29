import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Scissors, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Sparkles,
  RefreshCw,
  User,
  Settings,
  Package,
  Calendar,
  Check,
  RotateCcw,
  Award,
  Coins
} from 'lucide-react';
import { useApp } from '@store/AppContext';
import { ProductionWorkflow, ProductionWorkflowStep, WorkflowStepCategory } from '../../types';
import ConfigureWorkflowModal from '../modals/ConfigureWorkflowModal';

interface ProductionProcessFlowCardProps {
  orderId: any;
  orderStatus: string;
  orderSpecs?: any;
  currentLang: string;
  productionWorkflow?: ProductionWorkflow;
  onAdvanceToStep3: () => void;
  onUpdateStatus: (orderId: any, newStatus: string) => void;
  onUpdateWorkflow?: (workflow: ProductionWorkflow) => void;
  showToast: (msg: string, type?: string) => void;
  order?: any;
}

export const ProductionProcessFlowCard: React.FC<ProductionProcessFlowCardProps> = ({
  orderId,
  orderStatus,
  orderSpecs,
  currentLang,
  productionWorkflow,
  onAdvanceToStep3,
  onUpdateStatus,
  onUpdateWorkflow,
  showToast,
  order,
}) => {
  const { employees = [], addEarningRecord } = useApp();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Fallback default 4 stages if no dynamic workflow configured
  const defaultSteps: ProductionWorkflowStep[] = [
    {
      id: 'step_default_print',
      name: 'Digital / Offset Printing',
      nameLao: '1. ພິມອອກແທ່ນພິມ',
      category: 'PRESS',
      status: ['Printing', 'Cutting', 'Ready', 'Delivered', 'COMPLETED'].includes(orderStatus) ? 'COMPLETED' : 'PENDING',
    },
    {
      id: 'step_default_cut',
      name: 'Guillotine Precision Cutting',
      nameLao: '2. ຕັດເຈ້ຍ & ຕັດເຈຽນ',
      category: 'POST_PRESS',
      status: ['Cutting', 'Ready', 'Delivered', 'COMPLETED'].includes(orderStatus) ? 'COMPLETED' : 'PENDING',
    },
    {
      id: 'step_default_finish',
      name: orderSpecs?.binding || 'Binding & Finishing',
      nameLao: orderSpecs?.binding ? `3. ເຂົ້າເລ່ມ (${orderSpecs.binding})` : '3. ເຂົ້າເລ່ມ & ແປຮູບ',
      category: 'FINISHING',
      status: ['Ready', 'Delivered', 'COMPLETED'].includes(orderStatus) ? 'COMPLETED' : 'PENDING',
    },
    {
      id: 'step_default_qc',
      name: '100% Quality Inspection',
      nameLao: '4. ກວດສອບຄຸນນະພາບ & ແພັກ',
      category: 'QC',
      status: ['Ready', 'Delivered', 'COMPLETED'].includes(orderStatus) ? 'COMPLETED' : 'PENDING',
    },
  ];

  const currentWorkflowSteps = productionWorkflow?.steps && productionWorkflow.steps.length > 0
    ? productionWorkflow.steps
    : defaultSteps;

  const [steps, setSteps] = useState<ProductionWorkflowStep[]>(currentWorkflowSteps);

  useEffect(() => {
    if (productionWorkflow?.steps && productionWorkflow.steps.length > 0) {
      setSteps(productionWorkflow.steps);
    }
  }, [productionWorkflow]);

  const completedStepsCount = steps.filter((s) => s.status === 'COMPLETED').length;
  const isAllProductionCompleted = steps.length > 0 && completedStepsCount === steps.length;
  const progressPercent = steps.length > 0 ? Math.round((completedStepsCount / steps.length) * 100) : 0;

  const handleToggleStep = (stepId: string) => {
    let completedStepItem: ProductionWorkflowStep | null = null;
    let isNowDone = false;

    const updatedSteps = steps.map((step) => {
      if (step.id === stepId) {
        const isDone = step.status === 'COMPLETED';
        const nextStatus: 'PENDING' | 'COMPLETED' = isDone ? 'PENDING' : 'COMPLETED';
        isNowDone = nextStatus === 'COMPLETED';
        const updatedStep = {
          ...step,
          status: nextStatus,
          completedAt: nextStatus === 'COMPLETED' ? new Date().toISOString() : null,
          completedBy: nextStatus === 'COMPLETED' ? (step.assignedStaffName || 'Operator') : null,
        };
        completedStepItem = updatedStep;
        return updatedStep;
      }
      return step;
    });

    setSteps(updatedSteps);

    // Auto-calculate Technician Piece-Rate Incentive if marked COMPLETE
    if (isNowDone && completedStepItem && addEarningRecord) {
      const stepItem = completedStepItem as ProductionWorkflowStep;
      const assignedEmp = employees.find(
        (e) => e.id === stepItem.assignedTo || e.name === stepItem.assignedStaffName
      ) || employees.find((e) => (e.role || '').includes('operator') || (e.role || '').includes('cutting')) || employees[0];

      if (assignedEmp && assignedEmp.pieceRatePerImpression && Number(assignedEmp.pieceRatePerImpression) > 0) {
        const pages = Number(order?.totalPages || orderSpecs?.totalPages || 1);
        const copies = Number(order?.totalCopies || order?.quantity || orderSpecs?.quantity || 100);
        const impressions = Number(order?.totalImpressions || orderSpecs?.impressions || (pages * copies));
        const rate = Number(assignedEmp.pieceRatePerImpression);
        const earned = Math.round(rate * Math.max(1, impressions));

        addEarningRecord({
          employeeId: assignedEmp.id,
          employeeName: assignedEmp.name,
          orderId: String(orderId),
          orderNumber: order?.orderNumber || String(orderId),
          customerName: order?.customerName || 'Customer',
          stepId: stepItem.id,
          stepName: stepItem.nameLao || stepItem.name,
          impressions,
          ratePerImpression: rate,
          earnedAmount: earned,
        });

        showToast(
          currentLang === 'lo'
            ? `ບັນທຶກຄ່າແຮງງານພິເສດ (${assignedEmp.name}): +${earned.toLocaleString()} LAK`
            : `Incentive recorded for ${assignedEmp.name}: +${earned.toLocaleString()} LAK`,
          'success'
        );
      }
    }

    const newCompletedCount = updatedSteps.filter((s) => s.status === 'COMPLETED').length;
    const allDone = newCompletedCount === updatedSteps.length;

    const updatedWorkflow: ProductionWorkflow = {
      templateId: productionWorkflow?.templateId || 'custom',
      templateName: productionWorkflow?.templateName || 'Production Workflow',
      templateNameLao: productionWorkflow?.templateNameLao || 'ຂະບວນການຜະລິດ',
      steps: updatedSteps,
      completedAt: allDone ? new Date().toISOString() : undefined,
    };

    if (onUpdateWorkflow) {
      onUpdateWorkflow(updatedWorkflow);
    }
    if (order) {
      order.productionWorkflow = updatedWorkflow;
    }

    // Status sync
    if (allDone) {
      onUpdateStatus(orderId, 'Ready');
      showToast(
        currentLang === 'lo' 
          ? 'ຂະບວນການຜະລິດສຳເລັດ 100%! ປັບສະຖານະເປັນ ພ້ອມຈັດສົ່ງ (Ready for Pickup)' 
          : 'All production steps completed! Status updated to Ready for Pickup', 
        'success'
      );
    } else {
      onUpdateStatus(orderId, 'IN_PRODUCTION');
    }
  };

  const getCategoryIcon = (category: WorkflowStepCategory) => {
    switch (category) {
      case 'PRE_PRESS':
        return <Scissors className="w-4 h-4 text-blue-600" />;
      case 'PRESS':
        return <Printer className="w-4 h-4 text-amber-600" />;
      case 'POST_PRESS':
        return <Scissors className="w-4 h-4 text-purple-600" />;
      case 'FINISHING':
        return <Layers className="w-4 h-4 text-indigo-600" />;
      case 'QC':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'PACKAGING':
        return <Package className="w-4 h-4 text-teal-600" />;
      default:
        return <RefreshCw className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatStepTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
                Production Workflow Tracker
              </span>
              {productionWorkflow?.templateName && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  {productionWorkflow.templateNameLao || productionWorkflow.templateName}
                </span>
              )}
            </div>
            <h3 className="text-sm font-black text-slate-900 mt-0.5">
              {currentLang === 'lo' ? 'ຂະບວນການຜະລິດ & ມອບໝາຍຊ່າງ (Interactive Workflow)' : 'Production & Finishing Pipeline'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentLang === 'lo' ? 'ປັບແຕ່ງສາຍງານ' : 'Configure Steps'}</span>
          </button>

          <span className={`px-3 py-1.5 rounded-2xl text-xs font-black uppercase border flex items-center gap-1.5 ${
            isAllProductionCompleted 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-purple-50 text-purple-700 border-purple-200'
          }`}>
            <span>{isAllProductionCompleted ? 'ຜະລິດຄົບ 100%' : `${completedStepsCount}/${steps.length} ຂັ້ນຕອນ`}</span>
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-700">
            {currentLang === 'lo' ? 'ຄວາມຄືບໜ້າການຜະລິດລວມ:' : 'Overall Production Progress:'}
          </span>
          <span className="font-mono font-black text-amber-700">
            {progressPercent}% ({completedStepsCount} / {steps.length} {currentLang === 'lo' ? 'ສຳເລັດ' : 'done'})
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Dynamic Workflow Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {steps.map((step, idx) => {
          const isDone = step.status === 'COMPLETED';

          return (
            <div
              key={step.id || idx}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 ${
                isDone
                  ? 'bg-emerald-50/70 border-emerald-200 shadow-2xs'
                  : 'bg-slate-50/90 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Step Top Badges */}
                <div className="flex justify-between items-start">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition ${
                    isDone ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700'
                  }`}>
                    {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getCategoryIcon(step.category)}
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      Stage {idx + 1}
                    </span>
                  </div>
                </div>

                {/* Step Title & Subtitle */}
                <h4 className="text-xs font-black text-slate-900 mt-2.5 line-clamp-1">
                  {step.nameLao || step.name}
                </h4>
                <p className="text-[10.5px] text-slate-500 mt-0.5 font-medium line-clamp-1">
                  {step.name}
                </p>

                {/* Assigned Technician Badge */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 text-[10px] font-bold">
                    {currentLang === 'lo' ? 'ຊ່າງຮັບຜິດຊອບ:' : 'Operator:'}
                  </span>
                  {step.assignedStaffName ? (
                    <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      <User className="w-3 h-3 text-blue-600" />
                      <span className="truncate max-w-[100px]">{step.assignedStaffName}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 italic text-[10px]">
                      {currentLang === 'lo' ? 'ຍັງບໍ່ໄດ້ກຳນົດ' : 'Unassigned'}
                    </span>
                  )}
                </div>

                {/* Completion Timestamp */}
                {isDone && step.completedAt && (
                  <div className="mt-1 flex items-center justify-between text-[10px] text-emerald-700 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatStepTime(step.completedAt)}</span>
                    </span>
                    <span>{step.completedBy ? `by ${step.completedBy}` : '✓'}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleToggleStep(step.id)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                  isDone
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-200 border border-slate-300 text-slate-800'
                }`}
              >
                {isDone ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{currentLang === 'lo' ? 'ສຳເລັດແລ້ວ' : 'Completed'}</span>
                  </>
                ) : (
                  <>
                    <span>{currentLang === 'lo' ? 'ກົດຢືນຢັນສຳເລັດ' : 'Mark Done'}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Advance Action: Ready for Delivery (Step 3) */}
      <div className="pt-2">
        {isAllProductionCompleted ? (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-600/25 animate-fade-in">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <strong className="block text-sm">
                  {currentLang === 'lo' ? 'ສິນຄ້າຜະລິດ ແລະ ຜ່ານ QC ຄົບທຸກຂັ້ນຕອນແລ້ວ!' : 'All Production & Finishing Steps Completed!'}
                </strong>
                <span className="text-xs text-emerald-100 block mt-0.5">
                  {currentLang === 'lo' ? 'ພ້ອມສົ່ງຕໍ່ເຂົ້າສູ່ຂັ້ນຕອນການຈັດສົ່ງ (Step 3: Delivery)' : 'Ready to advance to delivery and packaging'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onAdvanceToStep3}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-100 text-emerald-900 text-xs font-black rounded-2xl shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-none"
            >
              <span>{currentLang === 'lo' ? 'ສົ່ງຕໍ່ເຂົ້າຂັ້ນຕອນການຈັດສົ່ງ (Step 3)' : 'Advance to Delivery (Step 3)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center justify-between">
            <span className="font-semibold">
              {currentLang === 'lo'
                ? `ກະລຸນາກວດສອບ ແລະ ຢືນຢັນຂະບວນການຜະລິດຄົບທຸກຂັ້ນຕອນ (${completedStepsCount}/${steps.length}) ເພື່ອປົດລັອກການຈັດສົ່ງ`
                : `Please complete all configured steps (${completedStepsCount}/${steps.length}) to unlock delivery`}
            </span>
            <span className="font-mono font-bold text-amber-600">
              {completedStepsCount} / {steps.length} {currentLang === 'lo' ? 'ສຳເລັດ' : 'done'}
            </span>
          </div>
        )}
      </div>

      {/* Configure Workflow Modal inside Step 2 */}
      {isConfigModalOpen && (
        <ConfigureWorkflowModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          order={order || { id: orderId, productionWorkflow }}
          currentLang={currentLang}
          onConfirmWorkflow={(newWorkflow) => {
            setSteps(newWorkflow.steps);
            if (onUpdateWorkflow) {
              onUpdateWorkflow(newWorkflow);
            }
            if (order) {
              order.productionWorkflow = newWorkflow;
            }
            showToast(
              currentLang === 'lo' ? 'ອັບເດດສາຍງານການຜະລິດໃໝ່ຮຽບຮ້ອຍແລ້ວ' : 'Production workflow updated',
              'success'
            );
          }}
        />
      )}
    </div>
  );
};

export default ProductionProcessFlowCard;
