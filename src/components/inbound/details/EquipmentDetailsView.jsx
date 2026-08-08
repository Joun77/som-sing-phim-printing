import React from 'react';
import { 
  Printer, 
  Tag, 
  Package, 
  DollarSign, 
  Clock, 
  Layers, 
  Truck, 
  PhoneCall, 
  Scissors, 
  BookOpen 
} from 'lucide-react';
import InboundStatusBadge from '../components/InboundStatusBadge';
import InboundMediaPreview from '../components/InboundMediaPreview';

const getValue = (record, keys, defaultValue = null) => {
  if (!record) return defaultValue;
  for (const k of keys) {
    const v = record?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return defaultValue;
};

export default function EquipmentDetailsView({ po }) {
  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num || 0).replace('LAK', '₭');
  };

  const equipmentCategory = getValue(po, ['itemType', 'machineCategory', 'equipmentCategory', 'category'], 'Equipment');
  const itemName = getValue(po, ['itemName', 'name', 'machineName'], 'Unassigned Machine Name');
  const isPrinter = equipmentCategory === 'Printer' || Boolean(po.blackYieldPages || po.inkType || po.printTech || po.linkedInkSku);

  const purchaseCost = getValue(po, ['purchaseCost', 'totalCost', 'unitPrice', 'costPerUnit']);
  const lifespanYears = getValue(po, ['lifespanYears']);
  const lifetimeCapacity = getValue(po, ['lifetimeCapacity', 'printedPagesCapacity']);
  const supplierName = getValue(po, ['supplierName']);
  const supplierContact = getValue(po, ['supplierContact', 'note', 'remarks']);

  const itemPhoto = getValue(po, ['itemPhoto', 'itemPhotoUrl', 'imageUrl']);
  const paymentSlip = getValue(po, ['paymentSlip', 'paymentSlipUrl', 'slipUrl']);

  const schema = [
    { label: 'ໝວດອຸປະກອນ (Equipment Category)', value: equipmentCategory, icon: Tag },
    { label: 'ຊື່ເຄື່ອງຈັກ (Machine Name)', value: itemName, icon: Package },
    { label: 'ລາຄາຊື້ (Purchase Cost)', value: purchaseCost ? formatLAK(Number(purchaseCost)) : null, isCurrency: true, icon: DollarSign },
    { label: 'ອາຍຸໃຊ້ງານ (Lifespan Years)', value: lifespanYears ? `${lifespanYears} ປີ (Years)` : null, icon: Clock },
    { label: 'ຄວາມຈຸລວມ (Lifetime Capacity)', value: lifetimeCapacity ? `${Number(lifetimeCapacity).toLocaleString()} ແຜ່ນ (Pages)` : null, icon: Layers },
    { label: 'ຜູ້ສະໜອງ (Supplier Name)', value: supplierName, icon: Truck },
    { label: 'ໝາຍເຫດ/ຕິດຕໍ່ (Reference Note / Contact)', value: supplierContact, icon: PhoneCall, isFullWidth: true }
  ];

  if (equipmentCategory === 'Cutter') {
    const cutCapacity = getValue(po, ['cutCapacity']);
    const bladeDep = getValue(po, ['bladeDepreciationPerCut']);
    if (cutCapacity) schema.push({ label: 'ຄວາມຈຸຕັດ (Cut Capacity)', value: `${Number(cutCapacity).toLocaleString()} ແຜ່ນ`, icon: Scissors });
    if (bladeDep) schema.push({ label: 'ຄ່າເສື່ອມ/ຕັດ (Blade Dep. Per Cut)', value: formatLAK(Number(bladeDep)), isCurrency: true, icon: DollarSign });
  } else if (equipmentCategory === 'Laminator') {
    const lamWidth = getValue(po, ['laminationWidth']);
    if (lamWidth) schema.push({ label: 'ໜ້າກວ້າງ (Lamination Width)', value: lamWidth, icon: Layers });
  } else if (equipmentCategory === 'Binder') {
    const bindMethod = getValue(po, ['bindingMethod']);
    if (bindMethod) schema.push({ label: 'ວິທີເຂົ້າຫົວ (Binding Method)', value: bindMethod, icon: BookOpen });
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <InboundStatusBadge categoryType="Machinery" itemType={equipmentCategory} isPrinter={isPrinter} />
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {itemName}
          </h2>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Printer className="w-4 h-4 text-purple-600" />
          <span>ລາຍລະອຽດຂໍ້ມູນນຳເຂົ້າເຄື່ອງຈັກ (Machinery & Assets Specifications)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {schema
            .filter(item => item.value !== null && item.value !== undefined)
            .map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  className={`bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm ${
                    item.isFullWidth ? 'sm:col-span-2 lg:col-span-2' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 text-slate-500">
                    {IconComp && <IconComp className="w-4 h-4 text-sky-600" />}
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                  <p className={`text-sm font-black truncate ${item.isCurrency ? 'font-mono text-emerald-700' : 'text-slate-900'}`}>
                    {String(item.value)}
                  </p>
                </div>
              );
            })}
        </div>

        {/* PRINTER TECHNICAL SPECS & INK YIELD PARAMETERS */}
        {isPrinter && (
          <div className="bg-purple-50/70 border border-purple-200 rounded-3xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-purple-200/60 pb-3 gap-2">
              <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                🖨️ PRINTER TECHNICAL SPECS & INK YIELD PARAMETERS (ISO 5%)
              </span>
              {po.inkType && (
                <span className="px-3 py-0.5 bg-purple-200/60 text-purple-900 font-black text-[10px] rounded-full w-fit">
                  {po.inkType} Ink ({po.printTech || 'Color'})
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
              <div className="bg-white p-3.5 rounded-2xl border border-purple-100 space-y-1">
                <p className="text-[10px] text-slate-500 uppercase font-black">ປະເພດໝຶກ (Ink Type / Tech)</p>
                <p className="font-black text-slate-900 text-sm">{po.inkType || '-'} {po.printTech ? `(${po.printTech})` : ''}</p>
                {po.maxWidth && (
                  <p className="text-[11px] text-purple-700 font-mono font-black pt-0.5">
                    Max Width: {po.maxWidth}
                  </p>
                )}
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-purple-100 space-y-1">
                <p className="text-[10px] text-slate-500 uppercase font-black">ໝຶກດຳ (Black Ink Yield & Volume)</p>
                <p className="font-black text-slate-900 text-sm">
                  {po.blackYieldPages ? `${po.blackYieldPages.toLocaleString()} pages` : '-'} / {po.blackCapacityMl ? `${po.blackCapacityMl} ml` : '-'}
                </p>
                {po.blackMlPerSheet !== undefined && po.blackMlPerSheet !== null && (
                  <p className="text-[11px] text-purple-700 font-mono font-black pt-0.5">
                    Rate: {Number(po.blackMlPerSheet).toFixed(4)} ml/ແຜ່ນ
                  </p>
                )}
                {po.clickRateBW !== undefined && po.clickRateBW !== null && (
                  <p className="text-[11px] text-emerald-700 font-mono font-black">
                    Rate/BW: {formatLAK(po.clickRateBW)}
                  </p>
                )}
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-purple-100 space-y-1">
                <p className="text-[10px] text-purple-700 uppercase font-black">ຊຸດໝຶກສີ (Color Ink Yield & Volume)</p>
                <p className="font-black text-purple-900 text-sm">
                  {po.colorYieldPages ? `${po.colorYieldPages.toLocaleString()} pages` : '-'} / {po.colorCapacityMl ? `${po.colorCapacityMl} ml` : '-'}
                </p>
                {po.colorMlPerSheet !== undefined && po.colorMlPerSheet !== null && (
                  <p className="text-[11px] text-purple-700 font-mono font-black pt-0.5">
                    Rate: {Number(po.colorMlPerSheet).toFixed(4)} ml/ແຜ່ນ
                  </p>
                )}
                {po.clickRateColor !== undefined && po.clickRateColor !== null && (
                  <p className="text-[11px] text-emerald-700 font-mono font-black">
                    Rate/Color: {formatLAK(po.clickRateColor)}
                  </p>
                )}
              </div>
            </div>

            {po.linkedInkSku && (
              <div className="bg-white p-3 rounded-2xl border border-purple-200 flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs gap-1">
                <span className="text-slate-500 font-bold">ລະຫັດໝຶກໃນຄັງ (Linked Ink SKU):</span>
                <span className="font-mono font-black text-purple-800 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-100 w-fit">
                  {po.linkedInkSku}
                </span>
              </div>
            )}
          </div>
        )}

        <InboundMediaPreview itemPhoto={itemPhoto} paymentSlip={paymentSlip} />
      </div>
    </div>
  );
}
