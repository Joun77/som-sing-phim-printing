import React, { useState } from 'react';
import { Scale, TrendingDown, RefreshCw, CheckCircle2 } from 'lucide-react';

interface MaterialQuote {
  material_name: string;
  category: string;
  suppliers: {
    supplier_name: string;
    currency: string;
    unit_price: number;
    lak_converted: number;
    lead_time_days: number;
  }[];
}

export const SupplierPriceCompare: React.FC = () => {
  const [data] = useState<MaterialQuote[]>([
    {
      material_name: 'Art Paper 260gsm (500 sheets/pack)',
      category: 'Paper',
      suppliers: [
        { supplier_name: 'Lao Paper Import', currency: 'LAK', unit_price: 450000, lak_converted: 450000, lead_time_days: 2 },
        { supplier_name: 'Bangkok Paper Mills', currency: 'THB', unit_price: 520, lak_converted: 416000, lead_time_days: 5 },
        { supplier_name: 'Vientiane Stationeries', currency: 'LAK', unit_price: 475000, lak_converted: 475000, lead_time_days: 1 },
      ]
    },
    {
      material_name: 'Cyan Offset Ink (1kg)',
      category: 'Ink',
      suppliers: [
        { supplier_name: 'Bangkok Offset Ink', currency: 'THB', unit_price: 400, lak_converted: 320000, lead_time_days: 4 },
        { supplier_name: 'Lao Chemical & Ink', currency: 'LAK', unit_price: 360000, lak_converted: 360000, lead_time_days: 2 },
      ]
    },
    {
      material_name: 'Thermal CTP Plate (0.30mm)',
      category: 'Plates',
      suppliers: [
        { supplier_name: 'Lao Prepress Solutions', currency: 'LAK', unit_price: 48000, lak_converted: 48000, lead_time_days: 1 },
        { supplier_name: 'Siam Plate Export', currency: 'THB', unit_price: 55, lak_converted: 44000, lead_time_days: 6 },
      ]
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">
              ປຽບທຽບລາຄາຜູ້ສະໜອງ (Supplier Price Comparison)
            </h3>
            <p className="text-xs font-semibold text-slate-400">
              ປຽບທຽບລາຄາຕົ້ນທຶນກະດາດ, ໝຶກ ແລະ ແພລດ ລະຫວ່າງຜູ້ສະໜອງຕ່າງໆ
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 gap-6">
        {data.map((item, idx) => {
          const sorted = [...item.suppliers].sort((a, b) => a.lak_converted - b.lak_converted);
          const cheapest = sorted[0];

          return (
            <div key={idx} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full">
                    {item.category}
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 mt-1">{item.material_name}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">ລາຄາຖືກສຸດ</span>
                  <span className="text-sm font-black text-emerald-600 font-sans">
                    ₭{cheapest.lak_converted.toLocaleString()} ({cheapest.supplier_name})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {item.suppliers.map((sup, sIdx) => {
                  const isBest = sup.supplier_name === cheapest.supplier_name;
                  return (
                    <div
                      key={sIdx}
                      className={`p-4 rounded-2xl border transition ${
                        isBest
                          ? 'bg-emerald-50/50 border-emerald-300 shadow-sm'
                          : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-xs text-slate-900">{sup.supplier_name}</div>
                        {isBest && (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[9px] font-extrabold flex items-center gap-0.5">
                            <TrendingDown className="w-3 h-3" /> Best Price
                          </span>
                        )}
                      </div>

                      <div className="text-lg font-black text-slate-900 font-sans mt-2">
                        {sup.currency === 'THB' ? '฿' : '₭'} {sup.unit_price.toLocaleString()}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 font-sans">
                        ≈ ₭{sup.lak_converted.toLocaleString()} LAK
                      </div>
                      <div className="text-[10px] text-slate-400 mt-2">
                        ⏱️ ໄລຍະເວລາຈັດສົ່ງ: {sup.lead_time_days} ວັນ
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
