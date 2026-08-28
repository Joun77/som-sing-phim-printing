import React, { useState } from 'react';
import { Edit3, Check } from 'lucide-react';
import {
  OrderDetailVerification,
  OverridePricingPayload,
} from '../../types/adminVerification';
import { PreFlightVerificationCard } from '../../components/admin/PreFlightVerificationCard';
import { CoverageChannelBreakdown } from '../../components/admin/CoverageChannelBreakdown';
import { ManualOverrideModal } from '../../components/admin/ManualOverrideModal';

const MOCK_ORDER_VERIFICATION: OrderDetailVerification = {
  id: 'ord-item-8821',
  orderNumber: 'ORD-2026-0882',
  customerName: 'ຫ້ອງການສະຖິຕິແຫ່ງຊາດ (National Statistics)',
  productName: 'ບົດລາຍງານສະຖິຕິປະຈຳປີ 2026 (Annual Report)',
  paperType: 'ເຈ້ຍປອນ 80 ແກຣມ (Woodfree 80gsm)',
  bindingType: 'ເຂົ້າເລັ້ມໄສກາວ (Perfect Binding)',
  quantity: 200,
  pageCount: 64,
  isDoubleSided: true,
  driveUrl: 'https://drive.google.com/file/d/1X98yZaBcDeFgHiJkLmNoPqRsTuVwXyZ/view?usp=sharing',
  fileSizeBytes: 48 * 1024 * 1024, // 48 MB
  status: 'AUTO_VERIFIED',
  coverage: {
    c: 18.5,
    m: 22.0,
    y: 15.0,
    k: 35.0,
    tac: 90.5,
    colorSum: 55.5,
  },
  costAudit: {
    paperCost: 4800000,
    inkCost: 3200000,
    bindingCost: 700000,
    finishingCost: 300000,
    setupCost: 50000,
    unitPrice: 45250,
    totalPrice: 9050000,
    rawC: 18.5,
    rawM: 22.0,
    rawY: 15.0,
    rawK: 35.0,
    rawTAC: 90.5,
    appliedTAC: 90.5,
    isManualOverride: false,
    formulaAuditLog: [
      'Model: BOOK_BOUND, Pages: 64, Duplex: true, Sheets: 32 per book',
      'Ink Cost per Side: (K:35.00% * 50) + (Color:55.50% * 80) = 2,500 LAK',
      'Unit Cost: Paper=24,000 + Ink=16,000 + Binding=3,500 + Finishing=1,500 = 45,000 LAK',
      'Order Total: (45,000 * 200 qty) + Setup:50,000 = 9,050,000 LAK',
    ],
  },
  overrideHistory: [
    {
      id: 'log-001',
      orderId: 'ord-item-8821',
      overriddenBy: 'Somchai (Pre-flight Admin)',
      overriddenAt: '2026-08-24 16:30',
      previousPageCount: 60,
      newPageCount: 64,
      previousTAC: 85.0,
      newTAC: 90.5,
      previousUnitPrice: 43000,
      newUnitPrice: 45250,
      reason: 'ລູກຄ້າແກ້ໄຂເພີ່ມໜ້າສາລະບານ 4 ໜ້າ ແລະ ອັບໂຫຼດໄຟລ໌ຊຸດສົມບູນ',
    },
  ],
  scanLogMessage: 'MuPDF rasterized 64 pages successfully. Average ink coverage calculated.',
};

