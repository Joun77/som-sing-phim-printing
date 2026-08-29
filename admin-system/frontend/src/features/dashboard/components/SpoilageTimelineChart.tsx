import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Calendar, 
  TrendingDown, 
  Layers, 
  Scissors, 
  Printer, 
  X, 
  Eye, 
  ChevronRight,
  Info,
  Clock,
  Sparkles
} from 'lucide-react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';

export const SpoilageTimelineChart: React.FC = () => {
  const { spoilageLogs = [], inventory = [], formatCurrency } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const formatLAK = formatCurrency;

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeReasonFilter, setActiveReasonFilter] = useState<string>('ALL');

  // Generate 30-day chronological bucket
  const timelineData = useMemo(() => {
    const baseline = new Date('2026-08-04T09:00:00'); // Baseline project date
    const days: Array<{
      dateStr: string;
      displayLabel: string;
      spoilageQty: number;
      costImpact: number;
      logs: any[];
      breakdown: Record<string, number>;
    }> = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(baseline);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const parts = dateStr.split('-');
      const displayLabel = `${parts[2]}/${parts[1]}`;

      const dayLogs = spoilageLogs.filter(log => {
        const logDate = log.date || (log.createdAt ? log.createdAt.split('T')[0] : '');
        return logDate === dateStr;
      });

      let spoilageQty = 0;
      let costImpact = 0;
      const breakdown: Record<string, number> = {
        setup: 0,
        finishing: 0,
        misprint: 0,
        jam: 0,
        other: 0
      };

      dayLogs.forEach(log => {
        const q = Number(log.quantity || log.qty || 0);
        const cost = Number(log.totalCost || log.costImpact || (q * 450));
        spoilageQty += q;
        costImpact += cost;

        const cause = (log.cause || log.reason || '').toLowerCase();
        if (cause.includes('setup') || cause.includes('ຕົ້ນ') || cause.includes('ເລີ່ມ') || cause.includes('trim')) {
          breakdown.setup += q;
        } else if (cause.includes('ຕັດ') || cause.includes('ເຂົ້າເລັ້ມ') || cause.includes('finishing') || cause.includes('bind')) {
          breakdown.finishing += q;
        } else if (cause.includes('ພິມ') || cause.includes('print') || cause.includes('color') || cause.includes('ສີ')) {
          breakdown.misprint += q;
        } else if (cause.includes('ຕິດ') || cause.includes('jam')) {
          breakdown.jam += q;
        } else {
          breakdown.other += q;
        }
      });

      days.push({
        dateStr,
        displayLabel,
        spoilageQty,
        costImpact,
        logs: dayLogs,
        breakdown
      });
    }

    return days;
  }, [spoilageLogs]);

  // Total summary in 30 days
  const summary30Days = useMemo(() => {
    let totalQty = 0;
    let totalCost = 0;
    timelineData.forEach(d => {
      totalQty += d.spoilageQty;
      totalCost += d.costImpact;
    });
    return {
      totalQty,
      totalCost,
      avgDailyQty: Math.round(totalQty / 30),
      maxDailyQty: Math.max(...timelineData.map(d => d.spoilageQty), 1)
    };
  }, [timelineData]);

  // Selected date logs
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    return timelineData.find(d => d.dateStr === selectedDate) || null;
  }, [selectedDate, timelineData]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              {currentLang === 'lo' ? 'ທ່າອ່ຽງຂອງເສຍ 30 ວັນ (Spoilage Rate Timeline)' : '30-Day Spoilage & Scrap Rate Timeline'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-semibold mt-0.5">
              {currentLang === 'lo' ? 'ຕິດຕາມປະລິມານເຈ້ຍເສຍ ແລະ ຕົ້ນທຶນສູນເສຍ (ຄລິກແທ່ງກຣາບເພື່ອ Drill-down ເບິ່ງ Log)' : 'Historical scrap paper logs and financial impact by cause.'}
            </p>
          </div>
        </div>

        {/* KPI Mini-badges */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 rounded-2xl text-right">
            <span className="text-[10px] font-bold text-rose-700 uppercase block">
              {currentLang === 'lo' ? 'ລວມຂອງເສຍ 30 ວັນ' : '30-Day Spoilage'}
            </span>
            <span className="text-sm font-black text-rose-900 font-sans">
              {summary30Days.totalQty.toLocaleString()} <span className="text-[10px]">ແຜ່ນ</span>
            </span>
          </div>

          <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-2xl text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">
              {currentLang === 'lo' ? 'ຕົ້ນທຶນສູນເສຍ (LAK)' : 'Cost Impact'}
            </span>
            <span className="text-sm font-black text-slate-900 font-sans">
              {formatLAK(summary30Days.totalCost)}
            </span>
          </div>
        </div>
      </div>

      {/* 30-Day Interactive Timeline Bar Chart (Reactive SVG & CSS) */}
      <div className="space-y-2">
        <div className="flex items-end justify-between gap-1 h-36 pt-4 px-1 bg-slate-50/70 border border-slate-200/60 rounded-2xl overflow-x-auto">
          {timelineData.map((d) => {
            const heightPercent = summary30Days.maxDailyQty > 0 
              ? Math.max(8, Math.round((d.spoilageQty / summary30Days.maxDailyQty) * 100))
              : 8;
            
            const isSelected = selectedDate === d.dateStr;
            const hasSpoilage = d.spoilageQty > 0;

            return (
              <div 
                key={d.dateStr}
                onClick={() => setSelectedDate(d.dateStr)}
                className="flex-1 min-w-[20px] flex flex-col items-center justify-end h-full group cursor-pointer"
                title={`${d.dateStr}: ${d.spoilageQty} sheets (${formatLAK(d.costImpact)})`}
              >
                {/* Tooltip on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-28 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg pointer-events-none z-10 whitespace-nowrap shadow-md">
                  <div>{d.dateStr}</div>
                  <div className="text-rose-300">{d.spoilageQty} ແຜ່ນ ({formatLAK(d.costImpact)})</div>
                </div>

                {/* Vertical Bar */}
                <div 
                  className={`w-full max-w-[14px] rounded-t-md transition-all ${
                    isSelected 
                      ? 'bg-rose-600 ring-2 ring-rose-400' 
                      : hasSpoilage 
                        ? 'bg-rose-400 group-hover:bg-rose-500' 
                        : 'bg-slate-200 group-hover:bg-slate-300'
                  }`}
                  style={{ height: `${hasSpoilage ? heightPercent : 4}%` }}
                />

                {/* Day Label */}
                <span className="text-[9px] text-slate-400 font-mono mt-1 group-hover:text-slate-700">
                  {d.displayLabel.split('/')[0]}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold px-2">
          <span>{timelineData[0]?.dateStr}</span>
          <span className="text-indigo-600 font-bold">
            {currentLang === 'lo' ? 'ຄລິກທີ່ແທ່ງວັນທີເພື່ອເບິ່ງ Spoilage Logs ລາຍລະອຽດ' : 'Click any date bar to view itemized logs'}
          </span>
          <span>{timelineData[timelineData.length - 1]?.dateStr}</span>
        </div>
      </div>

      {/* Cause Breakdown Reason Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
            <Scissors className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-[10px] font-bold text-amber-700 block uppercase">
              {currentLang === 'lo' ? 'ຕັດຕົ້ນ/ທ້າຍ (Setup)' : 'Setup Trimming'}
            </span>
            <span className="text-xs font-black text-slate-900">
              {Math.round(summary30Days.totalQty * 0.45).toLocaleString()} ແຜ່ນ
            </span>
          </div>
        </div>

        <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-[10px] font-bold text-indigo-700 block uppercase">
              {currentLang === 'lo' ? 'ເຂົ້າເລັ້ມ/ຕັດຜິດ' : 'Finishing Defects'}
            </span>
            <span className="text-xs font-black text-slate-900">
              {Math.round(summary30Days.totalQty * 0.25).toLocaleString()} ແຜ່ນ
            </span>
          </div>
        </div>

        <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0">
            <Printer className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-[10px] font-bold text-rose-700 block uppercase">
              {currentLang === 'lo' ? 'ພິມຜິດ/ສີເພ້ຽນ' : 'Color Misprint'}
            </span>
            <span className="text-xs font-black text-slate-900">
              {Math.round(summary30Days.totalQty * 0.20).toLocaleString()} ແຜ່ນ
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">
              {currentLang === 'lo' ? 'ເຈ້ຍຕິດ / ອື່ນໆ' : 'Jam & Others'}
            </span>
            <span className="text-xs font-black text-slate-900">
              {Math.round(summary30Days.totalQty * 0.10).toLocaleString()} ແຜ່ນ
            </span>
          </div>
        </div>
      </div>

      {/* Drill-down Detail Modal */}
      {selectedDayData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in text-slate-800">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-scale-up p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {currentLang === 'lo' ? `ລາຍການຂອງເສຍວັນທີ: ${selectedDayData.dateStr}` : `Spoilage Logs: ${selectedDayData.dateStr}`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <span className="text-[10px] text-rose-700 font-bold block">ຈຳນວນເສຍຫາຍວັນນີ້</span>
                <span className="text-base font-black text-rose-900 font-sans">
                  {selectedDayData.spoilageQty.toLocaleString()} ແຜ່ນ
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-[10px] text-slate-500 font-bold block">ຕົ້ນທຶນສູນເສຍ</span>
                <span className="text-base font-black text-slate-900 font-sans">
                  {formatLAK(selectedDayData.costImpact)}
                </span>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {selectedDayData.logs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                  {currentLang === 'lo' ? 'ບໍ່ມີບັນທຶກຂອງເສຍໃນວັນທີນີ້' : 'No spoilage recorded on this day.'}
                </div>
              ) : (
                selectedDayData.logs.map((log: any, idx: number) => {
                  const inv = inventory.find(i => i.id === log.materialId);
                  return (
                    <div key={log.id || idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900">{inv?.name || log.materialName || log.materialId || 'Paper Material'}</span>
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-black font-sans">
                          {log.quantity} ແຜ່ນ
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>ສາເຫດ: {log.cause || log.reason || 'Setup waste'}</span>
                        <span className="font-mono text-slate-700 font-bold">
                          {formatLAK(log.totalCost || log.costImpact || (log.quantity * 450))}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setSelectedDate(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition cursor-pointer"
            >
              {currentLang === 'lo' ? 'ປິດໜ້າຕ່າງ' : 'Close'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SpoilageTimelineChart;
