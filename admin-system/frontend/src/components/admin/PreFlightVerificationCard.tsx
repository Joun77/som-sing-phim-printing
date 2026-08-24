import React from 'react';
import { VerificationStatus } from '../../types/adminVerification';

interface PreFlightVerificationCardProps {
  status: VerificationStatus;
  driveUrl: string;
  fileSizeBytes?: number;
  detectedPageCount: number;
  orderedPageCount: number;
  scanLogMessage?: string;
  onOpenOverrideModal: () => void;
  onRequestDrivePermission: () => void;
}

export const PreFlightVerificationCard: React.FC<PreFlightVerificationCardProps> = ({
  status,
  driveUrl,
  fileSizeBytes,
  detectedPageCount,
  orderedPageCount,
  scanLogMessage,
  onOpenOverrideModal,
  onRequestDrivePermission,
}) => {
  const isPageMismatch = detectedPageCount !== orderedPageCount;
  const fileSizeMB = fileSizeBytes ? (fileSizeBytes / (1024 * 1024)).toFixed(2) : 'ไม่ระบุ';

  const getStatusBadge = () => {
    switch (status) {
      case 'AUTO_VERIFIED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Auto-Verified (วิเคราะห์ไฟล์อัตโนมัติสำเร็จ)
          </span>
        );
      case 'ADMIN_OVERRIDDEN':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <span className="w-2 h-2 rounded-full bg-purple-500 mr-1.5" />
            Admin Overridden (ปรับปรุงราคาโดยผู้ดูแล)
          </span>
        );
      case 'PENDING_MANUAL_VERIFICATION':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
            Pending Manual Verification (รอการตรวจสอบไฟล์)
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            ผลการตรวจสอบ Pre-Flight Telemetry
          </h3>
          <p className="text-xs text-slate-500">ข้อมูลการวิเคราะห์และตรวจสอบความสมบูรณ์ของไฟล์พิมพ์</p>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* Drive Source Link */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
          <span className="text-xs text-slate-400 font-medium block">ลิงก์ไฟล์ Google Drive</span>
          <div className="flex items-center space-x-2">
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-medium truncate flex-1 hover:underline text-xs"
              title={driveUrl}
            >
              {driveUrl || 'ไม่มีลิงก์ไฟล์'}
            </a>
            {status === 'PENDING_MANUAL_VERIFICATION' && (
              <button
                type="button"
                onClick={onRequestDrivePermission}
                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              >
                ขอสิทธิ์เข้าถึง
              </button>
            )}
          </div>
        </div>

        {/* File Size Info */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
          <span className="text-xs text-slate-400 font-medium block">ขนาดไฟล์เอกสาร</span>
          <span className="text-slate-800 font-semibold">{fileSizeMB} MB</span>
        </div>

        {/* Page Count Comparison */}
        <div className={`p-3.5 rounded-xl border space-y-1 ${
          isPageMismatch
            ? 'bg-amber-50/50 border-amber-300'
            : 'bg-slate-50 border-slate-200/70'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium block">จำนวนหน้า (สแกนพบ vs สั่งซื้อ)</span>
            {isPageMismatch && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                จำนวนหน้าไม่ตรงกัน
              </span>
            )}
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-lg font-bold text-slate-900">{detectedPageCount} หน้า</span>
            <span className="text-xs text-slate-500">(ลูกค้าเลือก {orderedPageCount} หน้า)</span>
          </div>
        </div>

        {/* Scan Log Message */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
          <span className="text-xs text-slate-400 font-medium block">ข้อความระบบสแกน (Log)</span>
          <span className="text-xs text-slate-700 line-clamp-2">
            {scanLogMessage || 'การวิเคราะห์เสร็จสมบูรณ์ ไม่มีข้อผิดพลาด'}
          </span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="text-xs text-slate-500">
          หากต้องการปรับจำนวนหน้าหรือสัดส่วนหมึกจริง สามารถเปิดเมนูปรับปรุงราคาได้
        </div>
        <button
          type="button"
          onClick={onOpenOverrideModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
        >
          แก้ไข/ปรับปรุงราคา (Manual Override)
        </button>
      </div>
    </div>
  );
};
