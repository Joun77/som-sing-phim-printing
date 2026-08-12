import React from 'react';
import { ShieldAlert, CheckCircle, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';

export default function EquipmentTable({ machines, onViewDetails, formatLAK }) {
  const { t } = useTranslation();
  const { printerColorLinks, inventory } = useApp();

  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-slate-800">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-wider">
              <th className="py-4 px-6">{t('inventory_status.lot_id')} (Asset ID)</th>
              <th className="py-4 px-6">S/N</th>
              <th className="py-4 px-6">{t('inventory_status.item_sku')} (Brand & Model)</th>
              <th className="py-4 px-6">{t('inventory.material_cat')}</th>
              <th className="py-4 px-6">{t('printer_management.color_scheme')}</th>
              <th className="py-4 px-6">{t('printer_management.total_slots')}</th>
              <th className="py-4 px-6">{t('printer_management.linked_inks')}</th>
              <th className="py-4 px-6">Est. Depreciation / Page</th>
              <th className="py-4 px-6">Location</th>
              <th className="py-4 px-6">{t('equipment_mapping.sla_status')}</th>
              <th className="py-4 px-6 text-right">{t('inventory_status.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold">
            {machines.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-12 text-center text-slate-400 font-bold">
                  No machinery registered. Use Inbound Procurement to purchase new assets.
                </td>
              </tr>
            ) : (
              machines.map(eq => {
                const isCritical = eq.components && eq.components.some(c => c.usage >= (c.threshold || 90));
                
                // Calculate dynamic ink summary
                const links = printerColorLinks.filter(lnk => lnk.assetId === eq.id);
                const linkedInksSummary = links.map(lnk => {
                  const ink = inventory.find(i => i.id === lnk.inkCode);
                  return `${lnk.slotPosition} (${ink ? ink.name : lnk.inkCode})`;
                }).join(', ') || '-';

                return (
                  <tr key={eq.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-500 uppercase">
                      {eq.id}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-600">
                      {eq.serialNumber || eq.sn || '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {eq.imageUrl ? (
                          <img src={eq.imageUrl} alt={eq.name} className="w-8 h-8 object-cover rounded-lg border border-slate-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                            {eq.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-extrabold text-slate-800 block leading-tight">{eq.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-700 border">
                        {eq.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {eq.colorSchemeType || '-'}
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-mono">
                      {eq.totalColorSlots || eq.totalSlots || '-'}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-medium max-w-xs truncate" title={linkedInksSummary}>
                      {linkedInksSummary}
                    </td>
                    <td className="py-4 px-6 text-emerald-600 font-mono font-bold">
                      {eq.TargetTotalPages > 0 
                        ? formatLAK((eq.MachinePrice || eq.purchaseCost || 0) / eq.TargetTotalPages) 
                        : '-'}
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {eq.location || '-'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        isCritical 
                          ? 'text-red-600 bg-red-50 border-red-100 animate-pulse' 
                          : 'text-green-600 bg-green-50 border-green-100'
                      }`}>
                        {isCritical ? (
                          <>
                            <ShieldAlert className="w-3 h-3" />
                            <span>Service Required</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Operational</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        {onViewDetails && (
                          <button
                            onClick={() => onViewDetails(eq)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold rounded-xl transition shadow-sm cursor-pointer"
                            title="ລາຍລະອຽດເພີ່ມເຕີມ"
                          >
                            <Eye className="w-3 h-3" />
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

