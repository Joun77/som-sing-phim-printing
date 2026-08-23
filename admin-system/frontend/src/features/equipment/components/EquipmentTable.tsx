import React from 'react';
import { ShieldAlert, CheckCircle, Eye, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@store/AppContext';
import type { Equipment } from '../types';

interface EquipmentTableProps {
  machines: Equipment[];
  onViewDetails: (eq: any) => void;
  onEdit?: (eq: any) => void;
  onDelete?: (eq: any) => void;
  formatLAK: (num: number) => string;
  onMaintenance?: (eqId: any) => void;
}

export default function EquipmentTable({ machines, onViewDetails, onEdit, onDelete, formatLAK }: EquipmentTableProps) {
  const { t } = useTranslation();
  const { printerColorLinks, inventory } = useApp();

  const subtypeLabelMap: Record<string, string> = {
    guillotine: 'GUILLOTINE CUTTER',
    sticker_plotter: 'STICKER PLOTTER',
    hole_drill: 'PAPER DRILL',
    binder: 'BINDER',
    folder: 'FOLDER/CREASER',
    laminator: 'LAMINATOR'
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-slate-800">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-wider">
              <th className="py-4 px-5">ASSET ID / S/N</th>
              <th className="py-4 px-5">BRAND & MODEL</th>
              <th className="py-4 px-5">CATEGORY / SUBTYPE</th>
              <th className="py-4 px-5">KEY OPERATIONAL SPECS</th>
              <th className="py-4 px-5">NET UNIT RATE</th>
              <th className="py-4 px-5">LOCATION</th>
              <th className="py-4 px-5">SLA STATUS</th>
              <th className="py-4 px-5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold">
            {machines.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                  No machinery registered. Use Inbound Procurement to purchase new assets.
                </td>
              </tr>
            ) : (
              machines.map(eq => {
                const isCritical = eq.components && eq.components.some(c => c.usage >= (c.threshold || 90));
                const isPostPress = eq.category !== 'Printer' && eq.category !== 'PRINTER';

                // Subtype text
                const subTypeKey = eq.postPressSubtype || eq.specs?.postPressSubtype || '';
                const subTypeLabel = subtypeLabelMap[subTypeKey] || eq.printerCategory || eq.category;

                // Specs calculation
                const lifespanYears = Number(eq.lifespanYears || eq.specs?.lifespanYears || 5);
                const estMonthlyVolume = Number(eq.estMonthlyVolume || eq.specs?.estMonthlyVolume || 50000);
                const maintenanceRatePct = Number(eq.maintenanceRatePercent || eq.specs?.maintenanceRatePercent || 15);
                
                const assetValue = eq.MachinePrice !== undefined ? eq.MachinePrice : (eq.purchaseCost || 0);
                const targetPages = eq.TargetTotalPages !== undefined ? eq.TargetTotalPages : (eq.printedPagesCapacity || 1000000);
                const totalMonths = lifespanYears * 12;
                const monthlyDepr = totalMonths > 0 ? (assetValue / totalMonths) : 0;
                const baseCostPerUnit = estMonthlyVolume > 0 ? (monthlyDepr / estMonthlyVolume) : 0;
                const netCostPerUnit = eq.costPerConsumptionUnit || eq.calculatedCostPerPage || (baseCostPerUnit * (1 + maintenanceRatePct / 100));

                const deprecationPerPage = targetPages > 0 ? (assetValue / targetPages) : 0;
                const unitRateLAK = isPostPress ? netCostPerUnit : (eq.calculatedCostPerPage || deprecationPerPage);

                // Ink Summary for printers
                const links = printerColorLinks.filter(lnk => lnk.assetId === eq.id);
                const linkedInksSummary = links.map(lnk => {
                  const ink = inventory.find(i => i.id === lnk.inkCode);
                  return `${lnk.slotPosition} (${ink ? ink.name : lnk.inkCode})`;
                }).join(', ') || '-';

                return (
                  <tr 
                    key={eq.id} 
                    onClick={() => onViewDetails(eq)}
                    className="hover:bg-sky-50/40 transition cursor-pointer group"
                  >
                    <td className="py-4 px-5 font-mono font-bold text-slate-700 uppercase">
                      <div>{eq.id}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{eq.serialNumber || eq.sn || 'SN: -'}</div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {eq.imageUrl ? (
                          <img src={eq.imageUrl} alt={eq.name} className="w-9 h-9 object-cover rounded-xl border border-slate-200" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-extrabold text-xs">
                            {eq.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-extrabold text-slate-900 block leading-tight group-hover:text-sky-600 transition">{eq.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{eq.brand || eq.model || 'Standard'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase border ${
                        isPostPress 
                          ? 'bg-sky-50 text-sky-700 border-sky-200' 
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {subTypeLabel}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-slate-600 font-medium">
                      {isPostPress ? (
                        <div className="space-y-0.5 text-[11px]">
                          <p className="font-semibold text-slate-700">เป้าหมาย: <span className="font-mono text-slate-900 font-extrabold">{estMonthlyVolume.toLocaleString()}</span> แผ่น/เดือน</p>
                          <p className="text-slate-400 text-[10px]">อายุ {lifespanYears} ปี • บำรุงรักษา +{maintenanceRatePct}%</p>
                        </div>
                      ) : (
                        <div className="space-y-0.5 text-[11px]">
                          <p className="font-semibold text-slate-700">ระบบสี: <span className="font-bold text-purple-700">{eq.colorSchemeType || 'CMYK'}</span> ({eq.totalColorSlots || 4} Slots)</p>
                          <p className="text-slate-400 text-[10px] truncate max-w-xs" title={linkedInksSummary}>หมึก: {linkedInksSummary}</p>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-5 font-mono font-black text-emerald-600 text-xs">
                      {unitRateLAK > 0 ? (
                        <div>
                          <span>{formatLAK(unitRateLAK)}</span>
                          <span className="text-[10px] font-normal text-slate-400 block">/ {isPostPress ? 'แผ่น (sheet)' : 'หน้า (page)'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-slate-600 font-medium">
                      {eq.location || 'Main Dept'}
                    </td>

                    <td className="py-4 px-5">
                      {(() => {
                        const curMeter = Number(eq.current_meter || eq.technical_specs?.current_meter || eq.specs?.current_meter || (eq.id === 'PRN-OFFSET-01' ? 102500 : 42000));
                        const lastMeter = Number(eq.last_serviced_meter || eq.technical_specs?.last_serviced_meter || eq.specs?.last_serviced_meter || (eq.id === 'PRN-OFFSET-01' ? 50000 : 0));
                        const interval = Number(eq.maintenance_interval_impressions || eq.technical_specs?.maintenance_interval_impressions || eq.specs?.maintenance_interval_impressions || 50000);
                        const delta = Math.max(0, curMeter - lastMeter);
                        const gaugePct = Math.min(100, Math.round((delta / interval) * 100));

                        let healthColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                        let barColor = 'bg-emerald-500';
                        let statusText = '🟢 Good (ปกติ)';

                        if (delta >= interval || gaugePct >= 100) {
                          healthColor = 'text-rose-700 bg-rose-50 border-rose-200 animate-pulse';
                          barColor = 'bg-rose-500';
                          statusText = '🔴 Overdue (เกินกำหนด)';
                        } else if (gaugePct >= 80) {
                          healthColor = 'text-amber-700 bg-amber-50 border-amber-200';
                          barColor = 'bg-amber-500';
                          statusText = '🟡 Due Soon (ใกล้กำหนด)';
                        }

                        return (
                          <div className="space-y-1.5 min-w-[130px]">
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black border ${healthColor}`}>
                                {statusText}
                              </span>
                              <span className="font-mono text-[10px] font-bold text-slate-500">
                                {gaugePct}%
                              </span>
                            </div>
                            {/* Health Gauge Progress Bar */}
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                                style={{ width: `${gaugePct}%` }}
                              />
                            </div>
                            <div className="text-[9px] text-slate-400 font-medium">
                              {delta.toLocaleString()} / {interval.toLocaleString()} imp
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onViewDetails(eq)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-extrabold rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>รายละเอียด</span>
                        </button>
                        {onEdit && (
                          <button
                            onClick={() => onEdit(eq)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-extrabold rounded-xl transition active:scale-95 cursor-pointer border border-slate-200"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>แก้ไข</span>
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(eq)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-extrabold rounded-xl transition active:scale-95 cursor-pointer border border-rose-200"
                            title="ลบเครื่องจักร"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบ</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