export const OrderDetailVerificationPage: React.FC = () => {
  const [order, setOrder] = useState<OrderDetailVerification>(MOCK_ORDER_VERIFICATION);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRequestDrivePermission = () => {
    const templateMsg = `ຮຽນລູກຄ້າ ${order.customerName},\n\nທາງໂຮງພິມ Som Sing Phim ຂໍຄວາມກະລຸນາເປີດສິດການເຂົ້າເຖິງໄຟລ໌ Google Drive ສຳລັບອໍເດີ #${order.orderNumber} ໃຫ້ເປັນ "ທຸກຄົນທີ່ມີລິ້ງ (Anyone with link)" ເພື່ອດຳເນີນການກວດສອບໄຟລ໌ ແລະ ເລີ່ມພິມງານ\n\nລິ້ງໄຟລ໌: ${order.driveUrl}`;
    navigator.clipboard.writeText(templateMsg);
    showToast('ຄັດລອກຂໍ້ຄວາມຂໍສິດ Drive ໄປຍັງຄລິບບອດແລ້ວ!');
  };

  const handleSubmitOverride = async (payload: OverridePricingPayload) => {
    // Simulate backend API POST /api/v1/admin/orders/:id/override-pricing
    const sheetsPerUnit = order.isDoubleSided ? Math.ceil(payload.pageCount / 2) : payload.pageCount;
    const paperCost = 150 * sheetsPerUnit * order.quantity;
    const inkCost = ((payload.overrideTAC || order.coverage.tac) * 2) * payload.pageCount * order.quantity;
    const newUnitPrice = payload.overrideUnitPrice || Math.round((paperCost + inkCost) / order.quantity);
    const newTotalPrice = newUnitPrice * order.quantity + order.costAudit.setupCost;

    const newLog = {
      id: `log-${Date.now()}`,
      orderId: order.id,
      overriddenBy: payload.approvedBy,
      overriddenAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      previousPageCount: order.pageCount,
      newPageCount: payload.pageCount,
      previousTAC: order.costAudit.appliedTAC,
      newTAC: payload.overrideTAC,
      previousUnitPrice: order.costAudit.unitPrice,
      newUnitPrice: newUnitPrice,
      reason: payload.reason,
    };

    setOrder((prev) => ({
      ...prev,
      pageCount: payload.pageCount,
      coverage: {
        ...prev.coverage,
        tac: payload.overrideTAC,
      },
      costAudit: {
        ...prev.costAudit,
        paperCost: paperCost,
        inkCost: inkCost,
        appliedTAC: payload.overrideTAC,
        unitPrice: newUnitPrice,
        totalPrice: newTotalPrice,
        isManualOverride: true,
        formulaAuditLog: [
          ...prev.costAudit.formulaAuditLog,
          `Admin Override: Pages=${payload.pageCount}, TAC=${payload.overrideTAC}%, Reason="${payload.reason}"`,
        ],
      },
      overrideHistory: [newLog, ...prev.overrideHistory],
    }));

    showToast('ປັບປຸງລາຄາ ແລະ ອະນຸມັດສັ່ງຜະລິດຮຽບຮ້ອຍແລ້ວ!');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl border border-slate-800 animate-slide-in flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <span>ຄຳສັ່ງຊື້</span>
            <span>/</span>
            <span className="font-semibold text-slate-800">#{order.orderNumber}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {order.productName}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            ລູກຄ້າ: <strong className="text-slate-800">{order.customerName}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsOverrideModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>ປັບປຸງລາຄາ (Manual Override)</span>
          </button>
        </div>
      </div>

      {/* Order Specs Quick Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium block">ເຈ້ຍ</span>
          <span className="text-xs font-bold text-slate-800 truncate block">{order.paperType}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium block">ການເຂົ້າເລັ້ມ</span>
          <span className="text-xs font-bold text-slate-800 truncate block">{order.bindingType}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium block">ຈຳນວນພິມ</span>
          <span className="text-base font-extrabold text-indigo-700">{order.quantity.toLocaleString()} ຫົວ</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium block">ຍອດລວມທັງໝົດ</span>
          <span className="text-base font-extrabold text-emerald-700">₭{order.costAudit.totalPrice.toLocaleString()}</span>
        </div>
      </div>

      {/* Main Telemetry & Verification Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PreFlightVerificationCard
          status={order.status}
          driveUrl={order.driveUrl}
          fileSizeBytes={order.fileSizeBytes}
          detectedPageCount={order.pageCount}
          orderedPageCount={order.pageCount}
          scanLogMessage={order.scanLogMessage}
          onOpenOverrideModal={() => setIsOverrideModalOpen(true)}
          onRequestDrivePermission={handleRequestDrivePermission}
        />

        <CoverageChannelBreakdown
          coverage={order.coverage}
          isFallback={order.status === 'PENDING_MANUAL_VERIFICATION'}
        />
      </div>

      {/* Internal Cost Breakdown Table & Formula Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cost Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            ໂຄງສ້າງຕົ້ນທຶນ ແລະ ລາຄາຈິງ (Internal Cost Audit)
          </h3>
          <div className="divide-y divide-slate-100 text-xs font-medium">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-600">ຕົ້ນທຶນເຈ້ຍລວມ (Paper Cost)</span>
              <span className="font-semibold text-slate-800">₭{order.costAudit.paperCost.toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-600">ຕົ້ນທຶນນ້ຳໝຶກລວມ (Ink Cost)</span>
              <span className="font-semibold text-slate-800">₭{order.costAudit.inkCost.toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-600">ຄ່າເຂົ້າເລັ້ມ (Binding Cost)</span>
              <span className="font-semibold text-slate-800">₭{order.costAudit.bindingCost.toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-600">ຄ່າເຄືອບຜິວ (Finishing Cost)</span>
              <span className="font-semibold text-slate-800">₭{order.costAudit.finishingCost.toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-600">ຄ່າຕັ້ງເຄື່ອງພິມ (Setup Cost)</span>
              <span className="font-semibold text-slate-800">₭{order.costAudit.setupCost.toLocaleString()}</span>
            </div>
            <div className="py-3 flex justify-between text-sm font-extrabold bg-slate-50 px-3 rounded-xl mt-2">
              <span className="text-slate-900">ລາຄາຂາຍລວມ (Total Price)</span>
              <span className="text-emerald-700">₭{order.costAudit.totalPrice.toLocaleString()} (₭{order.costAudit.unitPrice.toLocaleString()} / ຫົວ)</span>
            </div>
          </div>
        </div>

        {/* Formula Audit Log (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">Formula Audit Log</h3>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Verifiable</span>
          </div>
          <div className="space-y-2 font-mono text-[11px] text-slate-300">
            {order.costAudit.formulaAuditLog.map((log, idx) => (
              <div key={idx} className="p-2 bg-slate-800/60 rounded-lg border border-slate-700/50">
                &gt; {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Override History Timeline */}
      {order.overrideHistory.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            ປະຫວັດການແກ້ໄຂ ແລະ ປັບປຸງລາຄາ (Override Audit Trails)
          </h3>
          <div className="space-y-3">
            {order.overrideHistory.map((history) => (
              <div key={history.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="font-semibold text-slate-800">{history.overriddenBy}</span>
                  <span>{history.overriddenAt}</span>
                </div>
                <div className="text-slate-700">
                  <strong>ເຫດຜົນ:</strong> {history.reason}
                </div>
                <div className="text-slate-600 flex space-x-4">
                  <span>ໜ້າ: {history.previousPageCount} ➔ {history.newPageCount}</span>
                  <span>TAC: {history.previousTAC}% ➔ {history.newTAC}%</span>
                  <span>ລາຄາ/ຫົວ: ₭{history.previousUnitPrice.toLocaleString()} ➔ ₭{history.newUnitPrice.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Override Modal Dialog */}
      <ManualOverrideModal
        isOpen={isOverrideModalOpen}
        order={order}
        onClose={() => setIsOverrideModalOpen(false)}
        onSubmitOverride={handleSubmitOverride}
        onRequestDrivePermission={handleRequestDrivePermission}
      />
    </div>
  );
};
