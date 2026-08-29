import React from 'react';
import { FileScanStatus } from '../../types/pricing';
import { Info, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

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
        ລິ້ງໄຟລ໌ Google Drive / PDF Artworks
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
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            <span className="text-xs font-medium text-indigo-600">ກຳລັງສະແກນໄຟລ໌...</span>
          </div>
        )}
      </div>

      {/* Real-time Status Badge Indicator */}
      {isAutoVerified && (
        <div className="flex items-center space-x-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            ກວດພົບໄຟລ໌ຮຽບຮ້ອຍແລ້ວ {detectedPages ? `(${detectedPages} ໜ້າ)` : ''} — ຄິດໄລ່ລາຄາຕາມຄວາມໜາແໜ້ນນ້ຳໝຶກຈິງອັດຕະໂນມັດ
          </span>
        </div>
      )}

      {isPendingVerification && (
        <div className="flex items-start space-x-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">ກຳລັງໃຊ້ອັດຕາປະເມີນມາດຕະຖານຊົ່ວຄາວ</p>
            <p className="text-amber-700/90">{scanError || 'ເອກະສານຂະໜາດໃຫຍ່ ຫຼື ຕ້ອງຂໍສິດເຂົ້າເຖິງ, ທີມງານຈະກວດສອບຄວາມຖືກຕ້ອງກ່ອນເລີ່ມຜະລິດ'}</p>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>ກະລຸນາຕັ້ງຄ່າສິດແຊຣ໌ເປັນ <strong>&ldquo;ທຸກຄົນທີ່ມີລິ້ງ (Anyone with the link)&rdquo;</strong> ເພື່ອໃຫ້ລະບົບປະເມີນລາຄາໄດ້ທັນທີ</span>
      </p>
    </div>
  );
};
