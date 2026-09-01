import React, { useState } from 'react';
import { VerificationStatus } from '../../types/adminVerification';
import { Palette, UploadCloud, Loader2, CheckCircle2, Sparkles, FileText, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../api/client';

export interface CMYKCoverageData {
  c: number;
  m: number;
  y: number;
  k: number;
}

interface PreFlightVerificationCardProps {
  status: VerificationStatus;
  driveUrl: string;
  fileSizeBytes?: number;
  detectedPageCount: number;
  orderedPageCount: number;
  scanLogMessage?: string;
  cmykCoverage?: CMYKCoverageData;
  onOpenOverrideModal: () => void;
  onRequestDrivePermission: () => void;
  onApplyCMYKToSpec?: (cmyk: CMYKCoverageData, totalCoverage: number) => void;
  onUploadAndAnalyze?: (file: File) => Promise<void>;
}

export const PreFlightVerificationCard: React.FC<PreFlightVerificationCardProps> = ({
  status,
  driveUrl,
  fileSizeBytes,
  detectedPageCount,
  orderedPageCount,
  scanLogMessage,
  cmykCoverage,
  onOpenOverrideModal,
  onRequestDrivePermission,
  onApplyCMYKToSpec,
  onUploadAndAnalyze,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [localCMYK, setLocalCMYK] = useState<CMYKCoverageData | undefined>(cmykCoverage);
  const [applied, setApplied] = useState(false);

  const isPageMismatch = detectedPageCount !== orderedPageCount;
  const fileSizeMB = fileSizeBytes ? (fileSizeBytes / (1024 * 1024)).toFixed(2) : 'ไม่ระบุ';

  const activeC = localCMYK?.c ?? cmykCoverage?.c ?? 0;
  const activeM = localCMYK?.m ?? cmykCoverage?.m ?? 0;
  const activeY = localCMYK?.y ?? cmykCoverage?.y ?? 0;
  const activeK = localCMYK?.k ?? cmykCoverage?.k ?? 0;
  const totalCoverage = Number((activeC + activeM + activeY + activeK).toFixed(1));
  const colorCoverage = Number((activeC + activeM + activeY).toFixed(1));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (onUploadAndAnalyze) {
      setIsUploading(true);
      try {
        await onUploadAndAnalyze(selectedFile);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await apiFetch('/api/preflight/analyze', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const cmyk = {
          c: Number(data.avg_cov_c || data.cCoverage || 15),
          m: Number(data.avg_cov_m || data.mCoverage || 15),
          y: Number(data.avg_cov_y || data.yCoverage || 15),
          k: Number(data.avg_cov_k || data.kCoverage || 15),
        };
        setLocalCMYK(cmyk);
        if (onApplyCMYKToSpec) {
          onApplyCMYKToSpec(cmyk, cmyk.c + cmyk.m + cmyk.y + cmyk.k);
          setApplied(true);
        }
      }
    } catch (err) {
      console.error('Preflight upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyClick = () => {
    if (onApplyCMYKToSpec && (localCMYK || cmykCoverage)) {
      const c = localCMYK || cmykCoverage!;
      onApplyCMYKToSpec(c, totalCoverage);
      setApplied(true);
    }
  };

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
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            <span>ผลการตรวจสอบ Pre-Flight Telemetry & CMYK Coverage</span>
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
                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
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

      {/* CMYK Ink Coverage Breakdown Bars */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-black tracking-wide uppercase">
              สัดส่วนความครอบคลุมหมึกพิมพ์ (CMYK Ink Coverage)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              Total: {totalCoverage}%
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-700/50 font-mono">
              Color (CMY): {colorCoverage}%
            </span>
          </div>
        </div>

        {isUploading ? (
          <div className="py-6 flex flex-col items-center justify-center gap-2 text-indigo-300">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
            <span className="text-xs font-bold animate-pulse">กำลังวิเคราะห์ค่าสี CMYK และความละเอียดไฟล์...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Cyan */}
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-cyan-400">Cyan (C)</span>
                <span className="font-mono text-white">{activeC}%</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, activeC)}%` }} />
              </div>
            </div>

            {/* Magenta */}
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-rose-400">Magenta (M)</span>
                <span className="font-mono text-white">{activeM}%</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, activeM)}%` }} />
              </div>
            </div>

            {/* Yellow */}
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-amber-300">Yellow (Y)</span>
                <span className="font-mono text-white">{activeY}%</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-300 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, activeY)}%` }} />
              </div>
            </div>

            {/* Key/Black */}
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-300">Black (K)</span>
                <span className="font-mono text-white">{activeK}%</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, activeK)}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Upload new file directly or apply to spec */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
          <label className="flex items-center gap-1.5 text-indigo-300 hover:text-indigo-200 cursor-pointer font-bold">
            <UploadCloud className="w-4 h-4" />
            <span>อัปโหลดและวิเคราะห์ไฟล์ใหม่</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>

          {onApplyCMYKToSpec && (
            <button
              type="button"
              onClick={handleApplyClick}
              disabled={applied || totalCoverage === 0}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                applied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
              }`}
            >
              {applied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{applied ? 'นำค่าสีเข้าสู่การคำนวณแล้ว' : 'นำค่าสีเข้าสู่การคิดราคา (Apply CMYK to Spec)'}</span>
            </button>
          )}
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
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
        >
          แก้ไข/ปรับปรุงราคา (Manual Override)
        </button>
      </div>
    </div>
  );
};

