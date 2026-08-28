import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, Eye, Edit, Trash2, Layers } from 'lucide-react';
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
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const { printerColorLinks, inventory } = useApp();

  const [dbInks, setDbInks] = useState<any[]>([]);

  useEffect(() => {
    const p1 = fetch('/api/inbound')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const items = Array.isArray(data) ? data : (data?.data || []);
        return items.filter((i: any) => {
          const c = (i.category || '').toUpperCase();
          const sku = (i.skuCode || i.id || '').toUpperCase();
          const name = (i.itemName || i.name || '').toUpperCase();
          return c.includes('INK') || name.includes('INK') || name.includes('TONER') || name.includes('ໝຶກ') || sku.startsWith('INK');
        }).map((m: any) => ({
          id: m.skuCode || m.id,
          sku: m.skuCode || m.id,
          skuCode: m.skuCode || m.id,
          name: m.itemName || m.name || m.skuCode || m.id,
          category: m.category || 'Ink',
          colorGroup: m.specs?.colorGroup || m.colorGroup || 'Black',
          stockQty: Number(m.quantity || 0),
          unitPrice: Number(m.unitPrice || m.costPerPurchaseUnit || (m.totalPrice && m.quantity ? Math.round(Number(m.totalPrice) / Number(m.quantity)) : 0)),
          costPerPurchaseUnit: Number(m.costPerPurchaseUnit || m.unitPrice || 0),
          volume: Number(m.specs?.volume || m.specs?.volume_ml || 140),
          yield: Number(m.specs?.yield || m.specs?.expectedYield || m.specs?.isoYield || m.yield || 0),
          specs: m.specs || {}
        }));
      })
      .catch(() => []);

    const p2 = fetch('/api/inventory/items')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const items = Array.isArray(data) ? data : (data?.data || []);
        return items.filter((i: any) => {
          const c = (i.category || '').toUpperCase();
          const sku = (i.skuCode || i.sku || i.id || '').toUpperCase();
          const name = (i.name || '').toUpperCase();
          return c.includes('INK') || name.includes('INK') || name.includes('TONER') || name.includes('ໝຶກ') || sku.startsWith('INK');
        }).map((m: any) => ({
          id: m.id || m.sku || m.inkCode,
          sku: m.sku || m.inkCode || m.id,
          skuCode: m.sku || m.inkCode || m.id,
          name: m.name || m.id,
          category: m.category || 'Ink',
          colorGroup: m.specs?.colorGroup || m.colorGroup || 'Black',
          unitPrice: Number(m.unitPrice || m.costPerPurchaseUnit || 0),
          costPerPurchaseUnit: Number(m.costPerPurchaseUnit || m.unitPrice || 0),
          volume: Number(m.specs?.volume || m.specs?.volume_ml || 140),
          yield: Number(m.specs?.yield || m.specs?.expectedYield || m.specs?.isoYield || m.yield || 0),
          specs: m.specs || {}
        }));
      })
      .catch(() => []);

    Promise.all([p1, p2]).then(([inbInks, matInks]) => {
      setDbInks([...(inbInks || []), ...(matInks || [])]);
    });
  }, []);

  const allAvailableInks = [...inventory, ...dbInks];

  const formatUnitLAK = (val: number) => {
    if (!val || isNaN(val)) return 'LAK 0';
    if (Math.abs(val) < 1) return `LAK ${val.toFixed(2)}`;
    if (Math.abs(val) < 10) return `LAK ${val.toFixed(2)}`;
    return formatLAK(Math.round(val * 100) / 100);
  };

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
              <th className="py-4 px-5">{currentLang === 'lo' ? 'ລະຫັດເຄື່ອງ / S/N' : 'ASSET ID / S/N'}</th>
              <th className="py-4 px-5">{currentLang === 'lo' ? 'ແບຣນ & ລຸ້ນໂມເດວ' : 'BRAND & MODEL'}</th>
              <th className="py-4 px-5">{currentLang === 'lo' ? 'ໝວດໝູ່ / ປະເພດ' : 'CATEGORY / SUBTYPE'}</th>
              <th className="py-4 px-5">{currentLang === 'lo' ? 'ສະເປັກຫຼັກ & ລະບົບສີ' : 'KEY OPERATIONAL SPECS'}</th>
              <th className="py-4 px-5">{currentLang === 'lo' ? 'ຄ່າພິມຕໍ່ 1 ໜ້າ' : 'PRINT COST / PAGE'}</th>
              <th className="py-4 px-5">{currentLang === 'lo' ? 'ສະຖານທີ່ຕັ້ງ' : 'LOCATION'}</th>
              <th className="py-4 px-5">{currentLang === 'lo' ? 'ສະຖານະ SLA & ບຳລຸງຮັກສາ' : 'SLA STATUS'}</th>
              <th className="py-4 px-5 text-right">{currentLang === 'lo' ? 'ຈັດການ' : 'ACTIONS'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold">
            {machines.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                  {currentLang === 'lo' 
                    ? 'ບໍ່ມີລາຍການເຄື່ອງຈັກໃນລະບົບ. ສາມາດເພີ່ມໄດ້ຜ່ານເມນູນຳເຂົ້າສິນຄ້າ (Inbound Procurement).' 
                    : 'No machinery registered. Use Inbound Procurement to purchase new assets.'}
                </td>
              </tr>
            ) : (
              machines.map(eq => {
                const isCritical = eq.components && eq.components.some(c => c.usage >= (c.threshold || 90));
                const isPostPress = eq.category !== 'Printer' && eq.category !== 'PRINTER';

                // Subtype text
                const subTypeKey = eq.postPressSubtype || eq.specs?.postPressSubtype || '';
                const subTypeLabel = subtypeLabelMap[subTypeKey] || eq.printerCategory || eq.category || (isPostPress ? 'POST-PRESS' : 'INKJET');

                // Specs calculation
                const lifespanYears = Number(eq.lifespanYears || eq.specs?.lifespanYears || 5);
                const estMonthlyVolume = Number(eq.estMonthlyVolume || eq.specs?.estMonthlyVolume || 50000);
                const maintenanceRatePct = Number(eq.maintenanceRatePercent || eq.specs?.maintenanceRatePercent || 15);
                const maintCostPerPage = Number(eq.specs?.fixedMaintenanceCostPerPage || 0);
                
                const assetValue = Number(
                  eq.MachinePrice ?? 
                  eq.price ?? 
                  eq.unitPrice ?? 
                  eq.purchaseCost ?? 
                  eq.purchasePrice ?? 
                  eq.unitCost ?? 
                  0
                );
                const totalMonths = lifespanYears * 12;
                const targetPages = Number(
                  eq.TargetTotalPages || 
                  eq.printedPagesCapacity || 
                  eq.expectedLifeA4Pages || 
                  eq.lifetimePagesA4 || 
                  (estMonthlyVolume * totalMonths) || 
                  3000000
                );
                const monthlyDepr = totalMonths > 0 ? (assetValue / totalMonths) : 0;
                const baseCostPerUnit = (estMonthlyVolume > 0 && monthlyDepr > 0)
                  ? (monthlyDepr / estMonthlyVolume)
                  : (targetPages > 0 ? (assetValue / targetPages) : 0);

                const wearAllowancePerUnit = Math.round(baseCostPerUnit * (maintenanceRatePct / 100) * 1000) / 1000 + maintCostPerPage;
                const netCostPerUnit = Math.round((baseCostPerUnit + wearAllowancePerUnit) * 1000) / 1000;

                // Ink calculations for printer
                const links = printerColorLinks.filter(lnk => lnk.assetId === eq.id);
                let linkedInkRatePerPage = 0;
                if (!isPostPress) {
                  const oemSlots = 
                    eq.oem_baseline_specs?.slots || 
                    eq.specs?.oem_baseline_specs?.slots || 
                    eq.oemBaselineInks || 
                    eq.specs?.oemBaselineInks || 
                    [
                      { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500, oemPrice: 450000 },
                      { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
                      { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
                      { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 }
                    ];

                  if (oemSlots && oemSlots.length > 0) {
                    linkedInkRatePerPage = oemSlots.reduce((sum: number, oemSlot: any, idx: number) => {
                      const slotPos = oemSlot.slotPosition || `Slot ${idx + 1}`;
                      const isBlack = (oemSlot.colorGroup || '').toLowerCase().includes('black') || (oemSlot.colorGroup || '').toLowerCase().includes('k') || slotPos.toLowerCase().includes('black') || slotPos.toLowerCase().includes('slot 1');
                      const colorGroupName = isBlack ? 'Black' : (oemSlot.colorGroup || (idx === 1 ? 'Cyan' : idx === 2 ? 'Magenta' : idx === 3 ? 'Yellow' : `Color ${idx + 1}`));
                      const defaultYield = isBlack ? 7500 : 6000;
                      const defaultPrice = isBlack ? 450000 : 320000;
                      const defaultVol = isBlack ? 127 : 70;

                      const activeLink = links.find((lnk: any) => 
                        lnk.slotPosition === slotPos || 
                        (lnk.slotPosition && slotPos && (lnk.slotPosition.includes(slotPos) || slotPos.includes(lnk.slotPosition))) ||
                        (lnk.colorGroup && colorGroupName && lnk.colorGroup.toLowerCase() === colorGroupName.toLowerCase()) ||
                        (idx === 0 && (lnk.slotPosition?.includes('Slot 1') || lnk.colorGroup?.toLowerCase().includes('black') || lnk.colorGroup?.toLowerCase().includes('k'))) ||
                        (idx === 1 && (lnk.slotPosition?.includes('Slot 2') || lnk.colorGroup?.toLowerCase().includes('cyan') || lnk.colorGroup?.toLowerCase().includes('c'))) ||
                        (idx === 2 && (lnk.slotPosition?.includes('Slot 3') || lnk.colorGroup?.toLowerCase().includes('magenta') || lnk.colorGroup?.toLowerCase().includes('m'))) ||
                        (idx === 3 && (lnk.slotPosition?.includes('Slot 4') || lnk.colorGroup?.toLowerCase().includes('yellow') || lnk.colorGroup?.toLowerCase().includes('y')))
                      );
                      const ink = activeLink ? allAvailableInks.find((i: any) => i.id === activeLink.inkCode || i.skuCode === activeLink.inkCode || i.sku === activeLink.inkCode) : null;

                      
                      const oemVol = Number(oemSlot.oemStandardVolumeMl || oemSlot.volume || defaultVol);
                      const rawYield = Number(oemSlot.oemStandardIsoYieldA4 || (oemSlot.colorGroup === 'Black' ? (eq.blackYieldPages || defaultYield) : (eq.colorYieldPages || defaultYield)));
                      const yld = rawYield > 500 ? rawYield : defaultYield;
                      const isoRate = yld > 0 ? (oemVol / yld) : 0.0169;
                      
                      let slotCost = yld > 0 ? (Number(oemSlot.oemPrice || defaultPrice) / yld) : ((Number(oemSlot.oemPrice || defaultPrice) / oemVol) * isoRate);

                      if (ink) {
                        const bPrice = Number(ink.unitPrice || ink.costPerPurchaseUnit || defaultPrice);
                        const rawInkVol = Number(ink.volume || ink.specs?.volume || ink.specs?.volume_ml || defaultVol);
                        const actualVol = rawInkVol > 1 ? rawInkVol : defaultVol;

                        const rawInkYield = Number(ink.yield || ink.standard_page_yield || ink.specs?.yield || ink.specs?.isoYield || 0);
                        const inkYield = rawInkYield > 500 ? rawInkYield : yld;
                        slotCost = inkYield > 0 ? (bPrice / inkYield) : ((bPrice / actualVol) * isoRate);
                      }
                      
                      return sum + slotCost;
                    }, 0);
                  }

                }

                const finalCostPerPage = isPostPress 
                  ? (eq.costPerConsumptionUnit || netCostPerUnit) 
                  : (netCostPerUnit + Math.round(linkedInkRatePerPage * 1000) / 1000);

                const linkedInksSummary = links.map(lnk => {
                  const ink = allAvailableInks.find(i => i.id === lnk.inkCode || i.skuCode === lnk.inkCode || i.sku === lnk.inkCode);
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
                        <div className="text-[11px]">
                          <span className="text-slate-800 font-bold block">{eq.postPressAction || 'Post-Press Tool'}</span>
                          <span className="text-slate-400">{eq.specs?.maxFormat || 'A3+ format'}</span>
                        </div>
                      ) : (
                        <div className="text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">
                              {currentLang === 'lo' ? 'ລະບົບສີ: ' : 'System: '}
                              <span className="text-purple-700">{eq.colorSchemeType || 'CMYK'}</span>
                            </span>
                            <span className="text-slate-400 text-[10px]">({eq.totalColorSlots || 4} Slots)</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate max-w-xs" title={linkedInksSummary}>
                            {currentLang === 'lo' ? 'ໝຶກ: ' : 'Inks: '}{linkedInksSummary}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-5 font-mono font-black text-sky-700 text-xs">
                      {finalCostPerPage > 0 ? (
                        <div>
                          <span className="text-sm font-extrabold">{formatUnitLAK(finalCostPerPage)}</span>
                          <span className="text-[10px] font-normal text-slate-400 block">
                            / {isPostPress ? (currentLang === 'lo' ? 'ແຜ່ນ (sheet)' : 'sheet') : (currentLang === 'lo' ? 'ໜ້າ (page)' : 'page')}
                          </span>
                          {!isPostPress && linkedInkRatePerPage > 0 && (
                            <span className="text-[9px] font-semibold text-emerald-600 block">
                              (ເຄື່ອງ {formatUnitLAK(netCostPerUnit)} + ໝຶກ {formatUnitLAK(linkedInkRatePerPage)})
                            </span>
                          )}
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
                        const curMeter = Number(eq.current_meter || eq.technical_specs?.current_meter || eq.specs?.current_meter || eq.printedCount || (eq.id === 'PRN-OFFSET-01' ? 102500 : 0));
                        const lastMeter = Number(eq.last_serviced_meter || eq.technical_specs?.last_serviced_meter || eq.specs?.last_serviced_meter || (eq.id === 'PRN-OFFSET-01' ? 50000 : 0));
                        const interval = Number(eq.maintenance_interval_impressions || eq.technical_specs?.maintenance_interval_impressions || eq.specs?.maintenance_interval_impressions || 50000);
                        const delta = Math.max(0, curMeter - lastMeter);
                        const gaugePct = Math.min(100, Math.round((delta / interval) * 100));

                        let healthColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                        let barColor = 'bg-emerald-500';
                        let statusText = currentLang === 'lo' ? 'Good (ປົກກະຕິ)' : 'Good';

                        if (delta >= interval || gaugePct >= 100) {
                          healthColor = 'text-rose-700 bg-rose-50 border-rose-200 animate-pulse';
                          barColor = 'bg-rose-500';
                          statusText = currentLang === 'lo' ? 'Overdue (ເກີນກຳນົດ)' : 'Overdue';
                        } else if (gaugePct >= 80) {
                          healthColor = 'text-amber-700 bg-amber-50 border-amber-200';
                          barColor = 'bg-amber-500';
                          statusText = currentLang === 'lo' ? 'Due Soon (ໃກ້ກຳນົດ)' : 'Due Soon';
                        }

                        return (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className={`px-1.5 py-0.5 rounded font-black border ${healthColor}`}>
                                {statusText}
                              </span>
                              <span className="font-mono text-slate-400 font-bold">{gaugePct}%</span>
                            </div>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${barColor} rounded-full transition-all duration-300`} 
                                style={{ width: `${gaugePct}%` }}
                              />
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono">
                              {delta.toLocaleString()} / {interval.toLocaleString()} imp
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onViewDetails(eq)}
                          className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                          title={currentLang === 'lo' ? 'ລາຍລະອຽດ' : 'Details'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{currentLang === 'lo' ? 'ລາຍລະອຽດ' : 'Details'}</span>
                        </button>
                        {onEdit && (
                          <button
                            onClick={() => onEdit(eq)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-xl transition cursor-pointer"
                            title={currentLang === 'lo' ? 'ແກ້ໄຂ' : 'Edit'}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(eq)}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-xl transition cursor-pointer"
                            title={currentLang === 'lo' ? 'ລຶບ' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
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
