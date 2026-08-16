import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  Scissors,
  BookOpen,
  PackageCheck,
  AlertCircle,
  QrCode,
  ArrowLeft,
} from 'lucide-react';
import type { MasterOrder, MasterOrderItem, ProductionStep } from '../orders/types';

interface StepConfig {
  step: ProductionStep;
  stepNumber: number;
  labelLao: string;
  icon: React.ReactNode;
  modalTitle: string;
  modalMessage: string;
}

const PRODUCTION_STEPS: StepConfig[] = [
  {
    step: 'INNER_PRINTED',
    stepNumber: 1,
    labelLao: '1. ພິມເນື້ອໃນແລ້ວ',
    icon: <Printer className="w-4 h-4" />,
    modalTitle: '📄 ພິມເນື້ອໃນສຳເລັດແລ້ວ!',
    modalMessage: 'ກະລຸນາກວດສອບຄວາມຖືກຕ້ອງຂອງຈຳນວນແຜ່ນ, ໜ້າ-ຫຼັງ (Duplex) ແລະ ຄວາມຄົມຊັດຂອງເນື້ອໃນກ່ອນຢືນຢັນ',
  },
  {
    step: 'COVER_PRINTED',
    stepNumber: 2,
    labelLao: '2. ພິມປົກແລ້ວ',
    icon: <Sparkles className="w-4 h-4" />,
    modalTitle: '🎨 ພິມໜ້າປົກສຳເລັດແລ້ວ!',
    modalMessage: 'ກະລຸນາກວດສອບຄວາມຖືກຕ້ອງຂອງສີປົກ (CMYK) ແລະ ຕຳແໜ່ງສັນປຶ້ມ (Spine)',
  },
  {
    step: 'COVER_LAMINATED',
    stepNumber: 3,
    labelLao: '3. ເຄືອບປົກແລ້ວ',
    icon: <Sparkles className="w-4 h-4" />,
    modalTitle: '✨ ເຄືອບໜ້າປົກສຳເລັດແລ້ວ!',
    modalMessage: 'ກວດສອບຄວາມລຽບນຽນຂອງຟິມເຄືອບເງົາ/ດ້ານ ບໍ່ໃຫ້ມີຟອງອາກາດ',
  },
  {
    step: 'PAPER_TRIMMED',
    stepNumber: 4,
    labelLao: '4. ຕັດເຈ້ຍແລ້ວ',
    icon: <Scissors className="w-4 h-4" />,
    modalTitle: '✂️ ຕັດເຈ້ຍ/ເຈຽນສຳເລັດ!',
    modalMessage: 'ກວດສອບຂະໜາດສຳເລັດ (Trim Size) ຕາມມາດຕະຖານທີ່ກຳນົດໄວ້',
  },
  {
    step: 'BOUND',
    stepNumber: 5,
    labelLao: '5. ເຂົ້າສັນແລ້ວ',
    icon: <BookOpen className="w-4 h-4" />,
    modalTitle: '📘 ເຂົ້າສັນປຶ້ມສຳເລັດແລ້ວ!',
    modalMessage: 'ກວດສອບຄວາມແໜ້ນຂອງສັນກາວ/ສັນຫ່ວງ ແລະ ຄວາມຮຽບຮ້ອຍຂອງປຶ້ມ',
  },
  {
    step: 'READY_FOR_PICKUP',
    stepNumber: 6,
    labelLao: '6. QC ພ້ອມມອບ',
    icon: <PackageCheck className="w-4 h-4" />,
    modalTitle: '📦 ກວດຮັບ QC ພ້ອມມອບ!',
    modalMessage: 'ກວດສອບຈຳນວນເລ່ມຄົບຖ້ວນ, ບັນທຶກຈຳນວນເສຍຕົວຈິງ ແລະ ແພັກລົງກ່ອງພ້ອມມອບໃຫ້ລູກຄ້າ',
  },
];

