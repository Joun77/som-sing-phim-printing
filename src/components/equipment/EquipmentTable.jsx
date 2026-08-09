import React from 'react';
import { ShieldAlert, CheckCircle, Wrench, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function EquipmentTable({ machines, onMaintenance, onViewDetails, formatLAK }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-slate-800">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-wider">
              <th className="py-4 px-6">{t('inventory_status.item_sku')}</th>
              <th className="py-4 px-6">{t('inventory.material_cat')}</th>
              <th className="py-4 px-6">{t('equipment_mapping.operational_params')}</th>
              <th className="py-4 px-6">{t('equipment_mapping.sla_status')}</th>
              <th className="py-4 px-6 text-right">{t('inventory_status.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-semibold">
            {machines.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400 font-bold">
                  No machinery registered. Use Inbound Procurement to purchase new assets.
                </td>
              </tr>
            ) : (
              machines.map(eq => {
                const isCritical = eq.components && eq.components.some(c => c.usage >= (c.threshold || 90));
                
                let paramsSummary = '-';
                if (eq.category === 'Printer') {
                  paramsSummary = `Std Ink: ${eq.inkConsumptionStandard || 0.05} ml/sheet @ 5% | Click: ₭${eq.clickRateColor || 500}`;
                } else if (eq.category === 'Cutter') {
                  paramsSummary = `Capacity: ${eq.cutCapacity || 0} sheets / Blade: ${eq.bladeDepreciationPerCut || 0}₭`;
                } else if (eq.category === 'Binder') {
                  paramsSummary = `Avg Time: ${eq.avgTimePerBook || 0}m / Job depr: ${formatLAK(eq.depreciationPerJob || 0)}`;
                } else if (eq.category === 'Laminator') {
                  paramsSummary = `Speed: ${eq.speedMPerMin || 0} m/min / Warm-up: ${eq.warmUpTime || 0}m`;
                }

                return (
                  <tr key={eq.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4.5 px-6">
                      <div className="flex items-center gap-3">
                        {eq.imageUrl ? (
                          <img src={eq.imageUrl} alt={eq.name} className="w-10 h-10 object-cover rounded-xl border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs">
                            {eq.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-extrabold text-slate-800 block leading-tight">{eq.name}</span>
                          <span className="text-[10px] font-mono font-bold text-slate-400 block mt-1 uppercase">{eq.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4.5 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-700 border">
                        {eq.category}
                      </span>
                    </td>

                    <td className="py-4.5 px-6 text-xs text-slate-500 font-semibold font-sans">
                      {paramsSummary}
                    </td>
                    <td className="py-4.5 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        isCritical 
                          ? 'text-red-600 bg-red-50 border-red-100 animate-pulse' 
                          : 'text-green-600 bg-green-50 border-green-100'
                      }`}>
                        {isCritical ? (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Service Required</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Operational</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        {onViewDetails && (
                          <button
                            onClick={() => onViewDetails(eq)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                            title="ລາຍລະອຽດເພີ່ມເຕີມ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ລາຍລະອຽດເພີ່ມເຕີມ</span>
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
