import React from 'react';
import { FileScanStatus } from '../../types/pricing';

interface DriveLinkInputProps {
  value: string;
  onChange: (url: string) => void;
  isScanning: boolean;
  scanStatus: FileScanStatus | null;
  scanError: string | null;
  detectedPages: number | null;
}

export const DriveLinkInput: React.FC<DriveLinkInputProps> = ({
  value,
  onChange,
  isScanning,
  scanStatus,
  scanError,
  detectedPages,
}) => {
  const isAutoVerified = scanStatus === 'AUTO_VERIFIED';
  const isPendingVerification = scanStatus === 'PENDING_MANUAL_VERIFICATION';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-800">
        ลิงก์ไฟล์ Google Drive / PDF Artworks
      </label>
      <div className="relative">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
          className={`w-full px-4 py-3 border rounded-xl shadow-sm text-sm focus:ring-2 focus:outline-none transition-all ${
            isAutoVerified
              ? 'border-emerald-400 bg-emerald-50/30 focus:ring-emerald-400 text-slate-800'
              : isPendingVerification
              ? 'border-amber-400 bg-amber-50/30 focus:ring-amber-400 text-slate-800'
              : 'border-slate-300 focus:ring-indigo-500 bg-white text-slate-800'
          }`}
        />
        {isScanning && (
          <div className="absolute right-3 top-3.5 flex items-center space-x-2">
            <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
            <span className="text-xs font-medium text-indigo-600">กำลังสแกนไฟล์...</span>
          </div>
        )}
      </div>

      {/* Real-time Status Badge Indicator */}
      {isAutoVerified && (
        <div className="flex items-center space-x-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium animate-fadeIn">
          <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>
            ตรวจพบไฟล์เรียบร้อยแล้ว {detectedPages ? `(${detectedPages} หน้า)` : ''} — คำนวณราคาตามความหนาแน่นหมึกจริงอัตโนมัติ
          </span>
        </div>
      )}

      {isPendingVerification && (
        <div className="flex items-start space-x-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium animate-fadeIn">
          <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold">กำลังใช้เรทประเมินมาตรฐานชั่วคราว</p>
            <p className="text-amber-700/90">{scanError || 'เอกสารขนาดใหญ่หรือต้องขอสิทธิ์เข้าถึง ทีมงานจะตรวจสอบความถูกต้องก่อนเริ่มผลิต'}</p>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">
        💡 โปรดตั้งค่าสิทธิ์แชร์เป็น <strong>&ldquo;ทุกคนที่มีลิงก์ (Anyone with the link)&rdquo;</strong> เพื่อให้ระบบประเมินราคาได้ทันที
      </p>
    </div>
  );
};
