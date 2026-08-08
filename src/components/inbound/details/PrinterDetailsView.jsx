import React from 'react';
import { Printer, Zap } from 'lucide-react';
import InboundStatusBadge from '../components/InboundStatusBadge';
import InboundMediaPreview from '../components/InboundMediaPreview';
import DynamicKeyValueGrid from './DynamicKeyValueGrid';

export default function PrinterDetailsView({ item }) {
  const formatLAK = (num) => new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num || 0).replace('LAK', '₭');

  const itemName = item?.itemName || item?.name || item?.machineName || 'Unassigned Printer';
  const purchaseCost = item?.purchaseCost || item?.totalCost || item?.unitPrice;
  const lifespanYears = item?.lifespanYears;
  const lifetimeCapacity = item?.lifetimeCapacity || item?.printedPagesCapacity;
  const supplierName = item?.supplierName || '-';
  const supplierContact = item?.supplierContact || item?.note || '-';

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <InboundStatusBadge categoryType="Machinery" itemType="Printer" isPrinter={true} labelOverride="ໝວດ B: ເຄື່ອງພິມ (Printing Machine)" />
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{itemName}</h2>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Printer className="w-4 h-4 text-purple-600" />
          <span>ລາຍລະອຽດເຄື່ອງພິມ (Printing Machine Specifications)</span>
        </h3>

        {/* PRINTER TECHNICAL SPECS & INK YIELD PARAMETERS */}
        <div className="bg-purple-50/70 border border-purple-200 rounded-3xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-purple-200/60 pb-3 gap-2">
            <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
              🖨️ PRINTER TECHNICAL SPECS & INK YIELD PARAMETERS (ISO 5%)
            </span>
            {item?.inkType && (
              <span className="px-3 py-0.5 bg-purple-200/60 text-purple-900 font-black text-[10px] rounded-full w-fit">
                {item.inkType} Ink ({item.printTech || 'Color'})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
            <div className="bg-white p-3.5 rounded-2xl border border-purple-100 space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-black">ປະເພດໝຶກ (Ink Type / Tech)</p>
              <p className="font-black text-slate-900 text-sm">{item?.inkType || '-'} {item?.printTech ? `(${item.printTech})` : ''}</p>
              {item?.maxWidth && (
                <p className="text-[11px] text-purple-700 font-mono font-black pt-0.5">
                  Max Width: {item.maxWidth}
                </p>
              )}
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-purple-100 space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-black">ໝຶກດຳ (Black Ink Yield & Volume)</p>
              <p className="font-black text-slate-900 text-sm">
                {item?.blackYieldPages ? `${item.blackYieldPages.toLocaleString()} pages` : '-'} / {item?.blackCapacityMl ? `${item.blackCapacityMl} ml` : '-'}
              </p>
              {item?.blackMlPerSheet !== undefined && item?.blackMlPerSheet !== null && (
                <p className="text-[11px] text-purple-700 font-mono font-black pt-0.5">
                  Rate: {Number(item.blackMlPerSheet).toFixed(4)} ml/ແຜ່ນ
                </p>
              )}
              {item?.clickRateBW !== undefined && item?.clickRateBW !== null && (
                <p className="text-[11px] text-emerald-700 font-mono font-black">
                  Rate/BW: {formatLAK(item.clickRateBW)}
                </p>
              )}
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-purple-100 space-y-1">
              <p className="text-[10px] text-purple-700 uppercase font-black">ຊຸດໝຶກສີ (Color Ink Yield & Volume)</p>
              <p className="font-black text-purple-900 text-sm">
                {item?.colorYieldPages ? `${item.colorYieldPages.toLocaleString()} pages` : '-'} / {item?.colorCapacityMl ? `${item.colorCapacityMl} ml` : '-'}
              </p>
              {item?.colorMlPerSheet !== undefined && item?.colorMlPerSheet !== null && (
                <p className="text-[11px] text-purple-700 font-mono font-black pt-0.5">
                  Rate: {Number(item.colorMlPerSheet).toFixed(4)} ml/ແຜ່ນ
                </p>
              )}
              {item?.clickRateColor !== undefined && item?.clickRateColor !== null && (
                <p className="text-[11px] text-emerald-700 font-mono font-black">
                  Rate/Color: {formatLAK(item.clickRateColor)}
                </p>
              )}
            </div>
          </div>

          {item?.linkedInkSku && (
            <div className="bg-white p-3 rounded-2xl border border-purple-200 flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs gap-1">
              <span className="text-slate-500 font-bold">ລະຫັດໝຶກໃນຄັງ (Linked Ink SKU):</span>
              <span className="font-mono font-black text-purple-800 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-100 w-fit">
                {item.linkedInkSku}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[10px] text-slate-500 font-black uppercase">ລາຄາຊື້ (Purchase Cost)</span>
            <p className="text-sm font-black font-mono text-emerald-700">{formatLAK(purchaseCost)}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[10px] text-slate-500 font-black uppercase">ອາຍຸໃຊ້ງານ (Lifespan)</span>
            <p className="text-sm font-black text-slate-900">{lifespanYears ? `${lifespanYears} ປີ` : '-'}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[10px] text-slate-500 font-black uppercase">ຄວາມຈຸລວມ (Lifetime Capacity)</span>
            <p className="text-sm font-black text-slate-900">{lifetimeCapacity ? `${Number(lifetimeCapacity).toLocaleString()} ແຜ່ນ` : '-'}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[10px] text-slate-500 font-black uppercase">ຜູ້ສະໜອງ (Supplier)</span>
            <p className="text-sm font-black text-slate-900">{supplierName}</p>
          </div>
        </div>

        <DynamicKeyValueGrid item={item} customExclusions={['inkType', 'printTech', 'maxWidth', 'blackYieldPages', 'blackCapacityMl', 'colorYieldPages', 'colorCapacityMl', 'blackMlPerSheet', 'colorMlPerSheet', 'clickRateBW', 'clickRateColor', 'linkedInkSku']} />
        <InboundMediaPreview itemPhoto={item?.itemPhoto || item?.imageUrl} paymentSlip={item?.paymentSlip} />
      </div>
    </div>
  );
}