export const ShopFloorTracker: React.FC<{ initialOrderNo?: string }> = ({ initialOrderNo }) => {
  const pathOrderNo = typeof window !== 'undefined' && window.location.pathname.startsWith('/track')
    ? window.location.pathname.replace(/^\/track\/?/, '')
    : '';
  const orderNo = initialOrderNo || pathOrderNo || 'ORD-202608-001';

  const [order, setOrder] = useState<MasterOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [activeModalItem, setActiveModalItem] = useState<{
    item: MasterOrderItem;
    stepConfig: StepConfig;
  } | null>(null);
  const [spoilageCount, setSpoilageCount] = useState<number>(0);
  const [operatorNotes, setOperatorNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/orders/track/${orderNo}`);
      if (!res.ok) {
        throw new Error('Order not found');
      }
      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      console.warn('Track API error, using simulation fallback:', err);
      // Fallback mock simulation for demo/dev
      const mockOrder: MasterOrder = {
        id: 'mock-order-001',
        order_no: orderNo,
        order_number: orderNo,
        customer_name: 'ສົມພອນ ວົງສາ (Somphone Vongsa)',
        customer_phone: '020-5555-5555',
        total_amount_lak: 1850000,
        deposit_lak: 925000,
        remaining_lak: 925000,
        overall_status: 'IN_PRODUCTION',
        delivery_date: '2026-08-20',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [
          {
            id: 'item-1',
            order_id: 'mock-order-001',
            item_name: 'ຄູ່ມືທຸລະກິດ (ສະບັບພາສາລາວ)',
            quantity: 100,
            page_count: 120,
            paper_size: 'A5',
            binding_type: 'PERFECT_HOT_GLUE',
            spine_width_mm: 7.1,
            current_step: 'INNER_PRINTED',
            avg_cov_c: 2.15,
            avg_cov_m: 3.4,
            avg_cov_y: 1.8,
            avg_cov_k: 7.5,
            unit_cost_lak: 6500,
            unit_price_lak: 9250,
            total_price_lak: 925000,
            cover_file_url: `/api/v1/orders/files/orders/${orderNo}/cover_lao.pdf`,
            inner_file_url: `/api/v1/orders/files/orders/${orderNo}/inner_lao.pdf`,
          },
          {
            id: 'item-2',
            order_id: 'mock-order-001',
            item_name: 'Business Handbook (English Edition)',
            quantity: 100,
            page_count: 120,
            paper_size: 'A5',
            binding_type: 'PERFECT_HOT_GLUE',
            spine_width_mm: 7.1,
            current_step: 'PENDING',
            avg_cov_c: 2.15,
            avg_cov_m: 3.4,
            avg_cov_y: 1.8,
            avg_cov_k: 7.5,
            unit_cost_lak: 6500,
            unit_price_lak: 9250,
            total_price_lak: 925000,
            cover_file_url: `/api/v1/orders/files/orders/${orderNo}/cover_eng.pdf`,
            inner_file_url: `/api/v1/orders/files/orders/${orderNo}/inner_eng.pdf`,
          },
        ],
      };
      setOrder(mockOrder);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderNo]);

  const handleStepClick = (item: MasterOrderItem, stepConfig: StepConfig) => {
    setActiveModalItem({ item, stepConfig });
    setSpoilageCount(0);
    setOperatorNotes('');
  };

  const handleConfirmStep = async () => {
    if (!activeModalItem) return;

    setUpdating(true);
    const { item, stepConfig } = activeModalItem;

    try {
      const res = await fetch(`/api/v1/orders/items/${item.id}/step`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: stepConfig.step,
          spoilage_count: spoilageCount,
          notes: operatorNotes,
        }),
      });

      if (res.ok) {
        // Update state locally
        setOrder((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((i) =>
              i.id === item.id ? { ...i, current_step: stepConfig.step } : i
            ),
          };
        });
      }
    } catch (err) {
      console.warn('Failed to update step via API, updating local state:', err);
      setOrder((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === item.id ? { ...i, current_step: stepConfig.step } : i
          ),
        };
      });
    } finally {
      setUpdating(false);
      setActiveModalItem(null);
    }
  };

  const isStepPassedOrCurrent = (currentStep: ProductionStep, targetStepNumber: number) => {
    const stepOrder: Record<ProductionStep, number> = {
      PENDING: 0,
      INNER_PRINTED: 1,
      COVER_PRINTED: 2,
      COVER_LAMINATED: 3,
      PAPER_TRIMMED: 4,
      BOUND: 5,
      READY_FOR_PICKUP: 6,
      COMPLETED: 7,
    };
    const currentNum = stepOrder[currentStep] || 0;
    return currentNum >= targetStepNumber;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <Clock className="w-8 h-8 animate-spin text-indigo-400" />
          <p>ກຳລັງໂຫຼດຂໍ້ມູນຕິດຕາມການຜະລິດ...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-300">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-100">ບໍ່ພົບຂໍ້ມູນອໍເດີ {orderNo}</h3>
        <p className="text-sm text-slate-400 mt-1">ກະລຸນາກວດສອບເລກອໍເດີ ຫຼື ສະແກນ QR Code ໃໝ່ອີກຄັ້ງ</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> ກັບຄືນ
        </button>

        <a
          href={`/api/v1/orders/${order.order_no || order.id}/job-ticket`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <QrCode className="w-3.5 h-3.5" /> ດາວໂຫຼດ Job Ticket (PDF A4)
        </a>
      </div>

      {/* Order Header Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-md">
                {order.order_no || order.order_number || order.id}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">
                {order.overall_status || 'IN_PRODUCTION'}
              </span>
            </div>
            <h2 className="text-xl font-bold mt-2">{order.customer_name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">📞 {order.customer_phone || '-'}</p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">ຍອດລວມທັງໝົດ (LAK)</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {(order.total_amount_lak || 0).toLocaleString()} ₭
            </div>
            <div className="text-xs text-slate-400 mt-1">
              ມັດຈຳແລ້ວ:{' '}
              <strong className="text-slate-200">{(order.deposit_lak || 0).toLocaleString()} ₭</strong> | ຄົງເຫຼືອ:{' '}
              <strong className="text-amber-400">{(order.remaining_lak || 0).toLocaleString()} ₭</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Job Items List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          ລາຍການງານພິມໃນອໍເດີ ({order.items?.length || 0} ລາຍການ)
        </h3>

        {order.items?.map((item, idx) => {
          return (
            <div
              key={item.id || idx}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5"
            >
              {/* Item Header & Download Links */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs text-indigo-400 font-semibold">Job Item #{idx + 1}</div>
                  <h4 className="text-lg font-bold text-slate-100">{item.item_name || item.job_name}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>ຈຳນວນ: <strong className="text-slate-200">{item.quantity} ຫົວ</strong></span>
                    <span>•</span>
                    <span>ໜ້າ: <strong className="text-slate-200">{item.page_count} ໜ້າ ({item.paper_size || 'A5'})</strong></span>
                    <span>•</span>
                    <span>ສັນປຶ້ມ: <strong className="text-slate-200">{item.spine_width_mm || 0} ມມ</strong></span>
                    <span>•</span>
                    <span>ເຂົ້າສັນ: <strong className="text-slate-200">{item.binding_type}</strong></span>
                  </div>
                </div>

                {/* Direct Artwork Download Buttons */}
                <div className="flex items-center gap-2">
                  <a
                    href={item.cover_file_url || '#'}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-pink-400" />
                    <span>ດາວໂຫຼດໄຟລ໌ປົກ</span>
                  </a>

                  <a
                    href={item.inner_file_url || '#'}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ດາວໂຫຼດໄຟລ໌ເນື້ອໃນ</span>
                  </a>
                </div>
              </div>

              {/* 6 Step Interactive Production Tracker */}
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center justify-between">
                  <span>ຂັ້ນຕອນການຜະລິດ (ກົດເພື່ອອັບເດດສະຖານະ):</span>
                  <span className="text-indigo-400 font-mono">
                    ສະຖານະປັດຈຸບັນ: {item.current_step || 'PENDING'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {PRODUCTION_STEPS.map((stepCfg) => {
                    const isCompleted = isStepPassedOrCurrent(item.current_step, stepCfg.stepNumber);
                    return (
                      <button
                        key={stepCfg.step}
                        onClick={() => handleStepClick(item, stepCfg)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-950/30'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                      >
                        <div className="mb-1">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <span className="w-5 h-5 rounded-full border border-slate-600 inline-flex items-center justify-center text-[10px]">
                              {stepCfg.stepNumber}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium leading-tight">{stepCfg.labelLao}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal Alert */}
      {activeModalItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-slate-100">
            {/* Modal Title */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                {activeModalItem.stepConfig.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold">{activeModalItem.stepConfig.modalTitle}</h3>
                <p className="text-xs text-slate-400">{activeModalItem.item.item_name}</p>
              </div>
            </div>

            {/* Modal Message */}
            <p className="text-sm text-slate-300 leading-relaxed">
              {activeModalItem.stepConfig.modalMessage}
            </p>

            {/* Spoilage Input if Step 6 or General */}
            {activeModalItem.stepConfig.stepNumber >= 4 && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <label className="text-xs font-semibold text-amber-300 flex items-center justify-between">
                  <span>ຈຳນວນເຈ້ຍເສຍຕົວຈິງ (Actual Spoilage Count):</span>
                  <span className="text-[10px] text-slate-400">ເປົ້າໝາຍ ≤ 5%</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={spoilageCount}
                    onChange={(e) => setSpoilageCount(parseInt(e.target.value) || 0)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm w-24 text-center font-mono focus:border-amber-400 outline-none text-slate-100"
                  />
                  <span className="text-xs text-slate-400">ແຜ່ນ / ຊຸດ</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                ຍົກເລີກ
              </button>

              <button
                type="button"
                onClick={handleConfirmStep}
                disabled={updating}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {updating ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>ຢືນຢັນຂັ້ນຕອນນີ້</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
