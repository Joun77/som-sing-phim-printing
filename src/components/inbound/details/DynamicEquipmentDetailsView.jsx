import React from 'react';
import { Cpu, DollarSign, Clock, Layers, Truck, PhoneCall } from 'lucide-react';
import InboundStatusBadge from '../components/InboundStatusBadge';
import InboundMediaPreview from '../components/InboundMediaPreview';
import DynamicKeyValueGrid from './DynamicKeyValueGrid';

export default function DynamicEquipmentDetailsView({ item }) {
  const formatLAK = (num) => new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num || 0).replace('LAK', '₭');

  const equipmentCat = item?.itemType || item?.machineCategory || item?.equipmentCategory || item?.category || 'Equipment';
  const itemName = item?.itemName || item?.name || item?.machineName || 'Unassigned Equipment Asset';
  const purchaseCost = item?.purchaseCost || item?.totalCost || item?.unitPrice;
  const lifespanYears = item?.lifespanYears;
  const lifetimeCapacity = item?.lifetimeCapacity || item?.printedPagesCapacity;
  const supplierName = item?.supplierName || '-';
  const supplierContact = item?.supplierContact || item?.note || '-';

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <InboundStatusBadge categoryType="Machinery" itemType={equipmentCat} labelOverride={`ໝວດ B: ເຄື່ອງຈັກ [${equipmentCat}]`} />
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{itemName}</h2>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-600" />
          <span>ລາຍລະອຽດຂໍ້ມູນເຄື່ອງຈັກ (Machinery & Assets Specifications)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[10px] text-slate-500 font-black uppercase">ປະເພດອຸປະກອນ (Equipment Type)</span>
            <p className="text-sm font-black text-slate-900">{equipmentCat}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[10px] text-slate-500 font-black uppercase">ລາຄາຊື້ (Purchase Cost)</span>
            <p className="text-sm font-black font-mono text-emerald-700">{formatLAK(purchaseCost)}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[10px] text-slate-500 font-black uppercase">ອາຍຸໃຊ້ງານ (Lifespan Years)</span>
            <p className="text-sm font-black text-slate-900">{lifespanYears ? `${lifespanYears} ປີ` : '-'}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[10px] text-slate-500 font-black uppercase">ຄວາມຈຸລວມ (Lifetime Capacity)</span>
            <p className="text-sm font-black text-slate-900">{lifetimeCapacity ? `${Number(lifetimeCapacity).toLocaleString()} ແຜ່ນ` : '-'}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm sm:col-span-2">
            <span className="text-[10px] text-slate-500 font-black uppercase">ຜູ້ສະໜອງ (Supplier Name)</span>
            <p className="text-sm font-black text-slate-900">{supplierName}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm sm:col-span-2">
            <span className="text-[10px] text-slate-500 font-black uppercase">ຕິດຕໍ່/ໝາຍເຫດ (Contact / Note)</span>
            <p className="text-sm font-black text-slate-900">{supplierContact}</p>
          </div>
        </div>

        <DynamicKeyValueGrid item={item} />
        <InboundMediaPreview itemPhoto={item?.itemPhoto || item?.imageUrl} paymentSlip={item?.paymentSlip} />
      </div>
    </div>
  );
}
