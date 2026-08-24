import React, { useState } from 'react';
import {
  OrderDetailVerification,
  OverrideHistoryLog,
  OverridePricingPayload,
} from '../../types/adminVerification';
import { PreFlightVerificationCard } from '../../components/admin/PreFlightVerificationCard';
import { CoverageChannelBreakdown } from '../../components/admin/CoverageChannelBreakdown';
import { ManualOverrideModal } from '../../components/admin/ManualOverrideModal';
import { useOrderVerification, useOverridePricing } from '../../hooks/useOrders';

interface OrderDetailVerificationPageProps {
  orderId?: string;
}

export const OrderDetailVerificationPage: React.FC<OrderDetailVerificationPageProps> = ({
  orderId: propOrderId,
}) => {
  // Extract order ID from prop, URL search params, or fallback
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const targetOrderId = propOrderId || urlParams?.get('id') || urlParams?.get('order_id') || 'ORD-2026-0882';

  const { data: order, isLoading, error, refetch } = useOrderVerification(targetOrderId);
  const overridePricingMutation = useOverridePricing();

  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRequestDrivePermission = () => {
    if (!order) return;
    const templateMsg = `เรียนลูกค้า ${order.customerName},\n\nทางโรงพิมพ์ Som Sing Phim ขอความกรุณาเปิดสิทธิ์การเข้าถึงไฟล์ Google Drive สำหรับออเดอร์ #${order.orderNumber} ให้เป็น "ทุกคนที่มีลิงก์ (Anyone with link)" เพื่อดำเนินการตรวจสอบไฟล์และเริ่มพิมพ์งานครับ\n\nลิงก์ไฟล์: ${order.driveUrl}`;
    navigator.clipboard.writeText(templateMsg);
    showToast('คัดลอกข้อความขอสิทธิ์ Drive ไปยังคลิปบอร์ดแล้ว!');
  };

  const handleSubmitOverride = async (payload: OverridePricingPayload) => {
    if (!order) return;

    try {
      // Calculate new unit price or use direct override from admin
      const unitPriceToApply = payload.overrideUnitPrice && payload.overrideUnitPrice > 0
        ? payload.overrideUnitPrice
        : order.costAudit.unitPrice;

      await overridePricingMutation.mutateAsync({
        orderId: targetOrderId,
        orderItemId: order.id,
        overrideUnitPrice: unitPriceToApply,
        reason: payload.reason,
        approvedBy: payload.approvedBy,
      });

      setIsOverrideModalOpen(false);
      showToast('✓ ปรับปรุงราคาผ่านระบบและบันทึก Audit Log เรียบร้อยแล้ว!');
      refetch();
    } catch (err: any) {
      showToast(`❌ เกิดข้อผิดพลาดในการ Override ราคา: ${err.message || 'Server Error'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-8 bg-slate-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto p-8 my-12 bg-white rounded-2xl border border-rose-200 shadow-sm text-center space-y-4">
        <div className="text-3xl">⚠️</div>
        <h2 className="text-lg font-bold text-slate-800">ไม่สามารถโหลดข้อมูลการตรวจสอบคำสั่งซื้อได้</h2>
        <p className="text-sm text-slate-600">
          {error?.message || 'ไม่พบข้อมูลคำสั่งซื้อในระบบ'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow transition"
        >
          ลองใหม่อีกครั้ง (Retry)
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl border border-slate-800 animate-slideIn">
          {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <span>คำสั่งซื้อ</span>
            <span>/</span>
            <span className="font-semibold text-slate-800">#{order.orderNumber}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {order.productName}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            ลูกค้า: <strong className="text-slate-800">{order.customerName}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsOverrideModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            ✏️ ปรับปรุงราคา (Manual Override)
          </button>
        </div>
      </div>

      {/* Order Specs Quick Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium block">กระดาษ</span>
          <span className="text-xs font-bold text-slate-800 truncate block">{order.paperType}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium block">การเข้าเล่ม</span>
          <span className="text-xs font-bold text-slate-800 truncate block">{order.bindingType}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium block">จำนวนพิมพ์</span>
          <span className="text-base font-extrabold text-indigo-700">{order.quantity.toLocaleString()} เล่ม</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium block">ยอดรวมทั้งสิ้น</span>
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
            โครงสร้างต้นทุนและราคาจริง (Internal Cost Audit)
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-600">ต้นทุนกระดาษรวม (Paper Cost)</span>
              <span className="font-semibold text-slate-800">₭{order.costAudit.paperCost.toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-600">ต้นทุนน้ำหมึกรวม (Ink Cost)</span>
              <span className="font-semibold text-slate-800">₭{order.costAudit.inkCost.toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-600">ค่าเข้าเล่ม (Binding Cost)</span>
              <span className="font-semibold text-slate-800">₭{order.costAudit.bindingCost.toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-600">ค่าเคลือบผิว (Finishing Cost)</span>
              <span className="font-semibold text-slate-800">₭{order.costAudit.finishingCost.toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-600">ค่าตั้งเครื่องพิมพ์ (Setup Cost)</span>
              <span className="font-semibold text-slate-800">₭{order.costAudit.setupCost.toLocaleString()}</span>
            </div>
            <div className="py-3 flex justify-between text-sm font-extrabold bg-slate-50 px-3 rounded-xl mt-2">
              <span className="text-slate-900">ราคาขายรวม (Total Price)</span>
              <span className="text-emerald-700">₭{order.costAudit.totalPrice.toLocaleString()} (₭{order.costAudit.unitPrice.toLocaleString()} / เล่ม)</span>
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
            {order.costAudit.formulaAuditLog.map((log: string, idx: number) => (
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
            ประวัติการแก้ไขและปรับปรุงราคา (Override Audit Trails)
          </h3>
          <div className="space-y-3">
            {order.overrideHistory.map((history: OverrideHistoryLog) => (
              <div key={history.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">

                <div className="flex justify-between items-center text-slate-500">
                  <span className="font-semibold text-slate-800">{history.overriddenBy}</span>
                  <span>{history.overriddenAt}</span>
                </div>
                <div className="text-slate-700">
                  <strong>เหตุผล:</strong> {history.reason}
                </div>
                <div className="text-slate-600 flex space-x-4">
                  <span>หน้า: {history.previousPageCount} ➔ {history.newPageCount}</span>
                  <span>TAC: {history.previousTAC}% ➔ {history.newTAC}%</span>
                  <span>ราคา/เล่ม: ₭{history.previousUnitPrice.toLocaleString()} ➔ ₭{history.newUnitPrice.toLocaleString()}</span>
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
