import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../store/AppContext';
import type { MasterOrder, MasterOrderItem, ProductionStep } from '../orders/types';
import {
  ProductionOrderList,
  TrackerHeader,
  EquipmentSpecCard,
  PaperMaterialCard,
  ArtworkFilesCard,
  ProductionStepper,
  TactileActionButtons,
  SpoilageModal,
  ArtworkModal,
  STEP_ORDER_MAP,
  PRODUCTION_STEPS_CONFIG
} from './components/tracker';
import { BookOpen, Clock, AlertCircle } from 'lucide-react';

export const ShopFloorTracker: React.FC<{ initialOrderNo?: string }> = ({ initialOrderNo }) => {
  const { orders = [], equipment = [], showToast, formatCurrency } = useApp();

  const pathOrderNo = typeof window !== 'undefined' && window.location.pathname.startsWith('/track')
    ? window.location.pathname.replace(/^\/track\/?/, '')
    : '';

  const initialTargetNo = initialOrderNo || pathOrderNo || '';

  // Order selection state: if null, show ProductionOrderList; if selected, show Order Details
  const [selectedOrderNo, setSelectedOrderNo] = useState<string>(initialTargetNo);
  const [order, setOrder] = useState<MasterOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active item & Modals
  const [selectedItemIdx, setSelectedItemIdx] = useState<number | 'ALL'>('ALL');
  const [activeItem, setActiveItem] = useState<MasterOrderItem | null>(null);
  const [actionType, setActionType] = useState<'START' | 'PAUSE' | 'COMPLETE'>('COMPLETE');
  const [showSpoilageModal, setShowSpoilageModal] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<{ title: string; url: string; item: MasterOrderItem } | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);

  // Fetch or map order details
  const fetchOrderDetails = async (ordNo: string) => {
    setSelectedItemIdx('ALL');
    if (!ordNo) {
      setOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Check local AppContext orders first
      const localOrd = orders.find(
        (o: any) =>
          o.id?.toLowerCase() === ordNo.toLowerCase() ||
          (o as any).orderNumber?.toLowerCase() === ordNo.toLowerCase() ||
          (o as any).orderNo?.toLowerCase() === ordNo.toLowerCase()
      );

      if (localOrd) {
        const mappedOrder: MasterOrder = {
          id: localOrd.id,
          order_no: (localOrd as any).orderNumber || (localOrd as any).orderNo || localOrd.id,
          order_number: (localOrd as any).orderNumber || (localOrd as any).orderNo || localOrd.id,
          customer_name: localOrd.customerName || (localOrd as any).customer_name || 'ລູກຄ້າທົ່ວໄປ',
          customer_phone: (localOrd as any).customerPhone || (localOrd as any).customer_phone || '020-5555-5555',
          total_amount_lak: localOrd.totalPriceCharged || (localOrd as any).totalAmount || (localOrd as any).total_amount_lak || 0,
          deposit_lak: (localOrd as any).deposit_lak || (localOrd.totalPriceCharged || 0) * 0.5,
          remaining_lak: (localOrd as any).remaining_lak || (localOrd.totalPriceCharged || 0) * 0.5,
          overall_status: localOrd.status === 'Completed' ? 'COMPLETED' : 'IN_PRODUCTION',
          delivery_date: (localOrd as any).dueDate || (localOrd as any).deliveryDate || '2026-09-10',
          created_at: (localOrd as any).createdTime || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: (localOrd.items && localOrd.items.length > 0)
            ? (localOrd.items || []).map((it: any, idx: number) => ({
                id: it.id || `item-${idx + 1}`,
                order_id: localOrd.id,
                item_name: it.name || it.description || it.item_name || (localOrd as any).jobName || `ລາຍການທີ ${idx + 1}`,
                quantity: it.quantity || (localOrd as any).totalQuantity || 100,
                page_count: it.pageCount || it.page_count || 1,
                paper_size: it.paperSize || it.paper_size || 'A4',
                binding_type: it.bindingType || it.binding_type || 'PERFECT_HOT_GLUE',
                spine_width_mm: it.spineWidth || it.spine_width_mm || 5.0,
                current_step: (it.currentStep || it.current_step || 'PENDING') as ProductionStep,
                avg_cov_c: it.avg_cov_c || 2.5,
                avg_cov_m: it.avg_cov_m || 2.5,
                avg_cov_y: it.avg_cov_y || 2.5,
                avg_cov_k: it.avg_cov_k || 5.0,
                unit_cost_lak: it.unitCost || it.unit_cost_lak || (it.specs?.unitCost || 0),
                unit_price_lak: it.unitPrice || it.unit_price_lak || 0,
                total_price_lak: (it.unitPrice || it.unit_price_lak || 0) * (it.quantity || 1),
                cover_file_url: it.cover_file_url || `/api/v1/orders/files/orders/${ordNo}/cover.pdf`,
                inner_file_url: it.inner_file_url || `/api/v1/orders/files/orders/${ordNo}/inner.pdf`,
                assigned_press_name: it.assigned_press_name || it.press_machine,
                assigned_cutter_name: it.assigned_cutter_name || it.cutter_machine,
                assigned_finish_name: it.assigned_finish_name || it.finish_machine,
                specs: it.specs || it
              }))
            : [
                {
                  id: 'item-1',
                  order_id: localOrd.id,
                  item_name: (localOrd as any).jobName || (localOrd as any).customJobName || 'ງານພິມມາດຕະຖານ',
                  quantity: (localOrd as any).totalQuantity || (localOrd as any).quantity || 100,
                  page_count: 1,
                  paper_size: 'A4',
                  binding_type: 'NONE',
                  spine_width_mm: 0,
                  current_step: 'INNER_PRINTED',
                  avg_cov_c: 2.5,
                  avg_cov_m: 2.5,
                  avg_cov_y: 2.5,
                  avg_cov_k: 5.0,
                  unit_cost_lak: 0,
                  unit_price_lak: localOrd.totalPriceCharged || 0,
                  total_price_lak: localOrd.totalPriceCharged || 0,
                  cover_file_url: `/api/v1/orders/files/orders/${ordNo}/cover.pdf`,
                  inner_file_url: `/api/v1/orders/files/orders/${ordNo}/inner.pdf`,
                  specs: localOrd
                }
              ]
        };
        setOrder(mappedOrder);
        setLoading(false);
        return;
      }

      // 2. Fallback to API
      const res = await fetch(`/api/v1/orders/track/${ordNo}`);
      if (!res.ok) throw new Error('Order not found');
      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      setOrder(null);
      setError(`ບໍ່ພົບຂໍ້ມູນອໍເດີ "${ordNo}" ໃນລະບົບ`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOrderNo) {
      fetchOrderDetails(selectedOrderNo);
    } else {
      setOrder(null);
    }
  }, [selectedOrderNo]);

  // Step advancement helper
  const getNextStep = (currentStep: ProductionStep): ProductionStep => {
    const sequence: ProductionStep[] = [
      'PENDING',
      'INNER_PRINTED',
      'COVER_PRINTED',
      'COVER_LAMINATED',
      'PAPER_TRIMMED',
      'BOUND',
      'READY_FOR_PICKUP',
      'COMPLETED'
    ];
    const currentIndex = sequence.indexOf(currentStep);
    if (currentIndex >= 0 && currentIndex < sequence.length - 1) {
      return sequence[currentIndex + 1];
    }
    return 'COMPLETED';
  };

  const executeStepUpdate = async (
    item: MasterOrderItem,
    targetStep: ProductionStep,
    spoilage: number = 0,
    rca: string = '',
    notes: string = ''
  ) => {
    setUpdating(true);
    try {
      await fetch(`/api/v1/orders/${item.order_id}/items/${item.id}/step`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: targetStep,
          operator_id: 'OP-DESK-01',
          spoilage_count: spoilage,
          root_cause: rca,
          notes: notes,
        }),
      });
    } catch (e) {
      console.warn('Sync step to server warning:', e);
    }

    setOrder((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map((i) =>
          i.id === item.id ? { ...i, current_step: targetStep } : i
        ),
      };
    });
    showToast(`ອັບເດດຂັ້ນຕອນການຜະລິດສຳເລັດ`, 'success');
    setUpdating(false);
    setShowSpoilageModal(false);
    setActiveItem(null);
  };

  const handleTriggerAction = (item: MasterOrderItem, action: 'START' | 'PAUSE' | 'COMPLETE') => {
    setActiveItem(item);
    setActionType(action);
    if (action === 'PAUSE') {
      setShowSpoilageModal(true);
    } else if (action === 'START') {
      const next = getNextStep(item.current_step);
      executeStepUpdate(item, next, 0, 'START_STEP', 'Operator started production step');
    } else if (action === 'COMPLETE') {
      executeStepUpdate(item, 'READY_FOR_PICKUP', 0, 'COMPLETED', 'Operator marked job ready for QC/pickup');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 space-y-6 pb-20">
      {/* 1. ORDER LIST VIEW (If no order is selected) */}
      {!selectedOrderNo && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                ຕິດຕາມງານພິມ & ຄິວການຜະລິດ (Shop Floor Queue)
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                ເລືອກອໍເດີຈາກລາຍການເພື່ອເບິ່ງລາຍລະອຽດເຄື່ອງຈັກ, ຂະໜາດເຈ້ຍ, ໄຟລ໌ພິມ ແລະ ອັບເດດສະຖານະ
              </p>
            </div>
          </div>

          <ProductionOrderList
            orders={orders}
            onSelectOrder={(ord) => {
              const no = ord.orderNumber || ord.order_number || ord.orderNo || ord.id;
              setSelectedOrderNo(no);
            }}
            formatCurrency={formatCurrency}
          />
        </section>
      )}

      {/* 2. ORDER DRILLDOWN DETAIL VIEW (When order is selected) */}
      {selectedOrderNo && (
        <div className="space-y-6">
          {/* Loading Indicator */}
          {loading && (
            <div className="bg-white border border-sky-100 p-12 rounded-3xl text-center shadow-xs space-y-3">
              <Clock className="w-10 h-10 animate-spin text-sky-500 mx-auto" />
              <p className="text-sm font-bold text-slate-600">ກຳລັງໂຫຼດຂໍ້ມູນລາຍລະອຽດການຜະລິດ...</p>
            </div>
          )}

          {/* Error Message */}
          {!loading && (error || !order) && (
            <div className="bg-white border border-sky-100 p-8 rounded-3xl text-center shadow-xs space-y-3">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <h3 className="text-lg font-black text-slate-800">{error || 'ບໍ່ພົບຂໍ້ມູນອໍເດີ'}</h3>
              <button
                type="button"
                onClick={() => setSelectedOrderNo('')}
                className="px-4 py-2 bg-sky-500 text-white font-black rounded-xl text-xs"
              >
                ກັບໄປໜ້າລາຍການອໍເດີ
              </button>
            </div>
          )}

          {/* Detailed Content */}
          {!loading && order && (
            <div className="space-y-6 animate-fade-in">
              {/* Top Header Card */}
              <TrackerHeader
                order={order}
                onBack={() => setSelectedOrderNo('')}
                formatCurrency={formatCurrency}
              />

              {/* Order Print Items List */}
              <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-sky-600" />
                    <h2 className="text-lg font-black text-slate-900">
                      ລາຍການງານພິມໃນອໍເດີ ({order.items?.length || 1} ລາຍການ)
                    </h2>
                  </div>

                  {/* Multi-Item Switcher Tabs */}
                  {order.items && order.items.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-sky-50/70 p-1.5 rounded-2xl border border-sky-100">
                      <button
                        type="button"
                        onClick={() => setSelectedItemIdx('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition cursor-pointer ${
                          selectedItemIdx === 'ALL'
                            ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                            : 'bg-white hover:bg-sky-100/70 text-slate-600 border border-sky-200/60'
                        }`}
                      >
                        ທັງໝົດ ({order.items.length})
                      </button>
                      {order.items.map((it, i) => {
                        const isSelected = selectedItemIdx === i;
                        const isDone = it.current_step === 'READY_FOR_PICKUP' || it.current_step === 'COMPLETED';
                        return (
                          <button
                            key={it.id || i}
                            type="button"
                            onClick={() => setSelectedItemIdx(i)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                                : 'bg-white hover:bg-sky-100/70 text-slate-700 border border-sky-200/60'
                            }`}
                          >
                            <span className="opacity-75 font-mono">#{i + 1}</span>
                            <span className="truncate max-w-[130px]">{it.item_name}</span>
                            <span className={`w-2 h-2 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {(() => {
                  const itemsToRender = selectedItemIdx === 'ALL'
                    ? (order.items || [])
                    : (order.items && order.items[selectedItemIdx] ? [order.items[selectedItemIdx]] : (order.items || []));

                  return itemsToRender.map((item, idx) => {
                    const isComplete = item.current_step === 'READY_FOR_PICKUP' || item.current_step === 'COMPLETED';
                    const trueIndex = (order.items || []).findIndex((it) => it.id === item.id);
                    const displayTicketNum = trueIndex >= 0 ? trueIndex + 1 : idx + 1;

                    return (
                      <article
                        key={item.id || idx}
                        className="bg-white border border-sky-100 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6 transition hover:border-sky-200"
                      >
                        {/* Item Title Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono font-black px-2.5 py-0.5 bg-sky-100 text-sky-800 rounded-lg">
                                Job Ticket #{displayTicketNum}
                              </span>
                              <span className="text-xs font-bold text-slate-500">
                                ຂັ້ນຕອນປັດຈຸບັນ: <strong className="text-sky-700 font-mono">{item.current_step}</strong>
                              </span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                              {item.item_name}
                            </h3>
                          </div>
                        </div>

                        {/* 1. Equipment & Machinery Card (Dynamic Routing with Universal Search Form) */}
                        <EquipmentSpecCard
                          item={item}
                          availableMachines={equipment || []}
                          onMachineChanged={(log) => {
                            showToast(`ປ່ຽນ ${log.category} ເປັນ "${log.newMachineName}" ສຳເລັດ! (ເຫດຜົນ: ${log.reason})`, 'success');
                          }}
                        />

                        {/* 2. Paper & Material Card */}
                        <PaperMaterialCard item={item} />

                        {/* 3. Artwork Proofs & CMYK Coverage Card */}
                        <ArtworkFilesCard
                          item={item}
                          onPreviewArtwork={(title, url) => setPreviewFile({ title, url, item })}
                        />

                        {/* 4. 6-Milestone Interactive Pipeline Stepper */}
                        <ProductionStepper
                          currentStep={item.current_step}
                          onAdvanceStep={(targetStep) =>
                            executeStepUpdate(item, targetStep, 0, 'MANUAL', `Switched to ${targetStep}`)
                          }
                        />

                        {/* 5. Tactile Touch Action Buttons */}
                        <TactileActionButtons
                          onStart={() => handleTriggerAction(item, 'START')}
                          onPause={() => handleTriggerAction(item, 'PAUSE')}
                          onComplete={() => handleTriggerAction(item, 'COMPLETE')}
                          disabled={updating}
                          isCompleted={isComplete}
                        />
                      </article>
                    );
                  });
                })()}
              </section>
            </div>
          )}
        </div>
      )}

      {/* Spoilage & RCA Modal */}
      {showSpoilageModal && activeItem && (
        <SpoilageModal
          isOpen={showSpoilageModal}
          onClose={() => setShowSpoilageModal(false)}
          onConfirm={(count, rca, notes) => {
            const next = getNextStep(activeItem.current_step);
            executeStepUpdate(activeItem, next, count, rca, notes);
          }}
          updating={updating}
          jobName={activeItem.item_name}
          currentStep={activeItem.current_step}
        />
      )}

      {/* Artwork Inspector Modal */}
      {previewFile && (
        <ArtworkModal
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          title={previewFile.title}
          url={previewFile.url}
          item={previewFile.item}
        />
      )}
    </div>
  );
};
