import React from 'react'
import { PreflightReport } from '../lib/preflightAnalyzer'
import { CheckIcon, AlertCircleIcon, XIcon, SparkleIcon, ArrowRightIcon } from './icons'

export interface PreflightChecklistModalProps {
  report: PreflightReport
  onConfirm: () => void
  onCancel: () => void
}

export const PreflightChecklistModal: React.FC<PreflightChecklistModalProps> = ({
  report,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border animate-fade-in space-y-5"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-gold)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center border"
              style={{
                background: report.allPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                borderColor: report.allPassed ? '#10B981' : '#F59E0B',
                color: report.allPassed ? '#10B981' : '#F59E0B',
              }}
            >
              {report.allPassed ? <CheckIcon size={22} /> : <AlertCircleIcon size={22} />}
            </div>
            <div>
              <h3 className="font-black text-lg" style={{ color: 'var(--text-main)' }}>
                ตรวจสอบไฟล์พิมพ์ก่อนสั่งซื้อ (Preflight Check)
              </h3>
              <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                SOM SING PHIM · ARTWORK QUALITY INSPECTION
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* File Quick Spec Summary */}
        <div
          className="p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold border"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="truncate mr-2">
            <span style={{ color: 'var(--text-muted)' }}>ไฟล์: </span>
            <span style={{ color: 'var(--text-main)' }}>{report.fileName}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {report.fileSizeMB} MB
            </span>
            {report.estimatedDPI && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {report.estimatedDPI} DPI
              </span>
            )}
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-2.5">
          {report.items.map((item) => {
            const isPass = item.status === 'passed'
            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl border flex items-start gap-3 transition-all"
                style={{
                  background: isPass ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.08)',
                  borderColor: isPass ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.35)',
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: isPass ? '#10B981' : '#F59E0B',
                    color: '#050B18',
                  }}
                >
                  {isPass ? <CheckIcon size={14} /> : <AlertCircleIcon size={14} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-black" style={{ color: 'var(--text-main)' }}>
                      {item.label}
                    </span>
                    <span
                      className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
                      style={{
                        background: isPass ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: isPass ? '#10B981' : '#F59E0B',
                      }}
                    >
                      {isPass ? 'Passed' : 'Notice'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed m-0" style={{ color: 'var(--text-main)' }}>
                    {item.message}
                  </p>
                  {item.detail && (
                    <p className="text-[11px] font-normal mt-0.5 m-0" style={{ color: 'var(--text-muted)' }}>
                      {item.detail}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3.5 btn btn--gold text-xs font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <span>ยืนยันไฟล์และดำเนินการต่อ</span>
            <ArrowRightIcon size={16} />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="py-3.5 px-5 rounded-2xl text-xs font-bold transition-all border cursor-pointer"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            แก้ไข / เปลี่ยนไฟล์
          </button>
        </div>
      </div>
    </div>
  )
}

export default PreflightChecklistModal
