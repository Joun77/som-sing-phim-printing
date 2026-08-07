import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  X, 
  Download, 
  Link, 
  Printer, 
  ChevronRight, 
  Trash2,
  Truck,
  Package,
  Layers,
  Scissors,
  FileCheck,
  Plus,
  Image,
  Calendar,
  Phone,
  Check,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

const PRODUCTION_STAGES = [
  { id: 'preflight', label: '1. Pre-flight & Plate Prep', icon: FileCheck, desc: 'ตรวจสอบไฟล์ & ทำเพลท' },
  { id: 'printing', label: '2. Printing (กำลังพิมพ์)', icon: Printer, desc: 'กำลังสั่งพิมพ์ชิ้นงาน' },
  { id: 'finishing', label: '3. Finishing & Cutting', icon: Scissors, desc: 'เคลือบผิว & ตัดเจียน' },
  { id: 'binding', label: '4. Binding (เข้าเล่ม)', icon: Layers, desc: 'มุงหลังคา / ไส้กาว / ห่วง' },
  { id: 'qc_packaging', label: '5. QC & Packaging', icon: ShieldCheck, desc: 'ตรวจสอบ QC & แพ็กของ' }
];

export default function OrderDetailsModal({
  order,
  onBack,
  formatLAK,
  t,
  currentLang,
  handleStatusChange,
  handlePreflightToggle,
  deleteOrder,
  showToast,
  askConfirmation,
  setLightbox,
  setIsSettleOpen,
  setSettleAmount,
  setSettleStep,
  getStatusBadgeClass,
  getStatusIcon,
  getPaymentStatusBadge,
  getPaymentStatusIcon,
  isProductionView,
  onNavigateDelivery
}) {
  const preflightComplete = order.preflight?.cmyk === 'Pass' && order.preflight?.bleed === 'Pass' && order.preflight?.resolution === 'Pass';
  
  // Production Stage State
  const [activeStageIndex, setActiveStageIndex] = useState(order.productionStageIndex ?? 1);

  // Partial Delivery State & Logs
  const totalOrderedQty = order.items ? order.items.reduce((sum, it) => sum + Number(it.quantity || 0), 0) : 0;
  const [deliveryLogs, setDeliveryLogs] = useState(order.deliveryLogs || [
    {
      batchNo: 1,
      date: new Date().toLocaleDateString('th-TH') + ' 10:30',
      quantityDelivered: Math.min(100, totalOrderedQty),
      courierName: order.deliveryMethod || 'Kerry Lao',
      driverContact: '020 5551 2345 (คำพูน)',
      proofPhoto: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
      status: 'Delivered'
    }
  ]);

  // Delivery Modal state
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [batchQty, setBatchQty] = useState('');
  const [batchCourier, setBatchCourier] = useState(order.deliveryMethod || 'Kerry Lao');
  const [batchDriverPhone, setBatchDriverPhone] = useState('');
  const [batchProofUrl, setBatchProofUrl] = useState('');

  const totalDeliveredQty = deliveryLogs.reduce((sum, log) => sum + Number(log.quantityDelivered || 0), 0);
  const remainingQty = Math.max(0, totalOrderedQty - totalDeliveredQty);

  const getItemSpecs = (item) => {
    const name = item.name.toLowerCase();
    let paper = 'Standard';
    let size = 'A4';
    let finishing = 'None';
    
    if (name.includes('double a')) paper = 'Double A 80gsm';
    if (name.includes('glossy')) paper = 'Glossy Photo Paper';
    if (name.includes('spiral')) finishing = 'Spiral Binding';
    if (name.includes('ພັບ')) finishing = 'Folding';
    if (name.includes('a3')) size = 'A3';
    
    return { paper, size, finishing };
  };

  const handleStageSelect = (index) => {
    setActiveStageIndex(index);
    if (showToast) {
      showToast(`อัปเดตสถานะการผลิตเป็น: ${PRODUCTION_STAGES[index].label}`, 'info');
    }
  };

  const handleAddDeliveryBatch = (e) => {
    e.preventDefault();
    const qtyNum = Number(batchQty);
    if (!qtyNum || qtyNum <= 0) {
      showToast('กรุณาระบุจำนวนสินค้าที่จัดส่ง', 'warning');
      return;
    }
    if (qtyNum > remainingQty) {
      showToast(`จำนวนจัดส่ง (${qtyNum}) เกินกว่าสินค้าคงเหลือ (${remainingQty})`, 'warning');
      return;
    }

    const newLog = {
      batchNo: deliveryLogs.length + 1,
      date: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      quantityDelivered: qtyNum,
      courierName: batchCourier,
      driverContact: batchDriverPhone || 'ไม่ระบุเบอร์',
      proofPhoto: batchProofUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
      status: (totalDeliveredQty + qtyNum) >= totalOrderedQty ? 'Fully Delivered' : 'Partially Delivered'
    };

    const updatedLogs = [...deliveryLogs, newLog];
    setDeliveryLogs(updatedLogs);

    const newRemaining = totalOrderedQty - (totalDeliveredQty + qtyNum);
    if (newRemaining <= 0 && handleStatusChange) {
      handleStatusChange(order.id, 'Delivered');
    }

    setIsDeliveryModalOpen(false);
    setBatchQty('');
    setBatchDriverPhone('');
    setBatchProofUrl('');
    showToast(`บันทึกการจัดส่ง Batch #${newLog.batchNo} (${qtyNum} ชิ้น) เรียบร้อยแล้ว`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in w-full text-slate-800">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-100 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2.5 text-sm sm:text-base font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl w-fit"
        >
          <span>← {currentLang === 'lo' ? 'ກັບຄືນ' : 'Back to Orders'}</span>
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              const msg = currentLang === 'lo' ? 'ທ່ານຕ້ອງການລຶບອໍເດີນີ້ແທ້ ຫຼື ບໍ່?' : 'Delete this order permanently?';
              askConfirmation(msg, () => {
                deleteOrder(order.id);
                onBack();
                showToast(currentLang === 'lo' ? 'ລຶບອໍເດີສຳເລັດ!' : 'Order deleted successfully!', 'success');
              });
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl text-sm font-black transition"
          >
            <span>{currentLang === 'lo' ? 'ລຶບອໍເດີ' : 'Delete Order'}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-8 w-full">
        {/* Header Block */}
        <div className="border-b border-slate-100 pb-6 flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono font-bold uppercase">
              <span>Order Tracker ID: #{order.id}</span>
              <span>•</span>
              <span>Created: {order.date} {order.createdTime}</span>
            </div>
            <h3 className="text-2xl font-black text-primary-navy mt-2">
              {currentLang === 'lo' ? 'ລາຍລະອຽດການສັ່ງຊື້' : 'Order Details & Management'}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2.5 items-center">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase flex items-center gap-1.5 ${getStatusBadgeClass(order.status)}`}>
              {getStatusIcon(order.status)}
              <span>{t(`status.${order.status}`)}</span>
            </span>
            <span className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase flex items-center gap-1.5 ${getPaymentStatusBadge(order.paymentStatus)}`}>
              {getPaymentStatusIcon(order.paymentStatus)}
              <span>{t(`payment.${order.paymentStatus}`)}</span>
            </span>
          </div>
        </div>

        {/* 1. DYNAMIC PRODUCTION JOB TICKET & PROGRESS TRACKER SECTION */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Printer className="w-6 h-6 text-purple-400" />
                <h4 className="text-xl font-black text-white tracking-wide">
                  ใบสั่งผลิต & ຕິດຕາມການຜະລິດ (Production Job Ticket & Stages)
                </h4>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                ระบบจัดการขั้นตอนการผลิตตามสเปกสินค้า อัปเดตจำนวนที่ผลิตสำเร็จ และแจ้งพร้อมจัดส่ง
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextStatus = 'Ready';
                if (handleStatusChange) {
                  handleStatusChange(order.id, 'Printing'); // ensure transition
                  handleStatusChange(order.id, 'Ready');
                }
                if (showToast) {
                  showToast(currentLang === 'lo' ? 'ອັບເດດສະຖານະເປັນ: ພ້ອມສົ່ງ (Marked Ready for Delivery)!' : 'Marked Ready for Delivery! Logged for delivery tracking.', 'success');
                }
                if (onNavigateDelivery) {
                  onNavigateDelivery(order.id);
                }
              }}
              className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-500/25 transition active:scale-95 shrink-0"
            >
              <Truck className="w-5 h-5" />
              <span>🚚 ພ້ອມສົ່ງ (Mark Ready for Delivery)</span>
            </button>
          </div>

          {/* Render Dynamic Stages per Item */}
          <div className="space-y-6">
            {order.items && order.items.map((item, itemIdx) => {
              // Determine item category pipeline stages
              const nameLower = (item.name || '').toLowerCase();
              const specs = getItemSpecs(item);
              
              let categoryType = 'General Prints';
              let stages = [
                { id: 'preflight', label: 'Pre-flight', icon: FileCheck },
                { id: 'printing', label: 'Printing', icon: Printer },
                { id: 'cutting', label: 'Cutting', icon: Scissors },
                { id: 'folding', label: 'Folding/Finishing', icon: Layers },
                { id: 'qc', label: 'QC', icon: ShieldCheck }
              ];

              if (nameLower.includes('book') || nameLower.includes('เล่ม') || nameLower.includes('ເມນູ') || nameLower.includes('หนังสือ') || specs.finishing.includes('Binding') || item.useBinding) {
                categoryType = 'Books';
                stages = [
                  { id: 'preflight', label: 'Pre-flight', icon: FileCheck },
                  { id: 'printing', label: 'Printing', icon: Printer },
                  { id: 'lamination', label: 'Lamination', icon: Layers },
                  { id: 'cutting', label: 'Cutting', icon: Scissors },
                  { id: 'binding', label: 'Binding (เข้าเล่ม)', icon: Layers },
                  { id: 'qc', label: 'QC', icon: ShieldCheck }
                ];
              } else if (nameLower.includes('sticker') || nameLower.includes('สะติกเกอร์') || nameLower.includes('ສະຕິກເກີ')) {
                categoryType = 'Stickers';
                stages = [
                  { id: 'preflight', label: 'Pre-flight', icon: FileCheck },
                  { id: 'printing', label: 'Printing', icon: Printer },
                  { id: 'lamination', label: 'Lamination', icon: Layers },
                  { id: 'diecutting', label: 'Die-cutting (ไดคัท)', icon: Scissors },
                  { id: 'qc', label: 'QC', icon: ShieldCheck }
                ];
              }

              // State for progress tracking per stage per item
              const targetQty = Number(item.quantity || 1);
              const itemProgressKey = `progress_${order.id}_${itemIdx}`;
              
              // Load saved or default completed quantities
              const savedProgress = order.itemProgress?.[itemIdx] || {};

              return (
                <div key={item.id || itemIdx} className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-700 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {categoryType}
                        </span>
                        <h5 className="text-base font-bold text-white">{item.name}</h5>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        จำนวนเป้าหมาย: <span className="text-white font-bold">{targetQty}</span> ชิ้น | สเปก: {specs.paper} • {specs.size} • {specs.finishing}
                      </p>
                    </div>
                  </div>

                  {/* Stage Checkboxes & Item Progress Tracking */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {stages.map((stg) => {
                      const StgIcon = stg.icon;
                      const currentCompletedQty = savedProgress[stg.id] ?? (isProductionView ? targetQty : targetQty);
                      const isFullyDone = currentCompletedQty >= targetQty;

                      return (
                        <div
                          key={stg.id}
                          className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                            isFullyDone
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-900 border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-1.5">
                              <StgIcon className="w-4 h-4 text-purple-400" />
                              <span className="text-xs font-black">{stg.label}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isFullyDone}
                              onChange={(e) => {
                                const nextQty = e.target.checked ? targetQty : 0;
                                const updatedItemProgress = {
                                  ...(order.itemProgress || {}),
                                  [itemIdx]: {
                                    ...(order.itemProgress?.[itemIdx] || {}),
                                    [stg.id]: nextQty
                                  }
                                };
                                order.itemProgress = updatedItemProgress;
                                setActiveStageIndex(prev => prev); // force re-render
                                if (showToast) {
                                  showToast(`อัปเดตขั้นตอน ${stg.label} ของ ${item.name}`, 'info');
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>ผลิตสำเร็จ:</span>
                              <span className={isFullyDone ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                                {currentCompletedQty} / {targetQty}
                              </span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              max={targetQty}
                              value={currentCompletedQty}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(targetQty, Number(e.target.value)));
                                const updatedItemProgress = {
                                  ...(order.itemProgress || {}),
                                  [itemIdx]: {
                                    ...(order.itemProgress?.[itemIdx] || {}),
                                    [stg.id]: val
                                  }
                                };
                                order.itemProgress = updatedItemProgress;
                                setActiveStageIndex(prev => prev); // force re-render
                              }}
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-bold text-center text-white focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. PARTIAL DELIVERY MANAGEMENT SYSTEM */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-accent-sky" />
                <span>Partial Delivery Management (ระบบติดตามการทยอยจัดส่ง)</span>
              </h4>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                ติดตามจำนวนสินค้าที่จัดส่งออกแล้ว และบันทึกประวัติการส่งมอบงานแต่ละ Batch
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDeliveryModalOpen(true)}
              disabled={remainingQty <= 0}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition active:scale-95 w-fit ${
                remainingQty > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>+ บันทึกการจัดส่งเพิ่ม (Record Delivery Batch)</span>
            </button>
          </div>

          {/* Summary Counters Widget */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex items-center gap-4">
              <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black text-slate-400 uppercase block">Total Ordered Items</span>
                <span className="text-2xl font-black text-slate-900 font-sans">{totalOrderedQty} <span className="text-xs font-bold text-slate-500">ชิ้น</span></span>
              </div>
            </div>

            <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200/80 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black text-emerald-800 uppercase block">Total Delivered</span>
                <span className="text-2xl font-black text-emerald-600 font-sans">{totalDeliveredQty} <span className="text-xs font-bold text-emerald-700">ชิ้น</span></span>
              </div>
            </div>

            <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200/80 flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black text-amber-800 uppercase block">Total Remaining</span>
                <span className="text-2xl font-black text-amber-600 font-sans">{remainingQty} <span className="text-xs font-bold text-amber-700">ชิ้น</span></span>
              </div>
            </div>
          </div>

          {/* Delivery Logs Table */}
          <div className="space-y-3">
            <h5 className="text-xs font-black text-slate-500 uppercase tracking-wider">
              ประวัติการทยอยจัดส่งสินค้า (Delivery Batch Logs - {deliveryLogs.length} Records)
            </h5>
            {deliveryLogs.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider border-b">
                      <th className="px-4 py-3">Batch #</th>
                      <th className="px-4 py-3">วันที่ & เวลา</th>
                      <th className="px-4 py-3 text-center">จำนวนที่ส่ง (Qty)</th>
                      <th className="px-4 py-3">ขนส่ง & คนขับ</th>
                      <th className="px-4 py-3 text-center">หลักฐานส่งของ</th>
                      <th className="px-4 py-3 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {deliveryLogs.map((log) => (
                      <tr key={log.batchNo} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3.5 font-bold font-sans">Batch #{log.batchNo}</td>
                        <td className="px-4 py-3.5 font-sans text-slate-600">{log.date}</td>
                        <td className="px-4 py-3.5 text-center font-sans font-black text-emerald-600 text-sm">
                          +{log.quantityDelivered} ชิ้น
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-900 block">{log.courierName}</span>
                          <span className="text-[10px] text-slate-400 block font-sans">{log.driverContact}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {log.proofPhoto ? (
                            <button
                              type="button"
                              onClick={() => setLightbox && setLightbox({ src: log.proofPhoto, title: `Proof of Delivery: Batch #${log.batchNo}` })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition"
                            >
                              <Image className="w-3.5 h-3.5 text-accent-sky" />
                              <span>ดูรูปหลักฐาน</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">ไม่มีรูป</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            log.status === 'Fully Delivered'
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-sky-100 text-sky-700 border border-sky-200'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                ยังไม่มีประวัติการทยอยจัดส่งสินค้า
              </div>
            )}
          </div>
        </div>

        {/* 12-Column Main Order Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Customer Details info */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Customer Info</span>
                <span className="font-extrabold text-slate-900 text-base mt-1 block">{order.customerName}</span>
                <span className="text-sm text-slate-500 font-sans block mt-0.5">{order.phone}</span>
              </div>
              <div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Delivery & Schedule</span>
                <span className="text-sm text-slate-700 font-bold block mt-1">Due Date: {order.promisedDeliveryDate}</span>
                {order.installationSchedule && (
                  <span className="text-xs text-indigo-600 font-bold block mt-1">
                    🛠️ Installation: {order.installationSchedule.replace('T', ' ')}
                  </span>
                )}
              </div>
            </div>

            {/* Ordered Items Table */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {currentLang === 'lo' ? 'ລາຍການສັ່ງພິມ' : 'Ordered Print Items'}
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-black text-slate-500 uppercase tracking-wider border-b">
                      <th className="px-4 py-3">Item Name</th>
                      <th className="px-4 py-3">Specifications</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Total Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                    {order.items.map((item, idx) => {
                      const specs = getItemSpecs(item);
                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/30 transition">
                          <td className="px-4 py-3.5 font-bold text-slate-900">{item.name}</td>
                          <td className="px-4 py-3.5 text-slate-500 font-sans text-xs">
                            <span>{specs.paper}</span> • <span>{specs.size}</span> • <span>{specs.finishing}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center font-sans font-bold text-slate-900">x{item.quantity}</td>
                          <td className="px-4 py-3.5 text-right font-sans">{formatLAK(item.unitCost)}</td>
                          <td className="px-4 py-3.5 text-right font-sans font-black text-slate-900">{formatLAK(item.quantity * item.unitCost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delivery address & method */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Delivery Method & Location</span>
              <p className="text-sm font-semibold text-slate-700">
                {order.deliveryMethod === 'Pickup' ? '🏪 Pickup at Shop' : `🚚 Shipping (${order.deliveryMethod || 'Kerry Lao'})`}
              </p>
              {order.address && (
                <p className="text-xs text-slate-500 italic mt-1 font-semibold">{order.address}</p>
              )}
            </div>
          </div>

          {/* Right Column (col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Preflight card */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Pre-flight check</h4>
                <span className={`font-black flex items-center gap-1 text-xs ${preflightComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {preflightComplete ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  {preflightComplete ? t('orders.preflight_complete') : t('orders.preflight_pending')}
                </span>
              </div>

              <div className="space-y-3 text-xs font-bold text-slate-600">
                <div className="flex items-center justify-between">
                  <span>CMYK Mode</span>
                  <div className="flex gap-1">
                    {['Pass', 'Fail', 'Not Checked'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handlePreflightToggle('cmyk', val)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black border transition ${
                          order.preflight?.cmyk === val 
                            ? val === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : val === 'Fail' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-200 text-slate-800'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span>Bleed check</span>
                  <div className="flex gap-1">
                    {['Pass', 'Fail', 'Not Checked'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handlePreflightToggle('bleed', val)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black border transition ${
                          order.preflight?.bleed === val 
                            ? val === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : val === 'Fail' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-200 text-slate-800'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span>Resolution</span>
                  <div className="flex gap-1">
                    {['Pass', 'Fail', 'Not Checked'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handlePreflightToggle('resolution', val)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black border transition ${
                          order.preflight?.resolution === val 
                            ? val === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : val === 'Fail' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-200 text-slate-800'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Payments card */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Payment Status</h4>
                <span className={`inline-flex px-2 py-0.5 rounded-[6px] text-[10px] font-black border ${getPaymentStatusBadge(order.paymentStatus)}`}>
                  {t(`payment.${order.paymentStatus}`)}
                </span>
              </div>

              <div className="text-xs font-bold space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-sans text-slate-900 font-black text-sm">{formatLAK(order.totalPriceCharged)}</span>
                </div>
                <div className="flex justify-between text-red-600 font-black">
                  <span>Remaining:</span>
                  <span className="font-sans text-slate-900 text-sm">{formatLAK(order.remainingUnpaidBalance)}</span>
                </div>
              </div>

              {order.paymentSlipUrl && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Receipt Slip</span>
                  <button
                    onClick={() => setLightbox && setLightbox({ src: order.paymentSlipUrl, title: `Payment Slip: #${order.id}` })}
                    className="w-full relative rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:opacity-90 transition group"
                  >
                    <img src={order.paymentSlipUrl} alt="Slip" className="w-full h-24 object-cover" />
                    <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-xs font-bold">
                      View Slip
                    </div>
                  </button>
                </div>
              )}

              {order.remainingUnpaidBalance > 0 && (
                <button
                  onClick={() => {
                    setSettleAmount(order.remainingUnpaidBalance);
                    setSettleStep(1);
                    setIsSettleOpen(true);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/15 transition active:scale-95"
                >
                  {t('orders.btn_settle')}
                </button>
              )}
            </div>

            {/* Artwork files */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Artwork Files</h4>
              {order.artworkLink ? (
                <a
                  href={order.artworkLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black transition"
                >
                  Download File
                </a>
              ) : (
                <span className="text-xs text-slate-400 italic">No artwork link</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions with Dual-Mode Print Buttons */}
        <div className="flex flex-wrap justify-between items-center gap-4 pt-5 mt-6 border-t border-slate-100">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                showToast('กำลังพิมพ์: ใบเสนอราคารายละเอียดสเปก (Detailed Spec Quote)', 'info');
                window.print();
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-xs font-black transition active:scale-95 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>📜 Detailed Spec Quote (ใบเสนอราคารายละเอียดสเปก)</span>
            </button>
            <button
              onClick={() => {
                showToast('กำลังพิมพ์: ใบแจ้งหนี้/ใบเสร็จรับเงินสรุป (Summary Invoice)', 'info');
                window.print();
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-black transition active:scale-95 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>🧾 Summary Invoice (ใบแจ้งหนี้/ใบเสร็จรับเงินสรุป)</span>
            </button>
          </div>

          <div className="flex gap-2 items-center">
            {order.status !== 'Delivered' && (
              <button
                onClick={() => handleStatusChange && handleStatusChange(order.id, order.status)}
                className="px-5 py-2.5 bg-accent-sky text-white rounded-xl text-xs font-black hover:bg-sky-600 transition"
              >
                <span>Update Status ({order.status})</span>
              </button>
            )}
            <button
              onClick={onBack}
              className="px-4 py-2.5 border rounded-xl text-slate-500 hover:bg-slate-50 text-xs font-black"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>

      {/* RECORD DELIVERY BATCH MODAL FORM */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-800 text-base">บันทึกการทยอยจัดส่งสินค้า (Record Delivery Batch)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeliveryModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDeliveryBatch} className="space-y-4 text-xs font-bold">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl flex justify-between items-center">
                <span>จำนวนสินค้าที่เหลือจัดส่ง:</span>
                <span className="font-sans font-black text-sm">{remainingQty} ชิ้น</span>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600">จำนวนที่จัดส่งงวดนี้ (Qty) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={remainingQty}
                  value={batchQty}
                  onChange={(e) => setBatchQty(e.target.value)}
                  placeholder={`ระบุไม่เกิน ${remainingQty}`}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-bold font-sans text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600">บริษัทขนส่ง / วิธีจัดส่ง (Courier)</label>
                <select
                  value={batchCourier}
                  onChange={(e) => setBatchCourier(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Kerry Lao">Kerry Lao</option>
                  <option value="HAL Logistics">HAL Logistics</option>
                  <option value="Anousith Express">Anousith Express</option>
                  <option value="Shop Pickup">มารับที่ร้าน (Shop Pickup)</option>
                  <option value="Direct Driver">รถขนส่งโรงพิมพ์</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600">เลขพัสดุ / เบอร์โทรคนขับ (Driver Phone)</label>
                <input
                  type="text"
                  value={batchDriverPhone}
                  onChange={(e) => setBatchDriverPhone(e.target.value)}
                  placeholder="เช่น: 020 5551 2345 หรือ KR-99412"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-bold font-sans text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600">ลิงก์/รูปภาพหลักฐานการส่งมอบ (Proof of Delivery Image URL)</label>
                <input
                  type="text"
                  value={batchProofUrl}
                  onChange={(e) => setBatchProofUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-bold font-sans text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95"
                >
                  บันทึกการจัดส่ง (Confirm Batch)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

