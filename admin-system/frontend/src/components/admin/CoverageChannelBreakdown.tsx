import React from 'react';
import { RawChannelCoverage } from '../../types/adminVerification';

interface CoverageChannelBreakdownProps {
  coverage: RawChannelCoverage;
  isFallback?: boolean;
}

export const CoverageChannelBreakdown: React.FC<CoverageChannelBreakdownProps> = ({
  coverage,
  isFallback = false,
}) => {
  const isHeavyTAC = coverage.tac > 240;

  const channels = [
    { label: 'Cyan (C)', value: coverage.c, color: 'bg-cyan-500', barBg: 'bg-cyan-100', text: 'text-cyan-700' },
    { label: 'Magenta (M)', value: coverage.m, color: 'bg-pink-500', barBg: 'bg-pink-100', text: 'text-pink-700' },
    { label: 'Yellow (Y)', value: coverage.y, color: 'bg-amber-400', barBg: 'bg-amber-100', text: 'text-amber-700' },
    { label: 'Black / Key (K)', value: coverage.k, color: 'bg-slate-800', barBg: 'bg-slate-200', text: 'text-slate-900' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            สัดส่วนการใช้หมึกแยกสี (CMYK & TAC Density)
          </h3>
          <p className="text-xs text-slate-500">
            {isFallback
              ? '⚠️ ค่ามาตรฐาน (Fallback TAC) เนื่องจากไฟล์จำกัดสิทธิ์หรือขนาดเกิน 100MB'
              : 'ผลวิเคราะห์ความหนาแน่นหมึกต่อหน้าจากการ Rasterize ด้วย MuPDF/Ghostscript'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block font-medium">Total Area Coverage (TAC)</span>
          <span
            className={`text-xl font-extrabold ${
              isHeavyTAC ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {coverage.tac.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Warning banner for Heavy TAC */}
      {isHeavyTAC && (
        <div className="flex items-start space-x-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
          <svg className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-bold">เตือน: ความหนาแน่นหมึกสูงผิดปกติ (Heavy TAC &gt; 240%)</p>
            <p className="text-rose-700/90 mt-0.5">
              ไฟล์นี้ใช้ปริมาณหมึกสูง อาจทำให้หมึกแห้งช้าหรือซึมเลอะหลังพิมพ์ ควรพิจารณาปรับรอบพิมพ์หรือแจ้งช่างพิมพ์เพื่อคุมความร้อน
            </p>
          </div>
        </div>
      )}

      {/* Individual CMYK Channel Bars */}
      <div className="space-y-4">
        {channels.map((ch) => (
          <div key={ch.label} className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className={ch.text}>{ch.label}</span>
              <span className="text-slate-700">{ch.value.toFixed(2)}%</span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden ${ch.barBg}`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${ch.color}`}
                style={{ width: `${Math.min(100, Math.max(0, ch.value))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* TAC Multi-color Progress Overview */}
      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-700">
          <span>รวม 4 สี (Total Area Coverage: C+M+Y+K)</span>
          <span className={isHeavyTAC ? 'text-rose-600 font-bold' : 'text-slate-800 font-bold'}>
            {coverage.tac.toFixed(2)}% / 400%
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <div style={{ width: `${(coverage.c / 400) * 100}%` }} className="bg-cyan-500 h-full" title={`Cyan: ${coverage.c}%`} />
          <div style={{ width: `${(coverage.m / 400) * 100}%` }} className="bg-pink-500 h-full" title={`Magenta: ${coverage.m}%`} />
          <div style={{ width: `${(coverage.y / 400) * 100}%` }} className="bg-amber-400 h-full" title={`Yellow: ${coverage.y}%`} />
          <div style={{ width: `${(coverage.k / 400) * 100}%` }} className="bg-slate-800 h-full" title={`Black: ${coverage.k}%`} />
        </div>
      </div>
    </div>
  );
};
