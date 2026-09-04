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
  Play,
  Pause,
  Check,
  AlertTriangle,
  Delete,
  X,
  Layers,
  Wrench,
  RotateCcw,
  Phone,
  Smartphone,
  Zap,
  Palette,
  Droplet,
  Search
} from 'lucide-react';
import type { MasterOrder, MasterOrderItem, ProductionStep } from '../orders/types';

interface StepConfig {
  step: ProductionStep;
  stepNumber: number;
  labelLao: string;
  labelEn: string;
  icon: React.ReactNode;
}

const PRODUCTION_STEPS: StepConfig[] = [
  {
    step: 'INNER_PRINTED',
    stepNumber: 1,
    labelLao: '1. ພິມເນື້ອໃນ',
    labelEn: 'Inner Print',
    icon: <Printer className="w-5 h-5" />,
  },
  {
    step: 'COVER_PRINTED',
    stepNumber: 2,
    labelLao: '2. ພິມປົກ',
    labelEn: 'Cover Print',
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    step: 'COVER_LAMINATED',
    stepNumber: 3,
    labelLao: '3. ເຄືອບປົກ',
    labelEn: 'Lamination',
    icon: <Layers className="w-5 h-5" />,
  },
  {
    step: 'PAPER_TRIMMED',
    stepNumber: 4,
    labelLao: '4. ຕັດເຈ້ຍ',
    labelEn: 'Paper Cut',
    icon: <Scissors className="w-5 h-5" />,
  },
  {
    step: 'BOUND',
    stepNumber: 5,
    labelLao: '5. ເຂົ້າສັນ',
    labelEn: 'Binding',
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    step: 'READY_FOR_PICKUP',
    stepNumber: 6,
    labelLao: '6. QC ພ້ອມມອບ',
    labelEn: 'Ready QC',
    icon: <PackageCheck className="w-5 h-5" />,
  },
];

const RCA_CAUSES = [
  { id: 'PAPER_JAM', icon: <FileText className="w-4 h-4 text-amber-500" />, labelLao: 'ເຈ້ຍຕິດ / ປ້ອນບ່ຽວ (Paper Jam)' },
  { id: 'COLOR_MISMATCH', icon: <Palette className="w-4 h-4 text-purple-500" />, labelLao: 'ສີບໍ່ຕົງ / ໝຶກພ້ຽນ (Color Mismatch)' },
  { id: 'PLATE_DAMAGED', icon: <Layers className="w-4 h-4 text-blue-500" />, labelLao: 'ເພລດເສຍ / ມີຮອຍຂີດ (Plate Scratch)' },
  { id: 'INK_SMUDGE', icon: <Droplet className="w-4 h-4 text-cyan-500" />, labelLao: 'ໝຶກເລິ / ເປິເປື້ອນ (Ink Smudge)' },
  { id: 'DIECUT_MISALIGNED', icon: <Scissors className="w-4 h-4 text-rose-500" />, labelLao: 'ຕັດບ່ຽວ / ໃບມີດບໍ່ຄົມ (Diecut Misalignment)' },
  { id: 'OTHER_FAULT', icon: <AlertTriangle className="w-4 h-4 text-amber-600" />, labelLao: 'ອື່ນໆ / ຂັດຂ້ອງທົ່ວໄປ (Other Cause)' },
];

import { useApp } from '../../store/AppContext';

export const ShopFloorTracker: React.FC<{ initialOrderNo?: string }> = ({ initialOrderNo }) => {
  const { orders } = useApp();
  const pathOrderNo = typeof window !== 'undefined' && window.location.pathname.startsWith('/track')
    ? window.location.pathname.replace(/^\/track\/?/, '')
    : '';
  const orderNo = initialOrderNo || pathOrderNo || 'ORD-202608-001';

  const [order, setOrder] = useState<MasterOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tablet Touch Action State & Spoilage Modal
  const [activeItem, setActiveItem] = useState<MasterOrderItem | null>(null);
  const [actionType, setActionType] = useState<'START' | 'PAUSE' | 'COMPLETE' | 'SPOILAGE'>('COMPLETE');
  const [showSpoilageModal, setShowSpoilageModal] = useState(false);
  const [spoilageCount, setSpoilageCount] = useState<number>(0);
  const [selectedRCA, setSelectedRCA] = useState<string>('PAPER_JAM');
  const [operatorNotes, setOperatorNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Check local AppContext orders first
      const localOrd = orders.find(
        (o: any) => o.id?.toLowerCase() === orderNo.toLowerCase() || 
                   (o as any).orderNumber?.toLowerCase() === orderNo.toLowerCase() || 
                   (o as any).orderNo?.toLowerCase() === orderNo.toLowerCase()
      );

      if (localOrd) {
        const mappedOrder: MasterOrder = {
          id: localOrd.id,
          order_no: (localOrd as any).orderNumber || (localOrd as any).orderNo || localOrd.id,
          order_number: (localOrd as any).orderNumber || (localOrd as any).orderNo || localOrd.id,
          customer_name: localOrd.customerName || 'ລູກຄ້າທົ່ວໄປ (General Customer)',
          customer_phone: (localOrd as any).customerPhone || '020-5555-5555',
          total_amount_lak: localOrd.totalPriceCharged || (localOrd as any).totalAmount || 0,
          deposit_lak: (localOrd.totalPriceCharged || 0) * 0.5,
          remaining_lak: (localOrd.totalPriceCharged || 0) * 0.5,
          overall_status: localOrd.status === 'Completed' ? 'COMPLETED' : 'IN_PRODUCTION',
          delivery_date: (localOrd as any).dueDate || (localOrd as any).deliveryDate || (localOrd as any).date || '2026-08-30',
          created_at: (localOrd as any).createdTime || (localOrd as any).createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: (localOrd.items && localOrd.items.length > 0) ? (localOrd.items || []).map((it: any, idx: number) => ({
            id: it.id || `item-${idx + 1}`,
            order_id: localOrd.id,
            item_name: it.name || it.description || `ລາຍການທີ ${idx + 1}`,
            quantity: it.quantity || 100,
            page_count: it.pageCount || 1,
            paper_size: it.paperSize || 'A4',
            binding_type: it.bindingType || 'PERFECT_HOT_GLUE',
            spine_width_mm: it.spineWidth || 5,
            current_step: it.currentStep || 'PENDING',
            avg_cov_c: 2.5,
            avg_cov_m: 2.5,
            avg_cov_y: 2.5,
            avg_cov_k: 5.0,
            unit_cost_lak: it.unitCost || 0,
            unit_price_lak: it.unitPrice || 0,
            total_price_lak: (it.unitPrice || 0) * (it.quantity || 1),
            cover_file_url: `/api/v1/orders/files/orders/${orderNo}/cover.pdf`,
            inner_file_url: `/api/v1/orders/files/orders/${orderNo}/inner.pdf`
          })) : [
            {
              id: 'item-1',
              order_id: localOrd.id,
              item_name: (localOrd as any).jobName || (localOrd as any).customJobName || 'ງານພິມມາດຕະຖານ',
              quantity: (localOrd as any).totalQuantity || (localOrd as any).quantity || 100,
              page_count: 1,
              paper_size: 'A4',
              binding_type: 'NONE',
              spine_width_mm: 0,
              current_step: 'PENDING',
              avg_cov_c: 2.5,
              avg_cov_m: 2.5,
              avg_cov_y: 2.5,
              avg_cov_k: 5.0,
              unit_cost_lak: 0,
              unit_price_lak: localOrd.totalPriceCharged || 0,
              total_price_lak: localOrd.totalPriceCharged || 0,
              cover_file_url: `/api/v1/orders/files/orders/${orderNo}/cover.pdf`,
              inner_file_url: `/api/v1/orders/files/orders/${orderNo}/inner.pdf`
            }
          ]
        };
        setOrder(mappedOrder);
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/v1/orders/track/${orderNo}`);
      if (!res.ok) {
        throw new Error('Order not found');
      }
      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      console.warn('Track API error, using simulation fallback:', err);
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

  // Touch action triggers
  const handleTriggerAction = (item: MasterOrderItem, type: 'START' | 'PAUSE' | 'COMPLETE' | 'SPOILAGE') => {
    setActiveItem(item);
    setActionType(type);
    setSpoilageCount(0);
    setSelectedRCA('PAPER_JAM');
    setOperatorNotes('');

    if (type === 'START') {
      // Direct start without modal
      executeStepUpdate(item, 'INNER_PRINTED', 0, 'NORMAL_START', 'Operator started job');
    } else {
      // Pause or Complete opens Spoilage Modal
      setShowSpoilageModal(true);
    }
  };

  const handleNumpadInput = (digit: string) => {
    if (digit === 'CLEAR') {
      setSpoilageCount(0);
      return;
    }
    if (digit === 'BACKSPACE') {
      const str = spoilageCount.toString();
      setSpoilageCount(str.length > 1 ? parseInt(str.slice(0, -1)) || 0 : 0);
      return;
    }
    const curStr = spoilageCount === 0 ? '' : spoilageCount.toString();
    const nextStr = curStr + digit;
    if (nextStr.length <= 5) {
      setSpoilageCount(parseInt(nextStr) || 0);
    }
  };

  const handleAddQuickCount = (delta: number) => {
    setSpoilageCount((prev) => Math.max(0, prev + delta));
  };

  const executeStepUpdate = async (
    item: MasterOrderItem,
    targetStep: ProductionStep,
    spoilage: number,
    rca: string,
    notes: string
  ) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/v1/orders/items/${item.id}/step`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: targetStep,
          spoilage_count: spoilage,
          rca_cause: rca,
          notes: notes,
        }),
      });

      if (res.ok) {
        setOrder((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((i) =>
              i.id === item.id ? { ...i, current_step: targetStep } : i
            ),
          };
        });
      }
    } catch (err) {
      console.warn('Step update error, updating local state fallback:', err);
      setOrder((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === item.id ? { ...i, current_step: targetStep } : i
          ),
        };
      });
    } finally {
      setUpdating(false);
      setShowSpoilageModal(false);
      setActiveItem(null);
    }
  };

  const handleConfirmSpoilageModal = () => {
    if (!activeItem) return;

    let targetStep: ProductionStep = activeItem.current_step || 'PENDING';
    if (actionType === 'COMPLETE') {
      targetStep = 'READY_FOR_PICKUP';
    } else if (actionType === 'START') {
      targetStep = 'INNER_PRINTED';
    }

    const note = `[${actionType}] RCA: ${selectedRCA} | Spoilage: ${spoilageCount} | ${operatorNotes}`;
    executeStepUpdate(activeItem, targetStep, spoilageCount, selectedRCA, note);
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
          <Clock className="w-10 h-10 animate-spin text-indigo-400" />
          <p className="text-base font-bold">ກຳລັງໂຫຼດຂໍ້ມູນຕິດຕາມການຜະລິດ (Shop Floor)...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center text-slate-300">
        <AlertCircle className="w-14 h-14 text-rose-400 mx-auto mb-3" />
        <h3 className="text-xl font-black text-slate-100">ບໍ່ພົບຂໍ້ມູນອໍເດີ {orderNo}</h3>
        <p className="text-sm text-slate-400 mt-1">ກະລຸນາກວດສອບເລກອໍເດີ ຫຼື ສະແກນ QR Code ໃໝ່ອີກຄັ້ງ</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 px-3 sm:px-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="min-h-[48px] px-4 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl text-sm font-bold border border-slate-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>ກັບຄືນ</span>
        </button>

        <a
          href={`/api/v1/orders/${order.order_no || order.id}/job-ticket`}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[48px] px-5 flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white border-2 border-indigo-400 rounded-xl text-sm font-black shadow-lg shadow-indigo-950/50 transition cursor-pointer"
        >
          <QrCode className="w-5 h-5" />
          <span>ດາວໂຫຼດ Job Ticket (PDF A4)</span>
        </a>
      </div>

      {/* Touch Summary Banner */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-black px-3.5 py-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-xl font-mono">
                {order.order_no || order.order_number || order.id}
              </span>
              <span className="text-xs font-bold px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl uppercase tracking-wider">
                {order.overall_status || 'IN_PRODUCTION'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">{order.customer_name}</h2>
            <p className="text-sm text-slate-400 font-medium flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{order.customer_phone || '-'}</span>
            </p>
          </div>

          <div className="text-right space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">ຍອດລວມອໍເດີ (Grand Total)</div>
            <div className="text-3xl font-black text-emerald-400 font-mono">
              {(order.total_amount_lak || 0).toLocaleString()} ₭
            </div>
            <div className="text-xs text-slate-400 font-semibold">
              ມັດຈຳ: <span className="text-slate-200">{(order.deposit_lak || 0).toLocaleString()} ₭</span> | ຄົງເຫຼືອ: <span className="text-amber-400 font-bold">{(order.remaining_lak || 0).toLocaleString()} ₭</span>
            </div>
          </div>
        </div>
      </div>

      {/* Production Items Touch List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-200 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>ລາຍການງານພິມໃນໃບສັ່ງຜະລິດ ({order.items?.length || 0} ລາຍການ)</span>
          </h3>
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            <span>Touchscreen Operator Mode</span>
          </span>
        </div>

        {order.items?.map((item, idx) => {
          const isComplete = item.current_step === 'READY_FOR_PICKUP' || item.current_step === 'COMPLETED';

          return (
            <div
              key={item.id || idx}
              className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 shadow-xl space-y-6"
            >
              {/* Item Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="text-xs text-indigo-400 font-black uppercase tracking-wider">
                    Job Ticket #{idx + 1}
                  </div>
                  <h4 className="text-xl font-black text-white">{item.item_name || item.job_name}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-bold mt-1">
                    <span className="px-2.5 py-1 bg-slate-800 rounded-lg">ຈຳນວນ: <strong className="text-emerald-400">{item.quantity} ຫົວ</strong></span>
                    <span className="px-2.5 py-1 bg-slate-800 rounded-lg">ໜ້າ: <strong>{item.page_count} ໜ້າ ({item.paper_size || 'A5'})</strong></span>
                    <span className="px-2.5 py-1 bg-slate-800 rounded-lg">ສັນປຶ້ມ: <strong>{item.spine_width_mm || 0} ມມ</strong></span>
                    <span className="px-2.5 py-1 bg-slate-800 rounded-lg">ເຂົ້າສັນ: <strong>{item.binding_type}</strong></span>
                  </div>
                </div>

                {/* Direct Artwork Download Buttons */}
                <div className="flex items-center gap-2">
                  <a
                    href={item.cover_file_url || '#'}
                    download
                    className="min-h-[48px] px-3.5 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-pink-400" />
                    <span>ໄຟລ໌ປົກ</span>
                  </a>

                  <a
                    href={item.inner_file_url || '#'}
                    download
                    className="min-h-[48px] px-3.5 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>ໄຟລ໌ເນື້ອໃນ</span>
                  </a>
                </div>
              </div>

              {/* 3 Main Touch Action Buttons (Min 64px x 64px, High Contrast) */}
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>ປຸ່ມຄວບຄຸມການຜະລິດ (3 Main Touch Action Buttons):</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Button 1: Start (Emerald Green) */}
                  <button
                    type="button"
                    onClick={() => handleTriggerAction(item, 'START')}
                    disabled={updating || isComplete}
                    className="min-h-[64px] min-w-[64px] px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 disabled:opacity-40 text-white font-black text-base rounded-2xl border-2 border-emerald-400 shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-3 transition cursor-pointer"
                  >
                    <Play className="w-6 h-6 fill-white text-white shrink-0" />
                    <div className="text-left">
                      <div className="leading-tight">ເລີ່ມພິມ (Start)</div>
                      <div className="text-[10px] font-bold text-emerald-200">ກົດເມື່ອເລີ່ມເຄື່ອງພິມ</div>
                    </div>
                  </button>

                  {/* Button 2: Pause / Fault (Amber Orange) */}
                  <button
                    type="button"
                    onClick={() => handleTriggerAction(item, 'PAUSE')}
                    disabled={updating || isComplete}
                    className="min-h-[64px] min-w-[64px] px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-95 disabled:opacity-40 text-white font-black text-base rounded-2xl border-2 border-amber-400 shadow-xl shadow-amber-950/60 flex items-center justify-center gap-3 transition cursor-pointer"
                  >
                    <Pause className="w-6 h-6 fill-white text-white shrink-0" />
                    <div className="text-left">
                      <div className="leading-tight">ພັກເຄື່ອງ/ຂັດຂ້ອງ (Pause)</div>
                      <div className="text-[10px] font-bold text-amber-200">ບັນທຶກເຈ້ຍເສຍ & ສາເຫດ</div>
                    </div>
                  </button>

                  {/* Button 3: Complete (Indigo Blue) */}
                  <button
                    type="button"
                    onClick={() => handleTriggerAction(item, 'COMPLETE')}
                    disabled={updating || isComplete}
                    className={`min-h-[64px] min-w-[64px] px-6 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 active:scale-95 disabled:opacity-40 text-white font-black text-base rounded-2xl border-2 border-indigo-400 shadow-xl shadow-indigo-950/60 flex items-center justify-center gap-3 transition cursor-pointer ${
                      isComplete ? 'opacity-60 bg-slate-800 border-slate-700' : ''
                    }`}
                  >
                    <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
                    <div className="text-left">
                      <div className="leading-tight">{isComplete ? 'ສຳເລັດແລ້ວ' : 'ພິມສຳເລັດ (Complete)'}</div>
                      <div className="text-[10px] font-bold text-indigo-200">QC & ສະຫຼຸບຈຳນວນເສຍ</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 6-Step Visual Milestone Bar */}
              <div className="pt-2">
                <div className="text-xs font-bold text-slate-400 mb-2.5 flex items-center justify-between">
                  <span>ຂັ້ນຕອນການຜະລິດ (Production Milestones):</span>
                  <span className="text-indigo-400 font-mono font-bold">
                    Current: {item.current_step || 'PENDING'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {PRODUCTION_STEPS.map((stepCfg) => {
                    const isStepDone = isStepPassedOrCurrent(item.current_step, stepCfg.stepNumber);
                    return (
                      <div
                        key={stepCfg.step}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                          isStepDone
                            ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-950/40'
                            : 'bg-slate-950/60 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="mb-1.5">
                          {isStepDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <span className="w-5 h-5 rounded-full border border-slate-700 inline-flex items-center justify-center text-[10px] font-bold">
                              {stepCfg.stepNumber}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold leading-tight">{stepCfg.labelLao}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{stepCfg.labelEn}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Touch Spoilage & RCA Entry Modal (Tablet-Optimized) */}
      {showSpoilageModal && activeItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    {actionType === 'COMPLETE' ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>ຢືນຢັນພິມສຳເລັດ & ບັນທຶກເຈ້ຍເສຍ</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <span>ພັກເຄື່ອງ / ບັນທຶກເຫດຂັດຂ້ອງ</span>
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">{activeItem.item_name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSpoilageModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Spoilage Count Screen */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                ຈຳນວນເຈ້ຍເສຍຕົວຈິງ (Actual Spoilage Count)
              </span>
              <div className="text-4xl font-black text-amber-400 font-mono">
                {spoilageCount} <span className="text-lg text-slate-400 font-sans">ແຜ່ນ/ຊຸດ</span>
              </div>
            </div>

            {/* Quick Add Chips */}
            <div className="flex items-center justify-center gap-2">
              {[1, 5, 10, 50].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleAddQuickCount(delta)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 border border-slate-700 rounded-xl font-black text-sm transition cursor-pointer"
                >
                  +{delta}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSpoilageCount(0)}
                className="px-4 py-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-xl font-black text-xs transition cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Touch Virtual Numpad (Min 60px buttons for tablet fingers) */}
            <div className="grid grid-cols-3 gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'BACKSPACE'].map((key) => {
                const isAction = key === 'CLEAR' || key === 'BACKSPACE';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleNumpadInput(key)}
                    className={`min-h-[58px] rounded-2xl font-black text-lg transition active:scale-95 cursor-pointer flex items-center justify-center ${
                      isAction
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs'
                        : 'bg-slate-950 hover:bg-slate-800 text-white border border-slate-800 text-xl font-mono'
                    }`}
                  >
                    {key === 'CLEAR' ? 'C (ລຶບ)' : key === 'BACKSPACE' ? <Delete className="w-5 h-5" /> : key}
                  </button>
                );
              })}
            </div>

            {/* Root Cause Analysis (RCA) Selection Chips */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-indigo-400" />
                <span>ເລືອກສາເຫດຄວາມຜິດພາດ (Root Cause Analysis - RCA):</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RCA_CAUSES.map((rca) => {
                  const isSelected = selectedRCA === rca.id;
                  return (
                    <button
                      key={rca.id}
                      type="button"
                      onClick={() => setSelectedRCA(rca.id)}
                      className={`p-3 rounded-2xl border text-left text-xs font-bold transition flex items-center gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md shadow-amber-950/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{rca.icon}</span>
                      <span className="leading-tight">{rca.labelLao}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Operator Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400">ໝາຍເຫດເພີ່ມເຕີມຈາກຊ່າງ (Operator Notes):</label>
              <input
                type="text"
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                placeholder="ເຊັ່ນ: ປ່ຽນຫົວພິມ, ເຄື່ອງຮ້ອນເກີນໄປ, ປັບແຮງກົດໃໝ່..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:border-amber-400 outline-none"
              />
            </div>

            {/* Modal Bottom Confirm Button (64px height) */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSpoilageModal(false)}
                className="min-h-[64px] flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-sm font-bold border border-slate-700 transition cursor-pointer"
              >
                ຍົກເລີກ
              </button>

              <button
                type="button"
                onClick={handleConfirmSpoilageModal}
                disabled={updating}
                className="min-h-[64px] flex-[2] bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-2xl text-base font-black border-2 border-emerald-400 shadow-xl shadow-emerald-950/60 transition cursor-pointer flex items-center justify-center gap-2.5"
              >
                {updating ? <Clock className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                <span>ຢືນຢັນ & ບັນທຶກ (Confirm & Save)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
